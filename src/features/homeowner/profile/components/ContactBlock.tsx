/**
 * ContactBlock — Privacy Serializer Gate frontend surface.
 *
 * Renders EITHER the "🔒 Kontaktdaten werden nach gegenseitiger Annahme
 * des Angebots freigeschaltet" locked placeholder, OR the real website,
 * Instagram, and business phone once the backend match status is 'unlocked'.
 *
 * Component NEVER decides the unlock — it purely reflects the `unlocked`
 * flag returned by `getProfileForViewer`. The gate lives on the server.
 */
import { Lock, Globe, Instagram, Phone, ShieldCheck } from "lucide-react";

export type ContactBlockData = {
  website_url: string | null;
  instagram_handle: string | null;
  phone_e164: string | null;
};

interface ContactBlockProps {
  unlocked: boolean;
  contact: ContactBlockData | null;
}

const card = "rounded-2xl border border-white/[0.05] bg-white/[0.025] p-6";

export function ContactBlock({ unlocked, contact }: ContactBlockProps) {
  if (!unlocked || !contact) {
    return (
      <section className={`${card} relative overflow-hidden`} aria-live="polite" data-locked="true">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/[0.07] via-transparent to-transparent"
        />
        <div className="relative flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-400/30">
            <Lock className="size-5 text-orange-300" aria-hidden />
          </div>
          <div className="min-w-0">
            <h4 className="font-display text-base font-bold text-white">
              🔒 Kontaktdaten werden nach gegenseitiger Annahme des Angebots freigeschaltet
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
              Website, Social-Profile und Geschäftstelefon werden erst sichtbar, sobald beide Seiten
              das Match bestätigt haben. So bleibt der Erstkontakt fair &amp; spamfrei — für dich
              und den Handwerker.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 ring-1 ring-white/10">
              <ShieldCheck className="size-3.5" />
              Privacy Gate aktiv
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={card} data-locked="false">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="size-5 text-emerald-400" />
        <h4 className="font-display text-base font-bold text-white">
          Kontaktdaten — freigeschaltet
        </h4>
      </div>
      <dl className="space-y-3">
        {contact.website_url && (
          <ContactRow
            icon={<Globe className="size-4" />}
            label="Website"
            value={contact.website_url}
            href={contact.website_url}
          />
        )}
        {contact.instagram_handle && (
          <ContactRow
            icon={<Instagram className="size-4" />}
            label="Instagram"
            value={`@${contact.instagram_handle.replace(/^@/, "")}`}
            href={`https://instagram.com/${contact.instagram_handle.replace(/^@/, "")}`}
          />
        )}
        {contact.phone_e164 && (
          <ContactRow
            icon={<Phone className="size-4" />}
            label="Business phone"
            value={contact.phone_e164}
            href={`tel:${contact.phone_e164}`}
          />
        )}
        {!contact.website_url && !contact.instagram_handle && !contact.phone_e164 && (
          <p className="text-sm text-slate-400">
            Dieser Handwerker hat noch keine Kontaktdaten hinterlegt.
          </p>
        )}
      </dl>
    </section>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.02] px-4 py-3 ring-1 ring-white/[0.04]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-orange-300">
          {icon}
        </span>
        <div className="min-w-0">
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
            {label}
          </dt>
          <dd className="truncate text-sm font-semibold text-white">
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="hover:text-orange-300 transition-colors"
            >
              {value}
            </a>
          </dd>
        </div>
      </div>
    </div>
  );
}
