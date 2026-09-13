/**
 * ReceiptsManager — Built for real tradespeople.
 * Fast receipt snapping, voice-friendly material log, team sharing.
 */
import { useRef, useState } from "react";
import { Camera, Mic, Package, Plus, Receipt, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { initials, type Material, type ReceiptItem, type TeamMember } from "./profile-types";

interface ReceiptsManagerProps {
  receipts: ReceiptItem[];
  materials: Material[];
  receiptUploader: string;
  setReceiptUploader: (v: string) => void;
  onPickReceipts: (files?: FileList | null) => void;
  onRemoveReceipt: (id: string) => void;
  materialDraft: Omit<Material, "id">;
  setMaterialDraft: React.Dispatch<React.SetStateAction<Omit<Material, "id">>>;
  onAddMaterial: () => void;
  onRemoveMaterial: (id: string) => void;
  teamMembers: TeamMember[];
  memberById: (id: string) => TeamMember;
}

export function ReceiptsManager({
  receipts,
  materials,
  receiptUploader,
  setReceiptUploader,
  onPickReceipts,
  onRemoveReceipt,
  materialDraft,
  setMaterialDraft,
  onAddMaterial,
  onRemoveMaterial,
  teamMembers,
  memberById,
}: ReceiptsManagerProps) {
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "receipt" | "material";
    id: string;
  } | null>(null);

  const commonMaterials = [
    "Tiles (m²)",
    "Concrete (bags)",
    "Paint (L)",
    "Wood (m)",
    "Insulation",
    "Plaster",
    "Screws",
    "Cement",
  ];

  return (
    <>
      <section className="mx-2 mt-6 scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-sm sm:mx-4">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange/15 text-orange">
            <Receipt className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold text-white">Receipts & Materials</h3>
            <p className="text-xs text-slate-400">Snap receipts. Log materials. Share with team.</p>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => receiptInputRef.current?.click()} className="flex-1 btn-glow">
                <Upload className="mr-2 size-4" /> Upload Receipt
              </Button>
              <Button
                onClick={() => {
                  /* future voice receipt */
                }}
                variant="outline"
                className="flex-1"
              >
                <Mic className="mr-2 size-4" /> Voice Log
              </Button>
            </div>

            <input
              ref={receiptInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => onPickReceipts(e.target.files)}
            />

            {/* Receipts Grid */}
            {receipts.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {receipts.map((r) => (
                  <div
                    key={r.id}
                    className="group relative rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden"
                  >
                    {r.dataUrl && (
                      <img src={r.dataUrl} alt="" className="aspect-video w-full object-cover" />
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-white truncate">{r.vendor}</p>
                      <p className="text-emerald-300">€{r.amount}</p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ type: "receipt", id: r.id })}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/70 p-1 rounded-full"
                    >
                      <Trash2 className="size-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Material Log */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Package className="size-4" /> Materials
              </h4>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  id="material-item"
                  name="material-item"
                  placeholder="Item (e.g. Tiles)"
                  value={materialDraft.item}
                  onChange={(e) => setMaterialDraft((d) => ({ ...d, item: e.target.value }))}
                />
                <Input
                  id="material-cost"
                  name="material-cost"
                  type="number"
                  placeholder="Cost €"
                  value={materialDraft.cost || ""}
                  onChange={(e) =>
                    setMaterialDraft((d) => ({ ...d, cost: Number(e.target.value) || 0 }))
                  }
                />
              </div>

              <Button onClick={onAddMaterial} className="mt-3 w-full btn-glow">
                <Plus className="mr-2 size-4" /> Log Material
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  if (deleteConfirm.type === "receipt") onRemoveReceipt(deleteConfirm.id);
                  else onRemoveMaterial(deleteConfirm.id);
                }
                setDeleteConfirm(null);
              }}
              className="bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
