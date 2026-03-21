// ══════════════════════════════════════
//  mesDiagrammes — Éditeur SVG
// ══════════════════════════════════════

// ── État global ──
var currentTool = "select";
var diagramsList = [];
var currentDiagramIdx = 0;
var viewTransform = { x: 60, y: 60, scale: 1 };
var selectedId = null;
var selectedType = null;   // "shape" | "arrow"
var dragState = null;
var panStart = null;
var arrowSrcId = null;
var editingShapeId = null;
var lastClickTime = 0;
var lastClickShapeId = null;
var lastClickArrowId = null;
var editingArrowId = null;

// ── Palette ──
var COLORS = {
  "t-green":  { fill: "rgba(209,250,229,0.75)", stroke: "#059669", text: "#047857" },
  "t-violet": { fill: "rgba(237,233,254,0.75)", stroke: "#7c3aed", text: "#6d28d9" },
  "t-amber":  { fill: "rgba(254,243,199,0.75)", stroke: "#d97706", text: "#b45309" },
  "t-sky":    { fill: "rgba(224,242,254,0.75)", stroke: "#0284c7", text: "#0369a1" },
  "t-rose":   { fill: "rgba(255,228,230,0.75)", stroke: "#e11d48", text: "#be123c" },
  "t-teal":   { fill: "rgba(204,251,241,0.75)", stroke: "#0d9488", text: "#0f766e" },
};
var DEFAULT_COLOR = "t-sky";

var DEFAULT_SIZES = {
  rect:    { w: 130, h: 50 },
  rounded: { w: 130, h: 50 },
  db:      { w: 100, h: 65 },
  cloud:   { w: 110, h: 65 },
  text:    { w: 110, h: 34 },
};

// ── Helpers ──
function escDiag(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createSVGEl(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function getCurrentDiagram() {
  return diagramsList[currentDiagramIdx] || null;
}

// ── Persistance localStorage ──
function loadDiagrammes() {
  try {
    var stored = JSON.parse(localStorage.getItem("mes_diagrammes"));
    if (stored && stored.length) return stored;
  } catch (e) {}
  return JSON.parse(JSON.stringify(diagrammesDefaut));
}

function saveDiagrammes() {
  localStorage.setItem("mes_diagrammes", JSON.stringify(diagramsList));
  checkDiffDiagrammes();
}

function checkDiffDiagrammes() {
  var stored = localStorage.getItem("mes_diagrammes");
  var diff = stored !== JSON.stringify(diagrammesDefaut);
  document.getElementById("btnSaveDiagram").style.display = diff ? "inline-flex" : "none";
}

// ── File System Access API ──
var IDB_KEY_DIAG = "diagrammes";

function ouvrirDB_Diag() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open("doc-survival-kit-db", 1);
    req.onupgradeneeded = function (e) {
      e.target.result.createObjectStore("fileHandles");
    };
    req.onsuccess = function (e) { resolve(e.target.result); };
    req.onerror  = function (e) { reject(e.target.error); };
  });
}

function sauvegarderHandle_Diag(handle) {
  return ouvrirDB_Diag().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction("fileHandles", "readwrite");
      tx.objectStore("fileHandles").put(handle, IDB_KEY_DIAG);
      tx.oncomplete = resolve;
      tx.onerror = function (e) { reject(e.target.error); };
    });
  });
}

function recupererHandle_Diag() {
  return ouvrirDB_Diag().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction("fileHandles", "readonly");
      var req = tx.objectStore("fileHandles").get(IDB_KEY_DIAG);
      req.onsuccess = function (e) { resolve(e.target.result || null); };
      req.onerror  = function (e) { reject(e.target.error); };
    });
  });
}

function enregistrerDiagrammes() {
  if (!("showDirectoryPicker" in window)) return;
  recupererHandle_Diag().then(function (handle) {
    if (!handle) {
      document.getElementById("erreurFichierDiag").style.display = "none";
      document.getElementById("modalPremiereSauvegardeDiag").classList.add("open");
    } else {
      ecrireFichierDiag(handle);
    }
  });
}

function fermerModalSauvegardeDiag() {
  document.getElementById("modalPremiereSauvegardeDiag").classList.remove("open");
}

function ouvrirSelecteurFichierDiag() {
  fermerModalSauvegardeDiag();
  window.showDirectoryPicker()
    .then(function (dir) { return dir.getFileHandle("diagrammes.js"); })
    .then(function (handle) {
      document.getElementById("erreurFichierDiag").style.display = "none";
      return sauvegarderHandle_Diag(handle).then(function () {
        return ecrireFichierDiag(handle);
      });
    })
    .catch(function (err) {
      if (err.name === "NotFoundError") {
        document.getElementById("erreurFichierDiag").style.display = "block";
        document.getElementById("modalPremiereSauvegardeDiag").classList.add("open");
      } else if (err.name !== "AbortError") {
        console.error(err);
      }
    });
}

function ecrireFichierDiag(handle) {
  return handle.queryPermission({ mode: "readwrite" })
    .then(function (p) {
      if (p !== "granted") return handle.requestPermission({ mode: "readwrite" });
      return p;
    })
    .then(function (p) {
      if (p !== "granted") return;
      var content = "var diagrammesDefaut = " + JSON.stringify(diagramsList, null, 2) + ";\n";
      return handle.createWritable().then(function (w) {
        return w.write(content).then(function () { return w.close(); });
      }).then(function () {
        diagrammesDefaut = JSON.parse(JSON.stringify(diagramsList));
        checkDiffDiagrammes();
      });
    })
    .catch(function (err) { console.error(err); });
}

// ── Coordonnées SVG ──
function svgPoint(clientX, clientY) {
  var svg = document.getElementById("canvas");
  var rect = svg.getBoundingClientRect();
  return {
    x: (clientX - rect.left - viewTransform.x) / viewTransform.scale,
    y: (clientY - rect.top  - viewTransform.y) / viewTransform.scale,
  };
}

function updateViewport() {
  var vp = document.getElementById("viewport");
  vp.setAttribute(
    "transform",
    "translate(" + viewTransform.x + "," + viewTransform.y + ") scale(" + viewTransform.scale + ")"
  );
  document.getElementById("zoomLevel").textContent =
    Math.round(viewTransform.scale * 100) + "%";
}

// ── Zoom ──
function zoomIn()    { applyZoom(1.2, null, null); }
function zoomOut()   { applyZoom(1 / 1.2, null, null); }
function resetZoom() { viewTransform = { x: 60, y: 60, scale: 1 }; updateViewport(); }

function applyZoom(factor, cx, cy) {
  var newScale = Math.min(4, Math.max(0.15, viewTransform.scale * factor));
  if (cx !== null && cy !== null) {
    viewTransform.x = cx - (cx - viewTransform.x) * (newScale / viewTransform.scale);
    viewTransform.y = cy - (cy - viewTransform.y) * (newScale / viewTransform.scale);
  }
  viewTransform.scale = newScale;
  updateViewport();
}

// ── Rendu des formes ──
function renderShape(shape) {
  var c = COLORS[shape.color] || COLORS[DEFAULT_COLOR];
  var isSel = selectedId === shape.id && selectedType === "shape";
  var stroke = isSel ? "#f97316" : c.stroke;
  var sw = isSel ? 2.5 : 1.5;

  var g = createSVGEl("g");
  g.setAttribute("data-id", shape.id);
  g.setAttribute("data-type", "shape");
  g.classList.add("shape-group");

  // ── Fond selon le type ──
  if (shape.type === "rect" || shape.type === "rounded") {
    var rx = shape.type === "rounded" ? 12 : 3;
    var r = createSVGEl("rect");
    r.setAttribute("x", shape.x);       r.setAttribute("y", shape.y);
    r.setAttribute("width", shape.w);   r.setAttribute("height", shape.h);
    r.setAttribute("rx", rx);
    r.setAttribute("fill", c.fill);     r.setAttribute("stroke", stroke);
    r.setAttribute("stroke-width", sw);
    g.appendChild(r);

  } else if (shape.type === "db") {
    var ry = Math.min(12, shape.h * 0.2);
    var cx = shape.x + shape.w / 2;
    // Corps : path latéral + arc bas
    var body = createSVGEl("path");
    body.setAttribute("d", [
      "M", shape.x, shape.y + ry,
      "L", shape.x, shape.y + shape.h - ry,
      "A", shape.w / 2, ry, 0, 0, 0, shape.x + shape.w, shape.y + shape.h - ry,
      "L", shape.x + shape.w, shape.y + ry,
      "A", shape.w / 2, ry, 0, 0, 0, shape.x, shape.y + ry,
      "Z",
    ].join(" "));
    body.setAttribute("fill", c.fill);
    body.setAttribute("stroke", stroke);
    body.setAttribute("stroke-width", sw);
    g.appendChild(body);
    // Ellipse du haut (face visible)
    var topEl = createSVGEl("ellipse");
    topEl.setAttribute("cx", cx);              topEl.setAttribute("cy", shape.y + ry);
    topEl.setAttribute("rx", shape.w / 2);     topEl.setAttribute("ry", ry);
    topEl.setAttribute("fill", c.fill);
    topEl.setAttribute("stroke", stroke);      topEl.setAttribute("stroke-width", sw);
    g.appendChild(topEl);

  } else if (shape.type === "cloud") {
    // Ellipse à bordure pointillée = service externe / cloud
    var el = createSVGEl("ellipse");
    el.setAttribute("cx", shape.x + shape.w / 2);
    el.setAttribute("cy", shape.y + shape.h / 2);
    el.setAttribute("rx", shape.w / 2);
    el.setAttribute("ry", shape.h / 2);
    el.setAttribute("fill", c.fill);
    el.setAttribute("stroke", stroke);
    el.setAttribute("stroke-width", sw);
    el.setAttribute("stroke-dasharray", "5,3");
    g.appendChild(el);

  } else if (shape.type === "text") {
    // pas de fond — juste le texte
  }

  // ── Texte ──
  var textCy = shape.type === "db"
    ? shape.y + shape.h * 0.62
    : shape.y + shape.h / 2;
  var txt = createSVGEl("text");
  txt.setAttribute("x", shape.x + shape.w / 2);
  txt.setAttribute("y", textCy);
  txt.setAttribute("text-anchor", "middle");
  txt.setAttribute("dominant-baseline", "middle");
  txt.setAttribute("fill", shape.type === "text" ? "#292524" : c.text);
  txt.setAttribute("font-size", shape.type === "text" ? "13" : "12");
  txt.setAttribute("font-family", '"Segoe UI",system-ui,sans-serif');
  txt.setAttribute("font-weight", shape.type === "text" ? "400" : "600");
  txt.setAttribute("pointer-events", "none");
  txt.textContent = shape.text || "";
  g.appendChild(txt);

  // ── Poignée de redimensionnement (coin bas-droit) ──
  if (isSel) {
    var grip = createSVGEl("rect");
    grip.setAttribute("x", shape.x + shape.w - 5);
    grip.setAttribute("y", shape.y + shape.h - 5);
    grip.setAttribute("width", 10);   grip.setAttribute("height", 10);
    grip.setAttribute("rx", 2);
    grip.setAttribute("fill", "#f97316");
    grip.setAttribute("stroke", "#fff");   grip.setAttribute("stroke-width", 1.5);
    grip.classList.add("resize-grip");
    grip.setAttribute("data-shape-id", shape.id);
    g.appendChild(grip);
  }

  // ── Points de connexion (visibles au hover et en mode flèche) ──
  var hcx = shape.x + shape.w / 2, hcy = shape.y + shape.h / 2;
  [
    [hcx, shape.y],
    [hcx, shape.y + shape.h],
    [shape.x, hcy],
    [shape.x + shape.w, hcy],
  ].forEach(function (pt) {
    var dot = createSVGEl("circle");
    dot.setAttribute("cx", pt[0]);  dot.setAttribute("cy", pt[1]);
    dot.setAttribute("r", 5);
    dot.setAttribute("fill", "#f97316");
    dot.setAttribute("stroke", "#fff");  dot.setAttribute("stroke-width", 1.5);
    dot.classList.add("conn-dot");
    dot.setAttribute("data-shape-id", shape.id);
    g.appendChild(dot);
  });

  return g;
}

// ── Rendu d'une flèche ──
function getEdgePoint(shape, targetX, targetY) {
  var cx = shape.x + shape.w / 2;
  var cy = shape.y + shape.h / 2;
  var dx = targetX - cx, dy = targetY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: shape.y };
  var hw = shape.w / 2, hh = shape.h / 2;
  if (Math.abs(dx) * hh > Math.abs(dy) * hw) {
    var sx = dx > 0 ? 1 : -1;
    return { x: cx + sx * hw, y: cy + dy * hw / Math.abs(dx) };
  } else {
    var sy = dy > 0 ? 1 : -1;
    return { x: cx + dx * hh / Math.abs(dy), y: cy + sy * hh };
  }
}

function renderArrow(arrow, shapes) {
  var from = shapes.find(function (s) { return s.id === arrow.from; });
  var to   = shapes.find(function (s) { return s.id === arrow.to;   });
  if (!from || !to) return null;

  var toCx = to.x + to.w / 2, toCy = to.y + to.h / 2;
  var frCx = from.x + from.w / 2, frCy = from.y + from.h / 2;
  var fp = getEdgePoint(from, toCx, toCy);
  var tp = getEdgePoint(to,   frCx, frCy);

  // Raccourcir légèrement la pointe pour ne pas chevauchner la forme
  var dx = tp.x - fp.x, dy = tp.y - fp.y;
  var len = Math.sqrt(dx * dx + dy * dy);
  if (len > 16) {
    var off = 7 / len;
    tp = { x: tp.x - dx * off, y: tp.y - dy * off };
  }

  var isSel = selectedId === arrow.id && selectedType === "arrow";
  var stroke = isSel ? "#f97316" : "#a8a29e";
  var markerId = isSel ? "arrowhead-sel" : "arrowhead";

  var g = createSVGEl("g");
  g.setAttribute("data-id", arrow.id);
  g.setAttribute("data-type", "arrow");
  g.classList.add("arrow-group");

  var line = createSVGEl("line");
  line.setAttribute("x1", fp.x);  line.setAttribute("y1", fp.y);
  line.setAttribute("x2", tp.x);  line.setAttribute("y2", tp.y);
  line.setAttribute("stroke", stroke);
  line.setAttribute("stroke-width", isSel ? 2 : 1.5);
  line.setAttribute("marker-end", "url(#" + markerId + ")");
  g.appendChild(line);

  // Zone de clic élargie
  var hit = createSVGEl("line");
  hit.setAttribute("x1", fp.x);  hit.setAttribute("y1", fp.y);
  hit.setAttribute("x2", tp.x);  hit.setAttribute("y2", tp.y);
  hit.setAttribute("stroke", "transparent");
  hit.setAttribute("stroke-width", 14);
  g.appendChild(hit);

  // Label
  if (arrow.label) {
    var mx = (fp.x + tp.x) / 2, my = (fp.y + tp.y) / 2;
    var lbl = createSVGEl("text");
    lbl.setAttribute("x", mx);  lbl.setAttribute("y", my - 7);
    lbl.setAttribute("text-anchor", "middle");
    lbl.setAttribute("font-size", "10");
    lbl.setAttribute("font-family", '"Cascadia Code","SF Mono",Consolas,monospace');
    lbl.setAttribute("fill", "#a8a29e");
    lbl.setAttribute("pointer-events", "none");
    lbl.textContent = arrow.label;
    g.appendChild(lbl);
  }

  return g;
}

// ── Rendu complet ──
function renderAll() {
  var diag = getCurrentDiagram();
  if (!diag) return;

  document.getElementById("diagramTitle").value = diag.titre;

  var arrowsLayer = document.getElementById("arrowsLayer");
  arrowsLayer.innerHTML = "";
  (diag.arrows || []).forEach(function (a) {
    var el = renderArrow(a, diag.shapes);
    if (el) arrowsLayer.appendChild(el);
  });

  var shapesLayer = document.getElementById("shapesLayer");
  shapesLayer.innerHTML = "";
  (diag.shapes || []).forEach(function (s) {
    shapesLayer.appendChild(renderShape(s));
  });

  updateViewport();
  renderDiagramList();
}

function renderDiagramList() {
  var el = document.getElementById("diagramList");
  el.innerHTML = diagramsList.map(function (d, i) {
    var active = i === currentDiagramIdx ? " active" : "";
    return (
      '<div class="diagram-list-item' + active + '" onclick="selectDiagramme(' + i + ')">' +
      '<span class="diagram-list-name">' + escDiag(d.titre) + '</span>' +
      (diagramsList.length > 1
        ? '<button class="diagram-list-del" onclick="event.stopPropagation();supprimerDiagramme(' + i + ')">×</button>'
        : "") +
      "</div>"
    );
  }).join("");
}

// ── Gestion des diagrammes ──
function selectDiagramme(idx) {
  currentDiagramIdx = idx;
  selectedId = null;  selectedType = null;
  viewTransform = { x: 60, y: 60, scale: 1 };
  document.getElementById("colorPanel").style.display = "none";
  renderAll();
}

function creerDiagramme() {
  var d = {
    id: Date.now(),
    titre: window.t ? window.t.diag_new_diagram : "Nouveau diagramme",
    shapes: [],
    arrows: [],
  };
  diagramsList.push(d);
  saveDiagrammes();
  selectDiagramme(diagramsList.length - 1);
}

function supprimerDiagramme(idx) {
  if (diagramsList.length <= 1) return;
  diagramsList.splice(idx, 1);
  if (currentDiagramIdx >= diagramsList.length) currentDiagramIdx = diagramsList.length - 1;
  saveDiagrammes();
  renderAll();
}

function toggleDiagramList() {
  document.getElementById("diagramListPanel").classList.toggle("open");
}

// ── Outil actif ──
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll(".diagram-tool[id^='tool']").forEach(function (btn) {
    btn.classList.remove("active");
  });
  var btnId = "tool" + tool.charAt(0).toUpperCase() + tool.slice(1);
  var btn = document.getElementById(btnId);
  if (btn) btn.classList.add("active");

  arrowSrcId = null;
  document.getElementById("tempArrow").style.display = "none";
  document.getElementById("canvas").setAttribute(
    "data-tool", tool
  );
  if (tool !== "select") {
    document.getElementById("colorPanel").style.display = "none";
  }
  renderAll();
}

// ── Ajout d'une forme ──
function addShape(type, x, y) {
  var diag = getCurrentDiagram();
  var size = DEFAULT_SIZES[type] || { w: 120, h: 50 };
  var labels = { db: "Database", cloud: "Cloud", text: "Label" };
  var shape = {
    id: "s" + Date.now(),
    type: type,
    x: Math.round(x - size.w / 2),
    y: Math.round(y - size.h / 2),
    w: size.w,
    h: size.h,
    text: labels[type] || "Service",
    color: DEFAULT_COLOR,
  };
  diag.shapes.push(shape);
  saveDiagrammes();
  selectedId = shape.id;  selectedType = "shape";
  renderAll();
  document.getElementById("colorPanel").style.display = "flex";
  startTextEdit(shape.id);
}

// ── Suppression ──
function deleteSelected() {
  if (!selectedId) return;
  var diag = getCurrentDiagram();
  if (selectedType === "shape") {
    diag.shapes = diag.shapes.filter(function (s) { return s.id !== selectedId; });
    diag.arrows = diag.arrows.filter(function (a) {
      return a.from !== selectedId && a.to !== selectedId;
    });
  } else if (selectedType === "arrow") {
    diag.arrows = diag.arrows.filter(function (a) { return a.id !== selectedId; });
  }
  selectedId = null;  selectedType = null;
  document.getElementById("colorPanel").style.display = "none";
  saveDiagrammes();
  renderAll();
}

// ── Couleur ──
function setShapeColor(color) {
  if (!selectedId || selectedType !== "shape") return;
  var diag = getCurrentDiagram();
  var shape = diag.shapes.find(function (s) { return s.id === selectedId; });
  if (!shape) return;
  shape.color = color;
  saveDiagrammes();
  renderAll();
  document.getElementById("colorPanel").style.display = "flex";
}

// ── Édition texte inline ──
function startTextEdit(shapeId) {
  var diag = getCurrentDiagram();
  var shape = diag.shapes.find(function (s) { return s.id === shapeId; });
  if (!shape) return;
  editingShapeId = shapeId;

  var svg = document.getElementById("canvas");
  var sr = svg.getBoundingClientRect();
  var sx = shape.x * viewTransform.scale + viewTransform.x + sr.left;
  var sy = shape.y * viewTransform.scale + viewTransform.y + sr.top;
  var sw = shape.w * viewTransform.scale;
  var sh = shape.h * viewTransform.scale;
  var c = COLORS[shape.color] || COLORS[DEFAULT_COLOR];

  var input = document.getElementById("shapeTextInput");
  input.value = shape.text || "";
  input.style.left   = (sx + sw * 0.08) + "px";
  input.style.top    = (sy + sh * 0.22) + "px";
  input.style.width  = (sw * 0.84) + "px";
  input.style.fontSize   = Math.max(10, 12 * viewTransform.scale) + "px";
  input.style.color      = c.text;

  document.getElementById("textOverlay").style.display = "block";
  setTimeout(function () {
    input.focus();
    input.select();
  }, 10);
}

function confirmTextEdit() {
  var input = document.getElementById("shapeTextInput");
  var diag = getCurrentDiagram();
  if (editingShapeId) {
    var shape = diag.shapes.find(function (s) { return s.id === editingShapeId; });
    if (shape) { shape.text = input.value; saveDiagrammes(); renderAll(); }
    editingShapeId = null;
  } else if (editingArrowId) {
    var arrow = (diag.arrows || []).find(function (a) { return a.id === editingArrowId; });
    if (arrow) { arrow.label = input.value; saveDiagrammes(); renderAll(); }
    editingArrowId = null;
  }
  document.getElementById("textOverlay").style.display = "none";
}

function startArrowTextEdit(arrowId) {
  var diag = getCurrentDiagram();
  var arrow = (diag.arrows || []).find(function (a) { return a.id === arrowId; });
  if (!arrow) return;
  var from = diag.shapes.find(function (s) { return s.id === arrow.from; });
  var to   = diag.shapes.find(function (s) { return s.id === arrow.to;   });
  if (!from || !to) return;

  var toCx = to.x + to.w / 2,   toCy = to.y + to.h / 2;
  var frCx = from.x + from.w / 2, frCy = from.y + from.h / 2;
  var fp = getEdgePoint(from, toCx, toCy);
  var tp = getEdgePoint(to,   frCx, frCy);
  var mx = (fp.x + tp.x) / 2;
  var my = (fp.y + tp.y) / 2;

  var svg = document.getElementById("canvas");
  var sr = svg.getBoundingClientRect();
  var sx = mx * viewTransform.scale + viewTransform.x + sr.left;
  var sy = my * viewTransform.scale + viewTransform.y + sr.top;

  editingArrowId = arrowId;
  var input = document.getElementById("shapeTextInput");
  input.value = arrow.label || "";
  input.style.left     = (sx - 60) + "px";
  input.style.top      = (sy - 12) + "px";
  input.style.width    = "120px";
  input.style.fontSize = Math.max(10, 11 * viewTransform.scale) + "px";
  input.style.color    = "#78716c";

  document.getElementById("textOverlay").style.display = "block";
  setTimeout(function () { input.focus(); input.select(); }, 10);
}

// ── Hit-test ──
function shapeAt(x, y) {
  var diag = getCurrentDiagram();
  if (!diag) return null;
  for (var i = diag.shapes.length - 1; i >= 0; i--) {
    var s = diag.shapes[i];
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s;
  }
  return null;
}

function arrowIdAt(x, y) {
  var groups = document.querySelectorAll(".arrow-group");
  for (var i = 0; i < groups.length; i++) {
    var lines = groups[i].querySelectorAll("line");
    if (lines.length < 2) continue;
    var hit = lines[lines.length - 1];
    var x1 = +hit.getAttribute("x1"), y1 = +hit.getAttribute("y1");
    var x2 = +hit.getAttribute("x2"), y2 = +hit.getAttribute("y2");
    if (distToSeg(x, y, x1, y1, x2, y2) < 8) {
      return groups[i].getAttribute("data-id");
    }
  }
  return null;
}

function distToSeg(px, py, x1, y1, x2, y2) {
  var dx = x2 - x1, dy = y2 - y1;
  var lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// ── Créer une flèche ──
function createArrow(fromId, toId) {
  var diag = getCurrentDiagram();
  if (diag.arrows.some(function (a) { return a.from === fromId && a.to === toId; })) return;
  var arrow = { id: "a" + Date.now(), from: fromId, to: toId, label: "" };
  diag.arrows.push(arrow);
  saveDiagrammes();
  selectedId = arrow.id;  selectedType = "arrow";
  renderAll();
  startArrowTextEdit(arrow.id);
}

// ── Renommer le diagramme ──
function onTitleChange() {
  var diag = getCurrentDiagram();
  if (!diag) return;
  diag.titre = document.getElementById("diagramTitle").value || "Diagramme";
  saveDiagrammes();
  renderDiagramList();
}

// ── Événements souris ──
function onMouseDown(e) {
  if (e.button !== 0) return;
  if (editingShapeId || editingArrowId) { confirmTextEdit(); return; }

  var pt = svgPoint(e.clientX, e.clientY);

  // Clic sur un point de connexion → début de flèche
  var connDot = e.target.closest(".conn-dot");
  if (connDot) {
    arrowSrcId = connDot.getAttribute("data-shape-id");
    var srcShape = getCurrentDiagram().shapes.find(function (s) { return s.id === arrowSrcId; });
    var ta = document.getElementById("tempArrow");
    ta.setAttribute("x1", srcShape.x + srcShape.w / 2);
    ta.setAttribute("y1", srcShape.y + srcShape.h / 2);
    ta.setAttribute("x2", pt.x);  ta.setAttribute("y2", pt.y);
    ta.style.display = "";
    return;
  }

  // Clic sur la poignée de resize
  var grip = e.target.closest(".resize-grip");
  if (grip) {
    var sid = grip.getAttribute("data-shape-id");
    var shape = getCurrentDiagram().shapes.find(function (s) { return s.id === sid; });
    if (shape) {
      dragState = { type: "resize", id: sid, sx: pt.x, sy: pt.y, ow: shape.w, oh: shape.h };
    }
    return;
  }

  var shape = shapeAt(pt.x, pt.y);

  if (currentTool === "select") {
    if (shape) {
      // Détection du double-clic par horodatage (avant tout renderAll)
      var now = Date.now();
      if (now - lastClickTime < 350 && lastClickShapeId === shape.id) {
        lastClickTime = 0;  lastClickShapeId = null;
        startTextEdit(shape.id);
        return;
      }
      lastClickTime = now;  lastClickShapeId = shape.id;  lastClickArrowId = null;

      dragState = { type: "move", id: shape.id, sx: pt.x, sy: pt.y, ox: shape.x, oy: shape.y };
      selectedId = shape.id;  selectedType = "shape";
      document.getElementById("colorPanel").style.display = "flex";
      renderAll();
    } else {
      var aid = arrowIdAt(pt.x, pt.y);
      if (aid) {
        // Détection du double-clic sur une flèche
        var now2 = Date.now();
        if (now2 - lastClickTime < 350 && lastClickArrowId === aid) {
          lastClickTime = 0;  lastClickArrowId = null;
          selectedId = aid;  selectedType = "arrow";
          renderAll();
          startArrowTextEdit(aid);
          return;
        }
        lastClickTime = now2;  lastClickArrowId = aid;

        selectedId = aid;  selectedType = "arrow";
        document.getElementById("colorPanel").style.display = "none";
        renderAll();
      } else {
        // Pan
        panStart = { cx: e.clientX, cy: e.clientY, px: viewTransform.x, py: viewTransform.y };
        selectedId = null;  selectedType = null;
        document.getElementById("colorPanel").style.display = "none";
        renderAll();
      }
    }

  } else if (currentTool === "arrow") {
    if (shape) {
      if (!arrowSrcId) {
        arrowSrcId = shape.id;
        var ta = document.getElementById("tempArrow");
        ta.setAttribute("x1", shape.x + shape.w / 2);
        ta.setAttribute("y1", shape.y + shape.h / 2);
        ta.setAttribute("x2", pt.x);  ta.setAttribute("y2", pt.y);
        ta.style.display = "";
      } else if (arrowSrcId !== shape.id) {
        createArrow(arrowSrcId, shape.id);
        arrowSrcId = null;
        document.getElementById("tempArrow").style.display = "none";
      }
    } else {
      arrowSrcId = null;
      document.getElementById("tempArrow").style.display = "none";
    }

  } else {
    // Outils forme : placer au clic
    addShape(currentTool, pt.x, pt.y);
    setTool("select");
  }
}

function onMouseMove(e) {
  var pt = svgPoint(e.clientX, e.clientY);

  // Mise à jour de la flèche temporaire
  if (arrowSrcId) {
    var ta = document.getElementById("tempArrow");
    if (ta.style.display !== "none") {
      ta.setAttribute("x2", pt.x);  ta.setAttribute("y2", pt.y);
    }
  }

  if (dragState) {
    var diag = getCurrentDiagram();
    var shape = diag.shapes.find(function (s) { return s.id === dragState.id; });
    if (!shape) return;
    if (dragState.type === "move") {
      shape.x = Math.round(dragState.ox + pt.x - dragState.sx);
      shape.y = Math.round(dragState.oy + pt.y - dragState.sy);
    } else if (dragState.type === "resize") {
      shape.w = Math.max(60, Math.round(dragState.ow + pt.x - dragState.sx));
      shape.h = Math.max(30, Math.round(dragState.oh + pt.y - dragState.sy));
    }
    renderAll();
    // Repositionner la palette si visible
    if (selectedId === shape.id && document.getElementById("colorPanel").style.display !== "none") {
      // la palette est fixée en haut, pas besoin de la bouger
    }
  } else if (panStart) {
    viewTransform.x = panStart.px + (e.clientX - panStart.cx);
    viewTransform.y = panStart.py + (e.clientY - panStart.cy);
    updateViewport();
  }
}

function onMouseUp(e) {
  var pt = svgPoint(e.clientX, e.clientY);

  // Fin de tracé de flèche via conn-dot
  if (arrowSrcId && !dragState) {
    document.getElementById("tempArrow").style.display = "none";
    if (currentTool !== "arrow") {
      var target = shapeAt(pt.x, pt.y);
      if (target && target.id !== arrowSrcId) {
        createArrow(arrowSrcId, target.id);
      }
      arrowSrcId = null;
    }
  }

  if (dragState) {
    saveDiagrammes();
    dragState = null;
    renderAll();
  }
  panStart = null;
}


function onWheel(e) {
  e.preventDefault();
  var svg = document.getElementById("canvas");
  var r = svg.getBoundingClientRect();
  applyZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
}

// ── Init ──
document.addEventListener("DOMContentLoaded", function () {
  diagramsList = loadDiagrammes();
  if (!localStorage.getItem("mes_diagrammes")) saveDiagrammes();
  checkDiffDiagrammes();
  renderAll();

  var canvas = document.getElementById("canvas");
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseup",   onMouseUp);
  canvas.addEventListener("wheel",     onWheel, { passive: false });

  var titleInput = document.getElementById("diagramTitle");
  titleInput.addEventListener("change", onTitleChange);
  titleInput.addEventListener("blur",   onTitleChange);

  var textInput = document.getElementById("shapeTextInput");
  textInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter")  { e.preventDefault(); confirmTextEdit(); }
    if (e.key === "Escape") {
      document.getElementById("textOverlay").style.display = "none";
      editingShapeId = null;
    }
  });
  textInput.addEventListener("blur", function () {
    // Small delay to allow click on modal-confirm etc.
    setTimeout(confirmTextEdit, 100);
  });

  document.addEventListener("keydown", function (e) {
    if (document.activeElement.tagName === "INPUT") return;
    if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
    if (e.key === "Escape") {
      arrowSrcId = null;
      document.getElementById("tempArrow").style.display = "none";
      setTool("select");
    }
  });

  document.getElementById("modalPremiereSauvegardeDiag").addEventListener("click", function (e) {
    if (e.target === this) this.classList.remove("open");
  });
});
