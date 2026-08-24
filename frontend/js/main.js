/* ==========================================================================
   InsightBoard — main.js
   App shell injection (sidebar + topnav), dark mode, toasts, mobile menu.
   Loaded on every dashboard-layout page.
   ========================================================================== */

const IB2 = window.IB || {};
window.IB = IB2;

/* ---------------------------------------------------------------------- */
/* Theme (dark mode)                                                       */
/* ---------------------------------------------------------------------- */

IB2.initTheme = function () {
  const saved = localStorage.getItem(IB2.KEYS.THEME) || "light";
  document.documentElement.setAttribute("data-theme", saved);
  document.querySelectorAll(".theme-switch").forEach((el) => {
    el.setAttribute("aria-checked", saved === "dark");
    if (el.dataset.themeWired) return; // avoid double-binding switches injected after the first call
    el.dataset.themeWired = "1";
    el.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", current);
      localStorage.setItem(IB2.KEYS.THEME, current);
      document.querySelectorAll(".theme-switch").forEach((s) => s.setAttribute("aria-checked", current === "dark"));
      document.dispatchEvent(new CustomEvent("ib:theme-change", { detail: { theme: current } }));
    });
  });
};

/* ---------------------------------------------------------------------- */
/* Toasts                                                                   */
/* ---------------------------------------------------------------------- */

IB2.toast = function (message, type) {
  type = type || "success";
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  const icons = { success: "fa-circle-check", error: "fa-circle-exclamation", warning: "fa-triangle-exclamation" };
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML =
    '<i class="fa-solid ' + (icons[type] || icons.success) + '"></i>' +
    '<span>' + message + '</span>' +
    '<button class="toast-close" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>';
  stack.appendChild(el);
  const remove = () => { el.style.opacity = "0"; setTimeout(() => el.remove(), 200); };
  el.querySelector(".toast-close").addEventListener("click", remove);
  setTimeout(remove, 4200);
};

/* ---------------------------------------------------------------------- */
/* Auth session                                                            */
/* Every protected page is gated behind a real token (see the inline guard */
/* script in each page's <head>), and login/signup always set the token   */
/* and the user object together — so by the time getUser() runs here,     */
/* there should always be a real cached user. If there isn't (corrupted   */
/* localStorage, token set without a user, etc.), that's a broken session,*/
/* not a guest — send them back to login rather than inventing an identity.*/
/* ---------------------------------------------------------------------- */

IB2.getUser = function () {
  const raw = localStorage.getItem(IB2.KEYS.USER);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fallthrough */ }
  }
  IB2.logout(); // no valid cached user — treat as a broken/missing session
  return { name: "", email: "" }; // logout() redirects synchronously-ish; this just avoids a null crash mid-navigation
};

IB2.setUser = function (user) {
  localStorage.setItem(IB2.KEYS.USER, JSON.stringify(user));
};

IB2.isLoggedIn = function () {
  return !!localStorage.getItem(IB2.KEYS.TOKEN);
};

/**
 * Confirms the saved token is still accepted by the server (GET /api/auth/me).
 * - Server says the token is invalid/expired (401) -> the session is dead for
 *   real, so clear it and send the person back to login.
 * - Server unreachable (backend not running, offline, etc.) -> stay logged in
 *   on the strength of the local token rather than locking someone out just
 *   because the API happens to be down.
 * This runs in the background after the page has already rendered from the
 * locally cached token/user — the head-guard script (see each protected
 * page's <head>) is what actually blocks the page before first paint.
 */
IB2.validateSession = function () {
  if (!IB2.isLoggedIn()) return;
  IB.apiFetch("/auth/me").then(({ ok, status, data }) => {
    if (status === 401) {
      IB2.logout();
      return;
    }
    if (ok && data.user) {
      IB2.setUser(data.user); // keep the cached name/email fresh
    }
  });
};

IB2.logout = function () {
  localStorage.removeItem(IB2.KEYS.USER);
  localStorage.removeItem(IB2.KEYS.TOKEN);
  window.location.href = "login.html";
};

function initials(name) {
  return (name || "G U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/* ---------------------------------------------------------------------- */
/* App shell: sidebar + topnav                                             */
/* ---------------------------------------------------------------------- */

const NAV_ITEMS = [
  { key: "overview", label: "Overview", href: "dashboard.html", icon: "fa-gauge-high" },
  { key: "upload", label: "Upload Dataset", href: "upload.html", icon: "fa-cloud-arrow-up" },
  { key: "generated", label: "My Dashboards", href: "generated-dashboard.html", icon: "fa-chart-pie" },
  { key: "analysis", label: "Data Analysis", href: "analysis.html", icon: "fa-magnifying-glass-chart" },
  { key: "prediction", label: "Predictions", href: "prediction.html", icon: "fa-wand-magic-sparkles" },
  { key: "insights", label: "Insights", href: "insights.html", icon: "fa-lightbulb" },
  { key: "history", label: "History", href: "history.html", icon: "fa-clock-rotate-left" },
  { key: "settings", label: "Settings", href: "settings.html", icon: "fa-gear" },
];

IB2.injectShell = function (activeKey) {
  const sidebarRoot = document.getElementById("sidebar-root");
  const topnavRoot = document.getElementById("topnav-root");
  const user = IB2.getUser();

  IB2.validateSession(); // background check — bounces to login if the server says this token is no longer valid

  if (sidebarRoot) {
    const navHtml = NAV_ITEMS.map((item) => (
      '<a href="' + item.href + '" class="' + (item.key === activeKey ? "active" : "") + '">' +
      '<i class="fa-solid ' + item.icon + '"></i><span>' + item.label + '</span></a>'
    )).join("");

    sidebarRoot.innerHTML =
      '<aside class="sidebar" id="sidebar">' +
        '<button class="sidebar-collapse-btn" id="sidebarCollapseBtn" aria-label="Toggle sidebar width"><i class="fa-solid fa-chevron-left"></i></button>' +
        '<div class="sidebar-brand"><span class="brand-mark"><i class="fa-solid fa-chart-line"></i></span><span>InsightBoard</span></div>' +
        '<nav class="sidebar-nav">' + navHtml + '</nav>' +
        '<div class="sidebar-foot"><a href="#" id="logoutLink"><i class="fa-solid fa-right-from-bracket"></i> <span>Logout</span></a></div>' +
      '</aside>' +
      '<div class="sidebar-backdrop" id="sidebarBackdrop"></div>';
  }

  if (topnavRoot) {
    topnavRoot.innerHTML =
      '<header class="topnav">' +
        '<div class="topnav-left">' +
          '<button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button>' +
          '<div class="topnav-search"><i class="fa-solid fa-magnifying-glass"></i><input type="text" id="topnavSearch" placeholder="Search datasets, products, regions..." /></div>' +
        '</div>' +
        '<div class="topnav-right">' +
          '<div class="theme-switch" role="switch" aria-label="Toggle dark mode" tabindex="0"><span class="knob"><i class="fa-solid fa-moon"></i></span></div>' +
          '<button class="icon-btn" id="notifBtn" aria-label="Notifications"><i class="fa-regular fa-bell"></i><span class="badge-dot"></span></button>' +
          '<div class="topnav-user" id="userMenuBtn">' +
            '<div class="avatar">' + initials(user.name) + '</div>' +
            '<div class="user-meta"><div class="name">' + user.name + '</div><div class="role">Workspace Admin</div></div>' +
            '<i class="fa-solid fa-chevron-down" style="font-size:.7rem;color:var(--color-text-faint)"></i>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  wireShellEvents();
  IB2.initTheme(); // re-run to wire the theme switch injected into the topnav
};

function wireShellEvents() {
  const collapseBtn = document.getElementById("sidebarCollapseBtn");
  if (collapseBtn) {
    const collapsed = localStorage.getItem("ib_sidebar_collapsed") === "1";
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    collapseBtn.addEventListener("click", () => {
      const isCollapsed = document.body.classList.toggle("sidebar-collapsed");
      localStorage.setItem("ib_sidebar_collapsed", isCollapsed ? "1" : "0");
    });
  }

  const mobileBtn = document.getElementById("mobileMenuBtn");
  const backdrop = document.getElementById("sidebarBackdrop");
  const closeMobile = () => document.body.classList.remove("sidebar-open");
  if (mobileBtn) mobileBtn.addEventListener("click", () => document.body.classList.add("sidebar-open"));
  if (backdrop) backdrop.addEventListener("click", closeMobile);
  document.querySelectorAll(".sidebar-nav a").forEach((a) => a.addEventListener("click", closeMobile));

  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      IB2.logout();
    });
  }

  const notifBtn = document.getElementById("notifBtn");
  if (notifBtn) {
    notifBtn.addEventListener("click", () => {
      IB2.toast("You're all caught up — no new notifications.", "success");
    });
  }

  const userMenuBtn = document.getElementById("userMenuBtn");
  if (userMenuBtn) {
    userMenuBtn.addEventListener("click", () => { window.location.href = "settings.html"; });
  }

  const searchInput = document.getElementById("topnavSearch");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && searchInput.value.trim()) {
        IB2.toast('No results for "' + searchInput.value.trim() + '" — try a product, region, or dataset name.', "warning");
      }
    });
  }
}

/* ---------------------------------------------------------------------- */
/* Modal / confirm dialog helper                                           */
/* ---------------------------------------------------------------------- */

IB2.confirmModal = function (opts) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML =
    '<div class="modal-box">' +
      '<h3>' + opts.title + '</h3>' +
      '<p style="margin-bottom:0">' + opts.message + '</p>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-outline" id="modalCancel">' + (opts.cancelLabel || "Cancel") + '</button>' +
        '<button class="btn ' + (opts.danger ? "btn-danger" : "btn-primary") + '" id="modalConfirm">' + (opts.confirmLabel || "Confirm") + '</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.querySelector("#modalCancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector("#modalConfirm").addEventListener("click", () => {
    overlay.remove();
    if (typeof opts.onConfirm === "function") opts.onConfirm();
  });
};

/* ---------------------------------------------------------------------- */
/* Init on every load (theme should apply even before shell exists)        */
/* ---------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function () {
  IB2.initTheme();
});
