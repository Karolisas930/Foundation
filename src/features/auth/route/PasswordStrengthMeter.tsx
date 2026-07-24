import { scorePassword } from "@/lib/password-strength";

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const s = scorePassword(password);
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full ${s.bar} transition-all duration-300 ease-out`}
          style={{ width: `${s.percent}%` }}
        />
      </div>
      {s.label && <p className={`mt-1 text-[11px] font-medium ${s.tone}`}>{s.label}</p>}
    </div>
  );
}
