/* Wayne Industries — Dashboard Page */
(function () {
  "use strict";

  let barChart = null;
  let pieChart = null;

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

  document.addEventListener("DOMContentLoaded", () => {
    requireAuth(() => {
      buildNav("dashboard");
      loadDashboard();
    });
  });
})();
