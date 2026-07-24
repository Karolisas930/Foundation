import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung — Handwerk BW" },
      {
        name: "description",
        content: "Informationen zur Verarbeitung personenbezogener Daten gemäß Art. 13 DSGVO.",
      },
      { property: "og:title", content: "Datenschutzerklärung — Handwerk BW" },
      {
        property: "og:description",
        content: "Informationen zur Verarbeitung personenbezogener Daten gemäß Art. 13 DSGVO.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy-ink text-white">
      <div className="mx-auto max-w-3xl px-5 py-10 lg:py-14">
        <nav className="mb-8 text-xs text-white/50">
          <Link to="/" className="hover:text-orange">
            ← Zurück zur Startseite
          </Link>
        </nav>

        <header>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-orange">
            Rechtliches
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Datenschutzerklärung
          </h1>
          <p className="mt-3 text-sm text-white/60">
            Diese Datenschutzerklärung wird vom Anbieter der Plattform gepflegt. Die Angaben unten
            sind ein Ausgangs-Template und müssen an die konkret eingesetzten Dienste und
            Rechtsgrundlagen angepasst werden. Sie ersetzt keine rechtliche Beratung.
          </p>
        </header>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/80">
          <Section title="1. Verantwortlicher">
            <p>
              Verantwortlich für die Verarbeitung personenbezogener Daten auf dieser Website im
              Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
            </p>
            <address className="mt-2 not-italic">
              HANDWERK GmbH
              <br />
              Musterstraße 1, 68159 Mannheim, Deutschland
              <br />
              E-Mail:{" "}
              <a href="mailto:datenschutz@handwerk.app" className="text-orange hover:underline">
                datenschutz@handwerk.app
              </a>
            </address>
          </Section>

          <Section title="2. Zwecke und Rechtsgrundlagen der Verarbeitung">
            <p>Wir verarbeiten personenbezogene Daten insbesondere:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                zur Bereitstellung des Nutzerkontos, der Handwerker-Profile und der
                Marktplatz-Funktionen (Art. 6 Abs. 1 lit. b DSGVO);
              </li>
              <li>
                zur Erfüllung gesetzlicher Aufbewahrungs- und Steuerpflichten (Art. 6 Abs. 1 lit. c
                DSGVO);
              </li>
              <li>
                zur Verbesserung und Absicherung der Plattform sowie zur Missbrauchsprävention (Art.
                6 Abs. 1 lit. f DSGVO).
              </li>
            </ul>
          </Section>

          <Section title="3. Kategorien verarbeiteter Daten">
            <ul className="list-disc space-y-1 pl-5">
              <li>Stamm- und Kontaktdaten (Name, E-Mail, Adresse, Telefon)</li>
              <li>Profildaten (Gewerk, Qualifikationen, freigegebene Nachweise)</li>
              <li>Auftrags- und Rechnungsdaten (Belege, Km-Logs, Arbeitsstunden)</li>
              <li>Technische Daten (IP-Adresse, Log-Daten, Geräte-Kennungen)</li>
              <li>
                Optional: Standortdaten von Mitarbeitenden — ausschließlich mit aktiver, jederzeit
                widerrufbarer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
              </li>
            </ul>
          </Section>

          <Section title="4. Empfänger und Auftragsverarbeiter">
            <p>
              Für den Betrieb der Plattform setzen wir sorgfältig ausgewählte Dienstleister ein, die
              als Auftragsverarbeiter im Sinne von Art. 28 DSGVO tätig werden. Dazu zählen
              typischerweise:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Hosting und Datenbank (EU-Rechenzentrum)</li>
              <li>Authentifizierungs- und Speicherdienste</li>
              <li>E-Mail-Versand und transaktionale Benachrichtigungen</li>
              <li>Fehler- und Performance-Monitoring</li>
            </ul>
            <p className="mt-2">
              Eine aktuelle Liste der eingesetzten Auftragsverarbeiter stellen wir auf Anfrage zur
              Verfügung.
            </p>
          </Section>

          <Section title="5. Speicherdauer">
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie es für die jeweiligen
              Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten (insb. § 147 AO, § 257
              HGB) es vorschreiben. Danach werden die Daten gelöscht oder anonymisiert.
            </p>
          </Section>

          <Section title="6. Ihre Rechte">
            <p>Sie haben nach der DSGVO folgende Rechte:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung (Art. 17 DSGVO)</li>
              <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
              <li>Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
            </ul>
            <p className="mt-2">
              Zur Ausübung Ihrer Rechte genügt eine E-Mail an{" "}
              <a href="mailto:datenschutz@handwerk.app" className="text-orange hover:underline">
                datenschutz@handwerk.app
              </a>
              . Angemeldete Nutzer:innen können unter „Downloads &amp; Reports" zusätzlich einen
              vollständigen Datenexport (Art. 15 DSGVO) anfordern.
            </p>
          </Section>

          <Section title="7. Standortdaten von Mitarbeitenden (optional)">
            <p>
              Die Funktion „Staff Locations" erfasst Standortdaten ausschließlich, wenn das
              betroffene Teammitglied die Freigabe vorher aktiv erteilt hat. Die Einwilligung kann
              jederzeit ohne Angabe von Gründen widerrufen werden; gespeicherte Koordinaten werden
              dabei sofort gelöscht.
            </p>
          </Section>

          <Section title="8. Sicherheit">
            <p>
              Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten vor
              unberechtigtem Zugriff, Verlust oder Manipulation zu schützen:
              Transportverschlüsselung (TLS), zugriffsbeschränkte Datenbanken mit Row-Level-Security
              und regelmäßige Backups.
            </p>
          </Section>

          <Section title="9. Änderungen dieser Erklärung">
            <p>
              Wir passen diese Datenschutzerklärung an, sobald sich Rechtslage oder eingesetzte
              Verfahren ändern. Die jeweils aktuelle Fassung ist über diese Seite abrufbar.
            </p>
          </Section>
        </div>

        <p className="mt-12 text-xs text-white/40">
          Stand: {new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}. Diese
          Seite wird vom Anbieter gepflegt und stellt keine Rechtsberatung dar.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-extrabold text-white">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
