import React, { useState, useEffect } from 'react';
import { Folder, X, Check, Trash2, Palette, Sparkles } from 'lucide-react';
import { VaultFolder } from '../types';
import { NEON_7_COLORS, getNeonColorById } from '../utils/neonTheme';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderToEdit?: VaultFolder | null;
  onSave: (folder: { name: string; colorId: string; description?: string }) => void;
  onDelete?: (folderId: string) => void;
}

const CATEGORY_TEMPLATES = [
  { name: '업무 & 프로젝트', colorId: 'cyan', desc: 'API 키 및 개발 인프라' },
  { name: '개인 & 보안', colorId: 'purple', desc: '개인 계정 및 인증 토큰' },
  { name: '금융 & 결제', colorId: 'green', desc: '은행, 카드, 결제 비밀번호' },
  { name: '클라우드 & 서버', colorId: 'indigo', desc: 'AWS, GCP, 클라우드 자산' },
  { name: '비상 & 긴급 연락망', colorId: 'red', desc: '긴급 연락처 및 IDC 직통' },
  { name: '소셜 & 미디어', colorId: 'orange', desc: 'SNS 계정 및 커뮤니티' },
  { name: '쇼핑 & 라이프', colorId: 'yellow', desc: '쇼핑몰 및 구독 서비스' },
];

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  folderToEdit,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [colorId, setColorId] = useState('cyan');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name);
      setColorId(folderToEdit.colorId || 'cyan');
      setDescription(folderToEdit.description || '');
    } else {
      setName('');
      setColorId('cyan');
      setDescription('');
    }
    setError('');
  }, [folderToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }
    onSave({
      name: name.trim(),
      colorId,
      description: description.trim() || undefined,
    });
    onClose();
  };

  const currentColor = getNeonColorById(colorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#12151c] border border-[#1f2430] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden text-[#e8ecf1]">
        {/* Subtle Gradient Glow Top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#7fd8e0]/40 to-transparent" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f2430] bg-[#0b0d12]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${currentColor.badge}`}
            >
              <Folder className="w-5 h-5" style={{ color: currentColor.hex }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#e8ecf1] tracking-tight">
                {folderToEdit ? '사용자 지정 카테고리 수정' : '새 사용자 지정 카테고리'}
              </h2>
              <p className="text-xs text-[#6b7280]">
                API 키, 비밀번호, 연락처를 나만의 기준으로 체계화합니다
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6b7280] hover:text-[#e8ecf1] p-1.5 rounded-lg hover:bg-[#1f2430] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#e0667f]/10 border border-[#e0667f]/30 rounded-xl text-[#e0667f] text-xs font-medium">
              {error}
            </div>
          )}

          {/* Quick Preset Templates (if creating new) */}
          {!folderToEdit && (
            <div>
              <label className="block text-[11px] font-semibold text-[#6b7280] mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f2c078]" />
                <span>추천 카테고리 템플릿 (클릭 시 자동 적용)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => {
                      setName(tmpl.name);
                      setColorId(tmpl.colorId);
                      setDescription(tmpl.desc);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                      name === tmpl.name
                        ? 'bg-[#7fd8e0]/20 text-[#7fd8e0] border-[#7fd8e0]/40 font-semibold'
                        : 'bg-[#0b0d12]/50 text-[#6b7280] hover:text-[#e8ecf1] border-[#1f2430] hover:bg-[#1f2430]'
                    }`}
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Name */}
          <div>
            <label className="block text-xs font-semibold text-[#6b7280] mb-1.5">
              카테고리 이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="예: 프로젝트 A, 개인 인증서, 클라우드 인프라"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner transition-all font-normal"
            />
          </div>

          {/* Color Palette Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#6b7280] mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#6b7280]" />
              <span>카테고리 테마 색상</span>
            </label>
            <div className="grid grid-cols-7 gap-1.5 p-2 bg-[#0b0d12]/50 border border-[#1f2430] rounded-xl shadow-inner">
              {NEON_7_COLORS.map((c) => {
                const isSelected = colorId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColorId(c.id)}
                    title={c.nameKo}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1f2430] shadow-sm border border-[#2a3040] scale-105'
                        : 'hover:bg-[#1f2430]/50 border border-transparent'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-transform shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </span>
                    <span className="text-[10px] text-[#6b7280] mt-1 font-medium truncate max-w-full">
                      {c.nameKo.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Description */}
          <div>
            <label className="block text-xs font-semibold text-[#6b7280] mb-1.5">
              간단한 설명 (선택 사항)
            </label>
            <input
              type="text"
              placeholder="예: 프론트엔드 및 AI 백엔드 키 모음"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner transition-all font-normal"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-[#1f2430]">
            {folderToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `"${folderToEdit.name}" 카테고리를 삭제하시겠습니까?\n카테고리 내의 항목들은 삭제되지 않고 '미분류'로 안전하게 보존됩니다.`
                    )
                  ) {
                    onDelete(folderToEdit.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#e0667f] hover:bg-[#e0667f]/10 border border-[#e0667f]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>카테고리 삭제</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#6b7280] hover:text-[#e8ecf1] hover:bg-[#1f2430] border border-[#1f2430] bg-[#0b0d12]/30 cursor-pointer transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#12151c] bg-[#e8ecf1] hover:bg-white shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition-all active:scale-95 cursor-pointer"
              >
                {folderToEdit ? '변경사항 저장' : '카테고리 만들기'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
