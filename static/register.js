/* Wayne Industries — Register Page */
(function () {
  "use strict";

  async function handleRegister(e) {
    e.preventDefault();
    const fullName = $("#reg-name").value.trim();
    const email = $("#reg-email").value.trim();
    const password = $("#reg-password").value;
    const btn = $("#reg-submit");
    btn.disabled = true;
    btn.textContent = "PROCESSING...";

    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      currentUser = data.user;
      showToast("Account created", "Welcome to Wayne Industries.");
      window.location.href = "/dashboard.html";
    } catch (err) {
      showToast("Error", err.message, "destructive");
    } finally {
      btn.disabled = false;
      btn.textContent = "REGISTER";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();

    $("#register-form").addEventListener("submit", handleRegister);

    $("#toggle-password").addEventListener("click", () => {
      const inp = $("#reg-password");
      inp.type = inp.type === "password" ? "text" : "password";
    });
  });
})();
