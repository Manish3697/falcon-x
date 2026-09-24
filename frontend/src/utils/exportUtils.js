export const exportToCSV = (filename, data, headers) => {
  if (!data || !data.length) {
    alert("No data available to export.");
    return;
  }

  const csvRows = [];
  // Add headers
  csvRows.push(headers.map(h => `"${h.label}"`).join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h.key] !== undefined && row[h.key] !== null ? row[h.key] : "";
      // Escape double quotes
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportThreatReport = (threats, riskData) => {
  const report = {
    report_title: "FALCON-X Edge Cybersecurity Assessment Report",
    generated_at: new Date().toISOString(),
    platform: "FALCON-X Linux-Based Edge Appliance",
    network_subnet: "192.168.1.0/24",
    risk_summary: riskData,
    threat_findings: threats
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `falconx_threat_report_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
