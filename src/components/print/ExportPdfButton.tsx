"use client";

/**
 * Export PDF par le navigateur : la boîte d'impression propose « Enregistrer au format PDF ».
 * Le titre du document est remplacé le temps de l'impression pour nommer le fichier.
 * Les feuilles de style d'impression mettent chaque fiche sur une page (A4 paysage
 * pour un exercice, A4 portrait pour une séance).
 */
export function ExportPdfButton({ fileName, className, label = "Exporter en PDF" }: { fileName: string; className?: string; label?: string }) {
  const onClick = () => {
    const previous = document.title;
    document.title = fileName;
    window.addEventListener("afterprint", () => { document.title = previous; }, { once: true });
    window.print();
  };
  return (
    <button type="button" onClick={onClick} className={className} title="Choisir « Enregistrer au format PDF » dans la fenêtre d’impression">
      {label}
    </button>
  );
}
