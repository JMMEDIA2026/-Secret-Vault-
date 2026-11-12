import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Copy,
  Check,
  Wand2,
  Key,
  Lock,
  Sparkles,
  Sliders,
} from 'lucide-react';
import {
  generateSecurePassword,
  generateApiKeyPreset,
  evaluatePasswordStrength,
  PasswordGeneratorOptions,
} from '../utils/crypto';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectValue?: (val: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSelectValue,
}) => {
  const [tab, setTab] = useState<'password' | 'apikey'>('password');
  const [generatedValue, setGeneratedValue] = useState('');
  const [copied, setCopied] = useState(false);

  // Password options
  const [length, setLength] = useState(20);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(true);

  // API Key preset options
  const [apiPreset, setApiPreset] = useState<'openai' | 'gemini' | 'hex' | 'bearer' | 'uuid'>('openai');

  const regenerate = () => {
    if (tab === 'password') {
      const options: PasswordGeneratorOptions = {
        length,
        useUpper,
        useLower,
        useNumbers,
        useSymbols,
        avoidAmbiguous,
      };
      setGeneratedValue(generateSecurePassword(options));
    } else {
      setGeneratedValue(generateApiKeyPreset(apiPreset));
    }
  };

  useEffect(() => {
    if (isOpen) {
      regenerate();
    }
  }, [isOpen, tab, length, useUpper, useLower, useNumbers, useSymbols, avoidAmbiguous, apiPreset]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = tab === 'password' ? evaluatePasswordStrength(generatedValue) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel border border-white/25 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.15)] overflow-hidden backdrop-blur-3xl">
        {/* Rainbow Neon Accent */}
        <div className="h-[2.5px] w-full rainbow-neon-bar" />

        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/15 flex items-center justify-between bg-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                보안 키 및 비밀번호 생성기
              </h2>
              <p className="text-xs text-slate-300">
                암호학적으로 안전한 고엔트로피 키를 생성합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white glass-btn border-white/10 hover:border-white/30 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-white/15 px-6 pt-3 gap-3 bg-white/[0.02]">
          <button
            onClick={() => setTab('password')}
            className={`flex items-center gap-1.5 pb-2.5 text-xs rounded-xl font-bold px-3 transition-all cursor-pointer ${
              tab === 'password'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            복합 비밀번호
          </button>
          <button
            onClick={() => setTab('apikey')}
            className={`flex items-center gap-1.5 pb-2.5 text-xs rounded-xl font-bold px-3 transition-all cursor-pointer ${
              tab === 'apikey'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-cyan-300" />
            API 키 및 시크릿 토큰
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Generated Result Display Box */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">생성된 보안 값</span>
              <button
                onClick={regenerate}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                다시 생성
              </button>
            </div>

            <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-between gap-3">
              <span className="font-mono text-xs sm:text-sm text-emerald-300 break-all select-all font-semibold">
                {generatedValue}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 px-3.5 py-1.5 neon-btn-purple text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(217,70,239,0.5)] transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>복사</span>
                  </>
                )}
              </button>
            </div>

            {/* Password Entropy bar if in password mode */}
            {strength && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">엔트로피: {strength.entropy} bits</span>
                  <span className="text-emerald-400 font-medium">해독 예상: {strength.crackTime}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 ${
                        step <= strength.score ? strength.color : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PASSWORD OPTIONS */}
          {tab === 'password' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    비밀번호 길이
                  </span>
                  <span className="text-white font-mono font-bold">{length}자</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useUpper}
                    onChange={(e) => setUseUpper(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-500 bg-zinc-900 border-zinc-700"
                  />
                  <span className="text-zinc-300">대문자 (A-Z)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useLower}
                    onChange={(e) => setUseLower(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-500 bg-zinc-900 border-zinc-700"
                  />
                  <span className="text-zinc-300">소문자 (a-z)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useNumbers}
                    onChange={(e) => setUseNumbers(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-500 bg-zinc-900 border-zinc-700"
                  />
                  <span className="text-zinc-300">숫자 (0-9)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSymbols}
                    onChange={(e) => setUseSymbols(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-500 bg-zinc-900 border-zinc-700"
                  />
                  <span className="text-zinc-300">특수문자 (!@#$%)</span>
                </label>
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={avoidAmbiguous}
                  onChange={(e) => setAvoidAmbiguous(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-500 bg-zinc-900 border-zinc-700"
                />
                <span className="text-zinc-300">
                  혼동하기 쉬운 문자 제외 (0, O, 1, l, I)
                </span>
              </label>
            </div>
          )}

          {/* API KEY PRESETS */}
          {tab === 'apikey' && (
            <div className="space-y-3 text-xs">
              <label className="block text-zinc-300 font-medium mb-1">
                API 키 / 토큰 포맷 프리셋
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setApiPreset('openai')}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    apiPreset === 'openai'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <div className="font-semibold text-white">OpenAI 형식</div>
                  <div className="text-[11px] text-zinc-400">sk-proj-... (48자 접두사)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setApiPreset('gemini')}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    apiPreset === 'gemini'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <div className="font-semibold text-white">Google AI Studio</div>
                  <div className="text-[11px] text-zinc-400">AIzaSy... (39자 포맷)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setApiPreset('hex')}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    apiPreset === 'hex'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <div className="font-semibold text-white">256-bit Hex Token</div>
                  <div className="text-[11px] text-zinc-400">64자리 16진수 보안 토큰</div>
                </button>

                <button
                  type="button"
                  onClick={() => setApiPreset('uuid')}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    apiPreset === 'uuid'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <div className="font-semibold text-white">UUID v4</div>
                  <div className="text-[11px] text-zinc-400">표준 36자 고유 식별자</div>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-white/15">
            <button
              onClick={onClose}
              className="px-4 py-2.5 glass-btn border-white/10 hover:border-white/30 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              닫기
            </button>
            {onSelectValue && (
              <button
                onClick={() => {
                  onSelectValue(generatedValue);
                  onClose();
                }}
                className="px-5 py-2.5 neon-btn-emerald text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                이 값으로 적용하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
