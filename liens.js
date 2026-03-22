// ── Données des liens ────────────────────────────────────────────────
const LIENS_KEY = "mes_liens";

function loadLiens() {
  try {
    return JSON.parse(localStorage.getItem(LIENS_KEY)) || mesLiensDefaut;
  } catch {
    return mesLiensDefaut;
  }
}

function saveLiens(data) {
  localStorage.setItem(LIENS_KEY, JSON.stringify(data));
  showSavedLiens();
}

// ── Indicateur de sauvegarde ─────────────────────────────────────────
var _saveTimeoutLiens = null;
function showSavedLiens() {
  var el = document.getElementById("saveIndicatorLiens");
  if (!el) return;
  el.classList.add("visible");
  if (_saveTimeoutLiens) clearTimeout(_saveTimeoutLiens);
  _saveTimeoutLiens = setTimeout(function () {
    el.classList.remove("visible");
  }, 1500);
}

function renderLiens() {
  const data = loadLiens();
  const container = document.getElementById("linksContainer");
  container.innerHTML = data
    .map(
      (cat, idx) => `
      <section class="${cat.theme}">
        <div class="cat-header">
          <h2>${cat.titre}</h2>
          <div class="cat-actions">
            <button class="btn-add-link" onclick="ouvrirModalLien(${idx})" title="${window.t.liens_add_link_title}">＋</button>
            <button class="btn-del-cat" onclick="ouvrirConfirmSupprCat(${idx})" title="${window.t.liens_del_cat_title}">✕</button>
          </div>
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
      </section>`,
    )
    .join("");
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
