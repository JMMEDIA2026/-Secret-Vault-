export type VaultCategory = 'api_key' | 'password' | 'contact' | 'note' | 'bookmark';

export type ApiEnvironment = 'production' | 'staging' | 'development' | 'test';

export interface BookmarkData {
  url: string;
  domain?: string;
  favicon?: string;
  description?: string;
}

export interface ApiKeyData {
  service: string;
  apiKey: string;
  apiSecret?: string;
  endpointUrl?: string;
  environment: ApiEnvironment;
  expiresAt?: string; // YYYY-MM-DD
}

export interface PasswordData {
  service: string;
  websiteUrl?: string;
  username: string;
  password: string;
  twoFactorSeed?: string;
}

export interface ContactData {
  name: string;
  lastName?: string;
  phoneNumber: string;
  secondaryPhone?: string;
  email?: string;
  secondaryEmail?: string;
  organization?: string;
  jobTitle?: string;
  address?: string;
  birthday?: string;
  website?: string;
  snsHandle?: string;
  relationship?: string;
  customFields?: Array<{ label: string; value: string }>;
  isEmergency?: boolean;
  source?: 'google' | 'iphone' | 'naver' | 'other';
  privateNotes?: string;
}

export interface NoteData {
  content: string;
}

export interface VaultFolder {
  id: string;
  name: string;
  colorId: string; // 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'indigo' | 'purple'
  createdAt: number;
  description?: string;
  icon?: string;
}

// Custom category alias for user-defined classification
export type VaultCustomCategory = VaultFolder;

export interface VaultItem {
  id: string;
  title: string;
  category: VaultCategory;
  folderId?: string | null;
  customCategory?: string; // Optional direct custom category label
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  apiKeyData?: ApiKeyData;
  passwordData?: PasswordData;
  contactData?: ContactData;
  noteData?: NoteData;
  bookmarkData?: BookmarkData;
}

export interface VaultSettings {
  autoLockMinutes: number; // 0 = never, 5, 15, 30, 60
  lockOnBlur: boolean;
  clipboardTimeoutSec: number;
  // AI Smart Assistant / Chat Configuration
  aiAssistantEnabled?: boolean;
  aiModel?: 'gemini-2.5-flash' | 'gemini-3.8-flash' | 'gemini-flash-latest';
  aiAutoSuggestFolders?: boolean;
  aiIncludeNotes?: boolean;
  aiDefaultTemperature?: number;
}

export interface SecurityAuditResult {
  overallScore: number; // 0 to 100
  weakPasswords: VaultItem[];
  reusedPasswords: { password: string; items: VaultItem[] }[];
  expiringApiKeys: { item: VaultItem; daysRemaining: number }[];
  totalItems: number;
}
