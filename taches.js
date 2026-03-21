// ── Données des tâches ───────────────────────────────────────────────
const KEY = "mes_taches";
let filter = "all";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function save(tasks) {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}

// ── Actions ──────────────────────────────────────────────────────────
function addTask() {
  const input = document.getElementById("taskInput");
  const text = input.value.trim();
  if (!text) return;
  const priority = document.getElementById("taskPriority").value;
  const tasks = load();
  tasks.unshift({ id: Date.now(), text, priority, done: false });
  save(tasks);
  input.value = "";
  render();
}

function toggle(id) {
  const tasks = load();
  const t = tasks.find((t) => t.id === id);
  if (t) t.done = !t.done;
  save(tasks);
  render();
}

function remove(id) {
  save(load().filter((t) => t.id !== id));
  render();
}

function setFilter(f, btn) {
  filter = f;
  document
    .querySelectorAll(".filters button")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  render();
}

// ── Rendu ────────────────────────────────────────────────────────────
function render() {
  const tasks = load();
  const list = document.getElementById("taskList");

  const filtered = tasks.filter((t) => {
    if (filter === "todo") return !t.done;
    if (filter === "done") return t.done;
    if (filter === "urgent" || filter === "normal" || filter === "later")
      return t.priority === filter;
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-msg">' + window.t.taches_empty + '</p>';
    return;
  }

  const labels = {
    urgent: window.t.taches_priority_urgent,
    normal: window.t.taches_priority_normal,
    later: window.t.taches_priority_later,
  };

  list.innerHTML = filtered
    .map(
      (t) => `
    <div class="task task-${t.priority} ${t.done ? "done" : ""}">
      <div class="check" onclick="toggle(${t.id})"></div>
      <span class="task-text">${esc(t.text)}</span>
      <span class="task-tag">${labels[t.priority]}</span>
      <button class="task-del" onclick="remove(${t.id})" title="${window.t.taches_delete_title}">✕</button>
    </div>
  `,
    )
    .join("");
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

render();
