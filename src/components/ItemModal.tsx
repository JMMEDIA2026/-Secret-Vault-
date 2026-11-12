import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Key,
  Lock,
  Phone,
  FileText,
  Star,
  Sparkles,
  Eye,
  EyeOff,
  ShieldAlert,
  Folder,
  User,
  Building2,
  Mail,
  Smartphone,
  MapPin,
  Cake,
  Globe2,
  Heart,
  StickyNote,
  Tag,
  Plus,
  Check,
  Palette,
} from 'lucide-react';
import { VaultItem, VaultCategory, ApiEnvironment, VaultFolder } from '../types';
import {
  generateSecurePassword,
  generateApiKeyPreset,
  evaluatePasswordStrength,
} from '../utils/crypto';
import { getTagNeonStyle, NEON_7_COLORS, getNeonColorById } from '../utils/neonTheme';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<VaultItem>) => void;
  initialItem?: VaultItem | null;
  defaultCategory?: VaultCategory;
  folders?: VaultFolder[];
  defaultFolderId?: string | null;
  existingItems?: VaultItem[]; // Add this to provide suggestions
  restrictCategory?: VaultCategory; // If provided, only this category is allowed
  onCreateFolder?: (folder: { name: string; colorId: string; description?: string }) => Promise<string> | string;
}

const SERVICE_PRESETS = [
  'OpenAI',
  'Google Gemini',
  'Anthropic Claude',
  'Kakao Developers',
  'Naver Cloud Platform',
  'Amazon Web Services',
  'GitHub',
  'Stripe',
  'Supabase',
  'Firebase',
  'Cloudflare',
];

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  defaultCategory = 'api_key',
  folders = [],
  defaultFolderId,
  existingItems = [],
  restrictCategory,
  onCreateFolder,
}) => {
  const [category, setCategory] = useState<VaultCategory>(restrictCategory || defaultCategory);
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Inline Category Creation State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('cyan');

  // Suggestions state
  const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);

  // API Key fields
  const [apiService, setApiService] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [environment, setEnvironment] = useState<ApiEnvironment>('production');
  const [expiresAt, setExpiresAt] = useState('');

  // Password fields
  const [pwdService, setPwdService] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorSeed, setTwoFactorSeed] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Contact fields
  const [contactName, setContactName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');
  const [website, setWebsite] = useState('');
  const [snsHandle, setSnsHandle] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [privateNotes, setPrivateNotes] = useState('');

  // Note fields
  const [noteContent, setNoteContent] = useState('');

  // Derived suggestions from existing items
  const suggestions = useMemo(() => {
    const services = new Set<string>(SERVICE_PRESETS);
    const usernames = new Set<string>();
    const organizations = new Set<string>();
    const emails = new Set<string>();

    existingItems.forEach((item) => {
      if (item.apiKeyData?.service) services.add(item.apiKeyData.service);
      if (item.passwordData?.service) services.add(item.passwordData.service);
      if (item.passwordData?.username) usernames.add(item.passwordData.username);
      if (item.contactData?.organization) organizations.add(item.contactData.organization);
      if (item.contactData?.email) emails.add(item.contactData.email);
    });

    return {
      services: Array.from(services),
      usernames: Array.from(usernames),
      organizations: Array.from(organizations),
      emails: Array.from(emails),
    };
  }, [existingItems]);

  const getFilteredSuggestions = (field: 'services' | 'usernames' | 'organizations' | 'emails', value: string) => {
    if (!value.trim()) return [];
    return suggestions[field]
      .filter((s) => s.toLowerCase().includes(value.toLowerCase()) && s !== value)
      .slice(0, 5);
  };

  // Reset or fill form on load
  useEffect(() => {
    if (initialItem) {
      setCategory(initialItem.category);
      setTitle(initialItem.title);
      setFolderId(initialItem.folderId || '');
      setIsFavorite(initialItem.isFavorite);
      setTags(initialItem.tags || []);
      setNotes(initialItem.notes || '');

      if (initialItem.category === 'api_key' && initialItem.apiKeyData) {
        setApiService(initialItem.apiKeyData.service || '');
        setApiKey(initialItem.apiKeyData.apiKey || '');
        setApiSecret(initialItem.apiKeyData.apiSecret || '');
        setEndpointUrl(initialItem.apiKeyData.endpointUrl || '');
        setEnvironment(initialItem.apiKeyData.environment || 'production');
        setExpiresAt(initialItem.apiKeyData.expiresAt || '');
      } else if (initialItem.category === 'password' && initialItem.passwordData) {
        setPwdService(initialItem.passwordData.service || '');
        setWebsiteUrl(initialItem.passwordData.websiteUrl || '');
        setUsername(initialItem.passwordData.username || '');
        setPassword(initialItem.passwordData.password || '');
        setTwoFactorSeed(initialItem.passwordData.twoFactorSeed || '');
      } else if (initialItem.category === 'contact' && initialItem.contactData) {
        setContactName(initialItem.contactData.name || '');
        setContactLastName(initialItem.contactData.lastName || '');
        setPhoneNumber(initialItem.contactData.phoneNumber || '');
        setSecondaryPhone(initialItem.contactData.secondaryPhone || '');
        setContactEmail(initialItem.contactData.email || '');
        setSecondaryEmail(initialItem.contactData.secondaryEmail || '');
        setOrganization(initialItem.contactData.organization || '');
        setJobTitle(initialItem.contactData.jobTitle || '');
        setAddress(initialItem.contactData.address || '');
        setBirthday(initialItem.contactData.birthday || '');
        setWebsite(initialItem.contactData.website || '');
        setSnsHandle(initialItem.contactData.snsHandle || '');
        setRelationship(initialItem.contactData.relationship || '');
        setIsEmergency(initialItem.contactData.isEmergency || false);
        setPrivateNotes(initialItem.contactData.privateNotes || '');
      } else if (initialItem.category === 'note' && initialItem.noteData) {
        setNoteContent(initialItem.noteData.content || '');
      }
    } else {
      setCategory(restrictCategory || defaultCategory);
      setTitle('');
      setFolderId(defaultFolderId || '');
      setIsFavorite(false);
      setTagInput('');
      setTags([]);
      setNotes('');

      setApiService('');
      setApiKey('');
      setApiSecret('');
      setEndpointUrl('');
      setEnvironment('production');
      setExpiresAt('');

      setPwdService('');
      setWebsiteUrl('');
      setUsername('');
      setPassword('');
      setTwoFactorSeed('');
      setShowPassword(false);

      setContactName('');
      setContactLastName('');
      setPhoneNumber('');
      setSecondaryPhone('');
      setContactEmail('');
      setSecondaryEmail('');
      setOrganization('');
      setJobTitle('');
      setAddress('');
      setBirthday('');
      setWebsite('');
      setSnsHandle('');
      setRelationship('');
      setIsEmergency(false);
      setPrivateNotes('');

      setNoteContent('');
    }
  }, [initialItem, defaultCategory, defaultFolderId, isOpen, restrictCategory]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^#/, '');
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Unique available tags from vault + essential presets
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>([
      'AI',
      '개발용',
      '프로덕션',
      '클라우드',
      '보안',
      '중요',
      '금융',
      '개인',
      '긴급',
      '가족',
      '회사',
      '인프라',
      '백업',
    ]);
    existingItems.forEach((item) => {
      item.tags?.forEach((t) => {
        if (t && t.trim()) tagSet.add(t.trim());
      });
    });
    return Array.from(tagSet);
  }, [existingItems]);

  const handleCreateCategoryInline = async () => {
    if (!newCatName.trim()) return;
    const catName = newCatName.trim();
    if (onCreateFolder) {
      const createdId = await onCreateFolder({
        name: catName,
        colorId: newCatColor,
      });
      if (createdId) {
        setFolderId(createdId);
      }
    }
    setNewCatName('');
    setIsAddingCategory(false);
  };

  const renderSuggestions = (
    field: 'services' | 'usernames' | 'organizations' | 'emails',
    value: string,
    setter: (val: string) => void,
    fieldName: string
  ) => {
    const filtered = getFilteredSuggestions(field, value);
    if (filtered.length === 0 || activeSuggestionField !== fieldName) return null;

    return (
      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="p-1">
          {filtered.map((item) => (
            <button
              key={item}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setter(item);
                setActiveSuggestionField(null);
              }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-between"
            >
              <span>{item}</span>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">기존 값</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleGeneratePasswordInline = () => {
    const generated = generateSecurePassword({
      length: 20,
      useUpper: true,
      useLower: true,
      useNumbers: true,
      useSymbols: true,
      avoidAmbiguous: true,
    });
    setPassword(generated);
    setShowPassword(true);
  };

  const handleGenerateApiKeyInline = (preset: 'openai' | 'gemini' | 'hex' | 'bearer') => {
    const generated = generateApiKeyPreset(preset);
    setApiKey(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: Partial<VaultItem> = {
      category,
      title: title.trim(),
      folderId: folderId ? folderId : undefined,
      isFavorite,
      tags,
      notes: notes.trim(),
    };

    if (category === 'api_key') {
      payload.apiKeyData = {
        service: apiService.trim() || title.trim(),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim() || undefined,
        endpointUrl: endpointUrl.trim() || undefined,
        environment,
        expiresAt: expiresAt || undefined,
      };
    } else if (category === 'password') {
      payload.passwordData = {
        service: pwdService.trim() || title.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        username: username.trim(),
        password: password.trim(),
        twoFactorSeed: twoFactorSeed.trim() || undefined,
      };
    } else if (category === 'contact') {
      payload.contactData = {
        name: contactName.trim() || title.trim(),
        lastName: contactLastName.trim() || undefined,
        phoneNumber: phoneNumber.trim(),
        secondaryPhone: secondaryPhone.trim() || undefined,
        email: contactEmail.trim() || undefined,
        secondaryEmail: secondaryEmail.trim() || undefined,
        organization: organization.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        address: address.trim() || undefined,
        birthday: birthday || undefined,
        website: website.trim() || undefined,
        snsHandle: snsHandle.trim() || undefined,
        relationship: relationship.trim() || undefined,
        isEmergency,
        privateNotes: privateNotes.trim() || undefined,
      };
    } else if (category === 'note') {
      payload.noteData = {
        content: noteContent,
      };
    }

    onSave(payload);
  };

  const pwdStrength = password ? evaluatePasswordStrength(password) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0b0d12]/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#12151c] border-x border-t-[#2a3040] border-b-[#0a0c10] rounded-t-[2rem] sm:rounded-2xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_15px_35px_rgba(0,0,0,0.6)] overflow-hidden max-h-[95vh] sm:max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 md:px-6 py-4 border-b border-[#1f2430] flex items-center justify-between sticky top-0 bg-[#12151c]/80 backdrop-blur-xl z-20">
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#e8ecf1] tracking-tight">
              {initialItem ? '보관소 항목 수정' : '새로운 보안 항목 등록'}
            </h2>
            <p className="text-[10px] md:text-xs text-[#6b7280]">
              안전하게 암호화되어 로컬 볼트에 저장됩니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#e8ecf1] hover:bg-[#1f2430] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        {!initialItem && !restrictCategory && (
          <div className="flex border-b border-[#1f2430] bg-[#0b0d12]/30 px-4 md:px-6 pt-3 gap-1 md:gap-2 overflow-x-auto scrollbar-none sticky top-[72px] md:top-[76px] z-10">
            <button
              type="button"
              onClick={() => setCategory('api_key')}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] md:text-xs rounded-t-xl font-semibold transition-all shrink-0 cursor-pointer ${
                category === 'api_key'
                  ? 'bg-[#12151c] text-[#7fd8e0] border-t border-x border-[#1f2430] shadow-[0_-2px_10px_rgba(127,216,224,0.1)] font-bold'
                  : 'text-[#6b7280] hover:text-[#e8ecf1] hover:bg-[#1f2430]'
              }`}
            >
              <Key className={`w-3 md:w-3.5 h-3 md:h-3.5 ${category === 'api_key' ? 'text-[#7fd8e0]' : 'text-[#6b7280]'}`} />
              API 키
            </button>
            <button
              type="button"
              onClick={() => setCategory('password')}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] md:text-xs rounded-t-xl font-semibold transition-all shrink-0 cursor-pointer ${
                category === 'password'
                  ? 'bg-[#12151c] text-[#7fd8e0] border-t border-x border-[#1f2430] shadow-[0_-2px_10px_rgba(127,216,224,0.1)] font-bold'
                  : 'text-[#6b7280] hover:text-[#e8ecf1] hover:bg-[#1f2430]'
              }`}
            >
              <Lock className={`w-3 md:w-3.5 h-3 md:h-3.5 ${category === 'password' ? 'text-[#7fd8e0]' : 'text-[#6b7280]'}`} />
              비밀번호
            </button>
            <button
              type="button"
              onClick={() => setCategory('note')}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] md:text-xs rounded-t-xl font-semibold transition-all shrink-0 cursor-pointer ${
                category === 'note'
                  ? 'bg-[#12151c] text-[#f2c078] border-t border-x border-[#1f2430] shadow-[0_-2px_10px_rgba(242,192,120,0.1)] font-bold'
                  : 'text-[#6b7280] hover:text-[#e8ecf1] hover:bg-[#1f2430]'
              }`}
            >
              <FileText className={`w-3 md:w-3.5 h-3 md:h-3.5 ${category === 'note' ? 'text-[#f2c078]' : 'text-[#6b7280]'}`} />
              보안 메모
            </button>
          </div>
        )}

        {/* Header if restricted */}
        {restrictCategory && !initialItem && (
          <div className="px-5 md:px-6 pt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0b0d12]/50 rounded-lg border border-[#1f2430] text-[11px] md:text-xs font-bold text-[#e8ecf1] w-fit shadow-inner">
              {restrictCategory === 'contact' ? (
                <>
                  <Phone className="w-3.5 h-3.5 text-[#7fd8e0]" />
                  주소록 항목 추가
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-[#6b7280]" />
                  {restrictCategory}
                </>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 md:space-y-5 overflow-y-auto flex-1 bg-[#12151c]">
          {/* Common: Title & Favorite */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-[11px] md:text-xs font-semibold text-[#6b7280] mb-1">
                항목 이름 / 제목 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  category === 'api_key'
                    ? '예: OpenAI 프로덕션 키'
                    : category === 'password'
                    ? '예: GitHub 개인 계정'
                    : category === 'contact'
                    ? '예: 김철수 팀장 (비상 연락처)'
                    : '예: 서버 설정 및 패스코드'
                }
                className="w-full px-3 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-xs md:text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 font-normal shadow-inner transition-all"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`w-full py-2 px-3 rounded-xl border text-[11px] md:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer h-[38px] md:h-[42px] ${
                  isFavorite
                    ? 'bg-[#f2c078]/10 border-[#f2c078]/30 text-[#f2c078] shadow-[0_0_15px_rgba(242,192,120,0.1)]'
                    : 'bg-[#0b0d12]/30 border-[#1f2430] text-[#6b7280] hover:bg-[#1f2430] hover:text-[#e8ecf1]'
                }`}
              >
                <Star
                  className="w-3.5 md:w-4 h-3.5 md:h-4"
                  fill={isFavorite ? 'currentColor' : 'none'}
                />
                즐겨찾기
              </button>
            </div>
          </div>

          {/* Custom Category Selection Section */}
          <div className="p-3.5 bg-[#0b0d12]/40 border border-[#1f2430] rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#e8ecf1] flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-[#7fd8e0]" />
                <span>사용자 지정 카테고리 분류</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-[11px] font-semibold text-[#7fd8e0] hover:text-[#e8ecf1] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{isAddingCategory ? '닫기' : '새 카테고리 추가'}</span>
              </button>
            </div>

            {/* Inline category creator */}
            {isAddingCategory && (
              <div className="p-3 bg-[#12151c] border border-[#2a3040] rounded-xl space-y-2.5 animate-in fade-in">
                <div className="text-[11px] font-medium text-[#6b7280]">새 카테고리 생성 및 즉시 할당</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="카테고리명 (예: 프로젝트 A, 개인 금융)"
                    className="flex-1 px-3 py-1.5 bg-[#0b0d12]/60 border border-[#1f2430] rounded-lg text-xs text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategoryInline}
                    disabled={!newCatName.trim()}
                    className="px-3 py-1.5 bg-[#7fd8e0] text-[#0b0d12] hover:bg-[#a0ecf4] font-semibold text-xs rounded-lg disabled:opacity-40 transition-all cursor-pointer"
                  >
                    생성
                  </button>
                </div>
                {/* Color selection for new category */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#6b7280]">색상:</span>
                  {NEON_7_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewCatColor(c.id)}
                      className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                        newCatColor === c.id ? 'scale-125 border-white ring-1 ring-sky-400' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Category Chips / Selection */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFolderId('')}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  !folderId
                    ? 'bg-[#1f2430] text-[#e8ecf1] border-[#7fd8e0]/50 shadow-sm'
                    : 'bg-[#0b0d12]/30 text-[#6b7280] border-[#1f2430] hover:text-[#e8ecf1] hover:bg-[#1f2430]/50'
                }`}
              >
                <span>미분류</span>
              </button>
              {folders.map((f) => {
                const color = getNeonColorById(f.colorId);
                const isSelected = folderId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFolderId(f.id)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? `${color.badge} border-opacity-70 ring-1 ring-white/20 shadow-sm font-semibold`
                        : 'bg-[#0b0d12]/30 text-[#6b7280] border-[#1f2430] hover:text-[#e8ecf1] hover:bg-[#1f2430]/50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color.hex }} />
                    <span>{f.name}</span>
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CATEGORY: API KEY FORM */}
          {category === 'api_key' && (
            <div className="space-y-3.5 pt-2 border-t border-[#1f2430]">
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-1">
                  서비스 제공자
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {SERVICE_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setApiService(preset)}
                      className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        apiService === preset
                          ? 'bg-[#7fd8e0]/20 text-[#7fd8e0] border-[#7fd8e0]/40 font-semibold'
                          : 'bg-[#0b0d12]/30 text-[#6b7280] border-[#1f2430] hover:text-[#e8ecf1] hover:bg-[#1f2430]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={apiService}
                    onChange={(e) => setApiService(e.target.value)}
                    onFocus={() => setActiveSuggestionField('apiService')}
                    onBlur={() => setTimeout(() => setActiveSuggestionField(null), 200)}
                    placeholder="예: OpenAI, Google Gemini, Custom Service"
                    className="w-full px-3 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner"
                  />
                  {renderSuggestions('services', apiService, setApiService, 'apiService')}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#6b7280]">
                    API Key (공개키 / 토큰) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#4b5563]">생성:</span>
                    <button
                      type="button"
                      onClick={() => handleGenerateApiKeyInline('openai')}
                      className="text-[10px] px-1.5 py-0.5 bg-[#1f2430] hover:bg-[#2a3040] text-[#7fd8e0] rounded cursor-pointer transition-colors"
                    >
                      OpenAI형
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateApiKeyInline('gemini')}
                      className="text-[10px] px-1.5 py-0.5 bg-[#1f2430] hover:bg-[#2a3040] text-[#7fd8e0] rounded cursor-pointer transition-colors"
                    >
                      Gemini형
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateApiKeyInline('hex')}
                      className="text-[10px] px-1.5 py-0.5 bg-[#1f2430] hover:bg-[#2a3040] text-[#7fd8e0] rounded cursor-pointer transition-colors"
                    >
                      Hex64
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-... 또는 AIzaSy... 형태의 API 키"
                  className="w-full font-mono px-3 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] mb-1">
                    API Secret / 비밀 키 (선택사항)
                  </label>
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="2차 시크릿 키가 있는 경우"
                    className="w-full font-mono px-3 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] mb-1">
                    실행 환경
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as ApiEnvironment)}
                    className="w-full px-3 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] focus:outline-none focus:border-[#7fd8e0]/50 cursor-pointer shadow-inner"
                  >
                    <option value="production">운영 환경 (Production)</option>
                    <option value="staging">스테이징 (Staging)</option>
                    <option value="development">개발 환경 (Development)</option>
                    <option value="test">테스트 환경 (Test)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] mb-1">
                    엔드포인트 Base URL (선택사항)
                  </label>
                  <input
                    type="url"
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-3 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] mb-1">
                    만료 / 갱신 예정일 (선택사항)
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: PASSWORD FORM */}
          {category === 'password' && (
            <div className="space-y-3.5 pt-2 border-t border-[#1f2430]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] mb-1">
                    웹사이트 / 서비스 이름
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pwdService}
                      onChange={(e) => setPwdService(e.target.value)}
                      onFocus={() => setActiveSuggestionField('pwdService')}
                      onBlur={() => setTimeout(() => setActiveSuggestionField(null), 200)}
                      placeholder="예: GitHub, AWS, Google"
                      className="w-full px-3 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner"
                    />
                    {renderSuggestions('services', pwdService, setPwdService, 'pwdService')}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6b7280] mb-1">
                    로그인 웹사이트 URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://github.com/login"
                    className="w-full px-3 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-1">
                  아이디 / 로그인 이메일
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setActiveSuggestionField('username')}
                    onBlur={() => setTimeout(() => setActiveSuggestionField(null), 200)}
                    placeholder="user@example.com 또는 사용자명"
                    className="w-full px-3 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner"
                  />
                  {renderSuggestions('usernames', username, setUsername, 'username')}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#6b7280]">
                    비밀번호 <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePasswordInline}
                    className="text-xs text-[#7fd8e0] hover:text-[#7fd8e0]/80 font-semibold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    안전한 비밀번호 자동생성
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="안전한 비밀번호"
                    className="w-full font-mono px-3 pr-10 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6b7280] hover:text-[#e8ecf1] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength feedback */}
                {pwdStrength && password && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#0b0d12] rounded-full overflow-hidden flex gap-0.5">
                        {[0, 1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 ${
                              step <= pwdStrength.score ? pwdStrength.color : 'bg-[#1f2430]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[#6b7280] font-medium">{pwdStrength.label}</span>
                    </div>
                    <span className="text-[#4b5563]">해독 예상: {pwdStrength.crackTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY: CONTACT FORM */}
          {category === 'contact' && (
            <div className="space-y-4 md:space-y-5 pt-4 border-t border-[#1f2430]">
              {/* Name Section */}
              <div className="flex gap-3 md:gap-4">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#0b0d12]/50 border border-[#1f2430] flex items-center justify-center shrink-0 mt-6 shadow-inner">
                  <User className="w-3.5 md:w-4 h-3.5 md:h-4 text-[#6b7280]" />
                </div>
                <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-[#4b5563] mb-1 ml-1 uppercase tracking-wider">이름 *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="이름"
                      className="w-full px-3.5 md:px-4 py-2 md:py-2.5 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-xs md:text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#7fd8e0]/10 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-[#4b5563] mb-1 ml-1 uppercase tracking-wider">성</label>
                    <input
                      type="text"
                      value={contactLastName}
                      onChange={(e) => setContactLastName(e.target.value)}
                      placeholder="성"
                      className="w-full px-3.5 md:px-4 py-2 md:py-2.5 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-xs md:text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#7fd8e0]/10 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Phone Section */}
              <div className="flex gap-3 md:gap-4">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#0b0d12]/50 border border-[#1f2430] flex items-center justify-center shrink-0 mt-6 shadow-inner">
                  <Smartphone className="w-3.5 md:w-4 h-3.5 md:h-4 text-[#6b7280]" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-[#4b5563] mb-1 ml-1 uppercase tracking-wider">휴대전화 *</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full px-3.5 md:px-4 py-2 md:py-2.5 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-xs md:text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#7fd8e0]/10 transition-all font-mono shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: NOTE FORM */}
          {category === 'note' && (
            <div className="space-y-3.5 pt-2 border-t border-[#1f2430]">
              <div>
                <label className="block text-[11px] md:text-xs font-semibold text-[#6b7280] mb-1">
                  보안 메모 내용 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={8}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="보안 키, SSH 설정 등을 자유롭게 작성하세요."
                  className="w-full font-mono px-3 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-[11px] md:text-sm text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#f2c078]/50 shadow-inner"
                />
              </div>
            </div>
          )}

          {/* COMMON: Tags and General Memo */}
          <div className="pt-2 border-t border-[#1f2430] space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] md:text-xs font-semibold text-[#6b7280] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#7fd8e0]" />
                  <span>태그 할당 (검색 및 빠른 분류)</span>
                </label>
                <span className="text-[10px] text-[#4b5563]">Enter 또는 쉼표(,)로 추가</span>
              </div>

              {/* Tag Input Box */}
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-[#0b0d12]/50 border border-[#1f2430] rounded-xl shadow-inner min-h-[44px]">
                {tags.map((tag) => {
                  const neon = getTagNeonStyle(tag);
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border font-semibold transition-all ${neon.badge} border-opacity-40 shadow-xs`}
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:opacity-80 transition-opacity ml-1 cursor-pointer p-0.5 rounded hover:bg-black/20"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                <div className="relative flex-1 min-w-[120px]">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={tags.length === 0 ? '태그 입력 후 Enter (예: AI, 중요, 회사)...' : '태그 추가...'}
                    className="w-full bg-transparent border-none text-xs text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none"
                  />
                  {/* Tag Autocomplete Dropdown */}
                  {tagInput.trim() && (
                    <div className="absolute top-full left-0 mt-1 z-30 bg-[#12151c] border border-[#1f2430] rounded-xl shadow-xl p-1 max-h-36 overflow-y-auto min-w-[160px]">
                      {availableTags
                        .filter(
                          (t) =>
                            t.toLowerCase().includes(tagInput.toLowerCase().replace('#', '')) &&
                            !tags.includes(t)
                        )
                        .map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setTags([...tags, t]);
                              setTagInput('');
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-[#e8ecf1] hover:bg-[#1f2430] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span>#{t}</span>
                            <Plus className="w-3 h-3 text-[#7fd8e0]" />
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Clickable Recommended / Existing Tags */}
              {availableTags.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-[#6b7280] font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#f2c078]" />
                    추천 및 기존 태그 (클릭하여 즉시 추가 / 해제):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                    {availableTags.map((tag) => {
                      const isAssigned = tags.includes(tag);
                      const neon = getTagNeonStyle(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isAssigned) {
                              setTags(tags.filter((t) => t !== tag));
                            } else {
                              setTags([...tags, tag]);
                            }
                          }}
                          className={`text-[11px] px-2 py-0.5 rounded-md border font-medium transition-all cursor-pointer flex items-center gap-1 ${
                            isAssigned
                              ? `${neon.badge} ring-1 ring-white/20 border-opacity-60 font-semibold`
                              : 'bg-[#0b0d12]/30 text-[#6b7280] border-[#1f2430] hover:text-[#e8ecf1] hover:bg-[#1f2430]'
                          }`}
                        >
                          {isAssigned ? (
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          ) : (
                            <span className="text-[#4b5563]">+</span>
                          )}
                          <span>#{tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] md:text-xs font-semibold text-[#6b7280] mb-1">
                추가 비고 / 메모
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="참고사항을 자유롭게 기록하세요"
                className="w-full px-3.5 py-2 bg-[#0b0d12]/50 border border-[#1f2430] focus:bg-[#0b0d12] rounded-xl text-[11px] md:text-xs text-[#e8ecf1] placeholder-[#4b5563] focus:outline-none focus:border-[#7fd8e0]/50 shadow-inner leading-relaxed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 md:pt-3 border-t border-[#1f2430] flex items-center justify-end gap-2.5 sticky bottom-0 bg-[#12151c] z-20 pb-2 md:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 md:py-2 rounded-xl text-[11px] md:text-xs font-semibold text-[#6b7280] hover:bg-[#1f2430] hover:text-[#e8ecf1] border border-[#1f2430] bg-[#0b0d12]/30 transition-all cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none px-5 py-2.5 md:py-2 rounded-xl text-[11px] md:text-xs font-semibold text-[#12151c] bg-[#e8ecf1] hover:bg-white shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition-all active:scale-95 cursor-pointer"
            >
              {initialItem ? '저장' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
