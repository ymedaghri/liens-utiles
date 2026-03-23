// ── Données des liens ────────────────────────────────────────────────
const LIENS_KEY = "mes_liens";
var expandedCatTitres = (function () {
  try { return JSON.parse(localStorage.getItem("expanded_cat_titres")) || {}; } catch (e) { return {}; }
})();

function loadLiens() {
  try {
    return JSON.parse(localStorage.getItem(LIENS_KEY)) || mesLiensDefaut;
  } catch {
    return mesLiensDefaut;
  }
}

function saveLiens(data) {
  localStorage.setItem(LIENS_KEY, JSON.stringify(data));
}

function checkDiff() {
  const stored = localStorage.getItem(LIENS_KEY);
  const areDifferent = stored !== JSON.stringify(mesLiensDefaut);
  document.getElementById("btnSave").style.display = areDifferent
    ? "inline-flex"
    : "none";
}

// ── Persistance du FileSystemFileHandle via IndexedDB ────────────────
const IDB_NAME = "doc-survival-kit-db";
const IDB_STORE = "fileHandles";
const IDB_KEY = "mesLiens";

function ouvrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function sauvegarderHandle(handle) {
  const db = await ouvrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function recupererHandle() {
  const db = await ouvrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = (e) => resolve(e.target.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

// ── Enregistrement du fichier mesLiens.js ────────────────────────────
async function enregistrerModifications() {
  if (!("showSaveFilePicker" in window)) {
    console.error("File System Access API non disponible dans ce navigateur.");
    return;
  }

  const handle = await recupererHandle();

  if (!handle) {
    document.getElementById("erreurFichierLiens").style.display = "none";
    document.getElementById("modalPremiereSauvegarde").classList.add("open");
    return;
  }

  await ecrireFichier(handle);
}

function fermerModalPremiereSauvegarde() {
  document.getElementById("modalPremiereSauvegarde").classList.remove("open");
}

async function ouvrirSelecteurFichier() {
  fermerModalPremiereSauvegarde();
  try {
    const dirHandle = await window.showDirectoryPicker();
    const handle = await dirHandle.getFileHandle("mesLiens.js");
    document.getElementById("erreurFichierLiens").style.display = "none";
    await sauvegarderHandle(handle);
    await ecrireFichier(handle);
  } catch (err) {
    if (err.name === "NotFoundError") {
      document.getElementById("erreurFichierLiens").style.display = "block";
      document.getElementById("modalPremiereSauvegarde").classList.add("open");
    } else if (err.name !== "AbortError") {
      console.error("Erreur lors de la sélection du dossier :", err);
    }
  }
}

async function ecrireFichier(handle) {
  try {
    let permission = await handle.queryPermission({ mode: "readwrite" });
    if (permission !== "granted") {
      permission = await handle.requestPermission({ mode: "readwrite" });
    }
    if (permission !== "granted") {
      console.error("Permission d'écriture refusée.");
      return;
    }
    const data = loadLiens();
    const content =
      "var mesLiensDefaut = " + JSON.stringify(data, null, 2) + ";\n";
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    mesLiensDefaut = data;
    checkDiff();
    console.log("mesLiens.js enregistré avec succès.", data);
  } catch (err) {
    console.error("Erreur lors de l'enregistrement :", err);
  }
}

document
  .getElementById("modalPremiereSauvegarde")
  .addEventListener("click", function (e) {
    if (e.target === this) fermerModalPremiereSauvegarde();
  });

function toggleCat(titre) {
  if (expandedCatTitres[titre]) {
    delete expandedCatTitres[titre];
  } else {
    expandedCatTitres[titre] = true;
  }
  localStorage.setItem("expanded_cat_titres", JSON.stringify(expandedCatTitres));
  renderLiens();
}

function toggleAllLiens() {
  const data = loadLiens();
  const allExpanded = data.length > 0 && data.every(function (c) { return expandedCatTitres[c.titre]; });
  if (allExpanded) {
    expandedCatTitres = {};
  } else {
    data.forEach(function (c) { expandedCatTitres[c.titre] = true; });
  }
  localStorage.setItem("expanded_cat_titres", JSON.stringify(expandedCatTitres));
  renderLiens();
}

function updateToggleAllLiensBtn() {
  const btn = document.getElementById("btnToggleAllLiens");
  if (!btn) return;
  const data = loadLiens();
  const allExpanded = data.length > 0 && data.every(function (c) { return expandedCatTitres[c.titre]; });
  btn.textContent = allExpanded ? window.t.liens_btn_collapse_all : window.t.liens_btn_expand_all;
}

function renderLiens() {
  const data = loadLiens();
  const container = document.getElementById("linksContainer");
  container.innerHTML = data
    .map(
      (cat, idx) => {
        const isCollapsed = !expandedCatTitres[cat.titre];
        return `
      <section class="${cat.theme}${isCollapsed ? " collapsed" : ""}">
        <div class="cat-header">
          <h2>${cat.titre}</h2>
          <div class="cat-actions">
            <button class="btn-add-link" onclick="ouvrirModalLien(${idx})" title="${window.t.liens_add_link_title}">＋</button>
            <button class="btn-del-cat" onclick="ouvrirConfirmSupprCat(${idx})" title="${window.t.liens_del_cat_title}">✕</button>
          </div>
          <button class="btn-toggle-cat" onclick="toggleCat('${cat.titre.replace(/'/g, "\\'")}')" title="${isCollapsed ? window.t.liens_btn_expand : window.t.liens_btn_collapse}">
            <svg viewBox="0 0 10 6" width="10" height="6"><path d="M1 1 L5 5 L9 1" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="links">
          ${cat.liens
            .map(
              (l, lidx) => `
          <a href="${l.url}" target="_blank" class="link">
            <div>
              <span class="link-name">${l.nom}</span
              ><span class="link-desc">— ${l.desc}</span>
            </div>
            <span class="arrow">↗</span>
            <div class="link-actions">
              <button class="btn-edit-link" onclick="ouvrirModalEditLien(event, ${idx}, ${lidx})" title="${window.t.liens_edit_link_title}">✎</button>
              <button class="btn-del-link" onclick="supprimerLien(event, ${idx}, ${lidx})" title="${window.t.liens_del_link_title}">✕</button>
            </div>
          </a>`,
            )
            .join("")}
        </div>
      </section>`;
      },
    )
    .join("");
  checkDiff();
  updateToggleAllLiensBtn();
}

if (!localStorage.getItem(LIENS_KEY)) {
  saveLiens(mesLiensDefaut);
}

renderLiens();

// ── Ajout de catégorie ───────────────────────────────────────────────
function openModalCategorie() {
  document.getElementById("catNom").value = "";
  document.getElementById("catCouleur").value = "t-green";
  document.getElementById("modalCategorie").classList.add("open");
  document.getElementById("catNom").focus();
}

function closeModalCategorie() {
  document.getElementById("modalCategorie").classList.remove("open");
}

function confirmerCategorie() {
  const nom = document.getElementById("catNom").value.trim();
  if (!nom) {
    document.getElementById("catNom").focus();
    return;
  }
  const theme = document.getElementById("catCouleur").value;
  const data = loadLiens();
  data.push({ theme, titre: nom, liens: [] });
  saveLiens(data);
  renderLiens();
  closeModalCategorie();
}

document
  .getElementById("modalCategorie")
  .addEventListener("click", function (e) {
    if (e.target === this) closeModalCategorie();
  });

// ── Suppression de catégorie ─────────────────────────────────────────
let idxCatASupprimer = null;

function ouvrirConfirmSupprCat(idx) {
  idxCatASupprimer = idx;
  document.getElementById("modalConfirmSupprCat").classList.add("open");
}

function fermerConfirmSupprCat() {
  idxCatASupprimer = null;
  document.getElementById("modalConfirmSupprCat").classList.remove("open");
}

function supprimerCategorie() {
  if (idxCatASupprimer === null) return;
  const data = loadLiens();
  data.splice(idxCatASupprimer, 1);
  saveLiens(data);
  renderLiens();
  fermerConfirmSupprCat();
}

document
  .getElementById("modalConfirmSupprCat")
  .addEventListener("click", function (e) {
    if (e.target === this) fermerConfirmSupprCat();
  });

// ── Ajout d'un lien dans une catégorie ──────────────────────────────
let idxCatLien = null;

function ouvrirModalLien(idx) {
  idxCatLien = idx;
  document.getElementById("lienNom").value = "";
  document.getElementById("lienDesc").value = "";
  document.getElementById("lienUrl").value = "";
  document.getElementById("modalLien").classList.add("open");
  document.getElementById("lienNom").focus();
}

function fermerModalLien() {
  idxCatLien = null;
  document.getElementById("modalLien").classList.remove("open");
}

function confirmerLien() {
  const nom = document.getElementById("lienNom").value.trim();
  const desc = document.getElementById("lienDesc").value.trim();
  const url = document.getElementById("lienUrl").value.trim();
  if (!nom || !url) {
    document.getElementById(!nom ? "lienNom" : "lienUrl").focus();
    return;
  }
  const data = loadLiens();
  data[idxCatLien].liens.push({ nom, desc, url });
  saveLiens(data);
  renderLiens();
  fermerModalLien();
}

document.getElementById("modalLien").addEventListener("click", function (e) {
  if (e.target === this) fermerModalLien();
});

// ── Suppression d'un lien individuel ────────────────────────────────
let supprLienCatIdx = null;
let supprLienIdx = null;

function supprimerLien(event, catIdx, lienIdx) {
  event.preventDefault();
  supprLienCatIdx = catIdx;
  supprLienIdx = lienIdx;
  document.getElementById("modalConfirmSupprLien").classList.add("open");
}

function fermerConfirmSupprLien() {
  supprLienCatIdx = null;
  supprLienIdx = null;
  document.getElementById("modalConfirmSupprLien").classList.remove("open");
}

function confirmerSupprLien() {
  if (supprLienCatIdx === null) return;
  const data = loadLiens();
  data[supprLienCatIdx].liens.splice(supprLienIdx, 1);
  saveLiens(data);
  renderLiens();
  fermerConfirmSupprLien();
}

document
  .getElementById("modalConfirmSupprLien")
  .addEventListener("click", function (e) {
    if (e.target === this) fermerConfirmSupprLien();
  });

// ── Édition d'un lien ────────────────────────────────────────────────
let editLienCatIdx = null;
let editLienIdx = null;

function ouvrirModalEditLien(event, catIdx, lienIdx) {
  event.preventDefault();
  editLienCatIdx = catIdx;
  editLienIdx = lienIdx;
  const lien = loadLiens()[catIdx].liens[lienIdx];
  document.getElementById("editLienNom").value = lien.nom;
  document.getElementById("editLienDesc").value = lien.desc;
  document.getElementById("editLienUrl").value = lien.url;
  document.getElementById("modalEditLien").classList.add("open");
  document.getElementById("editLienNom").focus();
}

function fermerModalEditLien() {
  editLienCatIdx = null;
  editLienIdx = null;
  document.getElementById("modalEditLien").classList.remove("open");
}

function confirmerEditLien() {
  const nom = document.getElementById("editLienNom").value.trim();
  const desc = document.getElementById("editLienDesc").value.trim();
  const url = document.getElementById("editLienUrl").value.trim();
  if (!nom || !url) {
    document.getElementById(!nom ? "editLienNom" : "editLienUrl").focus();
    return;
  }
  const data = loadLiens();
  data[editLienCatIdx].liens[editLienIdx] = { nom, desc, url };
  saveLiens(data);
  renderLiens();
  fermerModalEditLien();
}

document
  .getElementById("modalEditLien")
  .addEventListener("click", function (e) {
    if (e.target === this) fermerModalEditLien();
  });

// ── Mode édition ─────────────────────────────────────────────────────
function toggleEditMode() {
  const container = document.getElementById("linksContainer");
  const btn = document.getElementById("btnEditMode");
  const actif = container.classList.toggle("edit-mode");
  btn.textContent = actif
    ? window.t.liens_btn_quit_edit_mode
    : window.t.liens_btn_edit_mode;
}
