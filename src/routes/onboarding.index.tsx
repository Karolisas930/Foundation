import { createFileRoute } from "@tanstack/react-router";
import { OnboardingChooser } from "./-onboarding-chooser";
import "../styles/light-overrides.css";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({
    meta: [
      { title: "Get started — HANDWERK" },
      {
        name: "description",
        content:
          "Choose how you want to use HANDWERK — as a homeowner, trade pro, business, or architect.",
      },
    ],
  }),
  component: OnboardingChooser,
});
