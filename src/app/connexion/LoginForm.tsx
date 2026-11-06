"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <p role="status" className="rounded-xl bg-brand-soft p-4 text-brand-deep">
        Lien envoyé à <strong>{state.email}</strong>. Ouvrez-le depuis ce navigateur pour vous connecter.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="suite" value={next} />
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">Adresse e-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={state.email}
          aria-invalid={state.status === "error"} aria-describedby={state.status === "error" ? "email-error" : undefined}
          className="w-full rounded-lg border border-ink/20 px-3 py-2" />
        {state.status === "error" && <p id="email-error" className="mt-1 text-sm text-warn">{state.message}</p>}
      </div>
      <button disabled={pending} className="w-full rounded-lg bg-ink px-4 py-2 font-semibold text-white disabled:opacity-60">
        {pending ? "Envoi…" : "Recevoir un lien de connexion"}
      </button>
    </form>
  );
}
