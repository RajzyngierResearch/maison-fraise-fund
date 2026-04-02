export const PORTAL_CUT_PERCENT = 20; // Maison Fraise takes 20%

export function calculateCut(amountCents: number): { ownerCents: number; cutCents: number } {
  const cutCents = Math.round(amountCents * (PORTAL_CUT_PERCENT / 100));
  return { ownerCents: amountCents - cutCents, cutCents };
}
