import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Grid,
  List,
  ArrowUpDown,
  Lock,
  Wand2,
  Shield,
  Key,
  Phone,
  Layers,
  FileText,
  Clock,
  Sparkles,
  Folder,
  FolderPlus,
} from 'lucide-react';
import { VaultItem, VaultCategory, VaultSettings, VaultFolder } from './types';
import {
  checkVaultSetup,
  hasVaultSetup,
  initializeVault,
  unlockVault,
  saveVaultData,
  saveVaultItems,
  changeMasterPassword,
  wipeVault,
  loadVaultSettings,
  saveVaultSettings,
  runSecurityAudit,
  SAMPLE_VAULT_ITEMS,
  DEFAULT_FOLDERS,
} from './utils/storage';
import { LockScreen } from './components/LockScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { VaultItemCard } from './components/VaultItemCard';
import { ItemModal } from './components/ItemModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { SettingsModal } from './components/SettingsModal';
import { FolderModal } from './components/FolderModal';
import { PhoneBookView } from './components/dianhua/PhoneBookView';
import { AiAssistantBar } from './components/AiAssistantBar';
import { getTagNeonStyle, getNeonColorById } from './utils/neonTheme';

export default function App() {
  // Authentication & Vault Session State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isFirstSetup, setIsFirstSetup] = useState(true);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [settings, setSettings] = useState<VaultSettings>(loadVaultSettings);

  // Filtering & View state
  const [activeView, setActiveView] = useState<'vault' | 'phonebook'>('vault');
  const [currentCategory, setCurrentCategory] = useState<VaultCategory | 'all' | 'favorites'>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all' | 'unassigned' | null>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'created'>('updated');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [detailItem, setDetailItem] = useState<VaultItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<VaultFolder | null>(null);

  // Move / Action Toast Notification
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // Clipboard auto-clear toast notification
  const [clipboardToast, setClipboardToast] = useState<{
    label: string;
    countdown: number;
  } | null>(null);

  // Check if vault is initialized on mount from Database
  useEffect(() => {
    checkVaultSetup().then((isSetup) => {
      setIsFirstSetup(!isSetup);
    });
  }, []);

  // Lock Vault
  const handleLockVault = useCallback(() => {
    setIsUnlocked(false);
    setCryptoKey(null);
    setItems([]);
    setFolders([]);
  }, []);

  // Auto-lock timer effect
  useEffect(() => {
    if (!isUnlocked || settings.autoLockMinutes === 0) return;

    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLockVault();
      }, settings.autoLockMinutes * 60 * 1000);
    };

    const handleActivity = () => resetTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    const handleBlur = () => {
      if (settings.lockOnBlur) {
        handleLockVault();
      }
    };
    window.addEventListener('blur', handleBlur);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isUnlocked, settings.autoLockMinutes, settings.lockOnBlur, handleLockVault]);

  // Unlock Vault Handler
  const handleUnlock = async (password: string): Promise<boolean> => {
    const result = await unlockVault(password);
    if (!result) return false;

    setCryptoKey(result.key);
    setItems(result.items);
    setFolders(result.folders || DEFAULT_FOLDERS);
    setIsUnlocked(true);
    return true;
  };

  // First Setup Handler
  const handleSetup = async (password: string, loadSamples: boolean) => {
    const initialItems = loadSamples ? SAMPLE_VAULT_ITEMS : [];
    const initialFolders = DEFAULT_FOLDERS;
    const key = await initializeVault(password, initialItems, initialFolders);
    setCryptoKey(key);
    setItems(initialItems);
    setFolders(initialFolders);
    setIsFirstSetup(false);
    setIsUnlocked(true);
  };

  // Reset / Wipe Vault
  const handleResetVault = () => {
    wipeVault();
    setIsUnlocked(false);
    setCryptoKey(null);
    setItems([]);
    setFolders([]);
    setIsFirstSetup(true);
    setIsSettingsModalOpen(false);
  };

  // Change Master Password
  const handleChangeMasterPassword = async (newPassword: string): Promise<boolean> => {
    if (!cryptoKey) return false;
    try {
      const newKey = await changeMasterPassword(cryptoKey, items, newPassword, folders);
      setCryptoKey(newKey);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Save Settings
  const handleSaveSettings = (newSettings: VaultSettings) => {
    setSettings(newSettings);
    saveVaultSettings(newSettings);
  };

  // Save (Create or Update) Item
  const handleSaveItem = async (partialItem: Partial<VaultItem>) => {
    if (!cryptoKey) return;

    let updatedItems: VaultItem[];
    const now = Date.now();

    if (editingItem && partialItem.id === editingItem.id) {
      updatedItems = items.map((i) =>
        i.id === editingItem.id
          ? ({ ...i, ...partialItem, updatedAt: now } as VaultItem)
          : i
      );
    } else {
      const newItem: VaultItem = {
        id: 'item-' + Math.random().toString(36).substring(2, 9) + '-' + now,
        title: partialItem.title || '새 항목',
        category: partialItem.category || 'api_key',
        folderId: partialItem.folderId,
        tags: partialItem.tags || [],
        isFavorite: partialItem.isFavorite || false,
        createdAt: now,
        updatedAt: now,
        notes: partialItem.notes,
        apiKeyData: partialItem.apiKeyData,
        passwordData: partialItem.passwordData,
        contactData: partialItem.contactData,
        noteData: partialItem.noteData,
      };
      updatedItems = [newItem, ...items];
    }

    setItems(updatedItems);
    await saveVaultData(updatedItems, folders, cryptoKey);
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    if (!cryptoKey) return;
    const updatedItems = items.filter((i) => i.id !== id);
    setItems(updatedItems);
    await saveVaultData(updatedItems, folders, cryptoKey);
    if (detailItem?.id === id) {
      setIsDetailModalOpen(false);
      setDetailItem(null);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id: string) => {
    if (!cryptoKey) return;
    const updatedItems = items.map((i) =>
      i.id === id ? { ...i, isFavorite: !i.isFavorite, updatedAt: Date.now() } : i
    );
    setItems(updatedItems);
    await saveVaultData(updatedItems, folders, cryptoKey);
    if (detailItem?.id === id) {
      setDetailItem({ ...detailItem, isFavorite: !detailItem.isFavorite });
    }
  };

  // Move Item to Folder (Supports Drag & Drop and Dropdown Menu)
  const handleMoveItemToFolder = async (itemId: string, targetFolderId: string | null) => {
    if (!cryptoKey) return;
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const updatedItems = items.map((i) =>
      i.id === itemId ? { ...i, folderId: targetFolderId || undefined, updatedAt: Date.now() } : i
    );
    setItems(updatedItems);
    await saveVaultData(updatedItems, folders, cryptoKey);

    const folderObj = folders.find((f) => f.id === targetFolderId);
    const destName = folderObj ? `'${folderObj.name}'` : '미분류';
    setActionNotification(`'${targetItem.title}' 항목이 ${destName} 폴더로 이동되었습니다.`);
  };

  // Folder CRUD: Create Folder
  const handleCreateFolder = async (folderData: { name: string; colorId: string }) => {
    if (!cryptoKey) return '';
    const newFolder: VaultFolder = {
      id: 'folder-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
      name: folderData.name,
      colorId: folderData.colorId,
      createdAt: Date.now(),
    };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    await saveVaultData(items, updatedFolders, cryptoKey);
    setIsFolderModalOpen(false);
    setEditingFolder(null);
    setSelectedFolderId(newFolder.id);
    setActionNotification(`'${newFolder.name}' 커스텀 카테고리가 생성되었습니다.`);
    return newFolder.id;
  };

  // Folder CRUD: Update Folder
  const handleUpdateFolder = async (folderId: string, folderData: { name: string; colorId: string }) => {
    if (!cryptoKey) return;
    const updatedFolders = folders.map((f) =>
      f.id === folderId ? { ...f, name: folderData.name, colorId: folderData.colorId } : f
    );
    setFolders(updatedFolders);
    await saveVaultData(items, updatedFolders, cryptoKey);
    setIsFolderModalOpen(false);
    setEditingFolder(null);
    setActionNotification(`'${folderData.name}' 폴더 속성이 저장되었습니다.`);
  };

  // Folder CRUD: Delete Folder (reassign items to unassigned)
  const handleDeleteFolder = async (folderId: string) => {
    if (!cryptoKey) return;
    const targetFolder = folders.find((f) => f.id === folderId);
    const folderName = targetFolder ? targetFolder.name : '폴더';

    // Remove folder and clear folderId on contained items
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    const updatedItems = items.map((i) =>
      i.folderId === folderId ? { ...i, folderId: undefined } : i
    );

    setFolders(updatedFolders);
    setItems(updatedItems);
    await saveVaultData(updatedItems, updatedFolders, cryptoKey);

    if (selectedFolderId === folderId) {
      setSelectedFolderId('all');
    }
    setIsFolderModalOpen(false);
    setEditingFolder(null);
    setActionNotification(`'${folderName}' 폴더가 삭제되었습니다. (항목은 미분류로 보존됨)`);
  };

  // Import Backup Items
  const handleImportBackup = async (importedItems: VaultItem[]) => {
    if (!cryptoKey) return;
    const existingIds = new Set(items.map((i) => i.id));
    const merged = [...items];

    importedItems.forEach((imp) => {
      if (!existingIds.has(imp.id)) {
        merged.push(imp);
      } else {
        // re-id to avoid collisions
        merged.push({
          ...imp,
          id: 'imported-' + Math.random().toString(36).substring(2, 7) + '-' + Date.now(),
        });
      }
    });

    setItems(merged);
    await saveVaultData(merged, folders, cryptoKey);
  };

  // Action Notification Auto-Dismiss
  useEffect(() => {
    if (!actionNotification) return;
    const timer = setTimeout(() => {
      setActionNotification(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [actionNotification]);

  // Copy Feedback with countdown
  const handleCopiedSecret = (label: string) => {
    const timeout = settings.clipboardTimeoutSec || 30;
    setClipboardToast({ label, countdown: timeout });
  };

  // Countdown timer for clipboard toast
  useEffect(() => {
    if (!clipboardToast) return;
    const interval = setInterval(() => {
      setClipboardToast((prev) => {
        if (!prev || prev.countdown <= 1) return null;
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [clipboardToast]);

  // Security Audit Results
  const auditResult = useMemo(() => runSecurityAudit(items), [items]);

  // All distinct tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [items]);

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // If we're in the vault view, don't show contacts - they are in the separate phonebook
      if (activeView === 'vault' && item.category === 'contact') return false;

      // Category filter
      if (currentCategory === 'favorites') {
        if (!item.isFavorite) return false;
      } else if (currentCategory !== 'all') {
        if (item.category !== currentCategory) return false;
      }

      // Folder filter
      if (selectedFolderId && selectedFolderId !== 'all') {
        if (selectedFolderId === 'unassigned') {
          if (item.folderId) return false;
        } else {
          if (item.folderId !== selectedFolderId) return false;
        }
      }

      // Tag filter
      if (selectedTag && (!item.tags || !item.tags.includes(selectedTag))) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0);
        
        return keywords.every(q => {
          const titleMatch = item.title.toLowerCase().includes(q);
          const notesMatch = item.notes?.toLowerCase().includes(q);
          const tagsMatch = item.tags?.some((t) => t.toLowerCase().includes(q));

          let specificMatch = false;
          if (item.category === 'api_key' && item.apiKeyData) {
            specificMatch =
              item.apiKeyData.service.toLowerCase().includes(q) ||
              item.apiKeyData.environment.toLowerCase().includes(q);
          } else if (item.category === 'password' && item.passwordData) {
            specificMatch =
              item.passwordData.service.toLowerCase().includes(q) ||
              item.passwordData.username.toLowerCase().includes(q);
          } else if (item.category === 'contact' && item.contactData) {
            specificMatch =
              item.contactData.name.toLowerCase().includes(q) ||
              item.contactData.phoneNumber.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, '')) ||
              (item.contactData.organization?.toLowerCase().includes(q) ?? false) ||
              (item.contactData.email?.toLowerCase().includes(q) ?? false);
          } else if (item.category === 'note' && item.noteData) {
            specificMatch = item.noteData.content.toLowerCase().includes(q);
          }

          return titleMatch || notesMatch || tagsMatch || specificMatch;
        });
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'ko');
      }
      if (sortBy === 'created') {
        return b.createdAt - a.createdAt;
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [items, currentCategory, selectedFolderId, selectedTag, searchQuery, sortBy]);

  // If vault is locked, show LockScreen
  const handleImportContacts = (newItems: VaultItem[]) => {
    if (!cryptoKey) return;
    const updatedItems = [...items, ...newItems];
    setItems(updatedItems);
    saveVaultItems(updatedItems, cryptoKey, folders);
  };

  if (!isUnlocked) {
    return (
      <LockScreen
        isFirstSetup={isFirstSetup}
        onUnlock={handleUnlock}
        onSetup={handleSetup}
        onResetVault={handleResetVault}
      />
    );
  }

  return (
    <div className="min-h-screen relative bg-[#f0f2f5] text-slate-800 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900 overflow-x-hidden">
      {/* Top Navbar */}
      <div className="relative z-30">
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          auditResult={auditResult}
          onOpenGenerator={() => setIsGeneratorModalOpen(true)}
          onOpenAudit={() => setIsAuditModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenAddItem={() => {
            setEditingItem(null);
            setIsItemModalOpen(true);
          }}
          onLockVault={handleLockVault}
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left Sidebar - Hidden on mobile if in phonebook view */}
        <div className={`${activeView === 'phonebook' ? 'hidden md:block' : 'block'} md:w-64`}>
          <Sidebar
            currentCategory={currentCategory}
            onSelectCategory={setCurrentCategory}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            items={items}
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onOpenCreateFolder={() => {
              setEditingFolder(null);
              setIsFolderModalOpen(true);
            }}
            onOpenEditFolder={(folder) => {
              setEditingFolder(folder);
              setIsFolderModalOpen(true);
            }}
            onMoveItemToFolder={handleMoveItemToFolder}
            allTags={allTags}
            auditResult={auditResult}
            onOpenAudit={() => setIsAuditModalOpen(true)}
            activeView={activeView}
            onSelectView={setActiveView}
          />
        </div>

        {/* Right Main Vault Browser */}
        <main className="flex-1 min-w-0 flex flex-col gap-5">
          {/* AI Smart Assistant Chat Bar: Natural language to folder & category classifier */}
          {settings.aiAssistantEnabled !== false && (
            <AiAssistantBar
              existingFolders={folders}
              onSaveItem={handleSaveItem}
              onCreateFolder={handleCreateFolder}
              onEditItemInModal={(itemData) => {
                setEditingItem(itemData as VaultItem);
                setIsItemModalOpen(true);
              }}
              onNotification={(msg) => setActionNotification(msg)}
              settings={settings}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
            />
          )}

          {activeView === 'phonebook' ? (
            <PhoneBookView
              items={items}
              onBack={() => {
                setActiveView('vault');
                setCurrentCategory('all');
              }}
              onAddItem={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              onEditItem={(item) => {
                setEditingItem(item);
                setIsItemModalOpen(true);
              }}
              onDeleteItem={handleDeleteItem}
              onToggleFavorite={handleToggleFavorite}
              onImport={handleImportContacts}
            />
          ) : (
            <>
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-panel p-3.5 sm:p-4 rounded-2xl border-none shadow-xl light-glow">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                {currentCategory === 'all' && '전체 항목'}
                {currentCategory === 'api_key' && 'API 키'}
                {currentCategory === 'password' && '계정 및 비밀번호'}
                {currentCategory === 'contact' && '보안 연락처'}
                {currentCategory === 'note' && '보안 메모'}
                {currentCategory === 'favorites' && '즐겨찾기'}
              </span>
              <span className="text-slate-500 font-mono font-medium">({filteredItems.length}개)</span>

              {/* Active Custom Folder Badge */}
              {selectedFolderId && selectedFolderId !== 'all' && (
                (() => {
                  if (selectedFolderId === 'unassigned') {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs font-semibold shadow-sm">
                        <Folder className="w-3.5 h-3.5 text-slate-500" />
                        <span>폴더: 미분류</span>
                        <button
                          onClick={() => setSelectedFolderId('all')}
                          className="hover:text-slate-900 font-bold ml-1 text-sm text-slate-400"
                          title="폴더 필터 해제"
                        >
                          ×
                        </button>
                      </span>
                    );
                  }
                  const activeFolder = folders.find((f) => f.id === selectedFolderId);
                  if (!activeFolder) return null;
                  const color = getNeonColorById(activeFolder.colorId);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border font-semibold text-xs shadow-sm transition-all ${color.badge}`}
                    >
                      <Folder className="w-3.5 h-3.5" />
                      <span>폴더: {activeFolder.name}</span>
                      <button
                        onClick={() => setSelectedFolderId('all')}
                        className="hover:opacity-75 font-bold ml-1 text-sm"
                        title="폴더 필터 해제"
                      >
                        ×
                      </button>
                    </span>
                  );
                })()
              )}

              {selectedTag && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border font-semibold text-xs ${getTagNeonStyle(selectedTag).badge}`}>
                  #{selectedTag}
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="hover:opacity-75 font-bold ml-0.5 text-sm"
                    title="태그 필터 해제"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-1.5 text-xs text-slate-700">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-700 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="updated" className="bg-white text-slate-800">최근 수정순</option>
                  <option value="title" className="bg-white text-slate-800">이름순 (가나다)</option>
                  <option value="created" className="bg-white text-slate-800">생성일순</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="카드 그리드 보기"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="목록 보기"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Create Folder Button */}
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setIsFolderModalOpen(true);
                }}
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-colors"
                title="새 커스텀 폴더 만들기"
              >
                <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
                <span>폴더 추가</span>
              </button>

              {/* Quick Add Button */}
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>항목 추가</span>
              </button>
            </div>
          </div>

          {/* Items Display Grid / List */}
          {filteredItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-300 rounded-3xl min-h-[320px] shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mb-4">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                보관 중인 항목이 없습니다
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-5 font-medium">
                {searchQuery
                  ? `'${searchQuery}' 검색 조건과 일치하는 항목을 찾을 수 없습니다.`
                  : selectedFolderId && selectedFolderId !== 'all'
                  ? '현재 선택한 폴더에 보관된 항목이 없습니다. 좌측 폴더로 항목을 드래그 앤 드롭해보세요.'
                  : '새로운 API 키, 전화번호 연락처 또는 비밀번호를 등록해보세요.'}
              </p>
              <div className="flex gap-2.5 flex-wrap justify-center">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                  >
                    검색어 초기화
                  </button>
                )}
                {selectedFolderId && selectedFolderId !== 'all' && (
                  <button
                    onClick={() => setSelectedFolderId('all')}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                  >
                    전체 항목 보기
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsItemModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4 text-white" />
                  첫 번째 항목 추가하기
                </button>
              </div>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4'
                  : 'flex flex-col gap-3'
              }
            >
              {filteredItems.map((item) => (
                <VaultItemCard
                  key={item.id}
                  item={item}
                  folders={folders}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={(target) => {
                    setEditingItem(target);
                    setIsItemModalOpen(true);
                  }}
                  onDelete={handleDeleteItem}
                  onViewDetail={(target) => {
                    setDetailItem(target);
                    setIsDetailModalOpen(true);
                  }}
                  onCopiedSecret={handleCopiedSecret}
                  onMoveItemToFolder={handleMoveItemToFolder}
                  onSelectFolder={setSelectedFolderId}
                />
              ))}
            </div>
          )}
          </>
          )}
        </main>
      </div>

      {/* Action Notification Toast (e.g. Item moved to folder, folder created) */}
      {actionNotification && (
        <div className="fixed bottom-6 left-6 z-50 bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
            <Folder className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-slate-700">{actionNotification}</span>
          <button
            onClick={() => setActionNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1 text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Clipboard Copy Toast */}
      {clipboardToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{clipboardToast.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">복사 완료</span>
            </div>
            <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-sky-600" />
              보안을 위해 {clipboardToast.countdown}초 후 자동 제거됩니다.
            </div>
          </div>
          <button
            onClick={() => setClipboardToast(null)}
            className="text-slate-400 hover:text-slate-700 p-1 text-sm font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Item Create / Edit Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialItem={editingItem}
        folders={folders}
        existingItems={items} // Pass items for autocomplete suggestions
        defaultFolderId={selectedFolderId}
        restrictCategory={activeView === 'phonebook' ? 'contact' : undefined}
        onCreateFolder={handleCreateFolder}
        defaultCategory={
          currentCategory === 'all' || currentCategory === 'favorites'
            ? 'api_key'
            : currentCategory
        }
      />

      {/* Item Detail View Modal */}
      <ItemDetailModal
        isOpen={isDetailModalOpen}
        item={detailItem}
        folders={folders}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailItem(null);
        }}
        onEdit={(item) => {
          setIsDetailModalOpen(false);
          setEditingItem(item);
          setIsItemModalOpen(true);
        }}
        onDelete={handleDeleteItem}
        onToggleFavorite={handleToggleFavorite}
        onCopiedSecret={handleCopiedSecret}
        onSelectFolder={setSelectedFolderId}
      />

      {/* Folder Create / Edit Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={
          editingFolder
            ? (data) => handleUpdateFolder(editingFolder.id, data)
            : handleCreateFolder
        }
        onDelete={
          editingFolder
            ? () => handleDeleteFolder(editingFolder.id)
            : undefined
        }
        initialFolder={editingFolder}
      />

      {/* Password & Key Generator Modal */}
      <PasswordGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
      />

      {/* Security Audit Modal */}
      <SecurityAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditResult={auditResult}
        onFixItem={(item) => {
          setEditingItem(item);
          setIsItemModalOpen(true);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        items={items}
        onChangeMasterPassword={handleChangeMasterPassword}
        onImportBackup={handleImportBackup}
        onWipeVault={handleResetVault}
      />
    </div>
  );
}
