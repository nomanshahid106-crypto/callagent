"use client";

import Link from "next/link";
import { useDemo } from "@/components/DemoProvider";
import { getAgent } from "@/lib/data";
import { formatDuration } from "@/lib/phone";
import { SAMPLE_CAMPAIGN, SAMPLE_RESULTS, type CallResult } from "@/lib/simulation";
import { StatusBadge } from "@/components/StatusBadge";

function csvEscape(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

function exportCsv(rows: CallResult[], filename: string) {
  const header = "Phone,Status,Duration,Outcome,Summary";
  const lines = rows.map((r) =>
    [
      csvEscape(r.phone),
      csvEscape(r.status),
      csvEscape(formatDuration(r.durationSec)),
      csvEscape(r.outcome ?? ""),
      csvEscape(r.summary ?? ""),
    ].join(","),
  );
  const blob = new Blob([[header, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsPage() {
  const { state } = useDemo();
  const campaign = state.campaign;
  const usingSample = !campaign;
  const rows: CallResult[] = campaign ? campaign.results : SAMPLE_RESULTS;
  const agentSlug = campaign ? campaign.agentSlug : SAMPLE_CAMPAIGN.agentSlug;
  const agent = getAgent(agentSlug);
  const campaignName = campaign ? campaign.name : SAMPLE_CAMPAIGN.name;

  const total = rows.length;
  const called = rows.filter((r) => r.status !== "Pending").length;
  const answered = rows.filter((r) => r.status === "Completed").length;
  const completed = rows.filter((r) => r.status === "Completed").length;
  const noAnswer = rows.filter((r) => r.status === "No Answer").length;
  const failed = rows.filter((r) => r.status === "Failed").length;
  const headline = agent
    ? rows.filter((r) => r.outcome === agent.headlineOutcome).length
    : 0;

  const totals: Array<[string, string | number]> = [
    ["Total Numbers", total],
    ["Called", called],
    ["Answered", answered],
    ["Completed", completed],
    ["No Answer", noAnswer],
    ["Failed", failed],
    [agent?.headlineOutcome ?? "Headline outcome", headline],
  ];

  return (
    <>
      <div className="dash-head">
        <h1>Call Results</h1>
        <div className="right">
          {usingSample && <span className="badge amber">Sample data</span>}
          <span className="badge demo">Demo Mode</span>
          <button
            className="btn sm"
            onClick={() => exportCsv(rows, "call-results.csv")}
          >
            ⬇ Export Results (CSV)
          </button>
        </div>
      </div>
      <p className="muted">
        <strong style={{ color: "#fff" }}>{campaignName}</strong> · {agent?.icon}{" "}
        {agent?.name} — one row per phone number: status, outcome and the AI
        summary of that call.
        {usingSample && (
          <>
            {" "}This is sample data — run a campaign from{" "}
            <Link href="/dashboard/campaigns/new">New Campaign</Link> to see
            your own results here.
          </>
        )}
      </p>

      <div className="grid-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        {totals.map(([label, value]) => (
          <div className="card stat" key={label} style={{ padding: 16 }}>
            <div className="num" style={{ fontSize: "1.5rem" }}>{value}</div>
            <div className="lbl">{label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Outcome</th>
                <th>Call Summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.phone}-${i}`}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{r.phone}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.durationSec ? formatDuration(r.durationSec) : "—"}</td>
                  <td>{r.outcome ?? "—"}</td>
                  <td className="summary-cell">
                    {r.summary ?? "—"}
                    {r.transcript.length > 0 && (
                      <details className="transcript-view">
                        <summary>View Transcript</summary>
                        <div className="body">{r.transcript.join("\n")}</div>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
