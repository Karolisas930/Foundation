import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "./constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CategoryStep({
  selectedId,
  onSelect,
  onAdvance,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdvance: () => void;
}) {
  return (
    <Card className="bg-slate-900 border-slate-700 text-white">
      <CardHeader>
        <CardTitle>Choose a category</CardTitle>
        <CardDescription>
          Select a trade category that best describes your project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CATEGORIES.map((c) => {
            const active = selectedId === c.id;
            const Icon = c.icon;
            return (
              <Card
                key={c.id}
                onClick={() => {
                  onSelect(c.id);
                  setTimeout(onAdvance, 180);
                }}
                className={cn(
                  "group relative cursor-pointer transform transition-all duration-200 ease-in-out",
                  "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-orange-500",
                  active && "border-orange-500 bg-orange-900/20",
                  "p-4 rounded-lg shadow-md",
                )}
              >
                <div className="flex flex-col items-start gap-3">
                  <span
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-lg border",
                      active
                        ? "border-orange-600 bg-orange-900/30 text-orange-400"
                        : "border-slate-600 bg-slate-700 text-slate-300 group-hover:text-orange-400",
                      "transition-colors duration-200 ease-in-out",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="flex-1">
                    <h3 className="text-md font-semibold text-white">{c.label}</h3>
                    <p className="text-xs text-slate-400 mt-1">{c.hint}</p>
                  </div>
                </div>
                {active && (
                  <span className="absolute right-4 top-4 inline-flex size-6 items-center justify-center rounded-full bg-orange-500 text-white">
                    <Check className="size-4" />
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
