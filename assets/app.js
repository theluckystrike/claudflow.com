/* ClaudFlow — AI Workflow Builder */

var state = {
  blocks: [],
  connections: [],
  nextId: 1,
  selected: null,
  dragging: null,
  dragOff: { x: 0, y: 0 },
  connecting: null
};

var BLOCK_TYPES = {
  input: { label: "Input", color: "#22c55e" },
  prompt: { label: "AI Prompt", color: "#06B6D4" },
  condition: { label: "Condition", color: "#eab308" },
  output: { label: "Output", color: "#ef4444" },
  transform: { label: "Transform", color: "#a855f7" }
};

var EXAMPLES = {
  blog: {
    name: "Blog Post Pipeline",
    blocks: [
      { id: 1, type: "input", label: "Topic + Keywords", x: 50, y: 40, content: "User provides blog topic and target keywords" },
      { id: 2, type: "prompt", label: "Generate Outline", x: 50, y: 160, content: "Create a detailed blog outline with H2 headings, key points per section, and target word count" },
      { id: 3, type: "prompt", label: "Write Draft", x: 50, y: 280, content: "Write the full blog post following the outline. Use conversational tone, include examples." },
      { id: 4, type: "condition", label: "Word Count OK?", x: 300, y: 280, content: "Check if draft is 800-1500 words" },
      { id: 5, type: "transform", label: "Add SEO Meta", x: 300, y: 160, content: "Generate title tag (50-60 chars), meta description (150-160 chars), OG tags" },
      { id: 6, type: "output", label: "Final Post", x: 300, y: 40, content: "Complete blog post with SEO metadata ready to publish" }
    ],
    connections: [[1,2],[2,3],[3,4],[4,5],[5,6]]
  },
  review: {
    name: "Code Review Flow",
    blocks: [
      { id: 1, type: "input", label: "Code Diff", x: 50, y: 40, content: "Paste the git diff or code file to review" },
      { id: 2, type: "prompt", label: "Bug Analysis", x: 50, y: 160, content: "Identify bugs, logic errors, and potential runtime issues. Rate each HIGH/MEDIUM/LOW." },
      { id: 3, type: "prompt", label: "Security Scan", x: 50, y: 280, content: "Check for SQL injection, XSS, auth bypass, hardcoded secrets. Provide CWE numbers." },
      { id: 4, type: "transform", label: "Merge Findings", x: 300, y: 220, content: "Combine bug and security findings, deduplicate, sort by severity" },
      { id: 5, type: "prompt", label: "Generate Fixes", x: 300, y: 100, content: "For each finding, provide corrected code with explanation" },
      { id: 6, type: "output", label: "Review Report", x: 550, y: 160, content: "Complete code review report with findings, fixes, and summary" }
    ],
    connections: [[1,2],[1,3],[2,4],[3,4],[4,5],[5,6]]
  },
  data: {
    name: "Data Analysis Chain",
    blocks: [
      { id: 1, type: "input", label: "Raw Data", x: 50, y: 40, content: "CSV or JSON dataset to analyze" },
      { id: 2, type: "transform", label: "Clean Data", x: 50, y: 160, content: "Remove nulls, normalize formats, handle outliers" },
      { id: 3, type: "prompt", label: "Statistical Summary", x: 50, y: 280, content: "Calculate mean, median, std dev, correlations. Identify top patterns." },
      { id: 4, type: "condition", label: "Anomalies Found?", x: 300, y: 280, content: "Check if any data points are >2 std deviations from mean" },
      { id: 5, type: "prompt", label: "Generate Insights", x: 300, y: 160, content: "Interpret the statistics in business terms. What actions should be taken?" },
      { id: 6, type: "output", label: "Analysis Report", x: 300, y: 40, content: "Full analysis with charts description, insights, and recommendations" }
    ],
    connections: [[1,2],[2,3],[3,4],[4,5],[5,6]]
  }
};

function getCanvas() { return document.getElementById("canvas-area"); }
function getSvg() { return document.getElementById("canvas-svg"); }

function createBlock(type, x, y) {
  var info = BLOCK_TYPES[type];
  if (!info) return;
  var b = {
    id: state.nextId++,
    type: type,
    label: info.label,
    x: x || 50,
    y: y || 50,
    content: ""
  };
  state.blocks.push(b);
  renderAll();
  selectBlock(b.id);
  return b;
}

function deleteBlock(id) {
  state.blocks = state.blocks.filter(function(b) { return b.id !== id; });
  state.connections = state.connections.filter(function(c) {
    return c[0] !== id && c[1] !== id;
  });
  if (state.selected === id) state.selected = null;
  renderAll();
}

function selectBlock(id) {
  state.selected = id;
  renderAll();
}

function findBlock(id) {
  for (var i = 0; i < state.blocks.length; i++) {
    if (state.blocks[i].id === id) return state.blocks[i];
  }
  return null;
}

function addConnection(fromId, toId) {
  if (fromId === toId) return;
  for (var i = 0; i < state.connections.length; i++) {
    if (state.connections[i][0] === fromId && state.connections[i][1] === toId) return;
  }
  if (state.connections.length >= 100) return;
  state.connections.push([fromId, toId]);
  renderAll();
}

function renderBlocks() {
  var canvas = getCanvas();
  if (!canvas) return;
  var existing = canvas.querySelectorAll(".block");
  for (var i = 0; i < existing.length; i++) {
    existing[i].remove();
  }
  for (var i = 0; i < state.blocks.length; i++) {
    var b = state.blocks[i];
    var info = BLOCK_TYPES[b.type] || {};
    var div = document.createElement("div");
    div.className = "block" + (state.selected === b.id ? " selected" : "");
    div.setAttribute("data-id", b.id);
    div.style.left = b.x + "px";
    div.style.top = b.y + "px";
    div.innerHTML =
      '<div class="block-type" style="color:' + (info.color || "var(--accent)") + '">' + escapeHtml(b.type) + '</div>' +
      '<div class="block-label">' + escapeHtml(b.label) + '</div>' +
      '<div class="port port-in"></div>' +
      '<div class="port port-out"></div>' +
      '<button class="delete-btn" data-del="' + b.id + '">x</button>';
    canvas.appendChild(div);
  }
}

function renderConnections() {
  var svg = getSvg();
  if (!svg) return;
  svg.innerHTML = "";
  for (var i = 0; i < state.connections.length; i++) {
    var c = state.connections[i];
    var from = findBlock(c[0]);
    var to = findBlock(c[1]);
    if (!from || !to) continue;
    var x1 = from.x + 90;
    var y1 = from.y + 60;
    var x2 = to.x + 20;
    var y2 = to.y;
    var midY = (y1 + y2) / 2;
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M" + x1 + "," + y1 + " C" + x1 + "," + midY + " " + x2 + "," + midY + " " + x2 + "," + y2);
    path.setAttribute("stroke", "var(--accent)");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.setAttribute("opacity", "0.6");
    /* arrowhead */
    var arrow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    arrow.setAttribute("cx", x2);
    arrow.setAttribute("cy", y2);
    arrow.setAttribute("r", "4");
    arrow.setAttribute("fill", "var(--accent)");
    svg.appendChild(path);
    svg.appendChild(arrow);
  }
}

function renderAll() {
  renderBlocks();
  renderConnections();
  bindBlockEvents();
}

function bindBlockEvents() {
  var canvas = getCanvas();
  if (!canvas) return;
  var blocks = canvas.querySelectorAll(".block");
  for (var i = 0; i < blocks.length; i++) {
    (function(el) {
      var id = parseInt(el.getAttribute("data-id"), 10);
      el.addEventListener("mousedown", function(e) {
        if (e.target.classList.contains("port-out")) {
          state.connecting = id;
          e.stopPropagation();
          return;
        }
        if (e.target.classList.contains("port-in")) {
          if (state.connecting !== null) {
            addConnection(state.connecting, id);
            state.connecting = null;
          }
          e.stopPropagation();
          return;
        }
        if (e.target.getAttribute("data-del")) {
          deleteBlock(parseInt(e.target.getAttribute("data-del"), 10));
          e.stopPropagation();
          return;
        }
        selectBlock(id);
        state.dragging = id;
        var rect = el.getBoundingClientRect();
        state.dragOff.x = e.clientX - rect.left;
        state.dragOff.y = e.clientY - rect.top;
        e.preventDefault();
      });
      el.addEventListener("dblclick", function() {
        openEditModal(id);
      });
    })(blocks[i]);
  }
}

function handleMouseMove(e) {
  if (state.dragging === null) return;
  var canvas = getCanvas();
  if (!canvas) return;
  var rect = canvas.getBoundingClientRect();
  var b = findBlock(state.dragging);
  if (!b) return;
  var nx = e.clientX - rect.left - state.dragOff.x;
  var ny = e.clientY - rect.top - state.dragOff.y;
  b.x = Math.max(0, Math.min(nx, rect.width - 150));
  b.y = Math.max(0, Math.min(ny, rect.height - 70));
  renderAll();
}

function handleMouseUp() {
  state.dragging = null;
  state.connecting = null;
}

/* Edit Modal */
function openEditModal(id) {
  var b = findBlock(id);
  if (!b) return;
  var overlay = document.getElementById("modal-overlay");
  document.getElementById("edit-label").value = b.label;
  document.getElementById("edit-content").value = b.content;
  overlay.setAttribute("data-edit-id", id);
  overlay.classList.add("open");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
}

function saveModal() {
  var overlay = document.getElementById("modal-overlay");
  var id = parseInt(overlay.getAttribute("data-edit-id"), 10);
  var b = findBlock(id);
  if (!b) return;
  b.label = document.getElementById("edit-label").value.substring(0, 100) || b.label;
  b.content = document.getElementById("edit-content").value.substring(0, 1000);
  closeModal();
  renderAll();
}

/* Import / Export */
function exportWorkflow() {
  var data = {
    blocks: state.blocks,
    connections: state.connections,
    nextId: state.nextId
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "claudflow-workflow.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importWorkflow() {
  var input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.addEventListener("change", function() {
    if (!input.files || !input.files[0]) return;
    var reader = new FileReader();
    reader.onload = function() {
      try {
        var data = JSON.parse(reader.result);
        if (data.blocks && data.connections) {
          state.blocks = data.blocks.slice(0, 50);
          state.connections = data.connections.slice(0, 100);
          state.nextId = data.nextId || 1;
          state.selected = null;
          renderAll();
          saveToStorage();
        }
      } catch (e) { /* invalid JSON */ }
    };
    reader.readAsText(input.files[0]);
  });
  input.click();
}

function loadExample(key) {
  var ex = EXAMPLES[key];
  if (!ex) return;
  state.blocks = JSON.parse(JSON.stringify(ex.blocks));
  state.connections = JSON.parse(JSON.stringify(ex.connections));
  state.nextId = 10;
  state.selected = null;
  renderAll();
  saveToStorage();
}

/* LocalStorage */
function saveToStorage() {
  try {
    localStorage.setItem("claudflow_state", JSON.stringify({
      blocks: state.blocks.slice(0, 50),
      connections: state.connections.slice(0, 100),
      nextId: state.nextId
    }));
  } catch (e) { /* ignore */ }
}

function loadFromStorage() {
  try {
    var raw = localStorage.getItem("claudflow_state");
    if (!raw) return false;
    var data = JSON.parse(raw);
    if (data.blocks && data.blocks.length > 0) {
      state.blocks = data.blocks.slice(0, 50);
      state.connections = data.connections.slice(0, 100);
      state.nextId = data.nextId || 1;
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function initApp() {
  var canvas = getCanvas();
  if (!canvas) return;

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", function() {
    if (state.dragging !== null) saveToStorage();
    handleMouseUp();
  });

  canvas.addEventListener("click", function(e) {
    if (e.target === canvas) {
      state.selected = null;
      state.connecting = null;
      renderAll();
    }
  });

  /* Block type buttons */
  var addBtns = document.querySelectorAll("[data-add-type]");
  for (var i = 0; i < addBtns.length; i++) {
    addBtns[i].addEventListener("click", function() {
      var type = this.getAttribute("data-add-type");
      var rect = canvas.getBoundingClientRect();
      var x = 50 + (state.blocks.length % 4) * 160;
      var y = 50 + Math.floor(state.blocks.length / 4) * 120;
      if (state.blocks.length < 50) {
        createBlock(type, Math.min(x, rect.width - 160), Math.min(y, rect.height - 80));
        saveToStorage();
      }
    });
  }

  /* Example buttons */
  var exBtns = document.querySelectorAll("[data-example]");
  for (var i = 0; i < exBtns.length; i++) {
    exBtns[i].addEventListener("click", function() {
      loadExample(this.getAttribute("data-example"));
    });
  }

  /* Modal */
  document.getElementById("modal-save").addEventListener("click", function() {
    saveModal();
    saveToStorage();
  });
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", function(e) {
    if (e.target === this) closeModal();
  });

  /* Export / Import */
  document.getElementById("btn-export").addEventListener("click", exportWorkflow);
  document.getElementById("btn-import").addEventListener("click", importWorkflow);
  document.getElementById("btn-clear").addEventListener("click", function() {
    state.blocks = [];
    state.connections = [];
    state.nextId = 1;
    state.selected = null;
    renderAll();
    saveToStorage();
  });

  /* Load saved or default example */
  if (!loadFromStorage()) {
    loadExample("blog");
  }
  renderAll();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
