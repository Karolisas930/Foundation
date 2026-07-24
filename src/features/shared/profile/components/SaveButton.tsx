/**
 * SaveButton — orange glow pill, matching the homepage + intake CTA style.
 */
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function SaveButton({
  onClick,
  disabled,
  label = "Save Changes",
  className,
}: SaveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "btn-glow btn-glow-hover inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-base font-semibold",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <Save className="size-5" />
      {label}
    </button>
  );
}
