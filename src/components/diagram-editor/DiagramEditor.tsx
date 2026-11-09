"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { DiagramAction, ElementKind, Point } from "@/lib/schemas";
import { COURT, MARKER_RADIUS, polyline, toSvg } from "@/lib/court/geometry";
import { COLORS } from "@/lib/court/tokens";
import { lintFrame, svgDistance } from "@/lib/diagram/lint";
import {
  addAction, addElement, addGhost, clampPoint, continueFrame, insertFrame, moveFrame, removeAction, removeElement,
  removeFrame, removeGhost, replaceFrame, shotFrom, snapToElement, updateElement,
  type EditorDiagram, type EditorFrame,
} from "@/lib/diagram/ops";
import { CourtDiagram } from "@/components/court/CourtDiagram";

type LineTool = "run" | "dribble" | "pass";
type Tool = "select" | ElementKind | LineTool | "shot" | "ghost";
type Selection = { type: "element"; id: string } | { type: "action"; index: number } | { type: "ghost"; index: number } | null;
type Drawing = { type: LineTool; actor: DiagramAction["actor"]; points: Point[] } | null;

const TOOLS: { id: Tool; label: string; help: string; icon: string }[] = [
  { id: "select", label: "Sélection", icon: "↖", help: "Cliquez sur un élément pour le sélectionner, faites-le glisser pour le déplacer (flèches du clavier : réglage fin)." },
  { id: "attacker", label: "Attaquant", icon: "●", help: "Cliquez sur le terrain pour placer un attaquant (numéroté automatiquement)." },
  { id: "defender", label: "Défenseur", icon: "✕", help: "Cliquez sur le terrain pour placer un défenseur." },
  { id: "plus_one", label: "+1", icon: "◍", help: "Cliquez sur le terrain pour placer le joueur +1." },
  { id: "cone", label: "Cône", icon: "▲", help: "Cliquez sur le terrain pour placer un cône." },
  { id: "run", label: "Course", icon: "→", help: "Cliquez au départ (sur un joueur), ajoutez des points, double-cliquez (ou Entrée) pour terminer." },
  { id: "dribble", label: "Dribble", icon: "⌇", help: "Cliquez sur le porteur, ajoutez des points, double-cliquez (ou Entrée) pour terminer." },
  { id: "pass", label: "Passe", icon: "⇢", help: "Cliquez sur le passeur puis sur le receveur, double-cliquez (ou Entrée) pour terminer." },
  { id: "shot", label: "Tir", icon: "◎", help: "Cliquez sur le tireur : la flèche part vers le panier." },
  { id: "ghost", label: "Position de départ", icon: "◌", help: "Cliquez pour marquer une position de départ en pointillés." },
];

const LINE_TOOLS: Tool[] = ["run", "dribble", "pass"];
const ACTION_LABELS: Record<DiagramAction["type"], string> = { run: "Course", dribble: "Dribble", pass: "Passe", shot: "Tir" };
const ACTOR_LABELS: Record<DiagramAction["actor"], string> = { attacker: "Attaquant", defender: "Défenseur", plus_one: "+1" };
const KIND_LABELS: Record<ElementKind, string> = { attacker: "Attaquant", defender: "Défenseur", plus_one: "+1", cone: "Cône" };
const HISTORY_LIMIT = 100;

const btn = "rounded-md border border-ink/20 px-2 py-1 text-xs font-medium hover:border-ink disabled:opacity-40";
const field = "w-full rounded-md border border-ink/20 px-2 py-1 text-sm";

export function DiagramEditor({ value, onChange }: { value: EditorDiagram; onChange: (d: EditorDiagram) => void }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [tool, setTool] = useState<Tool>("select");
  const [selection, setSelection] = useState<Selection>(null);
  const [drawing, setDrawing] = useState<Drawing>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const past = useRef<EditorDiagram[]>([]);
  const future = useRef<EditorDiagram[]>([]);
  const dragging = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [, forceRender] = useState(0);

  const court = value.court;
  const { width, height } = COURT[court];
  const r = MARKER_RADIUS[court];
  const fi = Math.min(frameIndex, value.frames.length - 1);
  const frame = value.frames[fi]!;

  /** Applique une modification en l'ajoutant à l'historique (annulable). */
  const commit = useCallback((next: EditorDiagram) => {
    past.current = [...past.current, value].slice(-HISTORY_LIMIT);
    future.current = [];
    onChange(next);
  }, [onChange, value]);
  const commitFrame = (f: EditorFrame) => commit(replaceFrame(value, fi, f));
  /** Saisie de texte : une seule étape d'historique par champ (enregistrée à la prise de focus). */
  const snapshot = () => {
    past.current = [...past.current, value].slice(-HISTORY_LIMIT);
    future.current = [];
  };
  const liveFrame = (f: EditorFrame) => onChange(replaceFrame(value, fi, f));

  const undo = () => {
    const prev = past.current.at(-1);
    if (!prev) return;
    past.current = past.current.slice(0, -1);
    future.current = [value, ...future.current];
    setSelection(null);
    onChange(prev);
    forceRender((n) => n + 1);
  };
  const redo = () => {
    const [next, ...rest] = future.current;
    if (!next) return;
    future.current = rest;
    past.current = [...past.current, value];
    setSelection(null);
    onChange(next);
    forceRender((n) => n + 1);
  };

  // Changer de vignette ou d'outil annule le tracé en cours.
  useEffect(() => { setDrawing(null); }, [fi, tool]);

  const toPoint = (e: { clientX: number; clientY: number }): Point => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return clampPoint({ x: p.x / width, y: p.y / height });
  };

  const finishDrawing = () => {
    if (!drawing) return;
    // Supprime les points doublés par le double-clic.
    const pts = drawing.points.filter((p, i, a) => i === 0 || svgDistance(court, p, a[i - 1]!) > 4);
    if (pts.length >= 2) commitFrame(addAction(frame, { type: drawing.type, actor: drawing.actor, points: pts }));
    setDrawing(null);
  };

  /** Clic sur le terrain (ou sur un pion avec un outil de tracé). */
  const onCanvasDown = (e: PointerEvent<SVGSVGElement>) => {
    const p = toPoint(e);
    const snapped = snapToElement(court, frame, p);
    if (tool === "select") {
      setSelection(null);
      return;
    }
    if (tool === "attacker" || tool === "defender" || tool === "plus_one" || tool === "cone") {
      const res = addElement(frame, tool, p);
      commitFrame(res.frame);
      setSelection({ type: "element", id: res.id });
      return;
    }
    if (tool === "ghost") {
      commitFrame(addGhost(frame, p));
      return;
    }
    if (tool === "shot") {
      const actor = snapped && snapped.kind !== "cone" ? snapped.kind : "attacker";
      commitFrame(addAction(frame, shotFrom(court, snapped?.at ?? p, actor)));
      return;
    }
    // Outils de tracé
    const at = snapped?.at ?? p;
    if (!drawing) {
      const actor = snapped && snapped.kind !== "cone" ? snapped.kind : "attacker";
      setDrawing({ type: tool as LineTool, actor, points: [at] });
    } else {
      setDrawing({ ...drawing, points: [...drawing.points, at] });
    }
  };

  const onElementDown = (e: PointerEvent, id: string) => {
    if (LINE_TOOLS.includes(tool) || tool === "shot") return; // laissé au terrain (aimantation)
    e.stopPropagation();
    setSelection({ type: "element", id });
    dragging.current = id;
    past.current = [...past.current, value].slice(-HISTORY_LIMIT);
    future.current = [];
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const p = toPoint(e);
    if (dragging.current) {
      onChange(replaceFrame(value, fi, updateElement(frame, dragging.current, { at: p })));
    } else if (drawing) {
      setCursor(snapToElement(court, frame, p)?.at ?? p);
    }
  };

  const onUp = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging.current) {
      dragging.current = null;
      svgRef.current?.releasePointerCapture(e.pointerId);
    }
  };

  const deleteSelection = () => {
    if (!selection) return;
    if (selection.type === "element") commitFrame(removeElement(frame, selection.id));
    if (selection.type === "action") commitFrame(removeAction(frame, selection.index));
    if (selection.type === "ghost") commitFrame(removeGhost(frame, selection.index));
    setSelection(null);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
    if (e.key === "Escape") { setDrawing(null); setSelection(null); return; }
    if (e.key === "Enter" && drawing) { e.preventDefault(); finishDrawing(); return; }
    if ((e.key === "Delete" || e.key === "Backspace") && selection) { e.preventDefault(); deleteSelection(); return; }
    if (selection?.type === "element" && e.key.startsWith("Arrow")) {
      e.preventDefault();
      const el = frame.elements.find((x) => x.id === selection.id);
      if (!el) return;
      const step = e.shiftKey ? 0.05 : 0.01;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key] ?? [0, 0];
      commitFrame(updateElement(frame, el.id, { at: { x: el.at.x + d[0]!, y: el.at.y + d[1]! } }));
    }
  };

  const selectedEl = selection?.type === "element" ? frame.elements.find((x) => x.id === selection.id) : undefined;
  const selectedAction = selection?.type === "action" ? frame.actions[selection.index] : undefined;
  const warnings = lintFrame(court, frame, fi);
  const flagged = new Set(warnings.flatMap((w) => w.elementIds ?? []));
  const currentTool = TOOLS.find((t) => t.id === tool)!;

  return (
    <div className="space-y-3">
      {/* Vignettes */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Vignettes du schéma">
        {value.frames.map((f, i) => (
          <button key={i} type="button" role="tab" aria-selected={i === fi} onClick={() => { setFrameIndex(i); setSelection(null); }}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm ${i === fi ? "border-ink bg-ink text-white" : "border-ink/20 hover:border-ink"}`}>
            <span className={`grid size-5 place-items-center rounded text-xs ${i === fi ? "bg-brand text-ink" : "bg-brand/80 text-white"}`}>{i + 1}</span>
            {f.title || "Sans titre"}
          </button>
        ))}
        <button type="button" className={btn} onClick={() => { commit(insertFrame(value, fi, continueFrame(frame, value.frames.length + 1))); setFrameIndex(fi + 1); }}
          disabled={value.frames.length >= 6} title="Nouvelle vignette reprenant les positions de celle-ci">+ Vignette suivante</button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
        <div className="space-y-2">
          {/* Palette */}
          <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Outils">
            {TOOLS.map((t) => (
              <button key={t.id} type="button" onClick={() => { setTool(t.id); if (t.id !== "select") setSelection(null); }}
                aria-pressed={tool === t.id} title={t.help}
                className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${tool === t.id ? "border-ink bg-ink text-white" : "border-ink/20 hover:border-ink"}`}>
                <span aria-hidden="true">{t.icon}</span>{t.label}
              </button>
            ))}
            <span className="mx-1 w-px bg-ink/15" />
            <button type="button" className={btn} onClick={undo} disabled={!past.current.length} title="Annuler (Ctrl+Z)">↶ Annuler</button>
            <button type="button" className={btn} onClick={redo} disabled={!future.current.length} title="Rétablir (Ctrl+Maj+Z)">↷ Rétablir</button>
          </div>
          <p className="text-xs text-muted" aria-live="polite">
            {drawing ? `Tracé en cours (${drawing.points.length} point${drawing.points.length > 1 ? "s" : ""}) : double-cliquez ou Entrée pour terminer, Échap pour annuler.` : currentTool.help}
          </p>

          {/* Terrain : rendu identique à la fiche + calque interactif */}
          <div tabIndex={0} onKeyDown={onKeyDown} aria-label="Terrain : zone d’édition du schéma"
            className={`relative mx-auto rounded-lg bg-panel p-2 outline-offset-2 ${court === "half" ? "max-w-md" : ""}`}>
            <div className="relative">
              <CourtDiagram court={court} frame={{ ...frame, title: frame.title || "Vignette", caption: frame.caption || "" }} className="block w-full" />
              <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full touch-none"
                style={{ cursor: tool === "select" ? "default" : "crosshair" }}
                onPointerDown={onCanvasDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => setCursor(null)}
                onDoubleClick={(e) => { e.preventDefault(); finishDrawing(); }}>
                <rect width={width} height={height} fill="transparent" />
                {frame.ghosts.map((g, i) => {
                  const s = toSvg(court, g);
                  const sel = selection?.type === "ghost" && selection.index === i;
                  return (
                    <circle key={`g${i}`} cx={s.x} cy={s.y} r={r * 1.1} fill="transparent" stroke={sel ? COLORS.ink : "none"} strokeDasharray="3 3"
                      onPointerDown={(e) => { if (tool !== "select") return; e.stopPropagation(); setSelection({ type: "ghost", index: i }); }} />
                  );
                })}
                {frame.actions.map((a, i) => {
                  const sel = selection?.type === "action" && selection.index === i;
                  return (
                    <polyline key={`a${i}`} points={polyline(court, a.points)} fill="none" strokeLinecap="round" strokeLinejoin="round"
                      stroke={sel ? "rgba(37,99,235,0.45)" : "transparent"} strokeWidth={14}
                      style={{ cursor: tool === "select" ? "pointer" : undefined }}
                      onPointerDown={(e) => { if (tool !== "select") return; e.stopPropagation(); setSelection({ type: "action", index: i }); }} />
                  );
                })}
                {frame.elements.map((el) => {
                  const s = toSvg(court, el.at);
                  const sel = selectedEl?.id === el.id;
                  return (
                    <g key={el.id}>
                      {flagged.has(el.id) && <circle cx={s.x} cy={s.y} r={r + 4} fill="none" stroke={COLORS.shot} strokeWidth={2} />}
                      {sel && <circle cx={s.x} cy={s.y} r={r + 6} fill="none" stroke="#2563EB" strokeWidth={2.5} strokeDasharray="5 3" />}
                      <circle cx={s.x} cy={s.y} r={r * 1.2} fill="transparent" style={{ cursor: LINE_TOOLS.includes(tool) || tool === "shot" ? "crosshair" : "grab" }}
                        onPointerDown={(e) => onElementDown(e, el.id)}>
                        <title>{`${KIND_LABELS[el.kind]} ${el.label ?? ""}`.trim()}</title>
                      </circle>
                    </g>
                  );
                })}
                {drawing && (
                  <polyline points={polyline(court, cursor ? [...drawing.points, cursor] : drawing.points)} fill="none"
                    stroke="#2563EB" strokeWidth={3} strokeDasharray="6 4" pointerEvents="none" />
                )}
              </svg>
            </div>
          </div>
          {drawing && (
            <div className="flex gap-2">
              <button type="button" className={btn} onClick={finishDrawing} disabled={drawing.points.length < 2}>Terminer le tracé</button>
              <button type="button" className={btn} onClick={() => setDrawing(null)}>Annuler le tracé</button>
            </div>
          )}
          {warnings.length > 0 && (
            <ul className="space-y-1 text-xs text-warn" aria-live="polite">
              {warnings.map((w, i) => <li key={i}>⚠ {w.message}</li>)}
            </ul>
          )}
        </div>

        {/* Panneau latéral : vignette et sélection */}
        <div className="space-y-4 text-sm">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs font-medium uppercase tracking-widest text-muted">Vignette {fi + 1}</legend>
            <label className="block">Titre<input className={field} maxLength={40} value={frame.title} onFocus={snapshot} onChange={(e) => liveFrame({ ...frame, title: e.target.value })} /></label>
            <label className="block">Légende<textarea className={field} rows={2} maxLength={200} value={frame.caption} onFocus={snapshot} onChange={(e) => liveFrame({ ...frame, caption: e.target.value })} /></label>
            <label className="block">Étiquette (fiche de séance)<input className={field} maxLength={10} placeholder="ex. Passe" value={frame.tag ?? ""} onFocus={snapshot} onChange={(e) => liveFrame({ ...frame, tag: e.target.value || undefined })} /></label>
            <div className="flex flex-wrap gap-1">
              <button type="button" className={btn} onClick={() => { commit(moveFrame(value, fi, -1)); setFrameIndex(fi - 1); }} disabled={fi === 0}>← Déplacer</button>
              <button type="button" className={btn} onClick={() => { commit(moveFrame(value, fi, 1)); setFrameIndex(fi + 1); }} disabled={fi === value.frames.length - 1}>Déplacer →</button>
              <button type="button" className={btn} onClick={() => { commit(insertFrame(value, fi, { ...frame, title: `${frame.title} (copie)`.slice(0, 40) })); setFrameIndex(fi + 1); }} disabled={value.frames.length >= 6}>Dupliquer</button>
              <button type="button" className={`${btn} text-warn`} onClick={() => { commit(removeFrame(value, fi)); setFrameIndex(Math.max(0, fi - 1)); setSelection(null); }} disabled={value.frames.length <= 1}>Supprimer</button>
            </div>
          </fieldset>

          {selectedEl && (
            <fieldset className="space-y-2 rounded-lg border border-ink/10 p-3">
              <legend className="px-1 text-xs font-medium uppercase tracking-widest text-muted">{KIND_LABELS[selectedEl.kind]}</legend>
              {selectedEl.kind !== "cone" && (
                <label className="block">Libellé<input className={field} maxLength={3} value={selectedEl.label ?? ""} onFocus={snapshot}
                  onChange={(e) => liveFrame(updateElement(frame, selectedEl.id, { label: e.target.value || undefined }))} /></label>
              )}
              {selectedEl.kind !== "cone" && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedEl.hasBall} onChange={(e) => commitFrame(updateElement(frame, selectedEl.id, { hasBall: e.target.checked }))} />
                  Porteur de balle
                </label>
              )}
              <button type="button" className={`${btn} text-warn`} onClick={deleteSelection}>Supprimer</button>
            </fieldset>
          )}
          {selectedAction && selection?.type === "action" && (
            <fieldset className="space-y-2 rounded-lg border border-ink/10 p-3">
              <legend className="px-1 text-xs font-medium uppercase tracking-widest text-muted">Action</legend>
              <label className="block">Type
                <select className={field} value={selectedAction.type}
                  onChange={(e) => {
                    const type = e.target.value as DiagramAction["type"];
                    const next = type === "shot" ? shotFrom(court, selectedAction.points[0]!, selectedAction.actor) : { ...selectedAction, type };
                    commitFrame({ ...frame, actions: frame.actions.map((a, i) => (i === selection.index ? next : a)) });
                  }}>
                  {Object.entries(ACTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="block">Joueur
                <select className={field} value={selectedAction.actor}
                  onChange={(e) => commitFrame({ ...frame, actions: frame.actions.map((a, i) => (i === selection.index ? { ...a, actor: e.target.value as DiagramAction["actor"] } : a)) })}>
                  {Object.entries(ACTOR_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <button type="button" className={`${btn} text-warn`} onClick={deleteSelection}>Supprimer</button>
            </fieldset>
          )}
          {selection?.type === "ghost" && (
            <fieldset className="space-y-2 rounded-lg border border-ink/10 p-3">
              <legend className="px-1 text-xs font-medium uppercase tracking-widest text-muted">Position de départ</legend>
              <button type="button" className={`${btn} text-warn`} onClick={deleteSelection}>Supprimer</button>
            </fieldset>
          )}
          <p className="text-xs text-muted">Raccourcis : Suppr pour effacer, flèches pour ajuster, Ctrl+Z pour annuler.</p>
        </div>
      </div>
    </div>
  );
}
