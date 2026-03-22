// ══════════════════════════════════════
//  mesNotes — CRUD notes (localStorage)
// ══════════════════════════════════════

var noteIdxASupprimer = null;
var noteIdxEnEdition = null;
var noteBlocNoteIdx = null;
var noteBlocBlocIdx = null;
var supprBlocNoteIdx = null;
var supprBlocBlocIdx = null;

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem("mes_notes")) || mesNotesDefaut;
  } catch (e) {
    return mesNotesDefaut;
  }
}

function saveNotes(data) {
  localStorage.setItem("mes_notes", JSON.stringify(data));
  showSavedNotes();
}

// ── Indicateur de sauvegarde ──
var _saveTimeoutNotes = null;
function showSavedNotes() {
  var el = document.getElementById("saveIndicatorNotes");
  if (!el) return;
  el.classList.add("visible");
  if (_saveTimeoutNotes) clearTimeout(_saveTimeoutNotes);
  _saveTimeoutNotes = setTimeout(function () {
    el.classList.remove("visible");
  }, 1500);
}

function renderNotes() {
  var notes = loadNotes();
  var container = document.getElementById("notesContainer");
  if (!container) return;
  var hadEditMode = container.classList.contains("edit-mode");

  if (notes.length === 0) {
    container.innerHTML =
      '<p class="empty-msg">' + window.t.notes_empty + "</p>";
  } else {
    container.innerHTML = notes
      .map(function (note, nIdx) {
        var blocsHtml = note.blocs
          .map(function (bloc, bIdx) {
            var inner = "";
            if (bloc.type === "b") {
              inner = "<b>" + esc(bloc.content) + "</b>";
            } else if (bloc.type === "p") {
              inner = "<p>" + esc(bloc.content) + "</p>";
            } else if (bloc.type === "pre") {
              inner =
                '<div class="pre-wrapper"><pre>' +
                esc(bloc.content) +
                "</pre>" +
                '<button class="btn-copy-pre" onclick="copierBloc(this)">' +
                window.t.notes_btn_copy +
                "</button>" +
                "</div>";
            } else if (bloc.type === "ul") {
              inner =
                "<ul>" +
                bloc.items
                  .map(function (i) {
                    return "<li>" + esc(i) + "</li>";
                  })
                  .join("") +
                "</ul>";
            } else if (bloc.type === "table") {
              inner =
                '<div class="table-wrapper"><table>' +
                "<thead><tr>" +
                bloc.headers.map(function(h) { return "<th>" + esc(h) + "</th>"; }).join("") +
                "</tr></thead>" +
                "<tbody>" +
                bloc.rows.map(function(row) {
                  return "<tr>" + row.map(function(c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
                }).join("") +
                "</tbody></table></div>";
            }
            return (
              '<div class="bloc-wrapper">' +
              inner +
              '<div class="bloc-actions">' +
              '<button class="btn-edit-bloc" onclick="ouvrirModalEditBloc(' +
              nIdx +
              "," +
              bIdx +
              ')">' +
              window.t.notes_btn_edit_bloc +
              "</button>" +
              '<button class="btn-del-bloc" onclick="ouvrirConfirmSupprBloc(' +
              nIdx +
              "," +
              bIdx +
              ')">×</button>' +
              "</div></div>"
            );
          })
          .join("");

        return (
          '<div class="note ' +
          esc(note.theme) +
          '">' +
          '<div class="note-header">' +
          "<h2>" +
          esc(note.titre) +
          "</h2>" +
          '<div class="note-actions">' +
          '<button class="btn-edit-note" onclick="ouvrirModalEditNote(' +
          nIdx +
          ')">' +
          window.t.notes_btn_edit_note +
          "</button>" +
          '<button class="btn-del-note" onclick="ouvrirConfirmSupprNote(' +
          nIdx +
          ')">×</button>' +
          "</div></div>" +
          '<div class="note-content">' +
          (blocsHtml || "") +
          "</div>" +
          '<div class="note-footer">' +
          '<button class="btn-add-bloc" onclick="ouvrirModalBloc(' +
          nIdx +
          ')">' +
          window.t.notes_btn_add_bloc +
          "</button>" +
          "</div></div>"
        );
      })
      .join("");
  }

  if (hadEditMode) container.classList.add("edit-mode");
}

// ── Toggle mode édition ──
function toggleEditModeNotes() {
  var container = document.getElementById("notesContainer");
  var btn = document.getElementById("btnEditModeNotes");
  if (container.classList.toggle("edit-mode")) {
    btn.textContent = window.t.notes_btn_quit_edit_mode;
  } else {
    btn.textContent = window.t.notes_btn_edit_mode;
  }
}

// ── Nouvelle note ──
function openModalNote() {
  document.getElementById("noteNom").value = "";
  document.getElementById("noteCouleur").value = "t-green";
  document.getElementById("modalNote").classList.add("open");
  setTimeout(function () {
    document.getElementById("noteNom").focus();
  }, 50);
}

function closeModalNote() {
  document.getElementById("modalNote").classList.remove("open");
}

function confirmerNote() {
  var titre = document.getElementById("noteNom").value.trim();
  if (!titre) return;
  var notes = loadNotes();
  notes.push({
    id: Date.now(),
    theme: document.getElementById("noteCouleur").value,
    titre: titre,
    blocs: [],
  });
  saveNotes(notes);
  closeModalNote();
  renderNotes();
}

// ── Édition note ──
function ouvrirModalEditNote(idx) {
  noteIdxEnEdition = idx;
  var note = loadNotes()[idx];
  document.getElementById("editNoteNom").value = note.titre;
  document.getElementById("editNoteCouleur").value = note.theme;
  document.getElementById("modalEditNote").classList.add("open");
  setTimeout(function () {
    document.getElementById("editNoteNom").focus();
  }, 50);
}

function fermerModalEditNote() {
  document.getElementById("modalEditNote").classList.remove("open");
  noteIdxEnEdition = null;
}

function confirmerEditNote() {
  if (noteIdxEnEdition === null) return;
  var titre = document.getElementById("editNoteNom").value.trim();
  if (!titre) return;
  var notes = loadNotes();
  notes[noteIdxEnEdition].titre = titre;
  notes[noteIdxEnEdition].theme =
    document.getElementById("editNoteCouleur").value;
  saveNotes(notes);
  fermerModalEditNote();
  renderNotes();
}

// ── Suppression note ──
function ouvrirConfirmSupprNote(idx) {
  noteIdxASupprimer = idx;
  document.getElementById("modalConfirmSupprNote").classList.add("open");
}

function fermerConfirmSupprNote() {
  document.getElementById("modalConfirmSupprNote").classList.remove("open");
  noteIdxASupprimer = null;
}

function supprimerNote() {
  if (noteIdxASupprimer === null) return;
  var notes = loadNotes();
  notes.splice(noteIdxASupprimer, 1);
  saveNotes(notes);
  fermerConfirmSupprNote();
  renderNotes();
}

// ── Ajout / édition bloc ──
function updateBlocPlaceholder() {
  var type = document.getElementById("blocType").value;
  var ta = document.getElementById("blocContent");
  var inp = document.getElementById("blocContentInput");
  var useInput = type === "b" || type === "p";
  inp.style.display = useInput ? "" : "none";
  ta.style.display = useInput ? "none" : "";
  if (type === "ul") ta.placeholder = window.t.modal_bloc_placeholder_ul;
  else if (type === "pre") ta.placeholder = window.t.modal_bloc_placeholder_pre;
  else if (type === "table") ta.placeholder = window.t.modal_bloc_placeholder_table;
  else if (type === "b") inp.placeholder = window.t.modal_bloc_placeholder_b;
  else inp.placeholder = window.t.modal_bloc_placeholder_p;
}

function ouvrirModalBloc(noteIdx) {
  noteBlocNoteIdx = noteIdx;
  noteBlocBlocIdx = null;
  document.getElementById("modalBlocTitre").textContent =
    window.t.modal_bloc_new;
  document.getElementById("blocType").value = "p";
  document.getElementById("blocContent").value = "";
  document.getElementById("blocContentInput").value = "";
  updateBlocPlaceholder();
  document.getElementById("modalBloc").classList.add("open");
  setTimeout(function () {
    document.getElementById("blocContentInput").focus();
  }, 50);
}

function ouvrirModalEditBloc(noteIdx, blocIdx) {
  noteBlocNoteIdx = noteIdx;
  noteBlocBlocIdx = blocIdx;
  var bloc = loadNotes()[noteIdx].blocs[blocIdx];
  document.getElementById("modalBlocTitre").textContent =
    window.t.modal_bloc_edit;
  document.getElementById("blocType").value = bloc.type;
  var useInput = bloc.type === "b" || bloc.type === "p";
  document.getElementById("blocContentInput").value = useInput
    ? bloc.content
    : "";
  document.getElementById("blocContent").value = useInput
    ? ""
    : bloc.type === "ul"
      ? bloc.items.join("\n")
      : bloc.type === "table"
        ? [bloc.headers.join(" | ")].concat(bloc.rows.map(function(r) { return r.join(" | "); })).join("\n")
        : bloc.content;
  updateBlocPlaceholder();
  document.getElementById("modalBloc").classList.add("open");
  setTimeout(function () {
    document
      .getElementById(useInput ? "blocContentInput" : "blocContent")
      .focus();
  }, 50);
}

function fermerModalBloc() {
  document.getElementById("modalBloc").classList.remove("open");
  noteBlocNoteIdx = null;
  noteBlocBlocIdx = null;
}

function confirmerBloc() {
  var type = document.getElementById("blocType").value;
  var useInput = type === "b" || type === "p";
  var raw = document.getElementById(
    useInput ? "blocContentInput" : "blocContent",
  ).value;
  if (!raw.trim()) return;
  var bloc;
  if (type === "ul") {
    var items = raw
      .split("\n")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    if (!items.length) return;
    bloc = { type: "ul", items: items };
  } else if (type === "table") {
    var lines = raw.split("\n").map(function(l) { return l.trim(); }).filter(Boolean);
    if (lines.length < 1) return;
    var headers = lines[0].split("|").map(function(c) { return c.trim(); });
    var rows = lines.slice(1).map(function(l) {
      return l.split("|").map(function(c) { return c.trim(); });
    });
    bloc = { type: "table", headers: headers, rows: rows };
  } else {
    bloc = { type: type, content: raw };
  }
  var notes = loadNotes();
  if (noteBlocBlocIdx === null) {
    notes[noteBlocNoteIdx].blocs.push(bloc);
  } else {
    notes[noteBlocNoteIdx].blocs[noteBlocBlocIdx] = bloc;
  }
  saveNotes(notes);
  fermerModalBloc();
  renderNotes();
}

// ── Suppression bloc ──
function ouvrirConfirmSupprBloc(noteIdx, blocIdx) {
  supprBlocNoteIdx = noteIdx;
  supprBlocBlocIdx = blocIdx;
  document.getElementById("modalConfirmSupprBloc").classList.add("open");
}

function fermerConfirmSupprBloc() {
  document.getElementById("modalConfirmSupprBloc").classList.remove("open");
  supprBlocNoteIdx = null;
  supprBlocBlocIdx = null;
}

function supprimerBloc() {
  if (supprBlocNoteIdx === null || supprBlocBlocIdx === null) return;
  var notes = loadNotes();
  notes[supprBlocNoteIdx].blocs.splice(supprBlocBlocIdx, 1);
  saveNotes(notes);
  fermerConfirmSupprBloc();
  renderNotes();
}

// ── Copier un bloc pre ──
function copierBloc(btn) {
  var content = btn.closest(".pre-wrapper").querySelector("pre").textContent;
  navigator.clipboard.writeText(content).then(function () {
    btn.textContent = window.t.notes_btn_copied;
    btn.classList.add("copied");
    setTimeout(function () {
      btn.textContent = window.t.notes_btn_copy;
      btn.classList.remove("copied");
    }, 1500);
  });
}

// ── Init ──
document.addEventListener("DOMContentLoaded", function () {
  if (!localStorage.getItem("mes_notes")) {
    saveNotes(mesNotesDefaut);
  }
  renderNotes();
  [
    "modalNote",
    "modalEditNote",
    "modalConfirmSupprNote",
    "modalBloc",
    "modalConfirmSupprBloc",
  ].forEach(function (id) {
    var el = document.getElementById(id);
    if (el)
      el.addEventListener("click", function (e) {
        if (e.target === el) el.classList.remove("open");
      });
  });
});
