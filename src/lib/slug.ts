/** « 3 contre 2 + 1 · Demi-terrain » → « 3-contre-2-plus-1-demi-terrain » */
export function slugify(input: string): string {
  const s = input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
  return s || "exercice";
}

/** Variante suivante d'un slug déjà pris : « x » → « x-2 » → « x-3 ». */
export function nextSlug(slug: string): string {
  const m = slug.match(/^(.*)-(\d+)$/);
  return m ? `${m[1]}-${Number(m[2]) + 1}` : `${slug}-2`;
}
