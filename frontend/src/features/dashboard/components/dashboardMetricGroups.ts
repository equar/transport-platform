export function dashboardMetricGroup(key: string) {
  if (/rider|guardian/i.test(key)) return "Riders and guardians";
  if (/driver|vehicle/i.test(key)) return "Drivers and fleet";
  if (
    /invoice|payment|billed|collected|balance|receivable|overdue|aging/i.test(
      key,
    )
  )
    return "Billing and receivables";
  if (/ride|route|recurr/i.test(key)) return "Rides and routes";
  if (/organization|contract|servicearea/i.test(key))
    return "Organizations and contracts";
  return "Administration and compliance";
}
