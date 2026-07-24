/**
 * LogHoursPage — timesheet review + entry surface.
 *
 * Blueprint-facing entry point for the timesheets slice. Re-exports the
 * existing StaffHoursPage so all timesheet routes resolve through this
 * canonical name; call sites can migrate incrementally.
 */
export { StaffHoursPage as LogHoursPage } from "./StaffHoursPage";
