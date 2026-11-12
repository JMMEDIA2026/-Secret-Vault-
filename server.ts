import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import pg from 'pg';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const { Pool } = pg;
const PORT = 3000;

interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: { rejectUnauthorized: boolean };
}

let activeDbConfig: DbConfig = {
  host: process.env.DATABASE_HOST || 'us-east-1.pg.psdb.cloud',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'postgres',
  user: process.env.DATABASE_USER || 'pscale_api_n04qjyelr69d.9k0005vtdxb5',
  password: process.env.DATABASE_PASSWORD || 'wjs3603825!',
  ssl: { rejectUnauthorized: false },
};

let dbPool: pg.Pool | null = null;
let isDbConnected = false;
let dbLastError: string | null = null;
let isTableInitialized = false;

// Persistent server-side store to guarantee zero localStorage leakage while maintaining durability
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'vault_store.json');

const memoryStore = new Map<string, string>();

function loadDiskStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') {
          memoryStore.set(k, v);
        }
      }
    }
  } catch {
    // ignore read error
  }
}

function saveDiskStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const obj: Record<string, string> = {};
    memoryStore.forEach((v, k) => {
      obj[k] = v;
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {
    // ignore write error
  }
}

loadDiskStore();

function createPool(config: DbConfig): pg.Pool {
  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl,
    connectionTimeoutMillis: 4000,
    max: 5,
    idleTimeoutMillis: 30000,
  });
}

async function initializeDatabase(pool: pg.Pool): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS secret_vault_store (
          key VARCHAR(255) PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      isTableInitialized = true;
      isDbConnected = true;
      dbLastError = null;
      console.log('PostgreSQL database and secret_vault_store table ready');

      // Sync existing server file store into Postgres if Postgres is currently empty
      try {
        const countRes = await client.query('SELECT COUNT(*) FROM secret_vault_store');
        const count = parseInt(countRes.rows[0]?.count || '0', 10);
        if (count === 0 && memoryStore.size > 0) {
          for (const [k, v] of memoryStore.entries()) {
            await client.query(
              `INSERT INTO secret_vault_store (key, data, updated_at)
               VALUES ($1, $2, NOW())
               ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
              [k, v]
            );
          }
        }
      } catch {}

      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    isDbConnected = false;
    dbLastError = err?.message || 'PostgreSQL connection failed';
    return false;
  }
}

async function tryConnect() {
  if (dbPool) {
    try {
      await dbPool.end();
    } catch {}
  }
  dbPool = createPool(activeDbConfig);
  await initializeDatabase(dbPool);
}

// Initial DB connection attempt
tryConnect();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // --- API Routes ---

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', dbConnected: isDbConnected });
  });

  // DB Status
  app.get('/api/db/status', async (req, res) => {
    if (dbPool && !isDbConnected) {
      // Retry connection in background if needed
      await initializeDatabase(dbPool);
    }

    res.json({
      connected: isDbConnected,
      host: activeDbConfig.host,
      port: activeDbConfig.port,
      database: activeDbConfig.database,
      user: activeDbConfig.user,
      hasPassword: Boolean(activeDbConfig.password),
      error: dbLastError,
      tableReady: isTableInitialized,
    });
  });

  // DB Config & Test Reconnect
  app.post('/api/db/config', async (req, res) => {
    try {
      const { host, port, database, user, password } = req.body;
      const testConfig: DbConfig = {
        host: host || activeDbConfig.host,
        port: port ? parseInt(port, 10) : activeDbConfig.port,
        database: database || activeDbConfig.database,
        user: user || activeDbConfig.user,
        password: password !== undefined ? password : activeDbConfig.password,
        ssl: { rejectUnauthorized: false },
      };

      const testPool = createPool(testConfig);
      const testClient = await testPool.connect();
      try {
        await testClient.query('SELECT 1');
        await testClient.query(`
          CREATE TABLE IF NOT EXISTS secret_vault_store (
            key VARCHAR(255) PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
      } finally {
        testClient.release();
      }

      // If test succeeds, replace active pool and config
      if (dbPool) {
        try {
          await dbPool.end();
        } catch {}
      }
      activeDbConfig = testConfig;
      dbPool = testPool;
      isDbConnected = true;
      dbLastError = null;
      isTableInitialized = true;

      return res.json({
        success: true,
        message: 'PostgreSQL 데이터베이스 연결 성공 및 동기화 완료',
        host: testConfig.host,
        user: testConfig.user,
        database: testConfig.database,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err?.message || '데이터베이스 연결 실패',
      });
    }
  });

  // Load Vault Data from DB
  app.get('/api/vault/load', async (req, res) => {
    const storage: Record<string, string> = {};

    if (isDbConnected && dbPool) {
      try {
        const result = await dbPool.query(
          `SELECT key, data FROM secret_vault_store WHERE key IN ('verification', 'data', 'settings')`
        );
        for (const row of result.rows) {
          storage[row.key] = row.data;
        }

        return res.json({
          success: true,
          storage,
          source: 'postgres',
          connected: true,
        });
      } catch (err: any) {
        console.error('Error loading vault from DB:', err);
      }
    }

    // Always refresh from disk store if memory store is empty or updated
    loadDiskStore();
    // Fallback to memory store if DB is pending authentication
    memoryStore.forEach((value, key) => {
      storage[key] = value;
    });

    return res.json({
      success: true,
      storage,
      source: 'memory_fallback',
      connected: isDbConnected,
      dbError: dbLastError,
    });
  });

  // Save Vault Data to DB
  app.post('/api/vault/save', async (req, res) => {
    try {
      const { verification, data, settings } = req.body;
      const entries: [string, string][] = [];
      if (verification !== undefined) entries.push(['verification', typeof verification === 'string' ? verification : JSON.stringify(verification)]);
      if (data !== undefined) entries.push(['data', typeof data === 'string' ? data : JSON.stringify(data)]);
      if (settings !== undefined) entries.push(['settings', typeof settings === 'string' ? settings : JSON.stringify(settings)]);

      // Always save to memory store & persist to server disk
      for (const [k, v] of entries) {
        memoryStore.set(k, v);
      }
      saveDiskStore();

      if (isDbConnected && dbPool) {
        for (const [k, v] of entries) {
          await dbPool.query(
            `INSERT INTO secret_vault_store (key, data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
            [k, v]
          );
        }
        return res.json({ success: true, savedToDb: true });
      }

      return res.json({
        success: true,
        savedToDb: false,
        warning: '데이터베이스 연결 대기 중 (인증 필요). 메모리 캐시에 임시 저장되었습니다.',
        error: dbLastError,
      });
    } catch (err: any) {
      console.error('Failed to save vault data:', err);
      return res.status(500).json({ success: false, error: err?.message || '저장 실패' });
    }
  });

  // AI Smart Vault Assistant using Gemini Flash (Free-tier / Standard Model)
  app.post('/api/ai/parse-and-classify', async (req, res) => {
    try {
      const {
        userInput,
        existingFolders = [],
        model: preferredModel,
        autoSuggestFolders = true,
        includeNotes = true,
        temperature = 0.2,
      } = req.body;
      if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
        return res.status(400).json({ success: false, error: '내용을 입력해주세요.' });
      }

      const folderContext = autoSuggestFolders && Array.isArray(existingFolders) && existingFolders.length > 0
        ? `현재 보관함에 존재하는 사용자 정의 폴더 목록:\n${JSON.stringify(
            existingFolders.map((f: any) => ({ id: f.id, name: f.name, description: f.description || '' }))
          )}`
        : '현재 등록된 사용자 폴더가 없거나 신규 폴더 자동 추천 모드입니다.';

      const systemInstruction = `당신은 보안 볼트(Vault)의 지능형 AI 비서입니다.
사용자가 입력한 자연어 텍스트(예: "네이버 아이디 user99 비번 secret@2026", "OpenAI API 키 sk-...", "김철수 팀장 010-9876-5432 영업부", "https://github.com/facebook/react 리액트 깃헙", "https://news.naver.com", 또는 일반 질문)를 정밀 분석합니다.

[규칙]
1. 사용자가 보관함에 새로 등록/저장하려는 정보인지(isItemToSave: true), 아니면 단순 인사나 일반 질문인지(isItemToSave: false) 판별합니다.
   - 사용자가 URL 링크(예: https://... 또는 도메인 주소)만 주거나 링크와 함께 설명을 준 경우, 즉시 'bookmark' 카테고리로 자동 판별하고 isItemToSave: true로 설정합니다.
2. 정보인 경우 다음 5개 카테고리 중 가장 적합한 카테고리를 선택합니다:
   - 'bookmark': 웹사이트 URL 링크, 즐겨찾기, 북마크, 웹 문서 주소 등 (링크만 입력된 경우 최우선 선택)
   - 'api_key': API Key, Secret Token, Access Token, 개발 서버 엔드포인트 등
   - 'password': 웹사이트/앱 로그인 계정, 사용자 ID, 패스워드, URL 등
   - 'contact': 인물 연락처, 이름, 전화번호, 이메일, 조직, 직책 등
   - 'note': 텍스트 메모, 암호화 메모, 보안 노트 등
3. 가장 합당한 폴더를 매칭 또는 추천합니다:
   - 기존 폴더 목록 중 가장 자연스럽고 적합한 폴더가 있다면 그 폴더의 id를 folderId에 넣습니다. (예: 개발 관련 링크면 '업무 & 프로젝트', 개인 웹사이트면 '개인 & 보안' 등)
   - 기존 폴더에 어울리는 것이 없거나 새로운 테마(예: '웹 북마크 & 링크', '클라우드 인프라', '금융 / 은행', '소셜 미디어' 등)가 더 적합하다면 folderId는 빈 문자열("")로 하고 newFolderName에 추천 폴더명을 기입합니다.
   - newFolderColor에는 'cyan', 'purple', 'green', 'orange', 'yellow', 'red', 'indigo' 중 하나를 지정합니다.
4. 검색 및 정리를 위한 핵심 태그(tags) 2~4개를 추출합니다. (예: ['링크', '리액트', 'GitHub'])
5. 입력 내용에서 유효한 상세 데이터(URL, 도메인, 설명, 아이디, 비번, 키, 전화번호, 이메일, 메모 내용 등)를 추출하여 알맞은 서브 객체(bookmarkData, passwordData, apiKeyData, contactData, noteData)에 채웁니다:
   - bookmarkData: { url: string (https:// 포함 전체 URL), domain: string (도메인 호스트명), description: string }
6. ${includeNotes ? '비고나 메모(notes) 항목에 부가 세부사항(예: 링크 요약, 개발용, 월 한도 등)을 적절히 기록합니다.' : '메모는 필요최소한으로 작성합니다.'}
7. reply에는 사용자에게 신뢰감과 친절함을 주는 자연스러운 한국어로 브리핑 답변을 작성합니다.
   예: "입력하신 웹 링크를 분석하여 [웹 북마크 & 링크] 폴더의 [링크 북마크] 카테고리로 자동 분류했습니다. 즉시 안전하게 보관할 수 있습니다."`;

      const candidateModels = preferredModel
        ? [preferredModel, 'gemini-2.5-flash', 'gemini-3.8-flash']
        : ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let lastError: any = null;
      let parsed: any = null;

      for (const model of candidateModels) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout for model ${model}`)), 6500)
          );

          const genPromise = ai.models.generateContent({
            model,
            contents: `[사용자 보관함 폴더 정보]\n${folderContext}\n\n[사용자 입력 내용]\n${userInput.trim()}`,
            config: {
              systemInstruction,
              temperature: typeof temperature === 'number' ? temperature : 0.2,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isItemToSave: { type: Type.BOOLEAN, description: '보관함 항목 생성 여부' },
                  reply: { type: Type.STRING, description: '사용자 친화적 한국어 설명/답변' },
                  title: { type: Type.STRING, description: '항목 제목 (예: 네이버 계정, OpenAI API Key)' },
                  category: {
                    type: Type.STRING,
                    description: "카테고리: 'bookmark' | 'api_key' | 'password' | 'contact' | 'note'",
                  },
                  folderId: { type: Type.STRING, description: '기존 폴더 중 매칭된 폴더 ID (없으면 빈 문자열)' },
                  newFolderName: { type: Type.STRING, description: '신규 추천 폴더명 (기존 폴더가 적절치 않은 경우)' },
                  newFolderColor: {
                    type: Type.STRING,
                    description: "신규 폴더 색상 ('red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'indigo' | 'purple')",
                  },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '관련 태그 목록',
                  },
                  notes: { type: Type.STRING, description: '추가 메모/비고' },
                  bookmarkData: {
                    type: Type.OBJECT,
                    properties: {
                      url: { type: Type.STRING, description: '웹사이트 URL 전체 주소' },
                      domain: { type: Type.STRING, description: '호스트 도메인 (예: naver.com)' },
                      description: { type: Type.STRING, description: '링크 개요 및 설명' },
                    },
                  },
                  apiKeyData: {
                    type: Type.OBJECT,
                    properties: {
                      service: { type: Type.STRING },
                      apiKey: { type: Type.STRING },
                      apiSecret: { type: Type.STRING },
                      endpointUrl: { type: Type.STRING },
                      environment: { type: Type.STRING, description: 'production | staging | development | test' },
                    },
                  },
                  passwordData: {
                    type: Type.OBJECT,
                    properties: {
                      service: { type: Type.STRING },
                      username: { type: Type.STRING },
                      password: { type: Type.STRING },
                      websiteUrl: { type: Type.STRING },
                    },
                  },
                  contactData: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      phoneNumber: { type: Type.STRING },
                      email: { type: Type.STRING },
                      organization: { type: Type.STRING },
                      jobTitle: { type: Type.STRING },
                      address: { type: Type.STRING },
                    },
                  },
                  noteData: {
                    type: Type.OBJECT,
                    properties: {
                      content: { type: Type.STRING },
                    },
                  },
                },
                required: ['isItemToSave', 'reply'],
              },
            },
          });

          const response: any = await Promise.race([genPromise, timeoutPromise]);

          if (response?.text) {
            parsed = JSON.parse(response.text.trim());
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${model} failed, trying next candidate:`, err?.message);
        }
      }

      // Safe heuristic fallback if AI models are temporarily unreachable
      if (!parsed) {
        console.warn('Using intelligent heuristic fallback');
        const text = userInput.trim();
        const urlMatch = text.match(/(https?:\/\/[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]{1,62}\.(?:com|net|org|kr|io|co\.kr|dev|app|ai|me|cc)[^\s]*)/i);
        const isPassword = /비번|비밀번호|password|passwd|아이디|user|id|login|계정/i.test(text);
        const isApiKey = /api|key|token|sk-|secret|ghp_|bearer/i.test(text);
        const isContact = /010-\d{4}-\d{4}|\d{2,3}-\d{3,4}-\d{4}|전화|연락처|email|이메일|팀장|대표/i.test(text);

        if (urlMatch) {
          let fullUrl = urlMatch[1];
          if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
            fullUrl = 'https://' + fullUrl;
          }
          let domain = '';
          try {
            domain = new URL(fullUrl).hostname;
          } catch {
            domain = fullUrl;
          }

          // Suggest or match bookmark folder
          const matchedFolder = existingFolders.find(
            (f: any) => /북마크|링크|웹|즐겨찾기|bookmark|link|사이트/i.test(f.name)
          );

          parsed = {
            isItemToSave: true,
            reply: `입력하신 웹 링크(${domain})를 감지하여 [링크 북마크] 카테고리로 자동 정리했습니다. 원클릭으로 바로 저장할 수 있습니다.`,
            title: text.replace(urlMatch[0], '').trim() || domain || '새 북마크',
            category: 'bookmark',
            folderId: matchedFolder ? matchedFolder.id : (existingFolders[0]?.id || ''),
            newFolderName: !matchedFolder && !existingFolders.length ? '웹 북마크 & 링크' : '',
            newFolderColor: 'cyan',
            tags: ['북마크', '링크', domain.replace(/^www\./, '').split('.')[0]].filter(Boolean),
            bookmarkData: {
              url: fullUrl,
              domain,
              description: text.replace(urlMatch[0], '').trim() || `${domain} 링크 바로가기`,
            },
          };
        } else if (isPassword) {
          const userMatch = text.match(/(?:아이디|id|user|계정)[\s:]*([^\s,]+)/i);
          const passMatch = text.match(/(?:비번|비밀번호|password|pw)[\s:]*([^\s,]+)/i);
          parsed = {
            isItemToSave: true,
            reply: '입력하신 계정 정보를 분석하여 [계정 및 비밀번호] 카테고리로 정리했습니다.',
            title: text.split(/\s+/)[0] + ' 계정',
            category: 'password',
            folderId: existingFolders[0]?.id || '',
            newFolderName: !existingFolders.length ? '개인 계정' : '',
            newFolderColor: 'cyan',
            tags: ['계정', '비밀번호'],
            passwordData: {
              service: text.split(/\s+/)[0] || '서비스',
              username: userMatch ? userMatch[1] : '',
              password: passMatch ? passMatch[1] : '',
            },
          };
        } else if (isApiKey) {
          const keyMatch = text.match(/([a-zA-Z0-9_\-\.]{20,})/);
          parsed = {
            isItemToSave: true,
            reply: '입력하신 키 정보를 감지하여 [API 키] 카테고리로 안전하게 정리했습니다.',
            title: text.split(/\s+/)[0] + ' API 키',
            category: 'api_key',
            folderId: existingFolders[0]?.id || '',
            newFolderName: !existingFolders.length ? '개발 / API' : '',
            newFolderColor: 'indigo',
            tags: ['API', '개발키'],
            apiKeyData: {
              service: text.split(/\s+/)[0] || 'API Service',
              apiKey: keyMatch ? keyMatch[1] : text,
              environment: 'production',
            },
          };
        } else if (isContact) {
          const phoneMatch = text.match(/(01[016789]-?\d{3,4}-?\d{4})/);
          const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          parsed = {
            isItemToSave: true,
            reply: '입력하신 인물 정보를 [보안 연락처] 카테고리로 정리했습니다.',
            title: text.split(/\s+/)[0] + ' 연락처',
            category: 'contact',
            folderId: existingFolders[0]?.id || '',
            newFolderName: !existingFolders.length ? '연락처' : '',
            newFolderColor: 'purple',
            tags: ['연락처'],
            contactData: {
              name: text.split(/\s+/)[0] || '연락처',
              phoneNumber: phoneMatch ? phoneMatch[1] : '',
              email: emailMatch ? emailMatch[1] : '',
            },
          };
        } else {
          parsed = {
            isItemToSave: true,
            reply: '입력하신 내용을 [보안 메모] 카테고리로 정리했습니다.',
            title: text.slice(0, 20) || '새 보안 메모',
            category: 'note',
            folderId: existingFolders[0]?.id || '',
            newFolderName: '',
            newFolderColor: 'yellow',
            tags: ['메모'],
            noteData: {
              content: text,
            },
          };
        }
      }

      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Gemini assistant error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'AI 분석 처리 중 오류가 발생했습니다.',
      });
    }
  });

  // Wipe Vault Data from DB
  app.post('/api/vault/wipe', async (req, res) => {
    try {
      memoryStore.clear();
      saveDiskStore();
      if (isDbConnected && dbPool) {
        await dbPool.query(`DELETE FROM secret_vault_store WHERE key IN ('verification', 'data', 'settings')`);
      }
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Failed to wipe vault data:', err);
      return res.status(500).json({ success: false, error: err?.message || '초기화 실패' });
    }
  });

  // Vite development middleware vs production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
