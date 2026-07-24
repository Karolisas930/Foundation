/**
 * HandymanProToolsExtra — features 9-12 + Email Connect.
 * Thin container composing the sibling modules in this folder.
 */
import { MeisterVerification } from "../MeisterVerification";
import { RouteOptimizer } from "./RouteOptimizer";
import { SubcontractorMatcher } from "./SubcontractorMatcher";
import { WeatherDelayPredictor } from "./WeatherDelayPredictor";
import { ComplianceReminder } from "./ComplianceReminder";
import { EmailConnectCard } from "./EmailConnectCard";

export { getConnectedEmail, type EmailConnection } from "./EmailConnectCard";

export function HandymanProToolsExtra() {
  return (
    <div id="pro-tools-extra">
      <MeisterVerification />
      <RouteOptimizer />
      <SubcontractorMatcher />
      <WeatherDelayPredictor />
      <ComplianceReminder />
      <EmailConnectCard />
    </div>
  );
}

export default HandymanProToolsExtra;
