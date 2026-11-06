/** Nom de fichier proposé par le navigateur lors de l'export PDF (il reprend le titre du document). */
export function pdfFileName(...parts: (string | number | undefined)[]): string {
  return parts
    .filter((p) => p !== undefined && String(p).trim() !== "")
    .map((p) => String(p).replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim())
    .join(" - ")
    .slice(0, 120);
}
