/**
 * TradesStep — Step 2. Searchable + accordion trade picker with removable
 * pills for the current selection.
 */
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CARD_CLS,
  HEADER_CLS,
  TRADE_CATEGORIES,
} from "@/features/contractor/onboarding/components/onboarding-constants";
import { TradeAccordion } from "@/features/contractor/onboarding/components/TradeAccordion";

interface Props {
  trades: string[];
  customTrades: string[];
  tradeSearch: string;
  setTradeSearch: (v: string) => void;
  onSearchKey: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onToggleTrade: (t: string) => void;
  onTouch: (k: string) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  noTradeMatches: boolean;
}

export function TradesStep({
  trades,
  customTrades,
  tradeSearch,
  setTradeSearch,
  onSearchKey,
  onToggleTrade,
  onTouch,
  errors,
  touched,
  noTradeMatches,
}: Props) {
  return (
    <section id="trades" className={CARD_CLS}>
      <h2 className={HEADER_CLS}>
        <span>
          Trades you offer <span className="text-orange">*</span>
        </span>
      </h2>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={tradeSearch}
          onChange={(e) => {
            setTradeSearch(e.target.value);
            onTouch("trades");
          }}
          onKeyDown={onSearchKey}
          placeholder="Search trades — e.g. Electrical, Plumbing, Roofing…"
          className="intake-input pl-9"
        />
      </div>
      {noTradeMatches && (
        <p className="text-[11px] font-medium text-slate-400">
          No matching trade found. Please select from the list below.
        </p>
      )}

      <TradeAccordion
        categories={TRADE_CATEGORIES}
        customTrades={customTrades}
        selected={trades}
        search={tradeSearch}
        onToggle={(t) => {
          onTouch("trades");
          onToggleTrade(t);
        }}
      />

      {touched.trades && errors.trades && (
        <p className="text-[11px] font-medium text-orange">{errors.trades}</p>
      )}

      {trades.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {trades.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
            >
              {t}
              <button
                type="button"
                onClick={() => onToggleTrade(t)}
                aria-label={`Remove ${t}`}
                className="rounded-full p-0.5 hover:bg-background/60"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
