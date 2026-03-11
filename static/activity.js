/* Wayne Industries — Activity Logs Page */
(function () {
  "use strict";

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

  document.addEventListener("DOMContentLoaded", () => {
    requireAuth(() => {
      if (!requireRole(["manager", "security_admin"])) return;
      buildNav("activity");
      loadActivity();
    });
  });
})();
