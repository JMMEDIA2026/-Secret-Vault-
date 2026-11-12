import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Settings,
  KeyRound,
  Download,
  Upload,
  AlertTriangle,
  Clock,
  Clipboard,
  Shield,
  CheckCircle2,
  Database,
  Server,
  Key,
  RefreshCw,
  Bot,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { VaultSettings, VaultItem } from '../types';
import { evaluatePasswordStrength } from '../utils/crypto';
import { fetchDbStatus, updateDbConfig, DatabaseStatus } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VaultSettings;
  onSaveSettings: (newSettings: VaultSettings) => void;
  items: VaultItem[];
  onChangeMasterPassword: (newPassword: string) => Promise<boolean>;
  onImportBackup: (importedItems: VaultItem[]) => void;
  onWipeVault: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  items,
  onChangeMasterPassword,
  onImportBackup,
  onWipeVault,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'aichat' | 'password' | 'database' | 'backup' | 'danger'>('general');

  // AI Chat Settings state
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(settings.aiAssistantEnabled ?? true);
  const [aiModel, setAiModel] = useState<'gemini-2.5-flash' | 'gemini-3.8-flash' | 'gemini-flash-latest'>(
    settings.aiModel || 'gemini-2.5-flash'
  );
  const [aiAutoSuggestFolders, setAiAutoSuggestFolders] = useState(settings.aiAutoSuggestFolders ?? true);
  const [aiIncludeNotes, setAiIncludeNotes] = useState(settings.aiIncludeNotes ?? true);
  const [aiDefaultTemperature, setAiDefaultTemperature] = useState(settings.aiDefaultTemperature ?? 0.2);
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Database settings
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [dbHost, setDbHost] = useState('us-east-1.pg.psdb.cloud');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('postgres');
  const [dbUser, setDbUser] = useState('pscale_api_n04qjyelr69d.9k0005vtdxb5');
  const [dbPassword, setDbPassword] = useState('wjs3603825!');
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const loadDbInfo = async () => {
    try {
      const s = await fetchDbStatus();
      setDbStatus(s);
      if (s.host) setDbHost(s.host);
      if (s.port) setDbPort(String(s.port));
      if (s.database) setDbName(s.database);
      if (s.user) setDbUser(s.user);
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      loadDbInfo();
    }
  }, [isOpen]);

  const handleTestAndSaveDb = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingDb(true);
    setDbTestResult(null);

    const res = await updateDbConfig({
      host: dbHost,
      port: parseInt(dbPort, 10),
      database: dbName,
      user: dbUser,
      password: dbPassword,
    });

    setDbTestResult(res);
    setIsTestingDb(false);
    if (res.success) {
      await loadDbInfo();
    }
  };

  // Settings states
  const [autoLockMinutes, setAutoLockMinutes] = useState(settings.autoLockMinutes);
  const [clipboardTimeoutSec, setClipboardTimeoutSec] = useState(settings.clipboardTimeoutSec);

  // Wipe confirmation
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveGeneralSettings = () => {
    onSaveSettings({
      ...settings,
      autoLockMinutes,
      clipboardTimeoutSec,
    });
    alert('설정이 저장되었습니다.');
  };

  const handleSaveAiChatSettings = () => {
    onSaveSettings({
      ...settings,
      aiAssistantEnabled,
      aiModel,
      aiAutoSuggestFolders,
      aiIncludeNotes,
      aiDefaultTemperature,
    });
    setAiSaveSuccess(true);
    setTimeout(() => setAiSaveSuccess(false), 3000);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword.length < 4) {
      setPwdMsg({ type: 'error', text: '새 마스터 비밀번호 또는 PIN은 최소 4자 이상이어야 합니다.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: '비밀번호 확인이 일치하지 않습니다.' });
      return;
    }

    setIsChangingPwd(true);
    try {
      const success = await onChangeMasterPassword(newPassword);
      if (success) {
        setPwdMsg({ type: 'success', text: '마스터 비밀번호가 성공적으로 변경 및 재암호화되었습니다.' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg({ type: 'error', text: '비밀번호 변경에 실패했습니다.' });
      }
    } catch {
      setPwdMsg({ type: 'error', text: '오류가 발생했습니다.' });
    } finally {
      setIsChangingPwd(false);
    }
  };

  // Export JSON Backup
  const handleExportDecryptedJson = () => {
    if (!window.confirm('경고: 백업 파일에는 암호화가 해제된 실제 키와 비밀번호가 포함됩니다. 안전한 곳에 보관하시겠습니까?')) {
      return;
    }

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      itemCount: items.length,
      items: items,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secret-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        const importedItems: VaultItem[] = Array.isArray(parsed)
          ? parsed
          : parsed.items || [];

        if (importedItems.length === 0) {
          alert('유효한 볼트 항목을 찾을 수 없습니다.');
          return;
        }

        if (
          window.confirm(
            `총 ${importedItems.length}개의 항목을 가져오시겠습니까? 기존 항목과 병합됩니다.`
          )
        ) {
          onImportBackup(importedItems);
          alert('가져오기가 완료되었습니다.');
          onClose();
        }
      } catch {
        alert('백업 파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const newPwdStrength = newPassword ? evaluatePasswordStrength(newPassword) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                볼트 환경설정 및 관리
              </h2>
              <p className="text-xs text-slate-500">
                자동 잠금, 마스터 비밀번호, 데이터 백업 및 복원
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 pt-2.5 gap-2 bg-slate-50/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 text-xs rounded-t-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            일반 및 보안
          </button>
          <button
            onClick={() => setActiveTab('aichat')}
            className={`px-3 py-2 text-xs rounded-t-xl font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'aichat'
                ? 'bg-white text-sky-700 border-t border-x border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-sky-500" />
            <span>AI Chat 설정</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-3 py-2 text-xs rounded-t-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'password'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            마스터 비밀번호 변경
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-2 text-xs rounded-t-xl font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-sky-600" />
            PostgreSQL DB 연동
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-2 text-xs rounded-t-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            백업 및 복원
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`px-3 py-2 text-xs rounded-t-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'danger'
                ? 'bg-white text-rose-700 border-t border-x border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            초기화
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  자동 잠금 시간 (미사용 시)
                </label>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800"
                >
                  <option value={5}>5분 후 자동 잠금</option>
                  <option value={15}>15분 후 자동 잠금 (권장)</option>
                  <option value={30}>30분 후 자동 잠금</option>
                  <option value={60}>1시간 후 자동 잠금</option>
                  <option value={0}>자동 잠금 안 함 (세션 유지)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                  <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                  클립보드 복사 시 만료 안내 시간
                </label>
                <select
                  value={clipboardTimeoutSec}
                  onChange={(e) => setClipboardTimeoutSec(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800"
                >
                  <option value={10}>10초</option>
                  <option value={30}>30초 (권장)</option>
                  <option value={60}>60초</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveGeneralSettings}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  설정 저장
                </button>
              </div>
            </div>
          )}

          {/* TAB: AI CHAT SETTINGS */}
          {activeTab === 'aichat' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-2xl flex items-start gap-3">
                <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>무료 Gemini AI 스마트 보관함 어시스턴트 설정</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-semibold border border-sky-300">
                      Active
                    </span>
                  </h3>
                  <p className="text-slate-600 mt-0.5 text-xs leading-relaxed">
                    자연어로 계정, API 키, 연락처를 입력하면 카테고리와 기존 맞춤 폴더를 자동으로 판단하고 분류해주는 AI Chat의 동작 환경을 설정합니다.
                  </p>
                </div>
              </div>

              {aiSaveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">AI Chat 어시스턴트 설정이 안전하게 저장되었습니다!</span>
                </div>
              )}

              {/* Toggle AI Feature */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <label className="text-slate-900 font-bold block">AI 어시스턴트 채팅창 활성화</label>
                  <p className="text-slate-500 text-[11px]">
                    메인 보관함 상단에 자연어 입력 및 자동 분류 채팅창을 표시합니다.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={aiAssistantEnabled}
                  onChange={(e) => setAiAssistantEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                />
              </div>

              {/* Gemini AI Model Selection */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                  Gemini AI 분석 모델 선택
                </label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800 font-mono text-xs"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (구글 공식 표준 추천, 초고속 & 최고 정확도)</option>
                  <option value="gemini-3.8-flash">gemini-3.8-flash (고난도 텍스트 심층 추론)</option>
                  <option value="gemini-flash-latest">gemini-flash-latest (최신 안정화 버전 자동 유지)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  * 구글 무료 티어 할당량 내에서 고속 분석되며 API 키는 백엔드 프록시로 안전하게 보호됩니다.
                </p>
              </div>

              {/* Auto Suggest Folders Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <label className="text-slate-900 font-bold block">사용자 맞춤 폴더 자동 매칭 및 추천</label>
                  <p className="text-slate-500 text-[11px]">
                    현재 생성된 폴더 목록을 바탕으로 입력값에 가장 어울리는 폴더를 AI가 스스로 선택합니다.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={aiAutoSuggestFolders}
                  onChange={(e) => setAiAutoSuggestFolders(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                />
              </div>

              {/* Include Notes Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <label className="text-slate-900 font-bold block">부가 설명 및 비고 자동 추출</label>
                  <p className="text-slate-500 text-[11px]">
                    사용자 입력 중 괄호나 서술형 문장(예: 개발용, 월 한도 등)을 비고(Notes) 항목에 보관합니다.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={aiIncludeNotes}
                  onChange={(e) => setAiIncludeNotes(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                />
              </div>

              {/* AI Precision / Temperature Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    AI 분류 정밀도 (Temperature: {aiDefaultTemperature})
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {aiDefaultTemperature <= 0.2 ? '매우 정확하고 일관됨 (권장)' : '유연한 추론'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={aiDefaultTemperature}
                  onChange={(e) => setAiDefaultTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAiChatSettings}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AI Chat 설정 저장</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CHANGE MASTER PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 flex items-start gap-2">
                <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p>
                  마스터 비밀번호를 변경하면 현재 저장된 모든 데이터가 새 키로 즉시 재암호화됩니다.
                </p>
              </div>

              {pwdMsg && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 ${
                    pwdMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {pwdMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{pwdMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  새 마스터 비밀번호 또는 PIN (최소 4자 이상)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새로운 마스터 비밀번호 또는 PIN 입력"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                />

                {newPwdStrength && newPassword && (
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-slate-500">강도: {newPwdStrength.label}</span>
                    <span className="text-slate-800 font-semibold">{newPwdStrength.crackTime}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  새 마스터 비밀번호 확인
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 다시 입력"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPwd}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {isChangingPwd ? '재암호화 중...' : '비밀번호 변경 및 데이터 재암호화'}
              </button>
            </form>
          )}

          {/* TAB: DATABASE CONFIGURATION */}
          {activeTab === 'database' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl border flex items-start gap-2.5 bg-slate-50 border-slate-200">
                {dbStatus?.connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-emerald-700">데이터베이스 연결됨 (클라우드 PostgreSQL)</div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        <strong className="font-mono">{dbStatus.host}</strong> ({dbStatus.database})의 secret_vault_store 테이블에 안전하게 동기화 중입니다.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-800">PostgreSQL 연결 확인 필요</div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        PlanetScale 콘솔의 암호(✏️ 아이콘 클릭 시 표시되는 DB 암호)를 입력하고 연결 테스트를 진행해주세요.
                      </p>
                      {dbStatus?.error && (
                        <div className="mt-1 font-mono text-[10px] text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                          {dbStatus.error}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>로컬 저장소(localStorage) 사용이 차단되어 있으며 데이터는 DB로만 처리됩니다.</span>
              </div>

              {dbTestResult && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 ${
                    dbTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {dbTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{dbTestResult.message || dbTestResult.error}</span>
                </div>
              )}

              <form onSubmit={handleTestAndSaveDb} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">데이터베이스 호스트</label>
                  <input
                    type="text"
                    value={dbHost}
                    onChange={(e) => setDbHost(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">포트</label>
                    <input
                      type="text"
                      value={dbPort}
                      onChange={(e) => setDbPort(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">데이터베이스 이름</label>
                    <input
                      type="text"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">사용자 (Role / ID)</label>
                  <input
                    type="text"
                    value={dbUser}
                    onChange={(e) => setDbUser(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">암호 (Password / Token)</label>
                  <input
                    type="password"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    placeholder="암호 입력"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isTestingDb}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {isTestingDb ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        확인 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        연결 테스트 및 설정 저장
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-slate-600" />
                  JSON 데이터 내보내기 (백업)
                </h4>
                <p className="text-slate-500 text-[11px]">
                  현재 저장된 모든 API 키, 비밀번호, 연락처를 JSON 파일로 다운로드합니다.
                </p>
                <button
                  type="button"
                  onClick={handleExportDecryptedJson}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  백업 파일 다운로드 (.json)
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-slate-600" />
                  백업 파일에서 데이터 복원
                </h4>
                <p className="text-slate-500 text-[11px]">
                  이전에 내보낸 JSON 백업 파일을 업로드하여 현재 볼트에 추가 병합합니다.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  백업 파일 선택 및 복원
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DANGER ZONE (WIPE) */}
          {activeTab === 'danger' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                위험 영역: 볼트 데이터 영구 삭제
              </div>
              <p className="text-rose-700 text-[11px] leading-relaxed">
                볼트의 모든 암호화 키, 설정, 저장된 API 키와 비밀번호가 브라우저에서 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  확인을 위해 <strong className="text-rose-600 font-mono">초기화</strong> 라고 입력하세요:
                </label>
                <input
                  type="text"
                  value={wipeConfirmText}
                  onChange={(e) => setWipeConfirmText(e.target.value)}
                  placeholder="초기화"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-rose-600"
                />
              </div>
              <button
                type="button"
                disabled={wipeConfirmText !== '초기화'}
                onClick={onWipeVault}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                모든 데이터 영구 삭제 및 볼트 재설정
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
