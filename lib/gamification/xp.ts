/**
 * Fase 14 — curva de XP. Espelha `level_for_xp` do SQL:
 * XP necessário para o nível N = 50 · N · (N-1)  (2→100, 3→300, 4→600, 5→1000…).
 */

export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return 50 * n * (n - 1);
}

export function levelFromXp(xp: number): number {
  const x = Math.max(0, xp);
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + x / 12.5)) / 2));
}

export type LevelProgress = {
  level: number;
  xp: number;
  floor: number; // XP no início do nível atual
  ceil: number; // XP para o próximo nível
  into: number; // quanto já andou dentro do nível
  span: number; // tamanho do nível
  pct: number; // 0–100
  toNext: number; // XP faltando para subir
};

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = Math.max(1, ceil - floor);
  const into = Math.max(0, Math.min(span, xp - floor));
  return {
    level,
    xp,
    floor,
    ceil,
    into,
    span,
    pct: Math.round((into / span) * 100),
    toNext: Math.max(0, ceil - xp),
  };
}

/** Quanto de XP cada ação vale (para a UI explicar; o SQL é a fonte da verdade). */
export const XP_VALUES = {
  daily_active: 15,
  content_read: 10,
  content_completed: 15,
  chat: 3,
  questions: 8,
  essay: 40,
  community_post: 12,
  onboarding: 50,
  referral_referrer: 300,
  referral_referred: 150,
} as const;
