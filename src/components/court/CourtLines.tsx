import type { CourtType } from "@/lib/schemas";
import { COLORS } from "@/lib/court/tokens";

const line = { fill: "none", stroke: COLORS.courtLine, strokeWidth: 2 } as const;

/** Tracé du terrain (cotes FIBA, 30 unités = 1 m). */
export function CourtLines({ court }: { court: CourtType }) {
  return court === "half" ? <HalfCourt /> : <FullCourt />;
}

function HalfCourt() {
  // Largeur 450, hauteur 420. Panier en (225, 47).
  return (
    <g>
      <rect x={1} y={1} width={448} height={418} fill={COLORS.courtFill} {...line} />
      <rect x={151.5} y={1} width={147} height={174} fill={COLORS.keyFill} {...line} />
      {/* lancer franc */}
      <path d="M171,175 A54,54 0 0 0 279,175" {...line} />
      <path d="M171,175 A54,54 0 0 1 279,175" {...line} strokeDasharray="6 5" />
      {/* arc à 3 points */}
      <path d="M27,1 L27,87 A202,202 0 0 0 423,87 L423,1" {...line} />
      {/* demi-cercle sous le panier */}
      <path d="M195,47 A30,30 0 0 0 255,47" {...line} />
      {/* panneau et cercle */}
      <line x1={202} y1={30} x2={248} y2={30} stroke={COLORS.ink} strokeWidth={3} />
      <circle cx={225} cy={39} r={7} fill="none" stroke={COLORS.ball} strokeWidth={2} />
      {/* cercle central (moitié) */}
      <path d="M171,419 A54,54 0 0 1 279,419" {...line} />
    </g>
  );
}

function FullCourt() {
  // Longueur 840, largeur 450. Paniers en (47,225) et (793,225).
  return (
    <g>
      <rect x={1} y={1} width={838} height={448} fill={COLORS.courtFill} {...line} />
      <line x1={420} y1={1} x2={420} y2={449} {...line} />
      <circle cx={420} cy={225} r={54} {...line} />
      {/* raquettes */}
      <rect x={1} y={151.5} width={174} height={147} fill={COLORS.keyFill} {...line} />
      <rect x={665} y={151.5} width={174} height={147} fill={COLORS.keyFill} {...line} />
      {/* lancers francs */}
      <path d="M175,171 A54,54 0 0 1 175,279" {...line} />
      <path d="M175,171 A54,54 0 0 0 175,279" {...line} strokeDasharray="6 5" />
      <path d="M665,171 A54,54 0 0 0 665,279" {...line} />
      <path d="M665,171 A54,54 0 0 1 665,279" {...line} strokeDasharray="6 5" />
      {/* arcs à 3 points */}
      <path d="M1,27 L87,27 A202,202 0 0 1 87,423 L1,423" {...line} />
      <path d="M839,27 L753,27 A202,202 0 0 0 753,423 L839,423" {...line} />
      {/* paniers */}
      <line x1={30} y1={202} x2={30} y2={248} stroke={COLORS.ink} strokeWidth={3} />
      <circle cx={47} cy={225} r={7} fill="none" stroke={COLORS.ball} strokeWidth={2} />
      <line x1={810} y1={202} x2={810} y2={248} stroke={COLORS.ink} strokeWidth={3} />
      <circle cx={793} cy={225} r={7} fill="none" stroke={COLORS.ball} strokeWidth={2} />
    </g>
  );
}
