import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Key,
  Copy,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SecurityAuditResult, VaultItem } from '../types';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditResult: SecurityAuditResult;
  onFixItem: (item: VaultItem) => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  auditResult,
  onFixItem,
}) => {
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '양호 및 안전함';
    if (score >= 60) return '주의 필요';
    return '심각한 보안 취약점 발견';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                볼트 보안 진단 리포트
              </h2>
              <p className="text-xs text-slate-500">
                보관 중인 비밀번호 강도, 재사용 여부 및 API 키 만료 상태 점검
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

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Score Hero Banner */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center sm:text-left">
                <span className="text-xs text-slate-500 block mb-0.5 font-medium">전체 보안 건전성</span>
                <div className={`text-4xl font-extrabold font-mono ${getScoreColor(auditResult.overallScore)}`}>
                  {auditResult.overallScore}
                  <span className="text-lg text-slate-400 font-normal"> / 100</span>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200 hidden sm:block" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {getScoreLabel(auditResult.overallScore)}
                </span>
                <span className="text-[11px] text-slate-500">
                  총 {auditResult.totalItems}개 보관 항목 중 취약점 감지
                </span>
              </div>
            </div>

            {auditResult.overallScore < 80 && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                즉시 조치 권장
              </span>
            )}
          </div>

          {/* Section: Weak Passwords */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-rose-600">
                <Lock className="w-4 h-4" />
                취약한 비밀번호 ({auditResult.weakPasswords.length})
              </span>
            </h3>

            {auditResult.weakPasswords.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                모든 계정 비밀번호가 안전한 복합 기준을 만족하고 있습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {auditResult.weakPasswords.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-slate-500 text-[11px]">
                        아이디: {item.passwordData?.username} · 길이: {item.passwordData?.password.length || 0}자
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onFixItem(item);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-rose-500" />
                      비밀번호 강화하기
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Reused Passwords */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Copy className="w-4 h-4 text-amber-600" />
              <span>재사용 중인 동일 비밀번호 ({auditResult.reusedPasswords.length}개 그룹)</span>
            </h3>

            {auditResult.reusedPasswords.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                중복 재사용되는 비밀번호가 없습니다. (크리덴셜 스터핑 공격 예방됨)
              </div>
            ) : (
              <div className="space-y-3">
                {auditResult.reusedPasswords.map((group, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="text-amber-800 font-semibold text-[11px]">
                      아래 {group.items.length}개 계정에서 동일한 비밀번호가 사용 중입니다:
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200"
                        >
                          <span className="text-slate-800 font-medium">{item.title}</span>
                          <button
                            onClick={() => {
                              onClose();
                              onFixItem(item);
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            고유 비밀번호로 변경
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Expiring API Keys */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-sky-600" />
              <span>만료 임박 / 갱신 필요 API 키 ({auditResult.expiringApiKeys.length})</span>
            </h3>

            {auditResult.expiringApiKeys.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                30일 이내 만료 예정인 API 키가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {auditResult.expiringApiKeys.map(({ item, daysRemaining }) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-slate-500 text-[11px]">
                        만료일: {item.apiKeyData?.expiresAt} ({daysRemaining <= 0 ? '만료됨!' : `${daysRemaining}일 남음`})
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onFixItem(item);
                      }}
                      className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                    >
                      키 갱신하기
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
