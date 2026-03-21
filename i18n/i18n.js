(function () {
  var lang = localStorage.getItem("lang") || "fr";
  window.t = lang === "en" ? i18n_en : i18n_fr;

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (window.t[key] !== undefined) el.textContent = window.t[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (window.t[key] !== undefined) el.innerHTML = window.t[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (window.t[key] !== undefined) el.placeholder = window.t[key];
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-title");
      if (window.t[key] !== undefined) el.title = window.t[key];
    });
    document.documentElement.lang = lang === "en" ? "en" : "fr";
  }

  window.applyI18n = applyI18n;
  document.addEventListener("DOMContentLoaded", applyI18n);
})();
