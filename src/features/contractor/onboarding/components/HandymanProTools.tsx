/**
 * HandymanProTools — thin coordinator that orchestrates the pro-tools modules.
 * Each module lives in its own file in this directory.
 */
import { VoiceToInvoiceConnected } from "./VoiceToInvoiceConnected";
import { InvoiceHistoryList } from "./InvoiceHistoryList";
import { HandymanProToolsExtra } from "./pro-tools-extra";
import { SmartReceiptAI } from "./SmartReceiptAI";
import { DigitalPunchList } from "./DigitalPunchList";
import { ToolTracker } from "./ToolTracker";
import { MaterialComparator } from "./MaterialComparator";
import { ReviewRequests } from "./ReviewRequests";
import { LeadQuality } from "./LeadQuality";

export function HandymanProTools() {
  return (
    <div id="pro-tools-suite">
      <SmartReceiptAI />
      <VoiceToInvoiceConnected />
      <InvoiceHistoryList />
      <DigitalPunchList />
      <ToolTracker />
      <MaterialComparator />
      <ReviewRequests />
      <LeadQuality />
      <HandymanProToolsExtra />
    </div>
  );
}

export default HandymanProTools;
