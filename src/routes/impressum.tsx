import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum — Handwerk BW" },
      {
        name: "description",
        content: "Anbieterkennzeichnung gemäß § 5 DDG (ehem. § 5 TMG) und § 18 MStV.",
      },
      { property: "og:title", content: "Impressum — Handwerk BW" },
      {
        property: "og:description",
        content: "Anbieterkennzeichnung gemäß § 5 DDG und § 18 MStV.",
      },
    ],
  }),
  component: ImpressumPage,
});

function ImpressumPage() {
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
            Impressum
          </h1>
          <p className="mt-3 text-sm text-white/60">
            Diese Seite wird vom Betreiber der Plattform gepflegt. Die folgenden Angaben sind ein
            Ausgangs-Template — vor der Veröffentlichung müssen sie durch die tatsächlichen Firmen-
            und Kontaktdaten ersetzt werden.
          </p>
        </header>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/80">
          <Section title="Angaben gemäß § 5 DDG">
            <address className="not-italic">
              HANDWERK GmbH
              <br />
              Musterstraße 1
              <br />
              68159 Mannheim
              <br />
              Deutschland
            </address>
          </Section>

          <Section title="Vertreten durch">
            <p>Geschäftsführung: [Vor- und Nachname]</p>
          </Section>

          <Section title="Kontakt">
            <p>
              Telefon: [+49 …]
              <br />
              E-Mail:{" "}
              <a href="mailto:kontakt@handwerk.app" className="text-orange hover:underline">
                kontakt@handwerk.app
              </a>
            </p>
          </Section>

          <Section title="Registereintrag">
            <p>
              Eintragung im Handelsregister
              <br />
              Registergericht: Amtsgericht Mannheim
              <br />
              Registernummer: HRB [XXXXX]
            </p>
          </Section>

          <Section title="Umsatzsteuer-ID">
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
              <br />
              DE [XXXXXXXXX]
            </p>
          </Section>

          <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
            <p>
              [Vor- und Nachname]
              <br />
              Musterstraße 1, 68159 Mannheim
            </p>
          </Section>

          <Section title="Streitschlichtung">
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
              bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noreferrer"
                className="text-orange hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
              . Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
            <p className="mt-3">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </Section>

          <Section title="Haftung für Inhalte">
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
              nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
              rechtswidrige Tätigkeit hinweisen.
            </p>
          </Section>

          <Section title="Haftung für Links">
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
              Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
              übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
              oder Betreiber der Seiten verantwortlich.
            </p>
          </Section>

          <Section title="Urheberrecht">
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung
              und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
              schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </Section>
        </div>

        <p className="mt-12 text-xs text-white/40">
          Diese Seite wird vom Anbieter gepflegt und stellt keine Rechtsberatung dar. Für die
          Richtigkeit und Vollständigkeit der Pflichtangaben ist der Anbieter selbst verantwortlich.
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
