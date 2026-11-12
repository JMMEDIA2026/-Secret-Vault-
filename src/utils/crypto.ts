/**
 * Web Crypto API based client-side zero-knowledge encryption
 * Uses PBKDF2 (SHA-256, 100,000 iterations) + AES-GCM 256-bit
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;

// Convert buffer to Base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate random salt (16 bytes)
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

// Generate random IV (12 bytes for AES-GCM)
export function generateIv(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

// Derive AES-GCM CryptoKey from password and salt
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext string using CryptoKey
export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = generateIv();
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

// Decrypt ciphertext string using CryptoKey and IV
export async function decryptData(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const dec = new TextDecoder();
  const ivBuffer = base64ToBuffer(ivBase64);
  const cipherBuffer = base64ToBuffer(ciphertextBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    key,
    cipherBuffer
  );

  return dec.decode(decryptedBuffer);
}

// Known constant string for master password verification
export const VERIFICATION_PHRASE = 'SECRET_VAULT_AUTH_VERIFIED_OK_2026';

// Calculate Password Strength & Entropy
export interface PasswordStrength {
  score: number; // 0 (very weak) to 4 (very strong)
  label: string;
  color: string;
  entropy: number;
  crackTime: string;
  feedback: string[];
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: '입력 없음',
      color: 'bg-zinc-600',
      entropy: 0,
      crackTime: '즉시',
      feedback: ['비밀번호를 입력해주세요.'],
    };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  // Shannon Entropy: E = L * log2(R)
  const entropy = Math.round(password.length * Math.log2(poolSize || 1));
  const feedback: string[] = [];

  if (password.length < 8) feedback.push('최소 8자 이상 권장');
  if (!/[A-Z]/.test(password)) feedback.push('대문자 포함 권장');
  if (!/[0-9]/.test(password)) feedback.push('숫자 포함 권장');
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('특수문자 포함 권장');

  let score = 0;
  let label = '매우 취약';
  let color = 'bg-rose-500';
  let crackTime = '몇 초 이내';

  if (entropy >= 80 && password.length >= 14) {
    score = 4;
    label = '매우 강력';
    color = 'bg-emerald-500';
    crackTime = '수억 년';
  } else if (entropy >= 60 && password.length >= 11) {
    score = 3;
    label = '강력함';
    color = 'bg-teal-500';
    crackTime = '수백 년';
  } else if (entropy >= 40 && password.length >= 8) {
    score = 2;
    label = '보통';
    color = 'bg-amber-500';
    crackTime = '몇 개월 ~ 수 년';
  } else if (entropy >= 25) {
    score = 1;
    label = '취약함';
    color = 'bg-orange-500';
    crackTime = '며칠 이내';
  }

  return {
    score,
    label,
    color,
    entropy,
    crackTime,
    feedback: feedback.length > 0 ? feedback : ['안전한 비밀번호입니다.'],
  };
}

// Generate random password or API key token
export interface PasswordGeneratorOptions {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  avoidAmbiguous: boolean; // avoid 0, O, 1, l, I
  prefix?: string;
}

export function generateSecurePassword(options: PasswordGeneratorOptions): string {
  let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let numberChars = '0123456789';
  let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (options.avoidAmbiguous) {
    lowerChars = lowerChars.replace(/[l]/g, '');
    upperChars = upperChars.replace(/[OI]/g, '');
    numberChars = numberChars.replace(/[01]/g, '');
  }

  let charset = '';
  const mandatoryChars: string[] = [];

  const getRandomChar = (str: string) => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return str[array[0] % str.length];
  };

  if (options.useLower) {
    charset += lowerChars;
    mandatoryChars.push(getRandomChar(lowerChars));
  }
  if (options.useUpper) {
    charset += upperChars;
    mandatoryChars.push(getRandomChar(upperChars));
  }
  if (options.useNumbers) {
    charset += numberChars;
    mandatoryChars.push(getRandomChar(numberChars));
  }
  if (options.useSymbols) {
    charset += symbolChars;
    mandatoryChars.push(getRandomChar(symbolChars));
  }

  if (charset.length === 0) {
    charset = lowerChars + numberChars;
  }

  const prefix = options.prefix || '';
  const remainingLength = Math.max(0, options.length - prefix.length - mandatoryChars.length);
  const randomChars: string[] = [];

  const array = new Uint32Array(remainingLength);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < remainingLength; i++) {
    randomChars.push(charset[array[i] % charset.length]);
  }

  // Shuffle mandatory + random chars
  const combined = [...mandatoryChars, ...randomChars];
  for (let i = combined.length - 1; i > 0; i--) {
    const r = new Uint32Array(1);
    window.crypto.getRandomValues(r);
    const j = r[0] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return prefix + combined.join('');
}

// Generate API token preset
export function generateApiKeyPreset(type: 'openai' | 'gemini' | 'uuid' | 'hex' | 'bearer'): string {
  if (type === 'openai') {
    return (
      'sk-proj-' +
      generateSecurePassword({
        length: 48,
        useUpper: true,
        useLower: true,
        useNumbers: true,
        useSymbols: false,
        avoidAmbiguous: false,
      })
    );
  }
  if (type === 'gemini') {
    return (
      'AIzaSy' +
      generateSecurePassword({
        length: 33,
        useUpper: true,
        useLower: true,
        useNumbers: true,
        useSymbols: false,
        avoidAmbiguous: false,
      })
    );
  }
  if (type === 'uuid') {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: string) => {
      const cryptoVal = window.crypto.getRandomValues(new Uint8Array(1))[0];
      return (Number(c) ^ (cryptoVal & (15 >> (Number(c) / 4)))).toString(16);
    });
  }
  if (type === 'hex') {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Bearer token
  return generateSecurePassword({
    length: 32,
    useUpper: true,
    useLower: true,
    useNumbers: true,
    useSymbols: false,
    avoidAmbiguous: false,
  });
}
