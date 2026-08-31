/* ==========================================================================
   InsightBoard — upload.js
   ========================================================================== */

   let pendingFile = null; // { name, size, headers, rows }

   document.addEventListener("DOMContentLoaded", function () {
     IB.injectShell("upload");
   
     const zone = document.getElementById("uploadZone");
     const fileInput = document.getElementById("fileInput");
     const chooseBtn = document.getElementById("chooseFileBtn");
     const analyzeBtn = document.getElementById("analyzeBtn");
     const useSampleBtn = document.getElementById("useSampleBtn");
     const removeBtn = document.getElementById("fileRemoveBtn");
   
     chooseBtn.addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });
     zone.addEventListener("click", () => fileInput.click());
     zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") fileInput.click(); });
   
     fileInput.addEventListener("change", (e) => {
       if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
     });
   
     ["dragenter", "dragover"].forEach((evt) => {
       zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.add("drag-over"); });
     });
     ["dragleave", "drop"].forEach((evt) => {
       zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.remove("drag-over"); });
     });
     zone.addEventListener("drop", (e) => {
       const file = e.dataTransfer.files && e.dataTransfer.files[0];
       if (file) handleFile(file);
     });
   
     removeBtn.addEventListener("click", () => resetFile());
   
     analyzeBtn.addEventListener("click", () => {
       if (!pendingFile) return;
       const dataset = IB.buildDataset(pendingFile.name, "upload", pendingFile.headers, pendingFile.rows);
       IB.saveDataset(dataset);
       runAnalysisPipeline();
     });
   
     useSampleBtn.addEventListener("click", () => {
       useSampleBtn.disabled = true;
       const original = useSampleBtn.innerHTML;
       useSampleBtn.innerHTML = '<span class="spinner dark"></span> Loading sample data...';
       IB.loadSampleDataset()
         .then((dataset) => {
           pendingFile = { name: dataset.name, size: estimateSize(dataset.rows), headers: dataset.headers, rows: dataset.rows };
           showFilePreview(pendingFile);
           renderPreviewTable(pendingFile.headers, pendingFile.rows);
           useSampleBtn.disabled = false;
           useSampleBtn.innerHTML = original;
           IB.toast("Sample dataset loaded — 120 records ready to analyze.", "success");
           runAnalysisPipeline();
         })
         .catch(() => {
           useSampleBtn.disabled = false;
           useSampleBtn.innerHTML = original;
           IB.toast("Couldn't load the sample dataset.", "error");
         });
     });
   });
   
   function handleFile(file) {
     if (!file.name.toLowerCase().endsWith(".csv")) {
       IB.toast("Please upload a valid CSV file.", "error");
       return;
     }
     const reader = new FileReader();
     reader.onload = (e) => {
       const { headers, rows } = IB.parseCSV(e.target.result);
       if (headers.length === 0 || rows.length === 0) {
         IB.toast("That CSV looks empty or couldn't be read.", "error");
         return;
       }
       pendingFile = { name: file.name, size: file.size, headers, rows };
       showFilePreview(pendingFile);
       renderPreviewTable(headers, rows);
       IB.toast("File loaded — review the preview below, then analyze.", "success");
     };
     reader.onerror = () => IB.toast("There was a problem reading that file.", "error");
     reader.readAsText(file);
   }
   
   function estimateSize(rows) {
     return JSON.stringify(rows).length;
   }
   
   function showFilePreview(file) {
     document.getElementById("filePreviewCard").classList.remove("hidden");
     document.getElementById("filePreviewName").textContent = file.name;
     document.getElementById("filePreviewStats").textContent =
       formatBytes(file.size) + "  ·  " + file.rows.length + " rows  ·  " + file.headers.length + " columns";
     document.getElementById("analyzeBtn").disabled = false;
   }
   
   function resetFile() {
     pendingFile = null;
     document.getElementById("filePreviewCard").classList.add("hidden");
     document.getElementById("previewTableCard").classList.add("hidden");
     document.getElementById("progressCard").classList.add("hidden");
     document.getElementById("analyzeBtn").disabled = true;
     document.getElementById("fileInput").value = "";
   }
   
   function formatBytes(bytes) {
     if (bytes < 1024) return bytes + " B";
     if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
     return (bytes / (1024 * 1024)).toFixed(1) + " MB";
   }
   
   function renderPreviewTable(headers, rows) {
     const card = document.getElementById("previewTableCard");
     const table = document.getElementById("previewTable");
     card.classList.remove("hidden");
     document.getElementById("previewTableSub").textContent = "First 8 of " + rows.length + " rows";
     table.querySelector("thead").innerHTML = "<tr>" + headers.map((h) => "<th>" + h + "</th>").join("") + "</tr>";
     table.querySelector("tbody").innerHTML = rows.slice(0, 8).map((r) =>
       "<tr>" + headers.map((h) => "<td>" + (r[h] ?? "") + "</td>").join("") + "</tr>"
     ).join("");
   }
   
   function runAnalysisPipeline() {
     const card = document.getElementById("progressCard");
     card.classList.remove("hidden");
     card.scrollIntoView({ behavior: "smooth", block: "center" });
     const steps = document.querySelectorAll(".progress-step");
     steps.forEach((s) => s.classList.remove("done", "active"));
   
     let i = 0;
     function advance() {
       if (i > 0) steps[i - 1].classList.remove("active");
       if (i > 0) steps[i - 1].classList.add("done");
       if (i < steps.length) {
         steps[i].classList.add("active");
         i++;
         setTimeout(advance, 550);
       } else {
         setTimeout(() => {
           IB.toast("Dashboard generated successfully!", "success");
           window.location.href = "generated-dashboard.html";
         }, 400);
       }
     }
     advance();
   }
   