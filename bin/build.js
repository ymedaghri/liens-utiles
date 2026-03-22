#!/usr/bin/env node

/**
 * Script de build pour générer un fichier HTML standalone
 * Usage: npm run build
 * Output: dist/doc-survival-kit-{version}.html
 */

const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..");
const DIST_DIR = path.join(SRC_DIR, "dist");
const pkg = require(path.join(SRC_DIR, "package.json"));
const VERSION = pkg.version;

// ══════════════════════════════════════
//  Lecture des fichiers sources
// ══════════════════════════════════════

function readFile(relativePath) {
  return fs.readFileSync(path.join(SRC_DIR, relativePath), "utf8");
}

const sources = {
  indexHtml: readFile("index.html"),
  adminHtml: readFile("admin.html"),
  diagramHtml: readFile("diagram.html"),
  styleCss: readFile("style.css"),
  i18nFr: readFile("i18n/fr.js"),
  i18nEn: readFile("i18n/en.js"),
  i18nJs: readFile("i18n/i18n.js"),
  mesLiens: readFile("mesLiens.js"),
  mesNotes: readFile("mesNotes.js"),
  diagrammes: readFile("diagrammes.js"),
  liens: readFile("liens.js"),
  taches: readFile("taches.js"),
  notes: readFile("notes.js"),
  diagram: readFile("diagram.js"),
};

// ══════════════════════════════════════
//  Extraction du contenu HTML
// ══════════════════════════════════════

/**
 * Extrait le contenu du body sans les balises script
 */
function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) return "";
  return match[1]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .trim();
}

/**
 * Extrait le contenu des balises style inline
 */
function extractInlineStyles(html) {
  const matches = html.match(/<style>([\s\S]*?)<\/style>/gi);
  if (!matches) return "";
  return matches
    .map((m) => m.replace(/<\/?style>/gi, ""))
    .join("\n");
}

/**
 * Extrait le script inline de admin.html
 */
function extractAdminScript(html) {
  const match = html.match(/<script>([\s\S]*?)<\/script>/i);
  return match ? match[1].trim() : "";
}

// ══════════════════════════════════════
//  Transformation des liens
// ══════════════════════════════════════

/**
 * Transforme les liens HTML en hash routing
 */
function transformLinks(html) {
  return html
    // Liens vers admin.html
    .replace(
      /href="admin\.html"([^>]*?)>/g,
      'href="#admin" onclick="navigateTo(\'admin\');return false;"$1>'
    )
    // Liens vers index.html
    .replace(
      /href="index\.html"([^>]*?)>/g,
      'href="#index" onclick="navigateTo(\'index\');return false;"$1>'
    )
    // Liens vers diagram.html
    .replace(
      /href="diagram\.html"([^>]*?)>/g,
      'href="#diagram" onclick="navigateTo(\'diagram\');return false;"$1>'
    );
}

// ══════════════════════════════════════
//  Extraction des boutons de navigation
// ══════════════════════════════════════

/**
 * Extrait les boutons de navigation globaux de index.html
 * (.btn-diagram et .btn-admin)
 */
function extractGlobalNav(html) {
  const btnDiagram = html.match(/<a href="diagram\.html"[^>]*class="btn-diagram"[\s\S]*?<\/a>/i);
  const btnAdmin = html.match(/<a href="admin\.html"[^>]*class="btn-admin"[^>]*>[^<]*<\/a>/i);

  let nav = "";
  if (btnDiagram) {
    nav += transformLinks(btnDiagram[0]) + "\n  ";
  }
  if (btnAdmin) {
    nav += transformLinks(btnAdmin[0]) + "\n  ";
  }
  return nav;
}

/**
 * Retire les boutons de navigation du body index
 */
function removeNavButtons(html) {
  return html
    .replace(/<a href="diagram\.html"[^>]*class="btn-diagram"[\s\S]*?<\/a>/gi, "")
    .replace(/<a href="admin\.html"[^>]*class="btn-admin"[^>]*>[^<]*<\/a>/gi, "");
}

// ══════════════════════════════════════
//  CSS
// ══════════════════════════════════════

const viewNavigationCSS = `
/* ══════════════════════════════════════
   Système de navigation par vues
   ══════════════════════════════════════ */

.view {
  display: none;
}

.view.active {
  display: block;
}

/* Ajustements pour la vue diagram */
#view-diagram.active {
  display: block;
  position: fixed;
  inset: 0;
}

/* Masquer les boutons de navigation dans admin et diagram */
body:has(#view-admin.active) .btn-admin,
body:has(#view-admin.active) .btn-diagram {
  display: none;
}

body:has(#view-diagram.active) .btn-admin,
body:has(#view-diagram.active) .btn-diagram {
  display: none;
}
`;

function buildCSS() {
  return (
    sources.styleCss +
    "\n\n/* ══════════════════════════════════════\n   Styles inline de admin.html\n   ══════════════════════════════════════ */\n\n" +
    extractInlineStyles(sources.adminHtml) +
    "\n" +
    viewNavigationCSS
  );
}

// ══════════════════════════════════════
//  JavaScript
// ══════════════════════════════════════

/**
 * Wrapper pour diagram.js - lazy init
 */
function wrapDiagramJS(js) {
  // Remplacer le DOMContentLoaded par une fonction qu'on appellera manuellement
  return js.replace(
    /document\.addEventListener\("DOMContentLoaded", function \(\) \{/,
    `var _diagramInitialized = false;
function initDiagramView() {
  if (_diagramInitialized) return;
  _diagramInitialized = true;
  // Contenu original du DOMContentLoaded:`
  ).replace(
    // Fermer la fonction à la fin (remplacer la dernière fermeture)
    /\}\);[\s]*$/,
    `}
// L'init sera appelée par le routeur de navigation`
  );
}

const routerJS = `
// ══════════════════════════════════════
//  Routeur de navigation
// ══════════════════════════════════════

var _currentView = "index";

function navigateTo(view) {
  // Masquer toutes les vues
  document.querySelectorAll(".view").forEach(function (v) {
    v.classList.remove("active");
  });

  // Afficher la vue demandée
  var el = document.getElementById("view-" + view);
  if (el) {
    el.classList.add("active");
  }

  // Gérer la classe body pour diagram
  document.body.classList.toggle("diagram-page", view === "diagram");

  // Mettre à jour l'URL (sans recharger)
  if (view !== _currentView) {
    history.pushState(null, "", "#" + view);
  }
  _currentView = view;

  // Initialiser diagram.js si nécessaire
  if (view === "diagram" && typeof initDiagramView === "function") {
    initDiagramView();
  }

  // Réappliquer les traductions pour la vue
  if (typeof applyI18n === "function") {
    applyI18n();
  }
}

// Écouter les changements de hash
window.addEventListener("hashchange", function () {
  var view = location.hash.slice(1) || "index";
  if (view !== _currentView) {
    navigateTo(view);
  }
});

// Initialisation au chargement
window.addEventListener("load", function () {
  var view = location.hash.slice(1) || "index";
  navigateTo(view);
});
`;

function buildJS() {
  const parts = [
    "// ══════════════════════════════════════",
    "//  doc-survival-kit v" + VERSION + " — Bundle standalone",
    "// ══════════════════════════════════════",
    "",
    "// ── i18n/fr.js ──",
    sources.i18nFr,
    "",
    "// ── i18n/en.js ──",
    sources.i18nEn,
    "",
    "// ── i18n/i18n.js ──",
    sources.i18nJs,
    "",
    "// ── mesLiens.js ──",
    sources.mesLiens,
    "",
    "// ── mesNotes.js ──",
    sources.mesNotes,
    "",
    "// ── diagrammes.js ──",
    sources.diagrammes,
    "",
    "// ── taches.js ──",
    sources.taches,
    "",
    "// ── liens.js ──",
    sources.liens,
    "",
    "// ── notes.js ──",
    sources.notes,
    "",
    "// ── diagram.js (avec lazy init) ──",
    wrapDiagramJS(sources.diagram),
    "",
    "// ── admin.js (inline) ──",
    extractAdminScript(sources.adminHtml),
    "",
    routerJS,
  ];

  return parts.join("\n");
}

// ══════════════════════════════════════
//  Assemblage HTML
// ══════════════════════════════════════

function buildHTML() {
  // Extraire les bodies
  let indexBody = extractBody(sources.indexHtml);
  let adminBody = extractBody(sources.adminHtml);
  let diagramBody = extractBody(sources.diagramHtml);

  // Retirer les boutons de navigation du body index (ils seront globaux)
  indexBody = removeNavButtons(indexBody);

  // Transformer les liens de navigation
  adminBody = transformLinks(adminBody);
  diagramBody = transformLinks(diagramBody);

  // Boutons de navigation globaux
  const globalNav = extractGlobalNav(sources.indexHtml);

  // Construire le HTML final
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title data-i18n="page_title">Dashboard — doc-survival-kit v${VERSION}</title>
  <style>
${buildCSS()}
  </style>
</head>
<body>
  <!-- Navigation globale -->
  ${globalNav}

  <!-- ══════════════════════════════════════
       Vue Index (Dashboard principal)
       ══════════════════════════════════════ -->
  <div id="view-index" class="view active">
    ${indexBody}
  </div>

  <!-- ══════════════════════════════════════
       Vue Admin
       ══════════════════════════════════════ -->
  <div id="view-admin" class="view">
    ${adminBody}
  </div>

  <!-- ══════════════════════════════════════
       Vue Diagram
       ══════════════════════════════════════ -->
  <div id="view-diagram" class="view">
    ${diagramBody}
  </div>

  <script>
${buildJS()}
  </script>
</body>
</html>`;
}

// ══════════════════════════════════════
//  Build
// ══════════════════════════════════════

function build() {
  console.log("Building doc-survival-kit v" + VERSION + "...");

  // Créer le dossier dist si nécessaire
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Générer le HTML
  const html = buildHTML();

  // Écrire le fichier
  const outputPath = path.join(DIST_DIR, `doc-survival-kit-${VERSION}.html`);
  fs.writeFileSync(outputPath, html, "utf8");

  // Stats
  const sizeKB = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
  console.log("");
  console.log("✓ Build terminé :");
  console.log("  Fichier : " + outputPath);
  console.log("  Taille  : " + sizeKB + " KB");
  console.log("");
  console.log("Ouvre le fichier dans Chrome ou Edge pour l'utiliser.");
}

build();
