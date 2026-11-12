import React, { useState } from 'react';
import {
  X,
  Key,
  Lock,
  Phone,
  FileText,
  Star,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Calendar,
  Building,
  User,
  ShieldAlert,
  Server,
  Edit2,
  Trash2,
  Clock,
  Folder,
} from 'lucide-react';
import { VaultItem, VaultFolder } from '../types';
import { getTagNeonStyle, getNeonColorById } from '../utils/neonTheme';

interface ItemDetailModalProps {
  item: VaultItem | null;
  isOpen: boolean;
  folders?: VaultFolder[];
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopiedSecret: (label: string, text: string) => void;
  onSelectFolder?: (folderId: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  folders = [],
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopiedSecret,
  onSelectFolder,
}) => {
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const currentFolder = folders.find((f) => f.id === item.folderId);
  const folderColor = currentFolder ? getNeonColorById(currentFolder.colorId) : null;

  const toggleFieldReveal = (field: string) => {
    setRevealedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const copyText = (text: string, fieldName: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    onCopiedSecret(label, text);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0d12]/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#12151c] border-x border-t-[#2a3040] border-b-[#0a0c10] rounded-2xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_15px_35px_rgba(0,0,0,0.6)] overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f2430] flex items-center justify-between bg-[#12151c]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleFavorite(item.id)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                item.isFavorite
                  ? 'text-[#f2c078] drop-shadow-[0_0_8px_rgba(242,192,120,0.4)]'
                  : 'text-[#4b5563] hover:text-[#e8ecf1]'
              }`}
            >
              <Star
                className="w-5 h-5"
                fill={item.isFavorite ? 'currentColor' : 'none'}
              />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#e8ecf1] tracking-tight">
                {item.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-[#6b7280]">
                  {item.category === 'api_key' && 'API 키 및 인증 토큰'}
                  {item.category === 'password' && '계정 정보 및 비밀번호'}
                  {item.category === 'contact' && '보안 암호화 연락처'}
                  {item.category === 'note' && '보안 암호화 메모'}
                </p>
                {currentFolder && folderColor && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectFolder?.(currentFolder.id);
                    }}
                    title="해당 카테고리로 필터링"
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border cursor-pointer transition-all ${folderColor.badge} border-opacity-30`}
                  >
                    <Folder className="w-3 h-3" />
                    <span>{currentFolder.name}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#7fd8e0] hover:bg-[#1f2430] transition-colors cursor-pointer"
              title="수정"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (window.confirm('이 항목을 삭제하시겠습니까?')) {
                  onClose();
                  onDelete(item.id);
                }
              }}
              className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#e0667f] hover:bg-[#e0667f]/10 transition-colors cursor-pointer"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#4b5563] hover:text-[#e8ecf1] hover:bg-[#1f2430] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-[#12151c]">
          {/* Emergency Alert Header for Contacts */}
          {item.category === 'contact' && item.contactData?.isEmergency && (
            <div className="p-3 bg-[#e0667f]/10 border border-[#e0667f]/30 rounded-xl text-xs text-[#e0667f] flex items-center gap-2 shadow-inner">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                <strong>긴급 비상 연락처</strong>로 등록되어 있습니다. 응급 시 우선 확인하세요.
              </span>
            </div>
          )}

          {/* API KEY DETAILS */}
          {item.category === 'api_key' && item.apiKeyData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#0b0d12]/50 p-3 rounded-xl border border-[#1f2430] shadow-inner">
                  <span className="text-[#6b7280] block mb-1">서비스명</span>
                  <span className="text-[#e8ecf1] font-semibold flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-[#7fd8e0]" />
                    {item.apiKeyData.service}
                  </span>
                </div>
                <div className="bg-[#0b0d12]/50 p-3 rounded-xl border border-[#1f2430] shadow-inner">
                  <span className="text-[#6b7280] block mb-1">실행 환경</span>
                  <span className="text-[#7fd8e0] font-mono font-semibold uppercase">
                    {item.apiKeyData.environment}
                  </span>
                </div>
              </div>

              {/* API Key Value Box */}
              <div className="bg-[#0b0d12]/50 p-3.5 rounded-xl border border-[#1f2430] space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-xs text-[#6b7280]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Key className="w-3.5 h-3.5 text-[#7fd8e0]" />
                    API Key
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldReveal('apiKey')}
                    className="text-[#6b7280] hover:text-[#e8ecf1] flex items-center gap-1 text-[11px] font-medium cursor-pointer transition-colors"
                  >
                    {revealedFields.apiKey ? (
                      <>
                        <EyeOff className="w-3 h-3" /> 숨기기
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> 표시
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="font-mono text-xs text-[#e8ecf1] break-all select-all font-semibold">
                    {revealedFields.apiKey
                      ? item.apiKeyData.apiKey
                      : '•'.repeat(Math.min(32, item.apiKeyData.apiKey.length || 20))}
                  </span>
                  <button
                    onClick={() =>
                      copyText(item.apiKeyData!.apiKey, 'apiKey', 'API Key')
                    }
                    className="shrink-0 p-1.5 bg-[#1f2430] hover:bg-[#2a3040] text-[#e8ecf1] border border-[#2a3040] rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-sm transition-all active:scale-95"
                  >
                    {copiedField === 'apiKey' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>복사</span>
                  </button>
                </div>
              </div>

              {/* API Secret if exists */}
              {item.apiKeyData.apiSecret && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">API Secret / 비밀 토큰</span>
                    <button
                      type="button"
                      onClick={() => toggleFieldReveal('apiSecret')}
                      className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                    >
                      {revealedFields.apiSecret ? (
                        <>
                          <EyeOff className="w-3 h-3" /> 숨기기
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> 표시
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="font-mono text-xs text-slate-900 break-all select-all font-semibold">
                      {revealedFields.apiSecret
                        ? item.apiKeyData.apiSecret
                        : '•'.repeat(24)}
                    </span>
                    <button
                      onClick={() =>
                        copyText(
                          item.apiKeyData!.apiSecret!,
                          'apiSecret',
                          'API Secret'
                        )
                      }
                      className="shrink-0 p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                    >
                      {copiedField === 'apiSecret' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>복사</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Endpoint & Expiry */}
              {item.apiKeyData.endpointUrl && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-500 block mb-1">Base URL / Endpoint</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-slate-800 truncate font-medium">
                      {item.apiKeyData.endpointUrl}
                    </span>
                    <button
                      onClick={() =>
                        copyText(
                          item.apiKeyData!.endpointUrl!,
                          'endpoint',
                          'Endpoint URL'
                        )
                      }
                      className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {item.apiKeyData.expiresAt && (
                <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>만료 / 갱신 예정일: {item.apiKeyData.expiresAt}</span>
                </div>
              )}
            </div>
          )}

          {/* PASSWORD DETAILS */}
          {item.category === 'password' && item.passwordData && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">서비스</span>
                  <span className="text-slate-900 font-semibold">
                    {item.passwordData.service || '웹사이트'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">웹사이트 링크</span>
                  {item.passwordData.websiteUrl ? (
                    <a
                      href={item.passwordData.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {item.passwordData.websiteUrl}
                      </span>
                    </a>
                  ) : (
                    <span className="text-slate-400">등록 안 됨</span>
                  )}
                </div>
              </div>

              {/* Username Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">아이디 / 계정</span>
                  <span className="text-slate-900 font-mono font-semibold select-all">
                    {item.passwordData.username}
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyText(
                      item.passwordData!.username,
                      'username',
                      '아이디/이메일'
                    )
                  }
                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                >
                  {copiedField === 'username' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>복사</span>
                </button>
              </div>

              {/* Password Box */}
              <div className="bg-[#0b0d12]/50 p-3.5 rounded-xl border border-[#1f2430] space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-xs text-[#6b7280]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Lock className="w-3.5 h-3.5 text-[#7fd8e0]" />
                    비밀번호
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFieldReveal('password')}
                    className="text-[#6b7280] hover:text-[#e8ecf1] flex items-center gap-1 text-[11px] font-medium cursor-pointer transition-colors"
                  >
                    {revealedFields.password ? (
                      <>
                        <EyeOff className="w-3 h-3" /> 숨기기
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> 표시
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="font-mono text-xs text-[#e8ecf1] break-all select-all font-semibold">
                    {revealedFields.password
                      ? item.passwordData.password
                      : '•'.repeat(16)}
                  </span>
                  <button
                    onClick={() =>
                      copyText(
                        item.passwordData!.password,
                        'password',
                        '비밀번호'
                      )
                    }
                    className="shrink-0 p-1.5 bg-[#1f2430] hover:bg-[#2a3040] text-[#e8ecf1] border border-[#2a3040] rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-sm transition-all active:scale-95"
                  >
                    {copiedField === 'password' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>복사</span>
                  </button>
                </div>
              </div>

              {/* 2FA backup codes if exists */}
              {item.passwordData.twoFactorSeed && (
                <div className="bg-[#0b0d12]/50 p-3 rounded-xl border border-[#1f2430] text-xs space-y-1 shadow-inner">
                  <div className="flex justify-between items-center text-[#6b7280]">
                    <span>2차 인증(2FA) 백업 키 / 복구 코드</span>
                    <button
                      onClick={() =>
                        copyText(
                          item.passwordData!.twoFactorSeed!,
                          '2fa',
                          '2FA 코드'
                        )
                      }
                      className="text-[#6b7280] hover:text-[#e8ecf1] p-1 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="font-mono text-[#e8ecf1] block select-all font-medium">
                    {item.passwordData.twoFactorSeed}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* CONTACT DETAILS */}
          {item.category === 'contact' && item.contactData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#0b0d12]/50 p-3 rounded-xl border border-[#1f2430] shadow-inner">
                  <span className="text-[#6b7280] block mb-1">이름</span>
                  <span className="text-[#e8ecf1] font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#7fd8e0]" />
                    {item.contactData.name}
                  </span>
                </div>
                <div className="bg-[#0b0d12]/50 p-3 rounded-xl border border-[#1f2430] shadow-inner">
                  <span className="text-[#6b7280] block mb-1">소속 및 관계</span>
                  <span className="text-[#e8ecf1] flex items-center gap-1.5 font-medium">
                    <Building className="w-3.5 h-3.5 text-[#6b7280]" />
                    {item.contactData.organization || item.contactData.relationship || '미지정'}
                  </span>
                </div>
              </div>

              {/* Primary Phone Box */}
              <div className="bg-[#0b0d12]/50 p-3.5 rounded-xl border border-[#1f2430] space-y-2 shadow-inner">
                <span className="text-xs text-[#6b7280] flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-[#7fd8e0]" />
                  주 전화번호
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-base font-bold text-[#e8ecf1] select-all">
                    {item.contactData.phoneNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${item.contactData.phoneNumber.replace(/[^0-9+]/g, '')}`}
                      className="px-2.5 py-1.5 bg-[#7fd8e0] hover:bg-[#7fd8e0]/80 text-[#12151c] rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                    >
                      <Phone className="w-3 h-3" />
                      통화
                    </a>
                  </div>
                </div>
              </div>

              {/* Email if available */}
              {item.contactData.email && (
                <div className="bg-[#0b0d12]/50 p-3 rounded-xl border border-[#1f2430] flex items-center justify-between text-xs shadow-inner">
                  <div>
                    <span className="text-[#6b7280] block mb-0.5">이메일</span>
                    <span className="text-[#e8ecf1] select-all font-medium">
                      {item.contactData.email}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyText(
                        item.contactData!.email!,
                        'email',
                        '이메일 주소'
                      )
                    }
                    className="p-1.5 bg-[#1f2430] hover:bg-[#2a3040] text-[#e8ecf1] border border-[#2a3040] rounded-lg cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Private Security Notes for Contact */}
              {item.contactData.privateNotes && (
                <div className="bg-[#0b0d12]/50 p-3.5 rounded-xl border border-[#1f2430] space-y-1 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-[#6b7280]">
                    <span className="font-medium text-[#e8ecf1]">비공개 보안 메모</span>
                    <button
                      type="button"
                      onClick={() => toggleFieldReveal('privNotes')}
                      className="text-[#6b7280] hover:text-[#e8ecf1] flex items-center gap-1 text-[11px] font-medium cursor-pointer transition-colors"
                    >
                      {revealedFields.privNotes ? (
                        <>
                          <EyeOff className="w-3 h-3" /> 숨기기
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> 표시
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#e8ecf1] whitespace-pre-wrap font-mono pt-1">
                    {revealedFields.privNotes
                      ? item.contactData.privateNotes
                      : '•••••••••••••••••••• (비공개 처리됨)'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* NOTE DETAILS */}
          {item.category === 'note' && item.noteData && (
            <div className="bg-[#0b0d12]/50 p-4 rounded-xl border border-[#1f2430] space-y-2 shadow-inner">
              <div className="flex justify-between items-center text-xs text-[#6b7280]">
                <span className="flex items-center gap-1.5 font-medium text-[#e8ecf1]">
                  <FileText className="w-3.5 h-3.5 text-[#f2c078]" />
                  메모 본문
                </span>
                <button
                  onClick={() =>
                    copyText(item.noteData!.content, 'note', '보안 메모')
                  }
                  className="p-1.5 bg-[#1f2430] hover:bg-[#2a3040] text-[#e8ecf1] border border-[#2a3040] rounded-lg flex items-center gap-1 text-[11px] font-medium cursor-pointer shadow-sm transition-all"
                >
                  <Copy className="w-3 h-3" />
                  전체 복사
                </button>
              </div>
              <pre className="font-mono text-xs sm:text-sm text-[#e8ecf1] whitespace-pre-wrap leading-relaxed select-all bg-[#0b0d12]/30 p-3 rounded-lg border border-[#1f2430]">
                {item.noteData.content}
              </pre>
            </div>
          )}

          {/* General Notes / Memo */}
          {item.notes && (
            <div className="bg-[#0b0d12]/50 p-3 rounded-xl border border-[#1f2430] text-xs shadow-inner">
              <span className="text-[#6b7280] block mb-1 font-medium">비고 및 설명</span>
              <p className="text-[#e8ecf1] whitespace-pre-wrap leading-relaxed">
                {item.notes}
              </p>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.tags.map((tag) => {
                const neon = getTagNeonStyle(tag);
                return (
                  <span
                    key={tag}
                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${neon.badge} border-opacity-30`}
                  >
                    #{tag}
                  </span>
                );
              })}
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-3 border-t border-[#1f2430] flex flex-col sm:flex-row justify-between text-[11px] text-[#4b5563] gap-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              생성일: {formatDate(item.createdAt)}
            </span>
            <span>최종 수정: {formatDate(item.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
