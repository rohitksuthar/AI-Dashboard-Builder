/* ==========================================================================
   InsightBoard — generated-dashboard.js
   The "main feature": builds a dashboard purely from whatever columns exist
   in the current dataset, hiding any visualization whose required columns
   are missing.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  IB.injectShell("generated");
  IB.seedHistoryIfEmpty();

  const params = new URLSearchParams(window.location.search);
  const wantsDemo = params.get("demo") === "1";
  let dataset = IB.getDataset();

  if (!dataset && wantsDemo) {
    IB.loadSampleDataset().then((ds) => renderDashboard(ds)).catch(showEmpty);
  } else if (!dataset) {
    showEmpty();
  } else {
    renderDashboard(dataset);
  }

  document.addEventListener("ib:theme-change", () => {
    const ds = IB.getDataset();
    if (ds) renderDashboard(ds, true);
  });
});

function showEmpty() {
  document.getElementById("emptyStateWrap").classList.remove("hidden");
  document.getElementById("dashboardContent").classList.add("hidden");
}

function renderDashboard(dataset, chartsOnly) {
  document.getElementById("emptyStateWrap").classList.add("hidden");
  document.getElementById("dashboardContent").classList.remove("hidden");

  const kpis = IB.computeKPIs(dataset);
  const dateCol = IB.findColumn(dataset, ["Date"]);
  const productCol = IB.findColumn(dataset, ["Product"]);
  const regionCol = IB.findColumn(dataset, ["Region"]);

  if (!chartsOnly) {
    document.getElementById("breadcrumbName").textContent = dataset.name;
    document.getElementById("datasetTitle").textContent = dataset.name.replace(/\.csv$/i, "");
    document.getElementById("datasetRows").textContent = IB.formatNumber(dataset.rows.length);
    document.getElementById("datasetCols").textContent = dataset.headers.length;
    document.getElementById("datasetUpdated").textContent = IB.formatDate(dataset.uploadDate);
    renderKpis(kpis);
  }

  const skipped = [];

  // Line chart: Date + Sales
  if (dateCol && kpis.salesCol) {
    const monthly = IB.computeMonthlySeries(dataset, kpis.salesCol);
    document.getElementById("chartCard-line").classList.remove("hidden");
    IB.lineChart("genLineChart", monthly.map((m) => m.label), monthly.map((m) => m.value), { fill: true });
  } else {
    document.getElementById("chartCard-line").classList.add("hidden");
    skipped.push("Sales Trend (needs Date + Sales)");
  }

  // Bar chart: Product + Sales
  if (productCol && kpis.salesCol) {
    const byProduct = IB.computeGroupSums(dataset, productCol, kpis.salesCol, 8);
    document.getElementById("chartCard-bar").classList.remove("hidden");
    IB.barChart("genBarChart", byProduct.map((p) => p.label), byProduct.map((p) => p.value));
  } else {
    document.getElementById("chartCard-bar").classList.add("hidden");
    skipped.push("Sales by Product (needs Product + Sales)");
  }

  // Doughnut: Region + Sales
  if (regionCol && kpis.salesCol) {
    const byRegion = IB.computeGroupSums(dataset, regionCol, kpis.salesCol);
    document.getElementById("chartCard-doughnut").classList.remove("hidden");
    IB.doughnutChart("genDoughnutChart", byRegion.map((r) => r.label), byRegion.map((r) => r.value));
  } else {
    document.getElementById("chartCard-doughnut").classList.add("hidden");
    skipped.push("Sales by Region (needs Region + Sales)");
  }

  // Profit chart: Profit column present
  if (kpis.profitCol) {
    const monthlyProfit = IB.computeMonthlySeries(dataset, kpis.profitCol);
    document.getElementById("chartCard-profit").classList.remove("hidden");
    if (monthlyProfit.length > 1) {
      IB.lineChart("genProfitChart", monthlyProfit.map((m) => m.label), monthlyProfit.map((m) => m.value), {
        fill: true, color: getComputedStyle(document.documentElement).getPropertyValue("--color-violet").trim(),
      });
    } else if (productCol) {
      const byProductProfit = IB.computeGroupSums(dataset, productCol, kpis.profitCol, 6);
      IB.barChart("genProfitChart", byProductProfit.map((p) => p.label), byProductProfit.map((p) => p.value), {
        color: getComputedStyle(document.documentElement).getPropertyValue("--color-violet").trim(),
      });
    }
  } else {
    document.getElementById("chartCard-profit").classList.add("hidden");
    skipped.push("Profit Chart (needs Profit)");
  }

  // Quantity chart: Quantity column present
  if (kpis.qtyCol && productCol) {
    const byQty = IB.computeGroupSums(dataset, productCol, kpis.qtyCol, 6);
    document.getElementById("chartCard-quantity").classList.remove("hidden");
    IB.barChart("genQuantityChart", byQty.map((p) => p.label), byQty.map((p) => p.value), {
      horizontal: true, color: getComputedStyle(document.documentElement).getPropertyValue("--color-amber").trim(),
    });
  } else {
    document.getElementById("chartCard-quantity").classList.add("hidden");
    skipped.push("Quantity Chart (needs Quantity + Product)");
  }

  const note = document.getElementById("skippedChartsNote");
  const noteText = document.getElementById("skippedChartsText");
  if (skipped.length && !chartsOnly) {
    note.style.display = "block";
    noteText.textContent = skipped.length + " visualization(s) hidden because required columns weren't found: " + skipped.join("; ") + ".";
  } else if (!skipped.length) {
    note.style.display = "none";
  }
}

function renderKpis(kpis) {
  const grid = document.getElementById("genKpiGrid");
  const cards = [
    { icon: "fa-sack-dollar", cls: "blue", label: "Total Sales", value: IB.formatINR(kpis.totalSales) },
    { icon: "fa-coins", cls: "violet", label: "Total Profit", value: IB.formatINR(kpis.totalProfit) },
    { icon: "fa-boxes-stacked", cls: "amber", label: "Total Quantity", value: IB.formatNumber(kpis.totalQuantity) },
    { icon: "fa-cart-shopping", cls: "blue", label: "Total Orders", value: IB.formatNumber(kpis.totalOrders) },
    { icon: "fa-chart-simple", cls: "violet", label: "Average Sales", value: IB.formatINR(kpis.avgSales) },
    { icon: "fa-percent", cls: "amber", label: "Profit Margin", value: kpis.profitMargin.toFixed(1) + "%" },
  ];
  grid.classList.add("kpi-grid-6");
  grid.innerHTML = cards.map((c) => (
    '<div class="kpi-card"><div class="kpi-card-top"><span class="kpi-icon ' + c.cls + '"><i class="fa-solid ' + c.icon + '"></i></span></div>' +
    '<div class="kpi-value">' + c.value + '</div><div class="kpi-label">' + c.label + '</div></div>'
  )).join("");
}
