export function useExport() {
  const exportCSV = (data, filename = "export") => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers
        .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPrint = (elementId) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            body { font-family: Inter, sans-serif; font-size: 12px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
            th { background: #f8fafc; font-weight: 600; }
            tr:nth-child(even) { background: #f8fafc; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>${el.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return { exportCSV, exportPrint };
}
