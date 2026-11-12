import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Key,
  Lock,
  Phone,
  FileText,
  Star,
  Copy,
  Check,
  Eye,
  EyeOff,
  MoreVertical,
  ExternalLink,
  Calendar,
  Building,
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Server,
  Edit2,
  Trash2,
  Folder,
  FolderInput,
  GripVertical,
  Bookmark,
  Globe,
} from 'lucide-react';
import { VaultItem, VaultFolder } from '../types';
import { evaluatePasswordStrength } from '../utils/crypto';
import { getTagNeonStyle, getNeonColorById } from '../utils/neonTheme';

interface VaultItemCardProps {
  item: VaultItem;
  folders?: VaultFolder[];
  onToggleFavorite: (id: string) => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onViewDetail: (item: VaultItem) => void;
  onCopiedSecret: (label: string, text: string) => void;
  onMoveItemToFolder?: (itemId: string, folderId: string | null) => void;
  onSelectFolder?: (folderId: string) => void;
}

export const VaultItemCard: React.FC<VaultItemCardProps> = ({
  item,
  folders = [],
  onToggleFavorite,
  onEdit,
  onDelete,
  onViewDetail,
  onCopiedSecret,
  onMoveItemToFolder,
  onSelectFolder,
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [folderSubmenuOpen, setFolderSubmenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const currentFolder = folders.find((f) => f.id === item.folderId);
  const currentFolderColor = currentFolder ? getNeonColorById(currentFolder.colorId) : null;

  const copyToClipboard = (text: string, fieldName: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    onCopiedSecret(label, text);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const getCategoryBadge = () => {
    switch (item.category) {
      case 'api_key':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
            <Key className="w-3 h-3 shrink-0 text-sky-600" />
            API 키
          </span>
        );
      case 'password':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
            <Lock className="w-3 h-3 shrink-0 text-indigo-600" />
            계정/비밀번호
          </span>
        );
      case 'contact':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <Phone className="w-3 h-3 shrink-0 text-emerald-600" />
            보안 연락처
          </span>
        );
      case 'note':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
            <FileText className="w-3 h-3 shrink-0 text-amber-600" />
            보안 메모
          </span>
        );
    }
  };

  const getCategoryAvatar = () => {
    switch (item.category) {
      case 'api_key':
        return {
          icon: <Key className="w-5 h-5 text-sky-600" />,
          bgColor: 'bg-sky-50 border-sky-100',
        };
      case 'password':
        return {
          icon: <Lock className="w-5 h-5 text-indigo-600" />,
          bgColor: 'bg-indigo-50 border-indigo-100',
        };
      case 'contact':
        if (item.contactData?.isEmergency) {
          return {
            icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
            bgColor: 'bg-rose-50 border-rose-100',
          };
        }
        return {
          icon: <Phone className="w-5 h-5 text-emerald-600" />,
          bgColor: 'bg-emerald-50 border-emerald-100',
        };
      case 'note':
        return {
          icon: <FileText className="w-5 h-5 text-amber-600" />,
          bgColor: 'bg-amber-50 border-amber-100',
        };
    }
  };

  const getEnvBadge = (env?: string) => {
    if (!env) return null;
    const styles: Record<string, string> = {
      production: 'bg-rose-50 text-rose-700 border-rose-200',
      staging: 'bg-amber-50 text-amber-700 border-amber-200',
      development: 'bg-blue-50 text-blue-700 border-blue-200',
      test: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    const labels: Record<string, string> = {
      production: '운영 (Prod)',
      staging: '스테이징 (Stg)',
      development: '개발 (Dev)',
      test: '테스트 (Test)',
    };

    return (
      <span
        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border whitespace-nowrap shrink-0 ${
          styles[env] || styles.development
        }`}
      >
        {labels[env] || env}
      </span>
    );
  };

  const getPasswordSecurityBadge = () => {
    if (item.category !== 'password' || !item.passwordData?.password) return null;
    const strength = evaluatePasswordStrength(item.passwordData.password);

    let grade: '매우 안전' | '보통' | '취약';
    let badgeStyle = '';
    let IconComponent = Shield;

    if (strength.score >= 3) {
      grade = '매우 안전';
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      IconComponent = ShieldCheck;
    } else if (strength.score === 2) {
      grade = '보통';
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      IconComponent = Shield;
    } else {
      grade = '취약';
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      IconComponent = ShieldAlert;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap shrink-0 ${badgeStyle}`}
        title={`비밀번호 보안 등급: ${grade} (추정 엔트로피: ${strength.entropy} bits)`}
      >
        <IconComponent className="w-2.5 h-2.5 shrink-0" />
        <span>{grade}</span>
      </span>
    );
  };

  const avatar = getCategoryAvatar();

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/vault-item-id', item.id);
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`group relative rounded-2xl border-none transition-all flex flex-col justify-between min-w-0 p-3.5 sm:p-5 tactile-card gradient-border-item light-glow ${
        isDragging
          ? 'opacity-40 scale-95 border-dashed border-sky-400'
          : ''
      }`}
    >
      <div className="min-w-0">
        {/* Top bar: Category, Folder Badge, Environment & Favorite */}
        <div className="flex items-center justify-between gap-2 mb-2.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 overflow-hidden">
            {/* Drag Handle Indicator */}
            <div
              title="이 항목을 드래그하여 사이드바의 폴더에 넣으세요"
              className="p-1 -ml-1 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {getCategoryBadge()}

            {/* Custom Folder Badge */}
            {currentFolder && currentFolderColor ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFolder?.(currentFolder.id);
                }}
                title={`폴더: ${currentFolder.name} (클릭 시 이 폴더로 필터링)`}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer shrink-0 ${currentFolderColor.badge}`}
              >
                <Folder className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[100px]">{currentFolder.name}</span>
              </button>
            ) : null}

            {item.category === 'api_key' &&
              getEnvBadge(item.apiKeyData?.environment)}
            {item.category === 'password' && getPasswordSecurityBadge()}
            {item.category === 'contact' && item.contactData?.isEmergency && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shrink-0">
                <ShieldAlert className="w-2.5 h-2.5 shrink-0" />
                긴급 연락망
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleFavorite(item.id)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                item.isFavorite
                  ? 'text-amber-400 hover:text-amber-500'
                  : 'text-slate-300 hover:text-slate-600'
              }`}
              title={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <Star
                className="w-4 h-4"
                fill={item.isFavorite ? 'currentColor' : 'none'}
              />
            </button>

            {/* Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setFolderSubmenuOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => {
                      setMenuOpen(false);
                      setFolderSubmenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onViewDetail(item);
                      }}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      상세 보기
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(item);
                      }}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      수정
                    </button>

                    {/* Quick Move to Folder Submenu */}
                    {folders.length > 0 && onMoveItemToFolder && (
                      <div className="border-t border-b border-slate-100 my-1 py-1">
                        <button
                          type="button"
                          onClick={() => setFolderSubmenuOpen(!folderSubmenuOpen)}
                          className="w-full text-left px-3.5 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center justify-between font-medium"
                        >
                          <span className="flex items-center gap-2">
                            <FolderInput className="w-3.5 h-3.5 text-slate-500" />
                            폴더 이동
                          </span>
                          <span className="text-[10px] text-slate-400">▶</span>
                        </button>

                        {folderSubmenuOpen && (
                          <div className="px-2 py-1 space-y-1 bg-slate-50 rounded-lg mx-1.5 my-1 border border-slate-200 max-h-40 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                onMoveItemToFolder(item.id, null);
                                setMenuOpen(false);
                                setFolderSubmenuOpen(false);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between ${
                                !item.folderId ? 'text-sky-700 font-bold bg-white' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <span>미분류 (폴더 없음)</span>
                              {!item.folderId && <Check className="w-3 h-3 text-sky-600" />}
                            </button>
                            {folders.map((f) => {
                              const isCur = item.folderId === f.id;
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => {
                                    onMoveItemToFolder(item.id, f.id);
                                    setMenuOpen(false);
                                    setFolderSubmenuOpen(false);
                                  }}
                                  className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between ${
                                    isCur ? 'font-bold bg-white text-slate-900' : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  <span className="truncate max-w-[110px]">{f.name}</span>
                                  {isCur && <Check className="w-3 h-3 shrink-0 text-slate-900" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(item.id);
                      }}
                      className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Title and Category Icon Avatar Header */}
        <div
          onClick={() => onViewDetail(item)}
          className="cursor-pointer group/title mb-3.5 flex items-start gap-3 min-w-0"
        >
          {/* Category Icon Avatar Badge with Glassmorphism & 3D Effect */}
          <motion.div
            whileHover={{ scale: 1.1, rotateY: 15, rotateX: -5 }}
            style={{ transformStyle: 'preserve-3d', perspective: '500px' }}
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/30 ${avatar.bgColor.replace('bg-', 'bg-opacity-20 ')}`}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
            
            {/* Icon with 3D Depth Shadow */}
            <div className="relative z-10 drop-shadow-[0_2px_3px_rgba(0,0,0,0.15)]">
              {avatar.icon}
            </div>

            {/* Inner Glow/Shadow for Depth */}
            <div className="absolute inset-[1px] rounded-[10px] border border-white/20 pointer-events-none" />
          </motion.div>

          <div className="min-w-0 flex-1">
            <h3
              className="font-bold text-slate-900 text-base tracking-tight group-hover/title:text-sky-600 transition-colors truncate block"
              title={item.title}
            >
              {item.title}
            </h3>
            {/* Subtitle based on category with full truncation */}
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 min-w-0 font-normal">
              {item.category === 'api_key' && item.apiKeyData?.service && (
                <span className="flex items-center gap-1 min-w-0 truncate">
                  <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={item.apiKeyData.service}>
                    {item.apiKeyData.service}
                  </span>
                </span>
              )}
              {item.category === 'password' && (
                <span className="flex items-center gap-1.5 min-w-0 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={item.passwordData?.username || ''}>
                    {item.passwordData?.username || '아이디 미지정'}
                  </span>
                </span>
              )}
              {item.category === 'contact' && (
                <span className="flex items-center gap-1.5 min-w-0 truncate">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span
                    className="truncate"
                    title={
                      item.contactData?.organization ||
                      item.contactData?.relationship ||
                      '연락처'
                    }
                  >
                    {item.contactData?.organization ||
                      item.contactData?.relationship ||
                      '연락처'}
                  </span>
                </span>
              )}
              {item.category === 'note' && (
                <span className="text-slate-400 text-xs truncate">
                  비공개 보안 메모
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Specific Primary Secret Field Rendering with auto-ellipsis */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-3.5 space-y-2 min-w-0">
          {/* API Key Display */}
          {item.category === 'api_key' && item.apiKeyData && (
            <div className="min-w-0">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 font-medium">
                <span className="shrink-0">API Key:</span>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-slate-600 hover:text-slate-900 flex items-center gap-1 shrink-0 font-medium cursor-pointer"
                >
                  {showSecret ? (
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
              <div className="flex items-center justify-between gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 min-w-0 shadow-2xs">
                <span
                  className="font-mono text-xs text-slate-900 truncate select-all min-w-0 flex-1 font-medium"
                  title={showSecret ? item.apiKeyData.apiKey : undefined}
                >
                  {showSecret
                    ? item.apiKeyData.apiKey
                    : '•'.repeat(Math.min(24, item.apiKeyData.apiKey.length || 16))}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      item.apiKeyData!.apiKey,
                      'apikey',
                      `${item.title} API Key`
                    )
                  }
                  className="shrink-0 p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="API 키 복사"
                >
                  {copiedField === 'apikey' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Password Display */}
          {item.category === 'password' && item.passwordData && (
            <div className="min-w-0">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 font-medium">
                <span className="shrink-0">비밀번호:</span>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-slate-600 hover:text-slate-900 flex items-center gap-1 shrink-0 font-medium cursor-pointer"
                >
                  {showSecret ? (
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
              <div className="flex items-center justify-between gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 min-w-0 shadow-2xs">
                <span
                  className="font-mono text-xs text-slate-900 truncate select-all min-w-0 flex-1 font-medium"
                  title={showSecret ? item.passwordData.password : undefined}
                >
                  {showSecret
                    ? item.passwordData.password
                    : '•'.repeat(Math.min(18, item.passwordData.password.length || 12))}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      item.passwordData!.password,
                      'password',
                      `${item.title} 비밀번호`
                    )
                  }
                  className="shrink-0 p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="비밀번호 복사"
                >
                  {copiedField === 'password' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Contact Display */}
          {item.category === 'contact' && item.contactData && (
            <div className="min-w-0">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 font-medium">
                <span className="shrink-0">전화번호:</span>
                <a
                  href={`tel:${item.contactData.phoneNumber.replace(/[^0-9+]/g, '')}`}
                  className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 text-[11px] shrink-0 font-semibold"
                >
                  <Phone className="w-3 h-3 text-emerald-600" /> 통화 연결
                </a>
              </div>
              <div className="flex items-center justify-between gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 min-w-0 shadow-2xs">
                <span
                  className="font-mono text-xs font-semibold text-slate-900 select-all truncate min-w-0 flex-1"
                  title={item.contactData.phoneNumber}
                >
                  {item.contactData.phoneNumber}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      item.contactData!.phoneNumber,
                      'phone',
                      `${item.title} 전화번호`
                    )
                  }
                  className="shrink-0 p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="전화번호 복사"
                >
                  {copiedField === 'phone' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Note Preview Display */}
          {item.category === 'note' && item.noteData && (
            <div
              className="text-xs text-slate-700 line-clamp-2 bg-white p-2.5 rounded-lg whitespace-pre-wrap break-words overflow-hidden text-ellipsis border border-slate-200 shadow-2xs font-normal"
              title={item.noteData.content}
            >
              {item.noteData.content}
            </div>
          )}
        </div>

        {/* Additional contextual row: Expiration / URL / Email */}
        {item.category === 'api_key' && item.apiKeyData?.expiresAt && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2.5 min-w-0 font-normal">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">만료 예정일: {item.apiKeyData.expiresAt}</span>
          </div>
        )}

        {item.category === 'password' && item.passwordData?.websiteUrl && (
          <div className="mb-2.5 min-w-0">
            <a
              href={item.passwordData.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 max-w-full min-w-0 truncate font-normal"
              title={item.passwordData.websiteUrl}
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{item.passwordData.websiteUrl}</span>
            </a>
          </div>
        )}

        {item.category === 'contact' && item.contactData?.email && (
          <div className="text-xs text-slate-500 truncate mb-2.5 min-w-0 font-normal" title={item.contactData.email}>
            이메일: <span className="text-slate-800 font-medium">{item.contactData.email}</span>
          </div>
        )}
      </div>

      {/* Footer: Tags and Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2 min-w-0">
        <div className="flex flex-wrap gap-1.5 items-center min-w-0 max-w-[70%] overflow-hidden">
          {item.tags && item.tags.length > 0 ? (
            item.tags.slice(0, 3).map((tag) => {
              const neon = getTagNeonStyle(tag);
              return (
                <span
                  key={tag}
                  title={`#${tag}`}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${neon.badge} max-w-[110px] truncate`}
                >
                  #{tag}
                </span>
              );
            })
          ) : (
            <span className="text-[10px] text-slate-400">태그 없음</span>
          )}
          {item.tags && item.tags.length > 3 && (
            <span className="text-[10px] text-slate-400 font-medium shrink-0">
              +{item.tags.length - 3}
            </span>
          )}
        </div>

        <button
          onClick={() => onViewDetail(item)}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 py-1.5 px-3 rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
        >
          상세보기
        </button>
      </div>
    </div>
  );
};
