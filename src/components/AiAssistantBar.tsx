import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Folder,
  FolderPlus,
  KeyRound,
  Shield,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Edit3,
  Settings,
  Bookmark,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VaultCategory, VaultFolder, VaultItem, VaultSettings } from '../types';
import { getNeonColorById } from '../utils/neonTheme';

export interface AiDetectedItem {
  title: string;
  category: VaultCategory;
  folderId?: string;
  newFolderName?: string;
  newFolderColor?: string;
  tags: string[];
  notes?: string;
  bookmarkData?: any;
  apiKeyData?: any;
  passwordData?: any;
  contactData?: any;
  noteData?: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  detectedItem?: AiDetectedItem | null;
  savedStatus?: 'saved' | 'idle';
}

interface AiAssistantBarProps {
  existingFolders: VaultFolder[];
  onSaveItem: (item: Partial<VaultItem>) => Promise<void>;
  onCreateFolder: (folder: { name: string; colorId: string }) => Promise<string>;
  onEditItemInModal: (item: Partial<VaultItem>) => void;
  onNotification?: (msg: string) => void;
  settings?: VaultSettings;
  onOpenSettings?: () => void;
}

export const AiAssistantBar: React.FC<AiAssistantBarProps> = ({
  existingFolders,
  onSaveItem,
  onCreateFolder,
  onEditItemInModal,
  onNotification,
  settings,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '안녕하세요! 무료 Gemini AI 스마트 비서입니다. 계정, API 키, 연락처, 메모를 자유롭게 입력하시면 가장 알맞은 폴더와 카테고리로 자동 분석하여 정리해 드립니다.',
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const toggleSecret = (msgId: string) => {
    setShowSecretMap((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsgId = 'user-' + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/parse-and-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: text,
          existingFolders,
          model: settings?.aiModel || 'gemini-2.5-flash',
          autoSuggestFolders: settings?.aiAutoSuggestFolders ?? true,
          includeNotes: settings?.aiIncludeNotes ?? true,
          temperature: settings?.aiDefaultTemperature ?? 0.2,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const data = json.data;
        let detectedItem: AiDetectedItem | null = null;

        if (data.isItemToSave) {
          detectedItem = {
            title: data.title || '새 보안 항목',
            category: data.category || (data.bookmarkData ? 'bookmark' : 'password'),
            folderId: data.folderId || undefined,
            newFolderName: data.newFolderName || undefined,
            newFolderColor: data.newFolderColor || 'cyan',
            tags: Array.isArray(data.tags) ? data.tags : [],
            notes: data.notes || '',
            bookmarkData: data.bookmarkData,
            apiKeyData: data.apiKeyData,
            passwordData: data.passwordData,
            contactData: data.contactData,
            noteData: data.noteData,
          };
        }

        const aiMsg: ChatMessage = {
          id: 'ai-' + Date.now(),
          sender: 'assistant',
          text: data.reply || '입력하신 내용을 분석하였습니다.',
          timestamp: Date.now(),
          detectedItem,
          savedStatus: 'idle',
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            sender: 'assistant',
            text: json.error || 'AI 분석 응답을 처리하지 못했습니다. 다시 시도해주세요.',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          text: '네트워크 통신 중 오류가 발생했습니다: ' + (err?.message || '잠시 후 다시 시도해주세요.'),
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct 1-Click Save to Designated Folder
  const handleDirectSave = async (msgId: string, item: AiDetectedItem) => {
    try {
      let finalFolderId = item.folderId;

      // If AI recommended a new folder that doesn't exist yet, create it first
      if (!finalFolderId && item.newFolderName) {
        const createdId = await onCreateFolder({
          name: item.newFolderName,
          colorId: item.newFolderColor || 'cyan',
        });
        finalFolderId = createdId;
      }

      await onSaveItem({
        title: item.title,
        category: item.category,
        folderId: finalFolderId,
        tags: item.tags,
        notes: item.notes,
        bookmarkData: item.bookmarkData,
        apiKeyData: item.apiKeyData,
        passwordData: item.passwordData,
        contactData: item.contactData,
        noteData: item.noteData,
      });

      // Mark this message card as saved
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, savedStatus: 'saved' } : m))
      );

      const targetFolderName = finalFolderId
        ? existingFolders.find((f) => f.id === finalFolderId)?.name || item.newFolderName || '폴더'
        : '미분류';

      onNotification?.(`'${item.title}' 항목이 [${targetFolderName}] 폴더에 성공적으로 저장되었습니다!`);
    } catch (err) {
      console.error(err);
      onNotification?.('저장 중 오류가 발생했습니다.');
    }
  };

  // Open in full Edit Modal
  const handleEditInModal = (item: AiDetectedItem) => {
    onEditItemInModal({
      title: item.title,
      category: item.category,
      folderId: item.folderId,
      tags: item.tags,
      notes: item.notes,
      bookmarkData: item.bookmarkData,
      apiKeyData: item.apiKeyData,
      passwordData: item.passwordData,
      contactData: item.contactData,
      noteData: item.noteData,
    });
  };

  const getCategoryBadge = (category: VaultCategory) => {
    switch (category) {
      case 'bookmark':
        return { label: '링크 북마크', icon: Bookmark, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'password':
        return { label: '계정 및 비밀번호', icon: KeyRound, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'api_key':
        return { label: 'API 키', icon: Shield, color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'contact':
        return { label: '보안 연락처', icon: Phone, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'note':
        return { label: '보안 메모', icon: FileText, color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: '보안 항목', icon: Shield, color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'assistant',
        text: '채팅 기록이 초기화되었습니다. 보관하려는 정보나 질문을 입력해주세요!',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="w-full glass-panel rounded-2xl border-none shadow-xl light-glow overflow-hidden transition-all bg-white/95">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 tracking-tight">AI 스마트 자동 분류 비서</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                무료 Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              자유롭게 입력하시면 계정·키·연락처·메모를 감지하고 가장 합당한 폴더로 자동 지정해 드립니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenSettings && (
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                  try {
                    navigator.vibrate([20, 30, 20]);
                  } catch {}
                }
                onOpenSettings();
              }}
              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all cursor-pointer text-xs flex items-center gap-1 border border-transparent hover:border-sky-200 active:scale-95"
              title="AI Chat 설정 열기"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline text-[11px] font-medium text-slate-600">AI 설정</span>
            </button>
          )}

          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="대화 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">초기화</span>
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={isOpen ? '채팅창 접기' : '채팅창 펼치기'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Chat Body */}
      {isOpen && (
        <div className="flex flex-col">
          {/* Chat Messages Log */}
          <div className="max-h-[340px] min-h-[140px] overflow-y-auto p-4 space-y-3.5 text-xs bg-gradient-to-b from-slate-50/30 to-white">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const showSecret = showSecretMap[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isUser
                        ? 'bg-slate-900 text-white'
                        : 'bg-sky-100 text-sky-600 border border-sky-200'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Bubble & Item Card */}
                  <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-tr-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* AI Smart Detected Item Preview Card */}
                    {msg.detectedItem && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full bg-slate-50/90 border border-sky-200/90 rounded-2xl p-3.5 shadow-sm text-slate-800 space-y-2.5 mt-0.5"
                      >
                        {/* Card Header: Category & Target Folder */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/60">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(() => {
                              const badge = getCategoryBadge(msg.detectedItem.category);
                              const Icon = badge.icon;
                              return (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${badge.color}`}>
                                  <Icon className="w-3 h-3" />
                                  <span>{badge.label}</span>
                                </span>
                              );
                            })()}

                            {/* Folder Target Badge */}
                            {(() => {
                              if (msg.detectedItem.folderId) {
                                const folder = existingFolders.find((f) => f.id === msg.detectedItem?.folderId);
                                const neon = getNeonColorById(folder?.colorId);
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${neon.badge}`}>
                                    <Folder className="w-3 h-3" />
                                    <span>폴더: {folder?.name || '기존 폴더'}</span>
                                  </span>
                                );
                              }
                              if (msg.detectedItem.newFolderName) {
                                const neon = getNeonColorById(msg.detectedItem.newFolderColor);
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${neon.badge}`}>
                                    <FolderPlus className="w-3 h-3" />
                                    <span>새 추천 폴더: {msg.detectedItem.newFolderName}</span>
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-100 text-slate-600">
                                  <Folder className="w-3 h-3" />
                                  <span>미분류</span>
                                </span>
                              );
                            })()}
                          </div>

                          {msg.savedStatus === 'saved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              보관함 저장 완료
                            </span>
                          )}
                        </div>

                        {/* Title & Key Data Extracted */}
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{msg.detectedItem.title}</h4>

                          {/* Specific Detail Fields Preview */}
                          <div className="mt-1.5 space-y-1 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                            {msg.detectedItem.bookmarkData?.url && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">웹 링크 URL:</span>
                                  <a
                                    href={msg.detectedItem.bookmarkData.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-600 hover:text-cyan-700 font-medium inline-flex items-center gap-1 hover:underline truncate max-w-[220px]"
                                  >
                                    <span className="truncate">{msg.detectedItem.bookmarkData.domain || msg.detectedItem.bookmarkData.url}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                </div>
                                {msg.detectedItem.bookmarkData.description && (
                                  <p className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                    {msg.detectedItem.bookmarkData.description}
                                  </p>
                                )}
                              </div>
                            )}

                            {msg.detectedItem.passwordData?.username && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">아이디 / 계정:</span>
                                <span className="font-mono font-medium text-slate-900">
                                  {msg.detectedItem.passwordData.username}
                                </span>
                              </div>
                            )}

                            {msg.detectedItem.passwordData?.password && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">비밀번호:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-medium text-slate-900">
                                    {showSecret ? msg.detectedItem.passwordData.password : '••••••••••••'}
                                  </span>
                                  <button
                                    onClick={() => toggleSecret(msg.id)}
                                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                    title={showSecret ? '숨기기' : '보기'}
                                  >
                                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            )}

                            {msg.detectedItem.apiKeyData?.apiKey && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">API 키:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-medium text-slate-900">
                                    {showSecret
                                      ? msg.detectedItem.apiKeyData.apiKey
                                      : `${msg.detectedItem.apiKeyData.apiKey.slice(0, 6)}••••••••`}
                                  </span>
                                  <button
                                    onClick={() => toggleSecret(msg.id)}
                                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                  >
                                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            )}

                            {msg.detectedItem.contactData?.phoneNumber && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">전화번호:</span>
                                <span className="font-mono font-medium text-slate-900">
                                  {msg.detectedItem.contactData.phoneNumber}
                                </span>
                              </div>
                            )}

                            {msg.detectedItem.contactData?.organization && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">소속 / 조직:</span>
                                <span className="font-medium text-slate-800">
                                  {msg.detectedItem.contactData.organization}
                                </span>
                              </div>
                            )}

                            {msg.detectedItem.noteData?.content && (
                              <div className="text-slate-700 whitespace-pre-wrap line-clamp-2">
                                {msg.detectedItem.noteData.content}
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {msg.detectedItem.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                              {msg.detectedItem.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {msg.savedStatus !== 'saved' ? (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleDirectSave(msg.id, msg.detectedItem!)}
                              className="flex-1 py-1.5 px-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>해당 폴더에 즉시 저장</span>
                            </button>
                            <button
                              onClick={() => handleEditInModal(msg.detectedItem!)}
                              className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="세부 정보 검토 및 수정 후 저장"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>수정</span>
                            </button>
                          </div>
                        ) : (
                          <div className="pt-1 flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <span className="font-semibold">암호화 보관함에 정상 등록되었습니다.</span>
                            <button
                              onClick={() => handleEditInModal(msg.detectedItem!)}
                              className="text-emerald-800 underline text-[11px] font-medium cursor-pointer"
                            >
                              상세 보기
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-spin" />
                  <span>입력 내용을 분석하고 가장 합당한 폴더를 찾는 중입니다...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Text Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="무엇이든 적어보세요 (예: '구글 아이디 myid@gmail.com 비번 p@ss1234', '홍길동 010-1234-5678')"
                disabled={isLoading}
                className="w-full pl-3.5 pr-8 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all disabled:opacity-60"
              />
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isLoading ? (
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">분석 및 분류</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
