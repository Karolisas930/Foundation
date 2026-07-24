/**
 * ProfileInfoBox — single labelled input field on the intake-input surface,
 * matching the homeowner intake cards (dark navy + orange focus ring).
 */
import { cn } from "@/lib/utils";

interface ProfileInfoBoxProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  type?: string;
  className?: string;
}

export function ProfileInfoBox({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
  type = "text",
  className,
}: ProfileInfoBoxProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
        {label}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        style={{ backgroundColor: "#151F32", borderColor: "#2F3336" }}
        className={cn(
          "block w-full rounded-xl border px-4 py-3 text-base font-medium text-white placeholder:text-white/40 outline-none transition focus:border-orange/60 focus:ring-2 focus:ring-orange/30",
          readOnly && "cursor-default",
        )}
      />
    </div>
  );
}
