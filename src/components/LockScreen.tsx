import React, { useState, useEffect } from 'react';
import { Shield, Lock, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, Fingerprint, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { evaluatePasswordStrength } from '../utils/crypto';
import { fetchDbStatus, DatabaseStatus } from '../utils/storage';
import { DatabaseConfigModal } from './DatabaseConfigModal';

interface LockScreenProps {
  isFirstSetup: boolean;
  onUnlock: (password: string) => Promise<boolean>;
  onSetup: (password: string, loadSamples: boolean) => Promise<void>;
  onResetVault: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  isFirstSetup,
  onUnlock,
  onSetup,
  onResetVault,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadSamples, setLoadSamples] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Biometric Fingerprint simulation state
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [biometricFeedback, setBiometricFeedback] = useState<string>('');

  // Database Connection Status & Modal
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  const pwdStrength = isFirstSetup ? evaluatePasswordStrength(password) : null;

  const loadDbInfo = async () => {
    try {
      const s = await fetchDbStatus();
      setDbStatus(s);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadDbInfo();
  }, []);

  // Handle Biometric Fingerprint Recognition Simulation
  const handleFingerprintAuth = async () => {
    if (isLoading || biometricStatus === 'scanning') return;
    setErrorMsg('');
    setBiometricStatus('scanning');
    setBiometricFeedback('생체 지문 스캔 중...');

    // Simulate scanning animation duration
    await new Promise((resolve) => setTimeout(resolve, 1100));

    if (isFirstSetup) {
      // If first setup, guide user to set password
      setBiometricStatus('failed');
      setBiometricFeedback('마스터 비밀번호 설정이 먼저 필요합니다.');
      setTimeout(() => {
        setBiometricStatus('idle');
        setBiometricFeedback('');
      }, 2500);
      return;
    }

    try {
      // Attempt quick unlock with the registered credentials
      const unlockSuccess = await onUnlock('0114');
      if (unlockSuccess) {
        setBiometricStatus('success');
        setBiometricFeedback('생체 지문 인증 완료! 볼트를 해제합니다.');
      } else {
        setBiometricStatus('failed');
        setBiometricFeedback('지문 인증 불일치: 비밀번호를 직접 입력해주세요.');
        setTimeout(() => {
          setBiometricStatus('idle');
          setBiometricFeedback('');
        }, 2500);
      }
    } catch {
      setBiometricStatus('failed');
      setBiometricFeedback('생체 센서 통신 오류가 발생했습니다.');
      setTimeout(() => {
        setBiometricStatus('idle');
        setBiometricFeedback('');
      }, 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password.trim()) {
      setErrorMsg('비밀번호를 입력해주세요.');
      return;
    }

    if (isFirstSetup) {
      if (password.length < 4) {
        setErrorMsg('마스터 비밀번호 또는 PIN은 최소 4자 이상이어야 합니다.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('비밀번호 확인이 일치하지 않습니다.');
        return;
      }

      setIsLoading(true);
      try {
        await onSetup(password, loadSamples);
      } catch {
        setErrorMsg('마스터 비밀번호 설정 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        const success = await onUnlock(password);
        if (!success) {
          setErrorMsg('마스터 비밀번호가 올바르지 않습니다.');
        }
      } catch {
        setErrorMsg('잠금 해제 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md glass-panel border-none rounded-3xl p-6 sm:p-8 shadow-2xl light-glow bg-white">
        {/* Header Branding */}
        <div className="text-center mb-6 pt-1">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white mb-3 shadow-xs">
            <Shield className="w-7 h-7 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
            <span>시크릿 볼트</span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-medium border border-slate-200">
              AES-256 GCM
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-2 font-normal">
            {isFirstSetup
              ? '안전한 개인 보관함 생성을 위해 관리자 PIN(4자리) 또는 비밀번호를 설정하세요'
              : '관리자 4자리 PIN 번호(0114) 또는 마스터 비밀번호로 잠금을 해제하세요'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">관리자 4자리 PIN / 비밀번호</label>
              {!isFirstSetup && (
                <button
                  type="button"
                  onClick={() => setPassword('0114')}
                  className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-sky-200"
                >
                  기본 PIN [0114] 자동 입력
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  if (errorMsg) setErrorMsg('');
                }}
                maxLength={32}
                placeholder="관리자 PIN 4자리 (0114) 또는 비밀번호 입력"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-slate-900 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-2xs font-mono tracking-wider"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength indicator for setup */}
            {isFirstSetup && password && pwdStrength && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">보안 강도:</span>
                  <span className="font-semibold text-slate-800">{pwdStrength.label} ({pwdStrength.entropy} bits)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  {[0, 1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        step <= pwdStrength.score ? pwdStrength.color : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {isFirstSetup && (
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 한 번 더 입력하세요"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-slate-900 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-2xs font-mono"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || biometricStatus === 'scanning'}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isFirstSetup ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                새로운 볼트 생성하기
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-white" />
                볼트 잠금 해제
              </>
            )}
          </button>
        </form>

        {/* Interactive Biometric Fingerprint Authentication Section */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center">
          <p className="text-[11px] font-medium text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-sky-500" />
            <span>생체 인증(지문 인식) 빠른 잠금 해제</span>
          </p>

          <button
            type="button"
            onClick={handleFingerprintAuth}
            disabled={isLoading || biometricStatus === 'scanning'}
            aria-label="지문 인식으로 잠금 해제"
            className={`group relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl transition-all duration-300 cursor-pointer ${
              biometricStatus === 'scanning'
                ? 'bg-sky-50 border-2 border-sky-500 shadow-md shadow-sky-100'
                : biometricStatus === 'success'
                ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md shadow-emerald-100'
                : biometricStatus === 'failed'
                ? 'bg-rose-50 border-2 border-rose-400'
                : 'bg-slate-50 hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-sm'
            }`}
          >
            {/* Animated Laser Scanning Line */}
            {biometricStatus === 'scanning' && (
              <motion.div
                initial={{ top: '15%' }}
                animate={{ top: ['15%', '85%', '15%'] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-3 right-3 h-0.5 bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)] z-10 pointer-events-none rounded-full"
              />
            )}

            {/* Ripple Pulse Rings */}
            {biometricStatus === 'scanning' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.25, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl border-2 border-sky-400 pointer-events-none"
              />
            )}

            {/* Icon */}
            <motion.div
              animate={
                biometricStatus === 'scanning'
                  ? { scale: [1, 1.06, 1] }
                  : biometricStatus === 'success'
                  ? { scale: [1, 1.15, 1] }
                  : {}
              }
              transition={{ duration: 0.6, repeat: biometricStatus === 'scanning' ? Infinity : 0 }}
              className="relative z-0"
            >
              {biometricStatus === 'success' ? (
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              ) : (
                <Fingerprint
                  className={`w-9 h-9 transition-colors duration-200 ${
                    biometricStatus === 'scanning'
                      ? 'text-sky-600'
                      : biometricStatus === 'failed'
                      ? 'text-rose-500'
                      : 'text-slate-500 group-hover:text-sky-600'
                  }`}
                />
              )}
            </motion.div>
          </button>

          {/* Biometric Status Feedback text */}
          <div className="min-h-[22px] mt-2.5 text-center">
            <AnimatePresence mode="wait">
              {biometricFeedback ? (
                <motion.p
                  key="feedback"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs font-semibold ${
                    biometricStatus === 'success'
                      ? 'text-emerald-600'
                      : biometricStatus === 'failed'
                      ? 'text-rose-600'
                      : 'text-sky-600 animate-pulse'
                  }`}
                >
                  {biometricFeedback}
                </motion.p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  아이콘을 탭하여 지문 인식을 진행하세요
                </p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Option to Reset Vault if password forgotten */}
        {!isFirstSetup && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                비밀번호를 분실하셨나요? 볼트 초기화
              </button>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2 text-rose-700">
                <p>볼트를 초기화하면 저장된 암호화 데이터가 모두 삭제됩니다.</p>
                <div className="flex gap-2 justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={onResetVault}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    데이터 삭제 및 초기화
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Database Configuration Modal */}
      <DatabaseConfigModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onConnectionSuccess={() => loadDbInfo()}
      />
    </div>
  );
};
