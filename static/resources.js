/* Wayne Industries — Resources Page */
(function () {
  "use strict";

  const TYPE_LABELS = { equipment: "Equipment", vehicle: "Vehicle", security_device: "Security Device" };
  const TYPE_ICONS = { equipment: "package", vehicle: "car", security_device: "shield" };
  const TYPE_NAV_IDS = { equipment: "equipment", vehicle: "vehicles", security_device: "security-devices" };

  let currentResourceType = "equipment";
  let editingResource = null;

  function getResourceType() {
    const params = new URLSearchParams(window.location.search);
    return params.get("type") || "equipment";
  }

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
    const typeLabel = TYPE_LABELS[currentResourceType] || "Equipment";
    $("#resource-dialog-title").textContent = `EDIT ${typeLabel.toUpperCase()}`;
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

  document.addEventListener("DOMContentLoaded", () => {
    currentResourceType = getResourceType();
    const navId = TYPE_NAV_IDS[currentResourceType] || "equipment";

    requireAuth(() => {
      buildNav(navId);
      loadResources();

      $("#btn-add-resource").addEventListener("click", openCreateDialog);
      $("#res-dialog-cancel").addEventListener("click", () => $("#resource-dialog-overlay").classList.add("hidden"));
      $("#res-dialog-save").addEventListener("click", saveResource);
      $("#resource-dialog-overlay").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) $("#resource-dialog-overlay").classList.add("hidden");
      });
    });
  });
})();
