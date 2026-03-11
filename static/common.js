/* ============================================================
   Wayne Industries — Shared Utilities
   ============================================================ */

// ─── State (shared across pages) ───
let currentUser = null;

// ─── DOM Helpers ───
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

// ─── API Helper ───
async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "same-origin",
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ─── Toast ───
function showToast(title, description, variant) {
  let container = $("#toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.className = "toast" + (variant === "destructive" ? " destructive" : "");
  el.innerHTML = `<div class="toast-title">${esc(title)}</div>${description ? `<div class="toast-desc">${esc(description)}</div>` : ""}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ─── Role Helpers ───
function isManagerOrAdmin() {
  return currentUser && (currentUser.role === "manager" || currentUser.role === "security_admin");
}
function isAdmin() {
  return currentUser && currentUser.role === "security_admin";
}

// ─── Nav Items ───
const NAV_ITEMS = [
  { id: "dashboard", href: "/dashboard.html", label: "Dashboard", icon: "layout-dashboard", roles: [] },
  { id: "equipment", href: "/resources.html?type=equipment", label: "Equipment", icon: "package", roles: [] },
  { id: "vehicles", href: "/resources.html?type=vehicle", label: "Vehicles", icon: "car", roles: [] },
  { id: "security-devices", href: "/resources.html?type=security_device", label: "Security Devices", icon: "shield", roles: [] },
  { id: "activity", href: "/activity.html", label: "Activity Logs", icon: "activity", roles: ["manager", "security_admin"] },
  { id: "users", href: "/users.html", label: "User Management", icon: "users", roles: ["security_admin"] },
];

// ─── Build Sidebar Nav ───
function buildNav(activeId) {
  const nav = $("#sidebar-nav");
  if (!nav) return;
  nav.innerHTML = "";
  NAV_ITEMS.forEach((item) => {
    if (item.roles.length > 0 && !item.roles.includes(currentUser?.role)) return;
    const a = document.createElement("a");
    a.className = "nav-item" + (item.id === activeId ? " active" : "");
    a.href = item.href;
    a.innerHTML = `<i data-lucide="${item.icon}"></i><span>${item.label}</span>`;
    nav.appendChild(a);
  });
  lucide.createIcons();
}

// ─── Update User UI in Sidebar ───
function updateUserUI() {
  if (!currentUser) return;
  const nameEl = $("#user-name");
  const avatarEl = $("#user-avatar");
  const badgeEl = $("#user-role-badge");
  if (nameEl) nameEl.textContent = currentUser.full_name || "User";
  if (avatarEl) avatarEl.textContent = (currentUser.full_name || "?").charAt(0).toUpperCase();
  if (badgeEl) {
    badgeEl.textContent = isAdmin() ? "ADMIN" : isManagerOrAdmin() ? "MANAGER" : "EMPLOYEE";
  }
}

// ─── Mobile Sidebar ───
function closeMobileSidebar() {
  const sidebar = $("#sidebar");
  const overlay = $("#mobile-overlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.add("hidden");
}

function initMobileSidebar() {
  const btn = $("#mobile-menu-btn");
  const overlay = $("#mobile-overlay");
  const closeBtn = $("#sidebar-close");
  if (btn) btn.addEventListener("click", () => {
    $("#sidebar").classList.add("open");
    $("#mobile-overlay").classList.remove("hidden");
  });
  if (overlay) overlay.addEventListener("click", closeMobileSidebar);
  if (closeBtn) closeBtn.addEventListener("click", closeMobileSidebar);
}

// ─── Sign Out ───
function initSignOut() {
  const btn = $("#btn-signout");
  if (btn) {
    btn.addEventListener("click", async () => {
      await api("/api/auth/logout", { method: "POST" }).catch(() => {});
      currentUser = null;
      window.location.href = "/login.html";
    });
  }
}

// ─── Auth Guard (for authenticated pages) ───
async function requireAuth(callback) {
  try {
    const data = await api("/api/auth/me");
    currentUser = data.user;
  } catch {
    currentUser = null;
  }
  if (!currentUser) {
    window.location.href = "/login.html";
    return;
  }
  updateUserUI();
  initMobileSidebar();
  initSignOut();
  lucide.createIcons();
  if (callback) callback();
}

// ─── Require Role (redirect to dashboard if insufficient) ───
function requireRole(roles) {
  if (!currentUser || (roles.length > 0 && !roles.includes(currentUser.role))) {
    window.location.href = "/dashboard.html";
    return false;
  }
  return true;
}
