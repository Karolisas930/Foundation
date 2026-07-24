import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TRADE_OPTIONS } from "@/regions";

export function TradeCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id="trade"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "intake-input flex h-10 w-full items-center justify-between rounded-md px-3 text-sm",
            !value && "text-slate-400",
          )}
        >
          <span className="truncate">{value || "Select a trade"}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Search trades…" />
          <CommandList>
            <CommandEmpty>No trade found.</CommandEmpty>
            <CommandGroup>
              {TRADE_OPTIONS.map((t) => (
                <CommandItem
                  key={t}
                  value={t}
                  onSelect={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-4", value === t ? "opacity-100" : "opacity-0")} />
                  {t}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
