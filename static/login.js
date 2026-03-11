/* Wayne Industries — Login Page */
(function () {
  "use strict";

  let isRegisterMode = false;

  async function checkAlreadyLoggedIn() {
    try {
      const data = await api("/api/auth/me");
      if (data.user) {
        window.location.href = "/dashboard.html";
        return;
      }
    } catch {}
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
      window.location.href = "/dashboard.html";
    } catch (err) {
      showToast("Error", err.message, "destructive");
    } finally {
      btn.disabled = false;
      btn.textContent = isRegisterMode ? "REGISTER" : "LOGIN";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    checkAlreadyLoggedIn();

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
      inp.type = inp.type === "password" ? "text" : "password";
    });
  });
})();
