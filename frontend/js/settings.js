/* ==========================================================================
   InsightBoard — settings.js
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  IB.injectShell("settings");

  const user = IB.getUser();
  document.getElementById("profileName").value = user.name;
  document.getElementById("profileEmail").value = user.email;
  document.getElementById("profileAvatarInitials").textContent = (user.name || "G U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  initTabs();
  initProfileForm();
  initNotifToggle();
  initDashboardDefaults();
  initSecurityForm();

  const changePhotoBtn = document.getElementById("changePhotoBtn");
  if (changePhotoBtn) {
    changePhotoBtn.addEventListener("click", () => IB.toast("Photo upload isn't wired to a backend in this demo.", "warning"));
  }
});

function initTabs() {
  const buttons = document.querySelectorAll(".settings-tabs button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".settings-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
    });
  });
}

function initProfileForm() {
  const form = document.getElementById("profileForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("profileName").value.trim();
    const email = document.getElementById("profileEmail").value.trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      IB.toast("Please enter a valid name and email.", "error");
      return;
    }
    IB.setUser({ name, email });
    IB.toast("Profile saved.", "success");
  });
}

function initNotifToggle() {
  const toggle = document.getElementById("notifToggle");
  const saved = localStorage.getItem("ib_notifications") !== "0";
  toggle.setAttribute("aria-checked", saved);
  if (saved) toggle.classList.add("is-on");
  applyToggleVisual(toggle, saved);

  toggle.addEventListener("click", () => {
    const now = toggle.getAttribute("aria-checked") !== "true";
    toggle.setAttribute("aria-checked", now);
    localStorage.setItem("ib_notifications", now ? "1" : "0");
    applyToggleVisual(toggle, now);
    IB.toast(now ? "Notifications turned on." : "Notifications turned off.", "success");
  });
}

function applyToggleVisual(toggle, on) {
  const knob = toggle.querySelector(".knob");
  knob.style.transform = on ? "translateX(20px)" : "translateX(0)";
  knob.style.background = on ? "var(--color-accent)" : "var(--color-primary)";
}

function initDashboardDefaults() {
  const range = document.getElementById("defaultRange");
  const chart = document.getElementById("defaultChart");
  const saved = JSON.parse(localStorage.getItem("ib_dashboard_defaults") || "{}");
  if (saved.range) range.value = saved.range;
  if (saved.chart) chart.value = saved.chart;

  document.getElementById("saveDashboardDefaultsBtn").addEventListener("click", () => {
    localStorage.setItem("ib_dashboard_defaults", JSON.stringify({ range: range.value, chart: chart.value }));
    IB.toast("Dashboard defaults saved.", "success");
  });
}

function initSecurityForm() {
  const form = document.getElementById("securityForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const current = document.getElementById("currentPassword").value;
    const next = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmNewPassword").value;
    if (!current) { IB.toast("Enter your current password.", "error"); return; }
    if (next.length < 6) { IB.toast("New password must be at least 6 characters.", "error"); return; }
    if (next !== confirm) { IB.toast("New passwords do not match.", "error"); return; }
    form.reset();
    IB.toast("Password updated (demo only — not persisted to a backend).", "success");
  });
}
