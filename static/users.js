/* Wayne Industries — Users Page */
(function () {
  "use strict";

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

  document.addEventListener("DOMContentLoaded", () => {
    requireAuth(() => {
      if (!requireRole(["security_admin"])) return;
      buildNav("users");
      loadUsers();
    });
  });
})();
