import { SectorCard } from "./SectorCard";

export function LogisticsCards() {
  return (
    <>
      <SectorCard
        title="Güterkraftverkehrserlaubnis Freight Compliance"
        subtitle="Federal freight transport licence stamp — required for heavy haul."
      />
      <SectorCard
        title="Heavy Machinery Fleet Matrix"
        subtitle="Excavators, containers, scaffolding and loader rentals."
      />
      <SectorCard
        title="On-Site Bulk Material Delivery Dispatch Log"
        subtitle="Chronological dispatch timeline for the active workday."
      />
    </>
  );
}
