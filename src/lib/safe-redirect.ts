/** N'accepte qu'un chemin interne (« /… ») pour éviter les redirections ouvertes. */
export function safeNext(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
