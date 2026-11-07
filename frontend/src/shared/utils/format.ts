import { formatServiceDateTime } from './serviceTime';
export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return formatServiceDateTime(value, { dateStyle: "medium", timeStyle: "short" });
}
