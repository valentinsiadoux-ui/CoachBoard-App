import type { CourtType } from "@/lib/schemas";
import { COLORS } from "@/lib/court/tokens";
import { FIBA, threeCornerY } from "@/lib/court/fiba";

const stroke = { stroke: COLORS.courtLine, strokeWidth: 2 } as const;
const W = FIBA.width;
const L = FIBA.halfLength;
const cx = W / 2;

/** Tracé du terrain (cotes FIBA, 30 unités = 1 m). */
export function CourtLines({ court }: { court: CourtType }) {
  return court === "half" ? <HalfCourt /> : <FullCourt />;
}

function HalfCourt() {
  return (
    <g>
      <rect x={1} y={1} width={W - 2} height={L - 2} fill={COLORS.courtFill} {...stroke} />
      <Markings />
      {/* demi-cercle central sur la ligne médiane */}
      <path d={`M${cx - FIBA.centerRadius},${L - 1} A${FIBA.centerRadius},${FIBA.centerRadius} 0 0 1 ${cx + FIBA.centerRadius},${L - 1}`} fill="none" {...stroke} />
    </g>
  );
}

function FullCourt() {
  const len = L * 2;
  return (
    <g>
      <rect x={1} y={1} width={len - 2} height={W - 2} fill={COLORS.courtFill} {...stroke} />
      <line x1={L} y1={1} x2={L} y2={W - 1} {...stroke} />
      <circle cx={L} cy={W / 2} r={FIBA.centerRadius} fill="none" {...stroke} />
      {/* demi-terrain gauche : (x, y) → (y, x) */}
      <g transform="matrix(0 1 1 0 0 0)"><Markings /></g>
      {/* demi-terrain droit : (x, y) → (len − y, x) */}
      <g transform={`matrix(0 1 -1 0 ${len} 0)`}><Markings /></g>
    </g>
  );
}

/** Raquette, lancer franc, arc à 3 points, zone de non-charge, panneau et cercle — repère demi-terrain. */
function Markings() {
  const kx1 = cx - FIBA.keyHalfWidth;
  const ft = FIBA.ftRadius;
  const by = FIBA.basketY;
  const nc = FIBA.noChargeRadius;
  const tr = FIBA.threeRadius;
  const cy = threeCornerY;
  return (
    <g>
      <rect x={kx1} y={1} width={FIBA.keyHalfWidth * 2} height={FIBA.keyLength - 1} fill={COLORS.keyFill} {...stroke} />
      {/* cercle de lancer franc : plein hors raquette, pointillé dedans */}
      <path d={`M${cx - ft},${FIBA.keyLength} A${ft},${ft} 0 0 0 ${cx + ft},${FIBA.keyLength}`} fill="none" {...stroke} />
      <path d={`M${cx - ft},${FIBA.keyLength} A${ft},${ft} 0 0 1 ${cx + ft},${FIBA.keyLength}`} fill="none" {...stroke} strokeDasharray="6 5" />
      {/* ligne à 3 points */}
      <path
        d={`M${FIBA.threeCornerX},1 L${FIBA.threeCornerX},${cy} A${tr},${tr} 0 0 0 ${W - FIBA.threeCornerX},${cy} L${W - FIBA.threeCornerX},1`}
        fill="none"
        {...stroke}
      />
      {/* zone de non-charge */}
      <path d={`M${cx - nc},${FIBA.backboardY} L${cx - nc},${by} A${nc},${nc} 0 0 0 ${cx + nc},${by} L${cx + nc},${FIBA.backboardY}`} fill="none" {...stroke} />
      {/* panneau et cercle */}
      <line x1={cx - FIBA.backboardHalfWidth} y1={FIBA.backboardY} x2={cx + FIBA.backboardHalfWidth} y2={FIBA.backboardY} stroke={COLORS.ink} strokeWidth={3} />
      <line x1={cx} y1={FIBA.backboardY} x2={cx} y2={by - FIBA.rimRadius} stroke={COLORS.ink} strokeWidth={2} />
      <circle cx={cx} cy={by} r={FIBA.rimRadius} fill="none" stroke={COLORS.ball} strokeWidth={2} />
    </g>
  );
}
