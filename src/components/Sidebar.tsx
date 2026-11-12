import React, { useState } from 'react';
import {
  Layers,
  Key,
  Lock,
  Phone,
  FileText,
  Star,
  Tag,
  ShieldCheck,
  AlertTriangle,
  Folder,
  FolderPlus,
  FolderOpen,
  MoreVertical,
  Inbox,
  Settings,
  Bookmark,
} from 'lucide-react';
import { VaultCategory, VaultItem, VaultFolder, SecurityAuditResult } from '../types';
import { getTagNeonStyle, getNeonColorById } from '../utils/neonTheme';

interface SidebarProps {
  currentCategory: VaultCategory | 'all' | 'favorites';
  onSelectCategory: (cat: VaultCategory | 'all' | 'favorites') => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  items: VaultItem[];
  allTags: string[];
  auditResult: SecurityAuditResult;
  onOpenAudit: () => void;
  // View Switching
  activeView: 'vault' | 'phonebook';
  onSelectView: (view: 'vault' | 'phonebook') => void;
  // Custom Folder Props
  folders: VaultFolder[];
  selectedFolderId: string | 'all' | 'unassigned' | null;
  onSelectFolder: (folderId: string | 'all' | 'unassigned' | null) => void;
  onOpenCreateFolder: () => void;
  onOpenEditFolder: (folder: VaultFolder) => void;
  onMoveItemToFolder: (itemId: string, targetFolderId: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
  items,
  allTags,
  auditResult,
  onOpenAudit,
  activeView,
  onSelectView,
  folders,
  selectedFolderId,
  onSelectFolder,
  onOpenCreateFolder,
  onOpenEditFolder,
  onMoveItemToFolder,
}) => {
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const counts = {
    all: items.filter((i) => i.category !== 'contact').length,
    bookmark: items.filter((i) => i.category === 'bookmark').length,
    api_key: items.filter((i) => i.category === 'api_key').length,
    password: items.filter((i) => i.category === 'password').length,
    contact: items.filter((i) => i.category === 'contact').length,
    note: items.filter((i) => i.category === 'note').length,
    favorites: items.filter((i) => i.isFavorite && i.category !== 'contact').length,
    unassigned: items.filter((i) => !i.folderId && i.category !== 'contact').length,
  };

  const handleDragOver = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== targetKey) {
      setDragOverTarget(targetKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverTarget(null);
    const itemId =
      e.dataTransfer.getData('application/vault-item-id') ||
      e.dataTransfer.getData('text/plain');
    if (itemId) {
      onMoveItemToFolder(itemId, targetFolderId);
    }
  };

  const navItems = [
    {
      id: 'all' as const,
      label: '전체 항목',
      icon: Layers,
      count: counts.all,
      color: 'text-slate-500',
    },
    {
      id: 'bookmark' as const,
      label: '링크 북마크',
      icon: Bookmark,
      count: counts.bookmark,
      color: 'text-cyan-600',
    },
    {
      id: 'api_key' as const,
      label: 'API 키 및 토큰',
      icon: Key,
      count: counts.api_key,
      color: 'text-sky-600',
    },
    {
      id: 'password' as const,
      label: '계정 및 비밀번호',
      icon: Lock,
      count: counts.password,
      color: 'text-indigo-600',
    },
    {
      id: 'note' as const,
      label: '보안 메모',
      icon: FileText,
      count: counts.note,
      color: 'text-amber-600',
    },
    {
      id: 'favorites' as const,
      label: '즐겨찾기',
      icon: Star,
      count: counts.favorites,
      color: 'text-rose-500',
    },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col gap-3 md:gap-4">
      {/* 1. Custom Categories System with Drag & Drop Target Support */}
      <div className="glass-panel border-none rounded-2xl p-3 md:p-3.5 shadow-xl light-glow">
        <div className="px-2 py-0.5 md:px-2.5 md:py-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Folder className="w-4 h-4 text-slate-500" />
            <span>사용자 지정 카테고리</span>
          </div>
          <button
            type="button"
            onClick={onOpenCreateFolder}
            className="text-[10px] md:text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
            title="새 사용자 지정 카테고리 만들기"
          >
            <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
            <span>추가</span>
          </button>
        </div>

        <nav className="space-y-1 mt-2 md:mt-2.5 max-h-[200px] md:max-h-none overflow-y-auto scrollbar-none">
          {/* All Items (No folder filter) */}
          <button
            type="button"
            onClick={() => onSelectFolder('all')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 md:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedFolderId === 'all' || selectedFolderId === null
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 shrink-0 opacity-75" />
              <span>모든 항목 보기</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                selectedFolderId === 'all' || selectedFolderId === null
                  ? 'bg-slate-800 text-slate-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {counts.all}
            </span>
          </button>

          {/* User Custom Folders (Droppable Targets) */}
          {folders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            const isDragOver = dragOverTarget === folder.id;
            const folderColor = getNeonColorById(folder.colorId);
            const folderItemsCount = items.filter((i) => i.folderId === folder.id).length;

            return (
              <div
                key={folder.id}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                className={`group relative rounded-xl transition-all ${
                  isDragOver ? 'ring-2 ring-sky-500 ring-offset-1 scale-[1.02]' : ''
                }`}
              >
                <div
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    isDragOver
                      ? 'bg-sky-50 border border-sky-300 text-sky-900'
                      : isSelected
                      ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-300 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectFolder(folder.id)}
                    className="flex items-center gap-2 flex-1 text-left truncate cursor-pointer py-0.5"
                  >
                    {isSelected || isDragOver ? (
                      <FolderOpen
                        className="w-4 h-4 shrink-0 transition-transform"
                        style={{ color: folderColor.hex }}
                      />
                    ) : (
                      <Folder
                        className="w-4 h-4 shrink-0"
                        style={{ color: folderColor.hex }}
                      />
                    )}
                    <span className="truncate max-w-[110px]">{folder.name}</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-semibold ${folderColor.badge}`}
                    >
                      {folderItemsCount}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditFolder(folder);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded transition-opacity cursor-pointer"
                      title="폴더 속성 변경"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Drag over dropping feedback banner */}
                {isDragOver && (
                  <div className="text-center text-[10px] py-0.5 font-semibold text-sky-700 bg-sky-100 rounded-b-lg">
                    여기에 드롭하여 이동
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned / No Folder Drop Target */}
          <div
            onDragOver={(e) => handleDragOver(e, 'unassigned')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            className={`rounded-xl transition-all ${
              dragOverTarget === 'unassigned' ? 'ring-2 ring-amber-500 ring-offset-1 scale-[1.02]' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectFolder('unassigned')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                dragOverTarget === 'unassigned'
                  ? 'bg-amber-50 border border-amber-300 text-amber-900 font-semibold'
                  : selectedFolderId === 'unassigned'
                  ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-300'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-slate-400" />
                <span>미분류 (카테고리 없음)</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
                {counts.unassigned}
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* 2. Category Navigation */}
      <div className="glass-panel border-none rounded-2xl p-3 md:p-3.5 shadow-xl light-glow">
        <div className="px-2 py-0.5 md:px-2.5 md:py-1 text-xs font-bold text-slate-900">
          <span>데이터 유형</span>
        </div>
        <nav className="space-y-1 mt-1.5 md:mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentCategory === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView('vault');
                  onSelectCategory(item.id);
                  onSelectTag(null);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 md:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : item.color
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                    isActive
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Security Health Card */}
      <div className="glass-panel border-none rounded-2xl p-3 md:p-4 shadow-xl light-glow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] md:text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 md:w-4 h-3.5 md:h-4 text-emerald-600" />
            보안 요약
          </span>
          <span className="text-xs font-bold text-slate-800 font-mono">
            {auditResult.overallScore}점
          </span>
        </div>

        <div className="h-1.5 md:h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              auditResult.overallScore >= 80
                ? 'bg-emerald-500'
                : auditResult.overallScore >= 60
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${auditResult.overallScore}%` }}
          />
        </div>

        <div className="hidden xs:block space-y-1 text-[10px] md:text-xs text-slate-500 mb-3 font-medium">
          <div className="flex justify-between">
            <span>취약함:</span>
            <span className={auditResult.weakPasswords.length > 0 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
              {auditResult.weakPasswords.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>재사용:</span>
            <span className={auditResult.reusedPasswords.length > 0 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
              {auditResult.reusedPasswords.length}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenAudit}
          className="w-full py-1.5 md:py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[10px] md:text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>보안 진단</span>
        </button>
      </div>
      
      {/* 3.5 Disguised Settings Button (Stealth access to Address Book) */}
      <div className="glass-panel border-none rounded-2xl p-3 md:p-4 shadow-xl light-glow">
        <button
          onClick={() => {
            onSelectView('phonebook');
            onSelectCategory('contact');
            onSelectTag(null);
            onSelectFolder('all');
          }}
          title="시스템 환경 설정"
          className={`w-full py-2.5 md:py-3 px-3 md:px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 md:gap-3 shadow-md transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer group border ${
            activeView === 'phonebook' 
              ? 'bg-slate-900 text-white border-slate-600 ring-2 ring-slate-400/30 shadow-slate-900/40' 
              : 'bg-slate-800 hover:bg-slate-900 text-slate-100 border-slate-700/60 hover:border-slate-600 shadow-slate-900/20'
          }`}
        >
          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
            activeView === 'phonebook' ? 'bg-white/15' : 'bg-white/10 group-hover:bg-white/15'
          }`}>
            <Settings className="w-4 md:w-4.5 h-4 md:h-4.5 text-slate-200 group-hover:rotate-90 transition-transform duration-500 ease-out" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-[11px] md:text-[13px] font-bold text-slate-100 truncate">
              {activeView === 'phonebook' ? '시스템 설정' : '시스템 환경 설정'}
            </div>
            <div className="text-[9px] md:text-[10px] font-medium text-slate-400 hidden xs:block truncate">
              보안 및 환경 구성
            </div>
          </div>
        </button>
      </div>

      {/* 4. Tags Filter */}
      {allTags.length > 0 && (
        <div className="glass-panel border-none rounded-2xl p-4 shadow-xl light-glow">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              태그 필터
            </span>
            {selectedTag && (
              <button
                onClick={() => onSelectTag(null)}
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 transition-colors cursor-pointer"
              >
                초기화
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const neonStyle = getTagNeonStyle(tag);
              const isSelected = selectedTag === tag;
              const tagCount = items.filter((i) => i.tags?.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => onSelectTag(isSelected ? null : tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                    isSelected
                      ? `${neonStyle.badge} ring-1 ring-offset-1 ring-slate-400 font-semibold shadow-xs`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                  }`}
                >
                  <span>#{tag}</span>
                  <span className="text-[9px] opacity-70 font-mono">({tagCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

