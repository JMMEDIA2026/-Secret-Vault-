import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, Shield, Server, Key } from 'lucide-react';
import { fetchDbStatus, updateDbConfig, DatabaseStatus } from '../utils/storage';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess?: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionSuccess,
}) => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [host, setHost] = useState('us-east-1.pg.psdb.cloud');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('postgres');
  const [user, setUser] = useState('pscale_api_n04qjyelr69d.9k0005vtdxb5');
  const [password, setPassword] = useState('wjs3603825!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const s = await fetchDbStatus();
      setStatus(s);
      if (s.host) setHost(s.host);
      if (s.port) setPort(String(s.port));
      if (s.database) setDatabase(s.database);
      if (s.user) setUser(s.user);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTestResult(null);

    const res = await updateDbConfig({
      host,
      port: parseInt(port, 10),
      database,
      user,
      password,
    });

    setTestResult(res);
    setIsLoading(false);

    if (res.success) {
      await loadStatus();
      onConnectionSuccess?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg glass-panel border-none rounded-2xl p-6 shadow-2xl light-glow bg-white text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">PostgreSQL 데이터베이스 연동 관리</h2>
              <p className="text-[11px] text-slate-500">PlanetScale PostgreSQL • 로컬 저장소 완전 차단</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status banner */}
        <div className="my-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 bg-slate-50 border-slate-200">
          {status?.connected ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-700">데이터베이스 연결 활성화됨</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  모든 암호화 데이터는 <strong className="font-mono">{status.host}</strong> ({status.database})의{' '}
                  <code className="bg-slate-200/80 px-1 py-0.5 rounded">secret_vault_store</code> 테이블에 안전하게 동기화됩니다.
                </div>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-800">데이터베이스 연결 확인 필요</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  PlanetScale 대시보드의 암호(✏️ 아이콘 클릭 시 표시되는 실제 DB 패스워드)를 입력 후 아래 [연결 테스트 및 저장]을 누르면 즉시 연동됩니다.
                </div>
                {status?.error && (
                  <div className="mt-1 font-mono text-[10px] text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                    오류 내용: {status.error}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Notice on local storage ban */}
        <div className="mb-4 px-3 py-2 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>보안 방침에 따라 로컬 브라우저 저장소(localStorage) 사용이 영구 차단되었습니다.</span>
        </div>

        {testResult && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{testResult.message || testResult.error}</span>
          </div>
        )}

        <form onSubmit={handleTestAndSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">데이터베이스 호스트</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Server className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg font-mono text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">포트</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg font-mono text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">데이터베이스 이름</label>
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg font-mono text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">사용자 (Role / ID)</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg font-mono text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">암호 (Password / Token)</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showPassword ? '숨기기' : '표시'}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Key className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="암호 또는 PlanetScale 토큰 입력"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-lg font-mono text-slate-900 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              * PlanetScale 대시보드에서 ✏️(연필) 아이콘으로 확인한 암호값을 입력할 수 있습니다.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer transition-colors"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  연결 확인 중...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  연결 테스트 및 적용
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
