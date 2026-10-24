import type { CallResult } from "@/lib/simulation";

export function StatusBadge({ status }: { status: CallResult["status"] }) {
  const cls =
    status === "Completed"
      ? "green"
      : status === "Calling"
        ? "blue"
        : status === "No Answer" || status === "Busy"
          ? "amber"
          : status === "Failed"
            ? "red"
            : "";
  return <span className={`badge ${cls}`}>{status}</span>;
}
