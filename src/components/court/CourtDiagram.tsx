import { useId } from "react";
import type { CourtType, DiagramAction, DiagramElement, DiagramFrame } from "@/lib/schemas";
import { COURT, polyline, toSvg, trimEnd, zigzag } from "@/lib/court/geometry";
import { COLORS } from "@/lib/court/tokens";
import { CourtLines } from "./CourtLines";

type Props = { court: CourtType; frame: DiagramFrame; className?: string };

export function CourtDiagram({ court, frame, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const { width, height } = COURT[court];
  const r = court === "full" ? 17 : 14;
  const arrowId = (c: string) => `arrow-${uid}-${c}`;

  const strokeColor = (a: DiagramAction): string => {
    if (a.type === "shot") return COLORS.shot;
    if (a.type === "pass") return COLORS.pass;
    return a.actor === "attacker" ? COLORS.run : COLORS.runDark;
  };

  const arrowColors = Array.from(new Set(frame.actions.map(strokeColor)));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`${frame.title} : ${frame.caption}`}
    >
      <defs>
        {arrowColors.map((c) => (
          <marker key={c} id={arrowId(c.slice(1))} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={c} />
          </marker>
        ))}
      </defs>

      <CourtLines court={court} />

      {frame.ghosts.map((g, i) => {
        const s = toSvg(court, g);
        return <circle key={`g${i}`} cx={s.x} cy={s.y} r={r} fill="none" stroke={COLORS.run} strokeWidth={2} strokeDasharray="4 4" />;
      })}

      {frame.actions.map((a, i) => {
        const color = strokeColor(a);
        const pts = trimEnd(court, a.points, r + 2);
        const common = { fill: "none", stroke: color, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round", markerEnd: `url(#${arrowId(color.slice(1))})` } as const;
        if (a.type === "dribble") return <polyline key={i} points={zigzag(court, pts)} {...common} />;
        if (a.type === "pass") return <polyline key={i} points={polyline(court, pts)} {...common} strokeDasharray="9 6" />;
        if (a.type === "shot") return <polyline key={i} points={polyline(court, pts)} {...common} strokeDasharray="2 6" />;
        return <polyline key={i} points={polyline(court, pts)} {...common} />;
      })}

      {frame.elements.map((el) => (
        <Marker key={el.id} court={court} el={el} r={r} />
      ))}
    </svg>
  );
}

function Marker({ court, el, r }: { court: CourtType; el: DiagramElement; r: number }) {
  const { x, y } = toSvg(court, el.at);
  if (el.kind === "cone") {
    return <path d={`M${x},${y - r * 0.8} L${x + r * 0.7},${y + r * 0.6} L${x - r * 0.7},${y + r * 0.6} z`} fill={COLORS.ball} />;
  }
  const label = el.label ?? (el.kind === "defender" ? "X" : el.kind === "plus_one" ? "+1" : "");
  const fill = el.kind === "attacker" ? COLORS.attacker : el.kind === "defender" ? COLORS.defender : COLORS.plusOne;
  const textFill = el.kind === "plus_one" ? COLORS.ink : "#fff";
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} stroke={el.kind === "plus_one" ? COLORS.ink : "none"} strokeWidth={1.5} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={el.kind === "plus_one" ? r * 0.85 : r * 1.1} fontWeight={700} fill={textFill} fontFamily="var(--font-display), sans-serif">
        {label}
      </text>
      {el.hasBall && <circle cx={x + r * 0.9} cy={y - r * 0.9} r={r * 0.38} fill={COLORS.ball} stroke="#fff" strokeWidth={1} />}
    </g>
  );
}
