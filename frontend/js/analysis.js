/* ==========================================================================
   InsightBoard — analysis.js
   ========================================================================== */

   document.addEventListener("DOMContentLoaded", function () {
    IB.injectShell("analysis");
    const dataset = IB.getDataset();
  
    if (!dataset) {
      document.getElementById("emptyStateWrap").classList.remove("hidden");
      return;
    }
    document.getElementById("analysisContent").classList.remove("hidden");
    renderAnalysis(dataset);
  
    document.addEventListener("ib:theme-change", () => renderMissingChart(dataset));
  });
  
  function renderAnalysis(dataset) {
    const stats = IB.computeColumnStats(dataset);
    document.getElementById("datasetNameLabel").textContent = dataset.name;
    document.getElementById("statRows").textContent = IB.formatNumber(stats.totalRows);
    document.getElementById("statCols").textContent = stats.totalColumns;
    document.getElementById("statNumeric").textContent = stats.numericCols;
    document.getElementById("statText").textContent = stats.textCols;
    document.getElementById("statMissing").textContent = IB.formatNumber(stats.missingValues);
    document.getElementById("statDuplicates").textContent = IB.formatNumber(stats.duplicateRows);
  
    const body = document.getElementById("columnInfoBody");
    body.innerHTML = stats.columnInfo.map((c) => (
      "<tr><td>" + c.name + "</td>" +
      '<td><span class="status-pill ' + (c.type === "numeric" ? "completed" : c.type === "date" ? "pending" : "failed") + '">' + c.type + "</span></td>" +
      '<td class="table-num">' + c.missing + "</td>" +
      '<td class="table-num">' + c.unique + "</td></tr>"
    )).join("");
  
    renderMissingChart(dataset, stats);
    renderPreview(dataset);
  }
  
  function renderMissingChart(dataset, statsArg) {
    const stats = statsArg || IB.computeColumnStats(dataset);
    IB.barChart("missingValuesChart", stats.columnInfo.map((c) => c.name), stats.columnInfo.map((c) => c.missing), {
      color: getComputedStyle(document.documentElement).getPropertyValue("--color-danger").trim(),
    });
  }
  
  function renderPreview(dataset) {
    const table = document.getElementById("dataPreviewTable");
    table.querySelector("thead").innerHTML = "<tr>" + dataset.headers.map((h) => "<th>" + h + "</th>").join("") + "</tr>";
    table.querySelector("tbody").innerHTML = dataset.rows.slice(0, 15).map((r) =>
      "<tr>" + dataset.headers.map((h) => "<td>" + (r[h] ?? "") + "</td>").join("") + "</tr>"
    ).join("");
  }
  