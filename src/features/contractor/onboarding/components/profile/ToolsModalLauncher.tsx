import { useState } from "react";
import {
  FileText,
  Receipt,
  CheckSquare,
  ShoppingBag,
  Mic,
  Upload,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

export default function ToolsModalLauncher() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Voice-to-Invoice
  const [isRecording, setIsRecording] = useState(false);
  const [invoiceText, setInvoiceText] = useState("");

  // Punch List
  const [punchItems, setPunchItems] = useState([
    { id: 1, text: "Demo old tiles in bathroom", done: true },
    { id: 2, text: "Install new shower drain", done: false },
    { id: 3, text: "Re-grout floor & walls", done: false },
  ]);
  const [newItem, setNewItem] = useState("");

  // Procurement Hub
  const [fetchingSuppliers, setFetchingSuppliers] = useState(false);

  const tools = [
    {
      id: "invoice",
      name: "Voice-to-Invoice",
      desc: "Dictate work details → instant client bill.",
      icon: FileText,
    },
    {
      id: "receipt",
      name: "Smart Receipt AI",
      desc: "Photo receipt → auto tax extraction.",
      icon: Receipt,
    },
    {
      id: "punch",
      name: "Digital Punch List",
      desc: "Shared checklist with client proof.",
      icon: CheckSquare,
    },
  ];

  const openProcurement = () => {
    setActiveModal("procurement");
    setFetchingSuppliers(true);
    setTimeout(() => setFetchingSuppliers(false), 900);
  };

  return (
    <div className="space-y-4">
      {/* Tool Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveModal(tool.id)}
              className="flex items-start p-4 rounded-xl border border-[#2F3336] bg-[#0F1419] hover:bg-[#161E27] hover:border-orange-500/50 transition-all group text-left"
            >
              <div className="p-2.5 bg-[#1E2732] group-hover:bg-orange-500/10 rounded-lg text-[#71767B] group-hover:text-orange-500 mr-3.5 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors">
                  {tool.name}
                </h4>
                <p className="text-xs text-[#71767B] mt-0.5 line-clamp-2">{tool.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Material Procurement Hub */}
      <button
        onClick={openProcurement}
        className="w-full flex items-center justify-between p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-all group text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500 text-white rounded-lg">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Material Procurement Hub</h4>
              <span className="text-[9px] bg-orange-500/20 text-orange-400 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                B2B
              </span>
            </div>
            <p className="text-xs text-[#71767B] mt-0.5">
              OBI, Bauhaus & Hornbach live pricing • 1-click collection
            </p>
          </div>
        </div>
      </button>

      {/* Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#151F32] border border-[#2F3336] rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-[#2F3336]">
              <h3 className="font-bold text-orange-500">Tool</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-xs text-[#71767B] hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Invoice Tool */}
            {activeModal === "invoice" && (
              <div className="pt-4 space-y-4">
                <h4 className="font-bold text-white">Voice-to-Invoice</h4>
                <input
                  type="text"
                  placeholder="Client Name"
                  className="w-full bg-[#0F1419] border border-[#2F3336] rounded-lg px-3 py-2 text-sm text-white"
                />
                <textarea
                  value={invoiceText}
                  onChange={(e) => setInvoiceText(e.target.value)}
                  placeholder="Describe the job..."
                  className="w-full h-28 bg-[#0F1419] border border-[#2F3336] rounded-lg px-3 py-2 text-sm text-white resize-none"
                />
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-white ${isRecording ? "bg-red-600" : "bg-orange-500"}`}
                >
                  <Mic className="w-4 h-4" /> {isRecording ? "Stop Recording" : "Start Dictation"}
                </button>
                <button className="w-full py-3 bg-white text-black font-bold rounded-lg">
                  Generate PDF Invoice
                </button>
              </div>
            )}

            {/* Receipt Tool */}
            {activeModal === "receipt" && (
              <div className="pt-4">
                <h4 className="font-bold text-white mb-4">Smart Receipt AI</h4>
                <div className="border-2 border-dashed border-[#2F3336] rounded-xl p-10 text-center hover:border-orange-500 cursor-pointer">
                  <Upload className="mx-auto mb-3 text-[#71767B]" />
                  <p className="font-bold text-white">Upload Receipt Photo</p>
                  <p className="text-xs text-[#71767B] mt-1">AI extracts totals automatically</p>
                </div>
              </div>
            )}

            {/* Punch List Tool */}
            {activeModal === "punch" && (
              <div className="pt-4 space-y-4">
                <h4 className="font-bold text-white">Digital Punch List</h4>
                <div className="flex gap-2">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add task..."
                    className="flex-1 bg-[#0F1419] border border-[#2F3336] rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <button
                    onClick={() => {
                      if (newItem.trim()) {
                        setPunchItems([
                          ...punchItems,
                          { id: Date.now(), text: newItem, done: false },
                        ]);
                        setNewItem("");
                      }
                    }}
                    className="bg-orange-500 px-4 rounded-lg text-white"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {punchItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-[#0F1419] p-3 rounded-lg border border-[#2F3336]"
                    >
                      <label className="flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() =>
                            setPunchItems(
                              punchItems.map((i) =>
                                i.id === item.id ? { ...i, done: !i.done } : i,
                              ),
                            )
                          }
                          className="accent-orange-500"
                        />
                        <span className={item.done ? "line-through text-[#71767B]" : "text-white"}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        onClick={() => setPunchItems(punchItems.filter((i) => i.id !== item.id))}
                        className="text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Procurement Hub */}
            {activeModal === "procurement" && (
              <div className="pt-4 space-y-4">
                <h4 className="font-bold text-white">Material Procurement Hub</h4>
                {fetchingSuppliers ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-[#0F1419] border border-[#2F3336] p-4 rounded-xl">
                      <p className="font-bold text-white">Mini Excavator</p>
                      <p className="text-xs text-emerald-400">OBI • Available • €220/day</p>
                    </div>
                    <div className="bg-[#0F1419] border border-[#2F3336] p-4 rounded-xl">
                      <p className="font-bold text-white">Skip Hire 7m³</p>
                      <p className="text-xs text-emerald-400">Bauhaus • In stock • €145</p>
                    </div>
                    <button className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl">
                      Request Collection Quote
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
