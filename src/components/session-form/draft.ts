import { SessionSchema, type Exercise, type SessionBlock, type SessionInput } from "@/lib/schemas";

/** Phase en cours d'édition : `key` stable pour le glisser-déposer (jamais enregistré). */
export type DraftBlock = SessionInput["blocks"][number] & { key: string; source: "exercise" | "free" };

export type SessionDraft = Omit<SessionInput, "id" | "blocks" | "flagship" | "keyInfo"> & {
  keyInfo: { mainObjective: string; technicalFocus: string; spaceEquipment: string; assistance: string };
  blocks: DraftBlock[];
  flagship: NonNullable<SessionInput["flagship"]>;
};

let seq = 0;
export const newKey = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

export const newBlock = (phase: SessionBlock["phase"], durationMin: number): DraftBlock => ({
  key: newKey(),
  source: "free",
  phase,
  durationMin,
  content: "",
  goal: "",
  isFlagship: false,
});

/** Squelette d'une séance type de 90 minutes, comme la fiche de référence. */
export function newSessionDraft(number: number): SessionDraft {
  return {
    number,
    title: "",
    category: "U15",
    team: "",
    playersCount: 12,
    plannedDurationMin: 90,
    keyInfo: { mainObjective: "", technicalFocus: "", spaceEquipment: "", assistance: "" },
    blocks: [
      newBlock("echauffement", 15),
      newBlock("technique", 20),
      { ...newBlock("situation", 20), source: "exercise", isFlagship: true },
      newBlock("jeu", 25),
      newBlock("retour-calme", 10),
    ],
    globalTip: "",
    flagship: {},
  };
}

export function draftFromSession(s: SessionInput): SessionDraft {
  const { id: _id, ...rest } = s;
  return {
    ...rest,
    keyInfo: {
      mainObjective: s.keyInfo.mainObjective ?? "",
      technicalFocus: s.keyInfo.technicalFocus ?? "",
      spaceEquipment: s.keyInfo.spaceEquipment ?? "",
      assistance: s.keyInfo.assistance ?? "",
    },
    blocks: s.blocks.map((b) => ({ ...b, key: newKey(), source: b.exerciseId ? "exercise" : "free" })),
    flagship: s.flagship ?? {},
  };
}

const opt = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);
const lines = (v: string[] | undefined) => {
  const out = (v ?? []).map((s) => s.trim()).filter(Boolean);
  return out.length ? out : undefined;
};

/** Document envoyé au serveur : sans clés techniques, champs vides retirés. */
export function buildSessionPayload(d: SessionDraft): Record<string, unknown> {
  const f = d.flagship;
  const points = (f.technicalPoints ?? []).filter((p) => p.title.trim() || p.description.trim());
  return {
    ...d,
    team: opt(d.team),
    globalTip: opt(d.globalTip),
    blocks: d.blocks.map(({ key: _k, source, ...b }) => ({
      ...b,
      exerciseId: source === "exercise" ? b.exerciseId || undefined : undefined,
      content: opt(b.content),
      goal: opt(b.goal),
    })),
    flagship: {
      title: opt(f.title),
      titleAccent: opt(f.titleAccent),
      challengeStatement: opt(f.challengeStatement),
      technicalPoints: points.length ? points : undefined,
      rotations: lines(f.rotations),
      accompanimentTip: opt(f.accompanimentTip),
    },
  };
}

export const validateSession = (payload: Record<string, unknown>) => SessionSchema.safeParse({ ...payload, id: "apercu" });

/** Pré-remplit l'adaptation de la situation phare à partir de l'exercice. */
export const flagshipFromExercise = (ex: Exercise): SessionDraft["flagship"] => ({
  title: ex.title,
  titleAccent: ex.titleAccent,
  challengeStatement: ex.challenge.statement,
  technicalPoints: ex.technicalPoints.map((p) => ({ ...p })),
  rotations: ex.steps.map((s) => `${s.title} — ${s.description}`),
});
