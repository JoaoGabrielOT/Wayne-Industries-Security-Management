/* ============================================================
   Wayne Industries — Vanilla JS SPA
   ============================================================ */
(function () {
  "use strict";
  // ─── State ───
  let currentUser = null;     // { id, email, full_name, role, avatar_url }
  let currentPage = null;
  let isRegisterMode = false;
  let editingResource = null; // null = creating
  let currentResourceType = "equipment";
  let barChart = null;
  let pieChart = null;
  const TYPE_MAP = { equipment: "equipment", vehicles: "vehicle", "security-devices": "security_device" };
  const TYPE_LABELS = { equipment: "Equipment", vehicle: "Vehicle", security_device: "Security Device" };
  const TYPE_ICONS = { equipment: "package", vehicle: "car", security_device: "shield" };
  const STATUS_LIST = ["active", "inactive", "available", "in_use", "maintenance"];
  const NAV_ITEMS = [
    { id: "dashboard", path: "dashboard", label: "Dashboard", icon: "layout-dashboard", roles: [] },
    { id: "equipment", path: "resources/equipment", label: "Equipment", icon: "package", roles: [] },
    { id: "vehicles", path: "resources/vehicles", label: "Vehicles", icon: "car", roles: [] },
    { id: "security-devices", path: "resources/security-devices", label: "Security Devices", icon: "shield", roles: [] },
    { id: "activity", path: "activity", label: "Activity Logs", icon: "activity", roles: ["manager", "security_admin"] },
    { id: "users", path: "users", label: "User Management", icon: "users", roles: ["security_admin"] },
  ];
  // ─── Helpers ───
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
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
  function showToast(title, description, variant) {
    const container = $("#toast-container");
    const el = document.createElement("div");
    el.className = "toast" + (variant === "destructive" ? " destructive" : "");
    el.innerHTML = `<div class="toast-title">${esc(title)}</div>${description ? `<div class="toast-desc">${esc(description)}</div>` : ""}`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
  function esc(s) { const d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; }
  function isManagerOrAdmin() { return currentUser && (currentUser.role === "manager" || currentUser.role === "security_admin"); }
  function isAdmin() { return currentUser && currentUser.role === "security_admin"; }
  // ─── Router ───
  function navigate(path) {
    history.pushState(null, "", "/" + path);
    route();
  }
  function route() {
    const path = location.pathname.replace(/^\//, "") || "dashboard";
    if (!currentUser) {
      showPage("login");
      return;
    }
    if (path === "login") { navigate("dashboard"); return; }
    if (path.startsWith("resources/")) {
      const typeSlug = path.split("/")[1];
      currentResourceType = TYPE_MAP[typeSlug] || "equipment";
      showPage("resources");
      loadResources();
    } else if (path === "activity") {
      if (!isManagerOrAdmin()) { navigate("dashboard"); return; }
      showPage("activity");
      loadActivity();
    } else if (path === "users") {
      if (!isAdmin()) { navigate("dashboard"); return; }
      showPage("users");
      loadUsers();
    } else {
      showPage("dashboard");
      loadDashboard();
    }
    updateNav();
  }
  function showPage(name) {
    currentPage = name;
    if (name === "login") {
      $("#page-login").classList.remove("hidden");
      $("#app-shell").classList.add("hidden");
    } else {
      $("#page-login").classList.add("hidden");
      $("#app-shell").classList.remove("hidden");
      $$(".page-inner").forEach((el) => el.classList.add("hidden"));
      const target = $(`#page-${name}`);
      if (target) target.classList.remove("hidden");
    }
  }
  // ─── Sidebar / Nav ───
  function buildNav() {
    const nav = $("#sidebar-nav");
    nav.innerHTML = "";
    NAV_ITEMS.forEach((item) => {
      if (item.roles.length > 0 && !item.roles.includes(currentUser?.role)) return;
      const a = document.createElement("a");
      a.className = "nav-item";
      a.href = "/" + item.path;
      a.dataset.navId = item.id;
      a.innerHTML = `<i data-lucide="${item.icon}"></i><span>${item.label}</span>`;
      a.addEventListener("click", (e) => { e.preventDefault(); navigate(item.path); closeMobileSidebar(); });
      nav.appendChild(a);
    });
    lucide.createIcons();
  }
  function updateNav() {
    const path = location.pathname.replace(/^\//, "");
    $$(".nav-item").forEach((el) => {
      const navPath = el.getAttribute("href")?.replace(/^\//, "");
      el.classList.toggle("active", navPath === path);
    });
  }
  function updateUserUI() {
    if (!currentUser) return;
    $("#user-name").textContent = currentUser.full_name || "User";
    $("#user-avatar").textContent = (currentUser.full_name || "?").charAt(0).toUpperCase();
    const badge = isAdmin() ? "ADMIN" : isManagerOrAdmin() ? "MANAGER" : "EMPLOYEE";
    $("#user-role-badge").textContent = badge;
  }
  function closeMobileSidebar() {
    $("#sidebar").classList.remove("open");
    $("#mobile-overlay").classList.add("hidden");
  }
  // ─── Auth ───
  async function checkSession() {
    try {
      const data = await api("/api/auth/me");
      currentUser = data.user;
    } catch {
      currentUser = null;
    }
    if (currentUser) {
      buildNav();
      updateUserUI();
    }
    route();
  }
  async function handleLogin(e) {
    e.preventDefault();
    const email = $("#login-email").value.trim();
    const password = $("#login-password").value;
    const fullName = $("#login-name").value.trim();
    const btn = $("#login-submit");
    btn.disabled = true;
    btn.textContent = "PROCESSING...";
    try {
      if (isRegisterMode) {
        const data = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, full_name: fullName }),
        });
        currentUser = data.user;
        showToast("Account created", "Welcome to Wayne Industries.");
      } else {
        const data = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        currentUser = data.user;
      }
      buildNav();
      updateUserUI();
      navigate("dashboard");
    } catch (err) {
      showToast("Error", err.message, "destructive");
    } finally {
      btn.disabled = false;
      btn.textContent = isRegisterMode ? "REGISTER" : "LOGIN";
    }
  }
  async function handleSignOut() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    currentUser = null;
    navigate("login");
  }
  // ─── Dashboard ───
  async function loadDashboard() {
    try {
      const data = await api("/api/dashboard/stats");
      $("#dashboard-greeting").textContent = `Welcome, ${currentUser?.full_name || "Operative"}`;
      renderStatsGrid(data);
      renderCharts(data);
      renderRecentActivity(data.recentLogs || []);
    } catch (err) {
      showToast("Error", err.message, "destructive");
    }
  }
  function renderStatsGrid(s) {
    const grid = $("#stats-grid");
    const cards = [
      { title: "Equipment", value: s.totalEquipment, icon: "package", variant: "primary" },
      { title: "Vehicles", value: s.totalVehicles, icon: "car", variant: "accent" },
      { title: "Security Devices", value: s.totalDevices, icon: "shield", variant: "success" },
      { title: "Active Devices", value: s.activeDevices, icon: "check-circle", variant: "success" },
      { title: "In Maintenance", value: s.maintenanceItems, icon: "alert-triangle", variant: "warning" },
      { title: "Available", value: s.availableItems, icon: "activity", variant: "primary" },
    ];
    grid.innerHTML = cards.map((c) => `
      <div class="stat-card variant-${c.variant}">
        <div class="stat-card-header">
          <div>
            <div class="stat-card-title">${c.title}</div>
            <div class="stat-card-value">${c.value}</div>
          </div>
          <div class="stat-icon-wrap icon-${c.variant}"><i data-lucide="${c.icon}"></i></div>
        </div>
      </div>
    `).join("");
    lucide.createIcons();
  }
  function renderCharts(s) {
    // Bar chart
    const barCtx = $("#chart-bar").getContext("2d");
    if (barChart) barChart.destroy();
    barChart = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: ["Equipment", "Vehicles", "Devices"],
        datasets: [{ data: [s.totalEquipment, s.totalVehicles, s.totalDevices], backgroundColor: "hsl(210,70%,45%)", borderRadius: 4 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "hsl(215,15%,50%)", font: { size: 11 } }, grid: { display: false } },
          y: { ticks: { color: "hsl(215,15%,50%)", font: { size: 11 } }, grid: { color: "hsl(220,15%,18%)" } },
        },
      },
    });
    // Pie chart
    const pieCtx = $("#chart-pie").getContext("2d");
    const pieData = [
      { label: "Active", value: s.activeDevices, color: "hsl(145,60%,40%)" },
      { label: "Available", value: s.availableItems, color: "hsl(210,70%,45%)" },
      { label: "Maintenance", value: s.maintenanceItems, color: "hsl(35,90%,55%)" },
      { label: "Other", value: s.totalResources - s.activeDevices - s.availableItems - s.maintenanceItems, color: "hsl(220,15%,30%)" },
    ].filter((d) => d.value > 0);
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(pieCtx, {
      type: "doughnut",
      data: {
        labels: pieData.map((d) => d.label),
        datasets: [{ data: pieData.map((d) => d.value), backgroundColor: pieData.map((d) => d.color), borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "60%",
        plugins: { legend: { position: "bottom", labels: { color: "hsl(215,15%,50%)", font: { size: 11 } } } },
      },
    });
  }
  function renderRecentActivity(logs) {
    const section = $("#recent-activity-section");
    const list = $("#recent-activity-list");
    if (!isManagerOrAdmin() || logs.length === 0) { section.classList.add("hidden"); return; }
    section.classList.remove("hidden");
    list.innerHTML = logs.map((l) => `
      <div class="log-item-compact" style="margin-bottom:8px;">
        <i data-lucide="activity"></i>
        <div style="flex:1;min-width:0;">
          <div class="log-text">${esc(l.action)}</div>
          <div class="log-meta">${new Date(l.created_at).toLocaleString()} — ${esc(l.entity_type || "system")}</div>
        </div>
      </div>
    `).join("");
    lucide.createIcons();
  }
  // ─── Resources ───
  async function loadResources() {
    const typeLabel = TYPE_LABELS[currentResourceType] || "Equipment";
    const typeIcon = TYPE_ICONS[currentResourceType] || "package";
    $("#resources-title").innerHTML = `<i data-lucide="${typeIcon}" class="icon-inline"></i> ${typeLabel} Inventory`;
    $("#btn-add-resource-label").textContent = `ADD ${typeLabel.toUpperCase()}`;
    if (isManagerOrAdmin()) {
      $("#btn-add-resource").classList.remove("hidden");
      $("#th-actions").classList.remove("hidden");
    } else {
      $("#btn-add-resource").classList.add("hidden");
      $("#th-actions").classList.add("hidden");
    }
    $("#resources-loading").classList.remove("hidden");
    $("#resources-empty").classList.add("hidden");
    $("#resources-table-wrap").classList.add("hidden");
    try {
      const resources = await api(`/api/resources?type=${currentResourceType}`);
      $("#resources-loading").classList.add("hidden");
      $("#resources-count").textContent = `${resources.length} ${typeLabel.toLowerCase()}(s) registered`;
      if (resources.length === 0) {
        $("#resources-empty").classList.remove("hidden");
      } else {
        $("#resources-table-wrap").classList.remove("hidden");
        renderResourceRows(resources);
      }
    } catch (err) {
      $("#resources-loading").classList.add("hidden");
      showToast("Error", err.message, "destructive");
    }
    lucide.createIcons();
  }
  function renderResourceRows(resources) {
    const tbody = $("#resources-tbody");
    tbody.innerHTML = resources.map((r) => `
      <tr>
        <td style="font-weight:500;color:var(--card-fg);">${esc(r.name)}</td>
        <td><span class="status-badge status-${r.status}">${r.status.replace("_", " ").toUpperCase()}</span></td>
        <td class="hidden-sm text-muted">${esc(r.location)}</td>
        <td class="hidden-md text-muted" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.description || "—")}</td>
        <td class="hidden-lg text-muted" style="font-family:var(--font-mono);font-size:0.75rem;">${new Date(r.updated_at).toLocaleDateString()}</td>
        ${isManagerOrAdmin() ? `
        <td class="actions-cell">
          <button class="btn-icon" onclick="window._editResource('${r.id}', ${JSON.stringify(esc(r.name))}, '${r.status}', ${JSON.stringify(esc(r.location))}, ${JSON.stringify(esc(r.description || ""))})"><i data-lucide="pencil" style="width:16px;height:16px;"></i></button>
          ${isAdmin() ? `<button class="btn-icon danger" onclick="window._deleteResource('${r.id}', ${JSON.stringify(esc(r.name))})"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button>` : ""}
        </td>` : ""}
      </tr>
    `).join("");
    lucide.createIcons();
  }
  window._editResource = function (id, name, status, location, description) {
    editingResource = id;
    $("#resource-dialog-title").textContent = `EDIT ${(TYPE_LABELS[currentResourceType] || "").toUpperCase()}`;
    $("#res-dialog-save").textContent = "UPDATE";
    $("#res-name").value = name;
    $("#res-status").value = status;
    $("#res-location").value = location;
    $("#res-description").value = description;
    $("#resource-dialog-overlay").classList.remove("hidden");
  };
  window._deleteResource = async function (id, name) {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await api(`/api/resources/${id}`, { method: "DELETE" });
      showToast("Deleted", `${name} has been removed.`);
      loadResources();
    } catch (err) {
      showToast("Error", err.message, "destructive");
    }
  };
  function openCreateDialog() {
    editingResource = null;
    const typeLabel = TYPE_LABELS[currentResourceType] || "Equipment";
    $("#resource-dialog-title").textContent = `NEW ${typeLabel.toUpperCase()}`;
    $("#res-dialog-save").textContent = "CREATE";
    $("#res-name").value = "";
    $("#res-status").value = "available";
    $("#res-location").value = "Wayne Tower";
    $("#res-description").value = "";
    $("#resource-dialog-overlay").classList.remove("hidden");
  }
  async function saveResource() {
    const name = $("#res-name").value.trim();
    if (!name) { showToast("Validation Error", "Name is required.", "destructive"); return; }
    const body = {
      name,
      type: currentResourceType,
      status: $("#res-status").value,
      location: $("#res-location").value.trim() || "Wayne Tower",
      description: $("#res-description").value.trim(),
    };
    try {
      if (editingResource) {
        await api(`/api/resources/${editingResource}`, { method: "PUT", body: JSON.stringify(body) });
        showToast("Updated", `${name} has been updated.`);
      } else {
        await api("/api/resources", { method: "POST", body: JSON.stringify(body) });
        showToast("Created", `${name} has been added.`);
      }
      $("#resource-dialog-overlay").classList.add("hidden");
      loadResources();
    } catch (err) {
      showToast("Error", err.message, "destructive");
    }
  }
  // ─── Activity ───
  async function loadActivity() {
    $("#activity-loading").classList.remove("hidden");
    $("#activity-empty").classList.add("hidden");
    $("#activity-list").innerHTML = "";
    try {
      const logs = await api("/api/activity");
      $("#activity-loading").classList.add("hidden");
      if (logs.length === 0) {
        $("#activity-empty").classList.remove("hidden");
      } else {
        $("#activity-list").innerHTML = logs.map((l) => `
          <div class="log-item">
            <i data-lucide="activity"></i>
            <div style="flex:1;min-width:0;">
              <div class="log-text">${esc(l.action)}</div>
              <div class="log-meta">${new Date(l.created_at).toLocaleString()} — ${esc(l.entity_type || "system")}</div>
            </div>
          </div>
        `).join("");
        lucide.createIcons();
      }
    } catch (err) {
      $("#activity-loading").classList.add("hidden");
      showToast("Error", err.message, "destructive");
    }
  }
  // ─── Users ───
  async function loadUsers() {
    $("#users-loading").classList.remove("hidden");
    $("#users-table-wrap").classList.add("hidden");
    try {
      const users = await api("/api/users");
      $("#users-loading").classList.add("hidden");
      $("#users-table-wrap").classList.remove("hidden");
      const tbody = $("#users-tbody");
      tbody.innerHTML = users.map((u) => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="avatar-sm">${(u.full_name || "?").charAt(0).toUpperCase()}</div>
              <span style="font-weight:500;color:var(--card-fg);">${esc(u.full_name)}</span>
            </div>
          </td>
          <td>
            <span class="role-${u.role}" style="font-family:var(--font-mono);font-size:0.75rem;font-weight:600;letter-spacing:0.1em;">
              <i data-lucide="shield-check" style="display:inline;width:12px;height:12px;margin-right:4px;vertical-align:-2px;"></i>
              ${u.role.replace("_", " ").toUpperCase()}
            </span>
          </td>
          <td class="text-right">
            <select class="role-select" data-user-id="${u.user_id}" style="width:160px;margin-left:auto;">
              <option value="employee" ${u.role === "employee" ? "selected" : ""}>Employee</option>
              <option value="manager" ${u.role === "manager" ? "selected" : ""}>Manager</option>
              <option value="security_admin" ${u.role === "security_admin" ? "selected" : ""}>Security Admin</option>
            </select>
          </td>
        </tr>
      `).join("");
      // Bind role change
      tbody.querySelectorAll(".role-select").forEach((sel) => {
        sel.addEventListener("change", async (e) => {
          const userId = e.target.dataset.userId;
          const newRole = e.target.value;
          try {
            const result = await api(`/api/users/${userId}/role`, {
              method: "PUT",
              body: JSON.stringify({ role: newRole }),
            });
            showToast("Role Updated", result.message);
            loadUsers();
          } catch (err) {
            showToast("Error", err.message, "destructive");
          }
        });
      });
      lucide.createIcons();
    } catch (err) {
      $("#users-loading").classList.add("hidden");
      showToast("Error", err.message, "destructive");
    }
  }
  // ─── Init ───
  document.addEventListener("DOMContentLoaded", () => {
    // Login form
    $("#login-form").addEventListener("submit", handleLogin);
    $("#toggle-register").addEventListener("click", () => {
      isRegisterMode = !isRegisterMode;
      $("#register-name-group").classList.toggle("hidden", !isRegisterMode);
      $("#login-title").textContent = isRegisterMode ? "CREATE ACCOUNT" : "SYSTEM ACCESS";
      $("#login-submit").textContent = isRegisterMode ? "REGISTER" : "LOGIN";
      $("#toggle-register").textContent = isRegisterMode
        ? "Already have access? Login"
        : "Request new access? Register";
    });
    $("#toggle-password").addEventListener("click", () => {
      const inp = $("#login-password");
      const isPass = inp.type === "password";
      inp.type = isPass ? "text" : "password";
    });
    // Sign out
    $("#btn-signout").addEventListener("click", handleSignOut);
    // Mobile sidebar
    $("#mobile-menu-btn").addEventListener("click", () => {
      $("#sidebar").classList.add("open");
      $("#mobile-overlay").classList.remove("hidden");
    });
    $("#mobile-overlay").addEventListener("click", closeMobileSidebar);
    $("#sidebar-close").addEventListener("click", closeMobileSidebar);
    // Resource dialog
    $("#btn-add-resource").addEventListener("click", openCreateDialog);
    $("#res-dialog-cancel").addEventListener("click", () => $("#resource-dialog-overlay").classList.add("hidden"));
    $("#res-dialog-save").addEventListener("click", saveResource);
    $("#resource-dialog-overlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) $("#resource-dialog-overlay").classList.add("hidden");
    });
    // Browser navigation
    window.addEventListener("popstate", route);
    // Lucide icons
    lucide.createIcons();
    // Check session
    checkSession();
  });
})();
