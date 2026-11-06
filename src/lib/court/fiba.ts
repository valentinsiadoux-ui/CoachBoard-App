/**
 * Cotes FIBA en unités SVG (30 unités = 1 m), exprimées pour UN demi-terrain :
 * x = largeur (0 → 450), y = distance à la ligne de fond (0 → 420).
 */
export const M = 30;

export const FIBA = {
  width: 15 * M,
  halfLength: 14 * M,
  basketY: 1.575 * M,
  rimRadius: 0.225 * M,
  backboardY: 1.2 * M,
  backboardHalfWidth: 0.9 * M,
  keyHalfWidth: 2.45 * M,
  keyLength: 5.8 * M,
  ftRadius: 1.8 * M,
  threeRadius: 6.75 * M,
  threeCornerX: 0.9 * M,
  noChargeRadius: 1.25 * M,
  centerRadius: 1.8 * M,
} as const;

/** Ordonnée où la ligne droite des corners rejoint l'arc à 3 points. */
export const threeCornerY =
  FIBA.basketY + Math.sqrt(FIBA.threeRadius ** 2 - (FIBA.width / 2 - FIBA.threeCornerX) ** 2);
