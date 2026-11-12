import { VaultItem, VaultFolder, VaultSettings, SecurityAuditResult } from '../types';
import {
  deriveKeyFromPassword,
  encryptData,
  decryptData,
  generateSalt,
  bufferToBase64,
  base64ToBuffer,
  VERIFICATION_PHRASE,
  evaluatePasswordStrength,
} from './crypto';

// In-memory runtime cache for fast synchronous access
let cachedVerification: string | null = null;
let cachedData: string | null = null;
let cachedSettings: VaultSettings | null = null;
let isCacheLoaded = false;

export const DEFAULT_SETTINGS: VaultSettings = {
  autoLockMinutes: 15,
  lockOnBlur: false,
  clipboardTimeoutSec: 30,
  aiAssistantEnabled: true,
  aiModel: 'gemini-2.5-flash',
  aiAutoSuggestFolders: true,
  aiIncludeNotes: true,
  aiDefaultTemperature: 0.2,
};

// Initial default custom categories with 7-color neon spectrum mapping
export const DEFAULT_FOLDERS: VaultFolder[] = [
  {
    id: 'folder-work',
    name: '업무 & 프로젝트',
    colorId: 'cyan', // 파랑 네온
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    description: 'API 키 및 개발 인프라 관련 항목',
  },
  {
    id: 'folder-personal',
    name: '개인 & 보안',
    colorId: 'purple', // 보라 네온
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    description: '개인 계정 및 인증 토큰',
  },
  {
    id: 'folder-emergency',
    name: '비상 & 인프라',
    colorId: 'red', // 빨강 네온
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    description: 'IDC 및 긴급 연락망',
  },
];

// Initial realistic sample data
export const SAMPLE_VAULT_ITEMS: VaultItem[] = [
  {
    id: 'sample-api-1',
    category: 'api_key',
    folderId: 'folder-work',
    title: 'Google Gemini Pro 2.5 API',
    tags: ['AI', 'Google', '개발용'],
    isFavorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    notes: '개인 사이드 프로젝트 및 챗봇 연동용 메인 API 키. 월 500달러 한도 설정됨.',
    apiKeyData: {
      service: 'Google AI Studio',
      apiKey: 'AIzaSyA8_EXAMPLE_GEMINI_KEY_x9Q2wK7eL9p0Z',
      apiSecret: 'gemini_secret_sec_77a9b01f',
      endpointUrl: 'https://generativelanguage.googleapis.com/v1beta',
      environment: 'production',
      expiresAt: '2026-12-31',
    },
  },
  {
    id: 'sample-api-2',
    category: 'api_key',
    folderId: 'folder-work',
    title: 'OpenAI Production GPT-4o API',
    tags: ['AI', 'OpenAI', '실서버'],
    isFavorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    notes: '사내 AI 어시스턴트 프로덕션 환경 토큰. 팀 공유 금지.',
    apiKeyData: {
      service: 'OpenAI',
      apiKey: 'sk-proj-u9H8kL1mN2oP3qR4sT5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4m',
      endpointUrl: 'https://api.openai.com/v1',
      environment: 'production',
      expiresAt: '2026-10-15',
    },
  },
  {
    id: 'sample-api-3',
    category: 'api_key',
    folderId: 'folder-work',
    title: 'Kakao Developers REST API',
    tags: ['소셜로그인', '카카오', '지도'],
    isFavorite: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    notes: '카카오 로그인 및 카카오톡 알림톡 전송용 REST API 키',
    apiKeyData: {
      service: 'Kakao Developers',
      apiKey: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
      apiSecret: 'kakao_admin_secret_998877',
      endpointUrl: 'https://kapi.kakao.com',
      environment: 'staging',
      expiresAt: '2027-01-01',
    },
  },
  {
    id: 'sample-pwd-1',
    category: 'password',
    folderId: 'folder-personal',
    title: 'GitHub 엔지니어링 메인 계정',
    tags: ['개발', 'Git', '중요'],
    isFavorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    notes: 'YubiKey 하드웨어 보안키 및 2차 인증(TOTP) 활성화됨',
    passwordData: {
      service: 'GitHub',
      websiteUrl: 'https://github.com/login',
      username: 'developer-jeonil@gmail.com',
      password: 'k#9X!mQ2$wL8^zP4&vR7*tY1@uI6',
      twoFactorSeed: 'JBSWY3DPEHPK3PXP (백업 코드 8개 보관중)',
    },
  },
  {
    id: 'sample-pwd-2',
    category: 'password',
    folderId: 'folder-work',
    title: 'AWS 루트 및 콘솔 관리자',
    tags: ['클라우드', '인프라', '최고보안'],
    isFavorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    notes: '매월 첫째 주 비밀번호 로테이션 정책 적용 중',
    passwordData: {
      service: 'Amazon Web Services',
      websiteUrl: 'https://aws.amazon.com/console/',
      username: 'cloud-admin@mycompany.internal',
      password: 'W$8vR#2pL!9qM^3zK*7tY&1uX@5n',
      twoFactorSeed: 'AWS-MFA-HW-DEVICE-SERIAL-0912',
    },
  },
  {
    id: 'sample-contact-1',
    category: 'contact',
    folderId: 'folder-emergency',
    title: '긴급 연락망 - 본사 서버 IDC 센터',
    tags: ['긴급', '서버', '인프라'],
    isFavorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    notes: '서버 다운 또는 비정상 트래픽 발생 시 24시간 당직실 직통 번호',
    contactData: {
      name: 'IDC 상주 엔지니어링팀',
      phoneNumber: '02-1588-9900',
      secondaryPhone: '010-8765-4321',
      email: 'idc-emergency@datacenter.co.kr',
      organization: '가산 데이터센터 3층 NOC',
      relationship: '인프라 관제팀',
      isEmergency: true,
      privateNotes: '야간 출입 보안 패스코드: #4829* (출입 시 사전 승인 필요)',
    },
  },
  {
    id: 'sample-contact-2',
    category: 'contact',
    folderId: 'folder-work',
    title: '클라우드 아키텍트 김민수 수석',
    tags: ['회사', '동료', '개발'],
    isFavorite: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    notes: '백엔드 아키텍처 및 쿠버네티스 인프라 리드',
    contactData: {
      name: '김민수',
      phoneNumber: '010-3456-7890',
      email: 'minsu.kim@techcorp.kr',
      organization: '테크솔루션 플랫폼팀',
      relationship: '직속 팀장 / 수석',
      isEmergency: false,
      privateNotes: '급한 장애 보고 시 슬랙 DM보다 전화 연락 선호',
    },
  },
  {
    id: 'sample-contact-3',
    category: 'contact',
    folderId: 'folder-personal',
    title: '가족 긴급 연락처 (어머니)',
    tags: ['가족', '긴급', '비상'],
    isFavorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    notes: '가족 비상 연락망 1순위',
    contactData: {
      name: '어머니',
      phoneNumber: '010-9876-5432',
      secondaryPhone: '02-999-1234',
      organization: '자택',
      relationship: '가족',
      isEmergency: true,
      privateNotes: '집 도어락 비상 마스터키 위치: 거실 책장 2번째 서랍',
    },
  },
  {
    id: 'sample-note-1',
    category: 'note',
    title: '서버 SSH 접속 키 및 방화벽 설정 메모',
    tags: ['인프라', 'SSH', '비밀메모'],
    isFavorite: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    notes: '개발 서버 배포용 포트 및 방화벽 화이트리스트 IP 대역',
    noteData: {
      content: `1. 개발 서버 점프호스트: bastion.internal.company.com:2202
2. 허용된 공인 IP 대역: 211.200.12.0/24
3. SSH Keyfinger: SHA256:4oP2+7x9wLq0M8rT...
4. 환경변수 파일 위치: /opt/app/configs/.env.production
* 매월 1일 방화벽 룰 정기 점검 필`,
    },
  },
];

// Clean legacy localStorage to prevent local leakage
export function purgeLocalStorage(): void {
  try {
    localStorage.removeItem('secret_vault_auth_v1');
    localStorage.removeItem('secret_vault_data_v1');
    localStorage.removeItem('secret_vault_settings_v1');
  } catch {}
}

// Fetch all vault storage items directly from the backend Database API
export async function syncFromDb(): Promise<{
  verification: string | null;
  data: string | null;
  settings: VaultSettings;
  connected: boolean;
  source: string;
}> {
  purgeLocalStorage();
  try {
    const res = await fetch('/api/vault/load');
    if (!res.ok) throw new Error('API load error');
    const json = await res.json();
    if (json.storage) {
      cachedVerification = json.storage.verification || null;
      cachedData = json.storage.data || null;
      if (json.storage.settings) {
        try {
          cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(json.storage.settings) };
        } catch {
          cachedSettings = DEFAULT_SETTINGS;
        }
      } else {
        cachedSettings = DEFAULT_SETTINGS;
      }
    }
    isCacheLoaded = true;
    return {
      verification: cachedVerification,
      data: cachedData,
      settings: cachedSettings || DEFAULT_SETTINGS,
      connected: json.connected ?? false,
      source: json.source || 'db',
    };
  } catch (e) {
    console.warn('DB sync warning:', e);
    isCacheLoaded = true;
    return {
      verification: cachedVerification,
      data: cachedData,
      settings: cachedSettings || DEFAULT_SETTINGS,
      connected: false,
      source: 'offline',
    };
  }
}

// Check if a master vault has been initialized
export async function checkVaultSetup(): Promise<boolean> {
  if (!isCacheLoaded) {
    await syncFromDb();
  }
  return cachedVerification !== null;
}

// Synchronous check against loaded cache
export function hasVaultSetup(): boolean {
  return cachedVerification !== null;
}

// Get saved settings or fallback to defaults
export function loadVaultSettings(): VaultSettings {
  return cachedSettings || DEFAULT_SETTINGS;
}

// Save settings to PostgreSQL DB
export async function saveVaultSettings(settings: VaultSettings): Promise<void> {
  cachedSettings = settings;
  try {
    await fetch('/api/vault/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: JSON.stringify(settings) }),
    });
  } catch (err) {
    console.error('Failed to save settings to DB:', err);
  }
}

// Initialize a new master vault with password and save to Database
export async function initializeVault(
  masterPassword: string,
  initialItems: VaultItem[] = SAMPLE_VAULT_ITEMS,
  initialFolders: VaultFolder[] = DEFAULT_FOLDERS
): Promise<CryptoKey> {
  purgeLocalStorage();
  const salt = generateSalt();
  const key = await deriveKeyFromPassword(masterPassword, salt);

  // 1. Create and encrypt verification token
  const verificationEncrypted = await encryptData(VERIFICATION_PHRASE, key);
  const verificationPayload = {
    salt: bufferToBase64(salt.buffer),
    iv: verificationEncrypted.iv,
    ciphertext: verificationEncrypted.ciphertext,
  };
  const verificationJson = JSON.stringify(verificationPayload);
  cachedVerification = verificationJson;

  // 2. Encrypt and save initial items & folders
  const payloadToEncrypt = {
    items: initialItems,
    folders: initialFolders,
  };
  const dataJson = JSON.stringify(payloadToEncrypt);
  const dataEncrypted = await encryptData(dataJson, key);
  const dataPayload = {
    iv: dataEncrypted.iv,
    ciphertext: dataEncrypted.ciphertext,
  };
  const dataPayloadJson = JSON.stringify(dataPayload);
  cachedData = dataPayloadJson;

  // Persist directly to PostgreSQL database
  try {
    await fetch('/api/vault/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verification: verificationJson,
        data: dataPayloadJson,
        settings: JSON.stringify(cachedSettings || DEFAULT_SETTINGS),
      }),
    });
  } catch (err) {
    console.error('Failed to save initialized vault to DB:', err);
  }

  return key;
}

// Unlock existing vault with master password directly from Database data
export async function unlockVault(
  masterPassword: string
): Promise<{ key: CryptoKey; items: VaultItem[]; folders: VaultFolder[] } | null> {
  purgeLocalStorage();
  // Always fetch latest data from DB before unlocking
  await syncFromDb();

  if (!cachedVerification) return null;

  try {
    const parsed = JSON.parse(cachedVerification);
    if (!parsed?.salt || !parsed?.iv || !parsed?.ciphertext) {
      return null;
    }
    const { salt, iv, ciphertext } = parsed;
    const saltBuffer = new Uint8Array(base64ToBuffer(salt));
    const key = await deriveKeyFromPassword(masterPassword, saltBuffer);

    // Verify key against verification token
    const decryptedPhrase = await decryptData(ciphertext, iv, key);
    if (decryptedPhrase !== VERIFICATION_PHRASE) {
      return null;
    }

    // Key is verified! Load and decrypt items and folders from DB
    let items: VaultItem[] = [];
    let folders: VaultFolder[] = [...DEFAULT_FOLDERS];
    if (cachedData) {
      try {
        const { iv: dataIv, ciphertext: dataCipher } = JSON.parse(cachedData);
        if (dataIv && dataCipher) {
          const decryptedJson = await decryptData(dataCipher, dataIv, key);
          const parsedData = JSON.parse(decryptedJson);
          if (Array.isArray(parsedData)) {
            items = parsedData;
            folders = [...DEFAULT_FOLDERS];
          } else if (parsedData && typeof parsedData === 'object') {
            items = parsedData.items || [];
            folders = parsedData.folders && parsedData.folders.length > 0 
              ? parsedData.folders 
              : [...DEFAULT_FOLDERS];
          }
        }
      } catch {
        items = [];
        folders = [...DEFAULT_FOLDERS];
      }
    }

    return { key, items, folders };
  } catch {
    return null;
  }
}

// Save encrypted items & folders directly to Database
export async function saveVaultData(
  items: VaultItem[],
  folders: VaultFolder[],
  key: CryptoKey
): Promise<void> {
  purgeLocalStorage();
  const payloadToEncrypt = {
    items,
    folders,
  };
  const dataJson = JSON.stringify(payloadToEncrypt);
  const encrypted = await encryptData(dataJson, key);
  const payload = {
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
  };
  const payloadStr = JSON.stringify(payload);
  cachedData = payloadStr;

  try {
    await fetch('/api/vault/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: payloadStr }),
    });
  } catch (err) {
    console.error('Failed to save vault data to DB:', err);
  }
}

// Save encrypted items to storage (backward-compatible)
export async function saveVaultItems(
  items: VaultItem[],
  key: CryptoKey,
  folders: VaultFolder[] = DEFAULT_FOLDERS
): Promise<void> {
  return saveVaultData(items, folders, key);
}

// Change Master Password (re-encrypts everything with new key and saves to DB)
export async function changeMasterPassword(
  oldKey: CryptoKey,
  items: VaultItem[],
  newPassword: string,
  folders: VaultFolder[] = DEFAULT_FOLDERS
): Promise<CryptoKey> {
  purgeLocalStorage();
  const salt = generateSalt();
  const newKey = await deriveKeyFromPassword(newPassword, salt);

  const verificationEncrypted = await encryptData(VERIFICATION_PHRASE, newKey);
  const verificationPayload = {
    salt: bufferToBase64(salt.buffer),
    iv: verificationEncrypted.iv,
    ciphertext: verificationEncrypted.ciphertext,
  };
  const verificationStr = JSON.stringify(verificationPayload);
  cachedVerification = verificationStr;

  const payloadToEncrypt = { items, folders };
  const dataJson = JSON.stringify(payloadToEncrypt);
  const encrypted = await encryptData(dataJson, newKey);
  const dataStr = JSON.stringify({ iv: encrypted.iv, ciphertext: encrypted.ciphertext });
  cachedData = dataStr;

  try {
    await fetch('/api/vault/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verification: verificationStr,
        data: dataStr,
      }),
    });
  } catch (err) {
    console.error('Failed to change password in DB:', err);
  }

  return newKey;
}

// Reset / Wipe entire vault from Database
export async function wipeVault(): Promise<void> {
  purgeLocalStorage();
  cachedVerification = null;
  cachedData = null;
  cachedSettings = null;
  try {
    await fetch('/api/vault/wipe', { method: 'POST' });
  } catch (err) {
    console.error('Failed to wipe DB vault:', err);
  }
}

// DB Status & Config Interface
export interface DatabaseStatus {
  connected: boolean;
  host: string;
  port: number;
  database: string;
  user: string;
  hasPassword: boolean;
  error?: string | null;
  tableReady: boolean;
}

export async function fetchDbStatus(): Promise<DatabaseStatus> {
  try {
    const res = await fetch('/api/db/status');
    if (!res.ok) throw new Error('DB status request failed');
    return await res.json();
  } catch (e: any) {
    return {
      connected: false,
      host: 'us-east-1.pg.psdb.cloud',
      port: 5432,
      database: 'postgres',
      user: 'pscale_api_n04qjyelr69d.9k0005vtdxb5',
      hasPassword: true,
      error: e.message,
      tableReady: false,
    };
  }
}

export async function updateDbConfig(config: {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/db/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, error: e.message || '요청 실패' };
  }
}

// Perform Security Audit across all vault items
export function runSecurityAudit(items: VaultItem[]): SecurityAuditResult {
  const weakPasswords: VaultItem[] = [];
  const passwordMap = new Map<string, VaultItem[]>();
  const expiringApiKeys: { item: VaultItem; daysRemaining: number }[] = [];

  const now = new Date();

  items.forEach((item) => {
    // Check passwords
    if (item.category === 'password' && item.passwordData?.password) {
      const pwd = item.passwordData.password;
      const strength = evaluatePasswordStrength(pwd);
      if (strength.score <= 2) {
        weakPasswords.push(item);
      }

      const existing = passwordMap.get(pwd) || [];
      existing.push(item);
      passwordMap.set(pwd, existing);
    }

    // Check expiring API keys
    if (item.category === 'api_key' && item.apiKeyData?.expiresAt) {
      const expDate = new Date(item.apiKeyData.expiresAt);
      if (!isNaN(expDate.getTime())) {
        const diffMs = expDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 30) {
          expiringApiKeys.push({ item, daysRemaining });
        }
      }
    }
  });

  const reusedPasswords: { password: string; items: VaultItem[] }[] = [];
  passwordMap.forEach((matchedItems, pwd) => {
    if (matchedItems.length > 1) {
      reusedPasswords.push({ password: pwd, items: matchedItems });
    }
  });

  // Calculate Overall Security Score
  let score = 100;
  score -= weakPasswords.length * 15;
  score -= reusedPasswords.reduce((acc, r) => acc + (r.items.length - 1) * 10, 0);
  score -= expiringApiKeys.length * 5;
  score = Math.max(10, Math.min(100, score));

  return {
    overallScore: items.length === 0 ? 100 : score,
    weakPasswords,
    reusedPasswords,
    expiringApiKeys,
    totalItems: items.length,
  };
}
