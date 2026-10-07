import { MONTHS, nf, type Metric } from "@/lib/platform";
import { REPORT_FIELDS, monthWindow, reportComparisons, type ReportDraft } from "@/lib/report-document";

export async function downloadReportPdf(name: string, month: number, year: number, score: number, metrics: Metric[], draft: ReportDraft) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const snapshot = draft.snapshot ?? { clientName: name, accounts: [], current: monthWindow(metrics, month, year).cur, previous: monthWindow(metrics, month, year).prev, rows: monthWindow(metrics, month, year).rows };
  const period = `${MONTHS[month - 1]} ${year}`;
  const clientName = snapshot.clientName || name;
  const color = { ink: "#202f40", heading: "#21568a", rule: "#93b0c8" };
  let y = 30;
  const clean = (text: string) => text.replace(/[•]/g, "-").replace(/[—–]/g, "-").replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/→/g, ">");
  function frame() {
    doc.setDrawColor(color.rule); doc.line(20, 17, 190, 17); doc.line(20, 279, 190, 279);
    doc.setFontSize(8); doc.setTextColor(color.ink);
    doc.text("Swiiftiphones Agency", 20, 286); doc.text(`${period} | ${doc.getNumberOfPages()}`, 190, 286, { align: "right" });
  }
  function newPage() { doc.addPage(); frame(); y = 30; }
  function text(value: string, size = 10) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(size); doc.setTextColor(color.ink);
    const lines: string[] = doc.splitTextToSize(clean(value || "Not provided"), 170);
    for (const line of lines) {
      if (y > 267) newPage();
      doc.setFont("helvetica", "normal"); doc.setFontSize(size); doc.setTextColor(color.ink);
      doc.text(line, 20, y); y += size * 0.48;
    }
    y += 4;
  }
  function heading(value: string) {
    if (y > 235) newPage();
    y += 5; doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(color.heading);
    const lines: string[] = doc.splitTextToSize(clean(value), 170);
    doc.text(lines, 20, y); y += lines.length * 6 + 5;
  }
  function table(headers: string[], rows: string[][], widths: number[]) {
    function row(cells: string[], header = false) {
      doc.setFontSize(9); doc.setFont("helvetica", header ? "bold" : "normal");
      const wrapped = cells.map((cell, i) => doc.splitTextToSize(clean(cell), (widths[i] ?? 40) - 6) as string[]);
      const height = Math.max(...wrapped.map(lines => lines.length)) * 4.5 + 5;
      if (y + height > 270) { newPage(); if (!header) row(headers, true); }
      doc.setFontSize(9); doc.setFont("helvetica", header ? "bold" : "normal");
      doc.setTextColor(header ? color.heading : color.ink); doc.setDrawColor(color.rule);
      let x = 20;
      wrapped.forEach((lines, i) => { doc.rect(x, y, widths[i] ?? 40, height); doc.text(lines, x + 3, y + 5); x += widths[i] ?? 40; });
      y += height;
    }
    row(headers, true); rows.forEach(cells => row(cells)); y += 5;
  }
  frame();
  doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(color.heading);
  const nameLines: string[] = doc.splitTextToSize(clean(clientName), 170);
  doc.text(nameLines, 105, 60, { align: "center" });
  y = 65 + nameLines.length * 12;
  doc.setFontSize(20); doc.setFont("helvetica", "normal");
  doc.text("Social Media Growth Report", 105, y, { align: "center" });
  y += 25; text(`Reporting period: ${period}`, 13);
  text(`Prepared by: ${draft.preparedBy || "Swiiftiphones Agency"}`, 12);
  if (snapshot.accounts.length) text(`Accounts: ${snapshot.accounts.join(", ")}`);
  text(`Performance score: ${score}/100${draft.rating ? ` | ${draft.rating}` : ""}`);
  y += 15; heading("Acknowledgement"); text(draft.acknowledgement);
  newPage();
  heading("1. Executive summary"); text(draft.summary);
  heading("2. Key performance results");
  text("Latest recorded snapshot for each reporting month. Values are not summed across daily snapshots.", 9);
  table(["Metric", "Previous month", "Reporting month"], reportComparisons(snapshot), [80, 45, 45]);
  heading("3. Before & after: followers");
  text(snapshot.current && snapshot.previous ? `${nf.format(snapshot.previous.followers)} before | ${nf.format(snapshot.current.followers)} after | ${nf.format(snapshot.current.followers - snapshot.previous.followers)} net change.` : "A comparable before-and-after pair is not recorded.");
  heading("4. Monthly performance overview");
  table(["Month", "Followers", "Views", "Engagement"], snapshot.rows.map(r => [r.label, nf.format(r.followers), nf.format(r.views), `${r.engagement}%`]), [60, 40, 40, 30]);
  REPORT_FIELDS.filter(([key]) => key !== "summary" && key !== "acknowledgement").forEach(([key, label], i) => { heading(`${i + 5}. ${label}`); text(draft[key] || "Awaiting account manager review."); });
  if (draft.invoice) {
    newPage(); heading("Invoice");
    text(`Invoice number: ${draft.invoice.number || "Not assigned"}\nInvoice to: ${clientName}\nPeriod: ${period}`);
    table(["Service", "Amount"], [[draft.invoice.service || "Not provided", `${draft.invoice.amount || "Not set"} ${draft.invoice.currency}`]], [125, 45]);
    heading("Payment terms"); text(draft.invoice.terms);
    if (draft.invoice.contact) { heading("Contact"); text(draft.invoice.contact); }
    if (draft.invoice.paymentDetails) { heading("Payment details"); text(draft.invoice.paymentDetails); }
  }
  doc.setProperties({ title: `${clientName} - ${period} Growth Report`, author: draft.preparedBy || "Swiiftiphones Agency" });
  doc.save(`report-${year}-${String(month).padStart(2, "0")}.pdf`);
}