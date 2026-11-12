import React from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Search,
  Lock,
  Wand2,
  Settings,
  Plus,
  X,
} from 'lucide-react';
import { SecurityAuditResult } from '../types';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  auditResult?: SecurityAuditResult;
  onOpenGenerator: () => void;
  onOpenAudit?: () => void;
  onOpenSettings: () => void;
  onOpenAddItem: () => void;
  onLockVault: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenGenerator,
  onOpenSettings,
  onOpenAddItem,
  onLockVault,
}) => {
  return (
    <header className="sticky top-0 z-30 glass-panel border-none px-4 lg:px-6 py-3 shadow-xl light-glow">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Mobile Lock */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center relative overflow-hidden"
              initial={{ rotateY: 0 }}
              animate={{ 
                y: [0, -4, 0],
                rotateY: [0, 5, 0, -5, 0]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              whileHover={{ 
                scale: 1.1, 
                rotateX: 10, 
                rotateY: 10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2), 0 0 15px rgba(56, 189, 248, 0.4)"
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* 3D Depth Layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <Shield className="w-5.5 h-5.5 text-sky-400 filter drop-shadow-[0_2px_4px_rgba(56,189,248,0.5)]" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 tracking-tight">시크릿 볼트</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-mono font-medium">
                  AES-256
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">보안 비밀번호 & API 키 보관함</p>
            </div>
          </div>

          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={onOpenAddItem}
              className="p-2 bg-slate-900 text-white rounded-xl shadow-xs cursor-pointer"
              title="새 항목 추가"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onLockVault}
              className="p-2 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-xs cursor-pointer hover:bg-slate-50"
              title="볼트 잠그기"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Instant Search */}
        <div className="w-full sm:max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="제목, 서비스명, 전화번호, 태그 검색..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-normal"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Key Generator Button */}
          <button
            onClick={onOpenGenerator}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title="비밀번호 및 API 키 생성기"
          >
            <Wand2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden lg:inline">키 생성기</span>
          </button>

          {/* Settings Button with Haptic Feedback */}
          <button
            onClick={(e) => {
              // Trigger physical haptic feedback on supported mobile/touch devices
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try {
                  navigator.vibrate([20, 30, 20]);
                } catch {}
              }
              onOpenSettings();
            }}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-xs active:scale-90 active:bg-slate-100 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500/40 relative group"
            title="보안 설정 및 AI Chat 설정"
          >
            <Settings className="w-4 h-4 text-slate-500 group-hover:text-slate-900 group-hover:rotate-45 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white animate-pulse" />
          </button>

          {/* Manual Lock Vault Button */}
          <button
            onClick={onLockVault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-600 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title="즉시 잠금"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>잠금</span>
          </button>

          {/* Add Item Primary Button */}
          <button
            onClick={onOpenAddItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>새 항목 추가</span>
          </button>
        </div>
      </div>
    </header>
  );
};
