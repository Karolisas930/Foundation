/**
 * CompactToolsPanel — replaces the long 12-tool scroll inside the
 * "Professional Tools" modal with a focused 2x2 grid + a single
 * Material Procurement Hub banner. All heavy operational forms
 * (Lead Quality, Route Optimizer, Compliance, Matcher, Email)
 * live in the hamburger dropdown instead.
 */
import { useState } from "react";
import { CheckSquare, FileText, Receipt, ShoppingBag, type LucideIcon } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
}

const CORE_TOOLS: Tool[] = [
  {
    id: "invoice",
    name: "Voice-to-Invoice",
    desc: "Dictate work details to instantly generate ready client bills.",
    icon: FileText,
  },
  {
    id: "receipt",
    name: "Smart Receipt AI",
    desc: "Snap an on-site photo to extract material tax write-offs instantly.",
    icon: Receipt,
  },
  {
    id: "punch",
    name: "Digital Punch List",
    desc: "Shared progress checklists with photo proof and client signatures.",
    icon: CheckSquare,
  },
];

export function CompactToolsPanel() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CORE_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveModal(tool.id)}
              className="group flex items-start gap-3 rounded-xl border border-[#2F3336] bg-[#0F1419] p-4 text-left transition-all hover:border-[#3E4144] hover:bg-[#161E27]"
            >
              <div className="shrink-0 rounded-lg bg-[#1E2732] p-2.5 text-[#71767B] transition-colors group-hover:bg-orange-500/10 group-hover:text-orange-500">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white transition-colors group-hover:text-orange-500">
                  {tool.name}
                </h4>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#71767B]">
                  {tool.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setActiveModal("procurement-hub")}
        className="group flex w-full items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-left transition hover:bg-orange-500/10"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-500 p-2.5 text-white shadow-md shadow-orange-500/10">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Material Procurement Hub</h4>
              <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-orange-400">
                Partner B2B
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#71767B]">
              Simultaneous OBI, Bauhaus, and Hornbach inventory search with 1-click pickup routes.
            </p>
          </div>
        </div>
      </button>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md space-y-4 rounded-2xl border border-[#2F3336] bg-[#151F32] p-6">
            <div className="flex items-center justify-between border-b border-[#2F3336] pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">
                Active Workspace
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-xs text-[#71767B] transition hover:text-white"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-white">
              [Form view contents for{" "}
              <span className="font-mono font-bold text-orange-400">{activeModal}</span> load
              cleanly right here without cluttering the main profile screen background.]
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompactToolsPanel;
