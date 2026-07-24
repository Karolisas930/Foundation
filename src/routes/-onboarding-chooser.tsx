import { Link } from "@tanstack/react-router";
import { Home, Hammer, Briefcase, Compass, ArrowRight } from "lucide-react";
import { TopBar } from "@/components/shared/TopBar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Choice = {
  sector: "homeowner" | "handyman" | "business" | "architect";
  title: string;
  blurb: string;
  icon: typeof Home;
  comingSoon?: boolean;
};

const CHOICES: Choice[] = [
  {
    sector: "homeowner",
    title: "I have a project",
    blurb: "Post a job and get matched with local trades.",
    icon: Home,
  },
  {
    sector: "handyman",
    title: "I'm a trade pro",
    blurb: "Find work nearby, no phone-tag, free to join.",
    icon: Hammer,
  },
  {
    sector: "business",
    title: "I run a business",
    blurb: "Manage teams, projects, and pipelines.",
    icon: Briefcase,
    comingSoon: true,
  },
  {
    sector: "architect",
    title: "I'm an architect",
    blurb: "Coordinate trades across BW projects.",
    icon: Compass,
    comingSoon: true,
  },
];

const baseCardClass =
  "group flex h-full items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition";

const activeCardClass = "hover:border-orange/40 hover:bg-white/[0.07]";

const disabledCardClass = "opacity-60 cursor-not-allowed grayscale";

function ChoiceCard({ choice }: { choice: Choice }) {
  const { sector, title, blurb, icon: Icon, comingSoon } = choice;
  const content = (
    <>
      <span
        className={
          "grid size-11 shrink-0 place-items-center rounded-xl ring-1 " +
          (comingSoon
            ? "bg-white/[0.08] text-white/50 ring-white/10"
            : "bg-orange/15 text-orange ring-orange/30")
        }
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display text-base font-bold text-white">{title}</span>
          {comingSoon ? (
            <Badge
              variant="outline"
              className="border-white/10 bg-white/[0.06] text-[10px] font-semibold uppercase tracking-wide text-white/70"
            >
              Coming soon
            </Badge>
          ) : (
            <ArrowRight className="size-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-orange" />
          )}
        </span>
        <span className="mt-1 block text-sm text-white/65">{blurb}</span>
      </span>
    </>
  );

  if (comingSoon) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div aria-disabled="true" className={baseCardClass + " " + disabledCardClass}>
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="border border-white/10 bg-navy-ink text-white"
          >
            <p className="text-xs">Coming soon — this role is not yet available.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link
      to="/onboarding/profile"
      search={{ sector }}
      className={baseCardClass + " " + activeCardClass}
    >
      {content}
    </Link>
  );
}

export function OnboardingChooser() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-ink text-white/90">
      <div aria-hidden className="absolute inset-0 blueprint-grid" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] orange-aurora"
      />

      <TopBar showSignIn={false} />

      <main className="relative z-10 mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <header className="mb-8 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            How do you want to start?
          </h1>
          <p className="mt-3 text-sm text-white/65 sm:text-base">
            Pick your role — you can change it later.
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CHOICES.map((choice) => (
            <li key={choice.sector}>
              <ChoiceCard choice={choice} />
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-white/55">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-orange hover:text-orange-glow">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
