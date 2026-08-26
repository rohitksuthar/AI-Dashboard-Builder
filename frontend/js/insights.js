/* ==========================================================================
   InsightBoard — insights.js
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  IB.injectShell("insights");
  const dataset = IB.getDataset();

  if (!dataset) {
    document.getElementById("emptyStateWrap").classList.remove("hidden");
    return;
  }
  document.getElementById("insightsContent").classList.remove("hidden");

  const kpis = IB.computeKPIs(dataset);
  const insights = IB.generateInsights(dataset, kpis);
  const grid = document.getElementById("insightGrid");
  grid.innerHTML = insights.map((ins) => (
    '<div class="card insight-card">' +
      '<div class="insight-emoji">' + ins.emoji + '</div>' +
      '<div><h3>' + ins.title + '</h3><p>' + ins.text + '</p></div>' +
    '</div>'
  )).join("");
});
