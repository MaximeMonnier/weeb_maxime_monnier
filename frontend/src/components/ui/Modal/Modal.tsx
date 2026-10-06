import React, { useEffect, useId, useRef } from "react";
import { cx } from "../../../lib/cx";

type ModalProps = Omit<
  React.DialogHTMLAttributes<HTMLDialogElement>,
  "open" | "title" | "onClose"
> & {
  open: boolean;
  title: string;
  /** Appelé à chaque fermeture, Échap comprise : le parent y repasse `open` à faux. */
  onClose: () => void;
};

/**
 * Fenêtre modale : titre, bouton « Fermer » et contenu, ouverte tant que `open` est vrai.
 */
export default function Modal({
  open,
  title,
  onClose,
  className,
  children,
  ...props
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Échap ferme le dialog sans passer par `open` : l'effet compare donc à
  // l'état réel de la fenêtre, et `showModal()` lève sur une fenêtre déjà ouverte.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className={cx(
        "m-auto w-full max-w-2xl rounded-lg bg-surface-alt p-6 text-ink backdrop:bg-black/50",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 id={titleId} className="text-xl font-bold">
          {title}
        </h3>
        <button
          className="text-ink cursor-pointer text-2xl font-bold hover:text-error transition-colors"
          onClick={onClose}
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>

      {children}
    </dialog>
  );
}
