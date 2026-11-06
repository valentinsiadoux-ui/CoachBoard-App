import { z } from "zod";

/**
 * Messages d'erreur en français, affichés tels quels dans les formulaires.
 * Base : la traduction française fournie par Zod ; par-dessus, des formulations
 * plus courtes pour les cas courants.
 */
z.config(z.locales.fr());
z.config({
  customError: (issue) => {
    switch (issue.code) {
      case "invalid_type":
        if (issue.input === undefined || issue.input === null) return "Champ obligatoire";
        if (issue.expected === "number" || issue.expected === "int") {
          return typeof issue.input === "number" && !Number.isNaN(issue.input) ? "Nombre entier attendu" : "Nombre attendu";
        }
        return "Valeur invalide";
      case "too_small":
        if (issue.origin === "string") return Number(issue.minimum) === 1 ? "Champ obligatoire" : `Au moins ${issue.minimum} caractères`;
        if (issue.origin === "array") return `Au moins ${issue.minimum} élément(s)`;
        if (issue.origin === "number") return `Minimum ${issue.minimum}`;
        return undefined;
      case "too_big":
        if (issue.origin === "string") return `${issue.maximum} caractères maximum`;
        if (issue.origin === "array") return `${issue.maximum} élément(s) maximum`;
        if (issue.origin === "number") return `Maximum ${issue.maximum}`;
        return undefined;
      case "invalid_value":
        return `Valeur attendue : ${issue.values.map(String).join(", ")}`;
      case "invalid_format":
        return "Format invalide";
      default:
        return undefined; // traduction française de Zod
    }
  },
});
