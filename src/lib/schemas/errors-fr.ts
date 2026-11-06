import { z } from "zod";

/** Messages d'erreur Zod en français (affichés tels quels dans les formulaires). */
export const frenchErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined" || issue.received === "null") return { message: "Champ obligatoire" };
      if (issue.expected === "number" || issue.expected === "integer") return { message: issue.received === "nan" ? "Nombre attendu" : "Nombre entier attendu" };
      return { message: "Valeur invalide" };
    case z.ZodIssueCode.too_small:
      if (issue.type === "string") return { message: issue.minimum === 1 ? "Champ obligatoire" : `Au moins ${issue.minimum} caractères` };
      if (issue.type === "array") return { message: `Au moins ${issue.minimum} élément(s)` };
      if (issue.type === "number") return { message: `Minimum ${issue.minimum}` };
      break;
    case z.ZodIssueCode.too_big:
      if (issue.type === "string") return { message: `${issue.maximum} caractères maximum` };
      if (issue.type === "array") return { message: `${issue.maximum} élément(s) maximum` };
      if (issue.type === "number") return { message: `Maximum ${issue.maximum}` };
      break;
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `Valeur attendue : ${issue.options.join(", ")}` };
    case z.ZodIssueCode.invalid_string:
      return { message: "Format invalide" };
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(frenchErrorMap);
