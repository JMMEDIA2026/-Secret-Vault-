// 7-Color Rainbow Palette Definition for Clean Light Theme
export interface NeonColorDef {
  id: string;
  nameKo: string;
  hex: string;
  glow: string;
  badge: string;
  btn: string;
  text: string;
  border: string;
  lightBg: string;
}

export const NEON_7_COLORS: NeonColorDef[] = [
  {
    id: 'red',
    nameKo: '레드 (Red)',
    hex: '#e11d48',
    glow: 'rgba(225, 29, 72, 0.2)',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    btn: 'bg-rose-600 text-white hover:bg-rose-700',
    text: 'text-rose-600',
    border: 'border-rose-300 hover:border-rose-400',
    lightBg: 'bg-rose-50',
  },
  {
    id: 'orange',
    nameKo: '오렌지 (Orange)',
    hex: '#ea580c',
    glow: 'rgba(234, 88, 12, 0.2)',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    btn: 'bg-orange-600 text-white hover:bg-orange-700',
    text: 'text-orange-600',
    border: 'border-orange-300 hover:border-orange-400',
    lightBg: 'bg-orange-50',
  },
  {
    id: 'yellow',
    nameKo: '옐로우 (Yellow)',
    hex: '#d97706',
    glow: 'rgba(217, 119, 6, 0.2)',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    btn: 'bg-amber-600 text-white hover:bg-amber-700',
    text: 'text-amber-700',
    border: 'border-amber-300 hover:border-amber-400',
    lightBg: 'bg-amber-50',
  },
  {
    id: 'green',
    nameKo: '그린 (Green)',
    hex: '#059669',
    glow: 'rgba(5, 150, 105, 0.2)',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    btn: 'bg-emerald-600 text-white hover:bg-emerald-700',
    text: 'text-emerald-700',
    border: 'border-emerald-300 hover:border-emerald-400',
    lightBg: 'bg-emerald-50',
  },
  {
    id: 'cyan',
    nameKo: '스카이 블루 (Sky Blue)',
    hex: '#0284c7',
    glow: 'rgba(2, 132, 199, 0.2)',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    btn: 'bg-sky-600 text-white hover:bg-sky-700',
    text: 'text-sky-600',
    border: 'border-sky-300 hover:border-sky-400',
    lightBg: 'bg-sky-50',
  },
  {
    id: 'indigo',
    nameKo: '인디고 블루 (Indigo)',
    hex: '#4f46e5',
    glow: 'rgba(79, 70, 229, 0.2)',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    btn: 'bg-indigo-600 text-white hover:bg-indigo-700',
    text: 'text-indigo-600',
    border: 'border-indigo-300 hover:border-indigo-400',
    lightBg: 'bg-indigo-50',
  },
  {
    id: 'purple',
    nameKo: '퍼플 (Purple)',
    hex: '#9333ea',
    glow: 'rgba(147, 51, 234, 0.2)',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    btn: 'bg-purple-600 text-white hover:bg-purple-700',
    text: 'text-purple-600',
    border: 'border-purple-300 hover:border-purple-400',
    lightBg: 'bg-purple-50',
  },
];

/**
 * Deterministically maps any tag string to one of the 7 neon colors
 */
export function getTagNeonStyle(tag: string): NeonColorDef {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash << 5) - hash + tag.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % NEON_7_COLORS.length;
  return NEON_7_COLORS[index];
}

/**
 * Get neon color definition by color ID, defaults to cyan
 */
export function getNeonColorById(colorId?: string): NeonColorDef {
  if (!colorId) return NEON_7_COLORS[4]; // cyan default
  const found = NEON_7_COLORS.find((c) => c.id === colorId);
  return found || NEON_7_COLORS[4];
}
