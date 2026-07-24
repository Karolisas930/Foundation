/**
 * ShowcasePortfolio — project folders with before/after photo uploads.
 *
 * Presentational. Folder state lives in HandymanProfilePage.
 */
import { useRef } from "react";
import { Folder, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ShowcaseFolder } from "./profile-types";

interface ShowcasePortfolioProps {
  folders: ShowcaseFolder[];
  onPickFolderImage: (folderId: string, slot: "before" | "after", file?: File | null) => void;
  onClearFolderImage: (folderId: string, slot: "before" | "after") => void;
  onAddFolder: () => void;
  onRemoveFolder: (id: string) => void;
  onRenameFolder: (id: string, title: string) => void;
}

export function ShowcasePortfolio({
  folders,
  onPickFolderImage,
  onClearFolderImage,
  onAddFolder,
  onRemoveFolder,
  onRenameFolder,
}: ShowcasePortfolioProps) {
  const beforeRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const afterRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <>
      {folders.map((f) => (
        <div
          key={f.id}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur-sm"
        >
          <div className="mb-3 flex items-center gap-2">
            <Folder className="size-4 text-orange shrink-0" />
            <Input
              value={f.title}
              onChange={(e) => onRenameFolder(f.id, e.target.value)}
              placeholder="Project name"
              className="intake-input h-9 flex-1 min-w-0"
            />
            {folders.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveFolder(f.id)}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-slate-400 hover:border-orange/40 hover:text-orange"
                aria-label="Delete project folder"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["before", "after"] as const).map((slot) => {
              const img = f[slot];
              const setRef = (el: HTMLInputElement | null) => {
                if (slot === "before") beforeRefs.current[f.id] = el;
                else afterRefs.current[f.id] = el;
              };
              const open = () => {
                const r = slot === "before" ? beforeRefs.current[f.id] : afterRefs.current[f.id];
                r?.click();
              };
              return (
                <div key={slot} className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {slot}
                  </p>
                  <button
                    type="button"
                    onClick={open}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("border-orange", "bg-orange/5");
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove("border-orange", "bg-orange/5");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("border-orange", "bg-orange/5");
                      const file = e.dataTransfer.files?.[0];
                      if (file) void onPickFolderImage(f.id, slot, file);
                    }}
                    className="group relative aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-white/15 bg-white/[0.03] transition-all duration-150 hover:border-orange/60 hover:bg-white/[0.06] active:scale-[0.98]"
                  >
                    {img ? (
                      <>
                        <img
                          src={img}
                          alt={`${f.title} ${slot}`}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur">
                          {slot}
                        </span>
                        <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-900">
                            Replace photo
                          </span>
                        </span>
                      </>
                    ) : (
                      <div className="pointer-events-none flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400">
                        <div className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/5 transition-colors group-hover:border-orange/60 group-hover:bg-orange/10 group-hover:text-orange">
                          <Plus className="size-4" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Drop or click
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500">
                          {slot} photo
                        </span>
                      </div>
                    )}
                    <input
                      ref={setRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickFolderImage(f.id, slot, e.target.files?.[0])}
                    />
                  </button>
                  {img && (
                    <button
                      type="button"
                      onClick={() => onClearFolderImage(f.id, slot)}
                      className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:bg-white/5 hover:text-orange"
                    >
                      <X className="size-3" /> Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onAddFolder}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-slate-300 hover:border-orange/50 hover:text-orange"
      >
        <Plus className="size-4" /> New project folder
      </button>
      <p className="text-xs text-slate-500">
        Each folder represents a completed job. Add a before and an after photo to prove your
        craftsmanship.
      </p>
    </>
  );
}
