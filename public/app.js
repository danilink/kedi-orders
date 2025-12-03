const statusLabels = {
  registrado: "Registrado",
  recibido: "Recibido",
  en_proceso: "En proceso",
  completado: "Completado",
  entregado: "Entregado",
  eliminado: "Eliminado",
};
const statusIcons = {
  recibido: "📥",
  en_proceso: "⏳",
  completado: "✅",
  entregado: "📦",
  eliminado: "✖️",
};
const STATUSES = Object.keys(statusLabels);

const menuCategories = [
  {
    name: "Entrantes y primeros platos",
    items: [
      { name: "Flor de alcachofa confitada", price: 2.25, unit: "unidad", displayUnit: "unidad" },
      { name: "Huevos rellenos de bonito", price: 18.0, unit: "kg", displayUnit: "kg" },
      { name: "Croquetas (mín. 6 uds) de jamón, setas, cabrales y pollo", price: 16.8, unit: "kg", displayUnit: "kg" },
      { name: "Salpicón de marisco", price: 35.0, unit: "kg", displayUnit: "kg" },
      { name: "Boquerones en vinagre", price: 34.0, unit: "kg", displayUnit: "kg" },
      { name: "Ensaladilla rusa", price: 16.5, unit: "kg", displayUnit: "kg" },
      { name: "Lombarda rehogada con manzana y uvas pasas", price: 18.0, unit: "kg", displayUnit: "kg" },
      { name: "Crema de marisco", price: 7.5, unit: "unidad", displayUnit: "ración" },
    ],
  },
  {
    name: "Segundos platos",
    items: [
      { name: "Paletilla de cordero lechal asada con guarnición", price: 29.0, unit: "unidad", displayUnit: "unidad" },
      { name: "Pierna de cordero lechal asada con guarnición", price: 25.0, unit: "unidad", displayUnit: "unidad" },
    ],
  },
  {
    name: "Cordero y cochinillo lechal",
    items: [
      { name: "Cordero lechal (medio)", price: 120.0, unit: "unidad", displayUnit: "unidad" },
      { name: "Cordero lechal (entero)", price: 220.0, unit: "unidad", displayUnit: "unidad" },
      { name: "Cochinillo lechal (medio)", price: 95.0, unit: "unidad", displayUnit: "unidad" },
      { name: "Cochinillo lechal (entero)", price: 180.0, unit: "unidad", displayUnit: "unidad" },
    ],
  },
  {
    name: "Carnes",
    items: [
      { name: "Solomillo ibérico relleno de foie gras, bacón, etc.", price: 20.0, unit: "unidad", displayUnit: "unidad" },
      { name: "Costillas asadas con salsa barbacoa", price: 20.0, unit: "kg", displayUnit: "kg" },
      { name: "Carrillada ibérica en salsa de Oporto y manzana", price: 25.0, unit: "kg", displayUnit: "kg" },
    ],
  },
  {
    name: "Pollos",
    items: [{ name: "Pollo relleno con salsa (cabrales, ciruelas)", price: 30.0, unit: "unidad", displayUnit: "unidad" }],
  },
  {
    name: "Pescados",
    items: [
      { name: "Pimientos del piquillo rellenos de merluza y gambas", price: 27.0, unit: "kg", displayUnit: "kg" },
      { name: "Bacalao a la vizcaína (lomos con salsa de tomate casero, pimientos y cebolleta morada)", price: 25.0, unit: "kg", displayUnit: "kg" },
      { name: "Merluza marinera", price: 29.0, unit: "kg", displayUnit: "kg" },
      { name: "Guarnición de patatas asadas", price: 10.0, unit: "kg", displayUnit: "kg" },
      { name: "Merluza rellena", price: 29.0, unit: "kg", displayUnit: "kg" },
    ],
  },
  {
    name: "Postres caseros",
    items: [
      { name: "Tarta casera de queso", price: 12.0, unit: "unidad", displayUnit: "unidad" },
      { name: "Pudin casero", price: 9.5, unit: "unidad", displayUnit: "unidad" },
    ],
  },
];

const menuOrder = menuCategories.flatMap((c) => c.items.map((item) => item.name));
const menuLookup = menuCategories.reduce((acc, category) => {
  category.items.forEach((item) => {
    acc[item.name] = item;
  });
  return acc;
}, {});
const cart = new Map();

const form = document.querySelector("#order-form");
const menuGrid = document.querySelector("#menu-grid");
const cartContainer = document.querySelector("#cart");
const orderTotalEl = document.querySelector("#order-total");
const submitBtn = document.querySelector('#order-form button[type="submit"]');
const ordersTableBody = document.querySelector("#orders-table-body");
const ordersEmpty = document.querySelector("#orders-empty");
const filterSelect = document.querySelector("#status-filter");
const searchInput = document.querySelector("#orders-search");
const sortSelect = document.querySelector("#orders-sort");
const summary = document.querySelector("#summary");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const detailName = document.querySelector("#detail-name");
const detailDate = document.querySelector("#detail-date");
const detailNotes = document.querySelector("#detail-notes");
const detailItems = document.querySelector("#detail-items");
const detailEmpty = document.querySelector("#detail-empty");
const detailPrint = document.querySelector("#detail-print");
const detailQuickStatus = document.querySelector("#detail-quick-status");
const detailTabBtn = document.querySelector('[data-tab="detail"]');
const detailPanel = document.querySelector('.tab-panel[data-tab="detail"]');
const detailStatusLabel = document.querySelector("#detail-status-label");
const detailEditBtn = document.querySelector("#detail-edit");
const detailDeleteBtn = document.querySelector("#detail-delete");
const multiTabBtn = document.querySelector('[data-tab="multi"]');
const multiPanel = document.querySelector('.tab-panel[data-tab="multi"]');
const multiContainer = document.querySelector("#multi-container");
const multiCount = document.querySelector("#multi-count");
const multiEmpty = document.querySelector("#multi-empty");
const selectAllCheckbox = document.querySelector("#orders-select-all");
const exportCsvBtn = document.querySelector("#export-csv");
const exportXlsBtn = document.querySelector("#export-xls");
const exportPdfBtn = document.querySelector("#export-pdf");
const saveMessage = document.querySelector("#save-message");

let cachedOrders = [];
let currentDetailId = null;
let editingOrderId = null;
let editingOrderStatus = null;
const selectedIds = new Set();
let lastViewOrders = [];

init();

function init() {
  renderMenu();
  renderCart();
  loadOrders();

  tabButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      setActiveTab(btn.dataset.tab);
    })
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = serializeForm();
    if (!payload) return;
    if (editingOrderId) {
      await fetch(`/api/orders/${editingOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, status: editingOrderStatus || "registrado" }),
      });
    } else {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    form.reset();
    cart.clear();
    renderCart();
    renderMenu();
    editingOrderId = null;
    editingOrderStatus = null;
    toggleEditMode(false);
    loadOrders();
    showSaveMessage();
  });

  [filterSelect, searchInput, sortSelect].forEach((el) => el && el.addEventListener("change", () => loadOrders()));
  if (searchInput) {
    searchInput.addEventListener("input", () => loadOrders());
  }

  if (detailPrint) {
    detailPrint.addEventListener("click", () => window.print());
  }
  if (detailEditBtn) {
    detailEditBtn.addEventListener("click", () => startEditCurrent());
  }
  if (detailDeleteBtn) {
    detailDeleteBtn.addEventListener("click", () => deleteCurrentOrder());
  }
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", () => toggleSelectAll(selectAllCheckbox.checked));
  }
  exportCsvBtn?.addEventListener("click", exportCsv);
  exportXlsBtn?.addEventListener("click", exportXls);
  exportPdfBtn?.addEventListener("click", exportPdf);
}

function serializeForm() {
  const data = new FormData(form);
  const phoneRaw = (data.get("phone") || "").trim();
  const phone = normalizePhone(phoneRaw);
  const pickupDate = data.get("pickupDate");
  const items = Array.from(cart.values())
    .filter((i) => Number(i.quantity) > 0)
    .map((i) => ({
      name: i.name,
      quantity: Number(i.quantity),
      unit: i.unit,
      price: i.price,
    }));

  if (items.length === 0) {
    alert("Añade al menos un plato al pedido.");
    return null;
  }

  if (!isValidPhone(phone)) {
    alert("Introduce un teléfono válido (solo números, 9 a 15 dígitos, opcional +).");
    return null;
  }

  if (!isValidPickupDate(pickupDate)) {
    alert("La fecha de recogida debe ser a partir de mañana.");
    return null;
  }

  const totalPrice = calculateTotal(items);
  const notes = (data.get("notes") || "").trim();

  return {
    customerName: data.get("customerName"),
    phone,
    pickupDate,
    notes,
    totalPrice,
    items,
  };
}

async function loadOrders() {
  const res = await fetch("/api/orders");
  const { orders } = await res.json();
  const visible = (orders || []).filter((o) => o.status !== "eliminado");
  cachedOrders = visible;
  const view = getViewOrders();
  renderOrders(view);
  renderSummary(visible);
  if (currentDetailId) {
    showOrderDetail(currentDetailId);
  }
  refreshMultiTab();
  lastViewOrders = view;
}

function renderMenu() {
  menuGrid.innerHTML = "";
  menuCategories.forEach((category) => {
    const section = document.createElement("div");
    section.className = "menu-section";
    const title = document.createElement("h3");
    title.textContent = category.name;
    section.appendChild(title);

    const wrap = document.createElement("div");
    wrap.className = "menu-items";

    category.items.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dish-btn";
      btn.addEventListener("click", () => addToCart(item.name));

      const info = document.createElement("div");
      const dishTitle = document.createElement("div");
      dishTitle.className = "dish-title";
      dishTitle.textContent = item.name;
      const dishMeta = document.createElement("div");
      dishMeta.className = "dish-meta";
      dishMeta.textContent = formatPrice(item);
      info.appendChild(dishTitle);
      info.appendChild(dishMeta);

      const qty = cart.get(item.name)?.quantity;
      if (qty) {
        const badge = document.createElement("span");
        badge.className = "dish-qty";
        badge.textContent = qty;
        btn.appendChild(badge);
      }

      btn.appendChild(info);
      wrap.appendChild(btn);
    });

    section.appendChild(wrap);
    menuGrid.appendChild(section);
  });
}

function addToCart(name) {
  const item = menuLookup[name];
  if (!item) return;
  const current = cart.get(name)?.quantity || 0;
  cart.set(name, { ...item, quantity: current + 1 });
  renderCart();
  renderMenu();
}

function updateQuantity(name, quantity) {
  const item = menuLookup[name];
  if (!item) return;
  const qty = Number(quantity);
  if (!Number.isFinite(qty)) return;
  if (qty <= 0) {
    cart.delete(name);
  } else {
    cart.set(name, { ...item, quantity: qty });
  }
  renderCart();
  renderMenu();
}

function renderCart() {
  cartContainer.innerHTML = "";
  if (cart.size === 0) {
    cartContainer.innerHTML = '<p class="cart-meta">Todavía no has añadido platos.</p>';
    updateOrderTotal(0);
    return;
  }

  menuOrder
    .filter((name) => cart.has(name))
    .forEach((name) => {
      const item = cart.get(name);
      const row = document.createElement("div");
      row.className = "cart-row";

      const info = document.createElement("div");
      info.className = "cart-info";
      const title = document.createElement("p");
      title.className = "cart-name";
      title.textContent = item.name;
      const meta = document.createElement("span");
      meta.className = "cart-meta";
      meta.textContent = `${formatPrice(item)} · ${item.unit === "kg" ? "Peso" : "Unidades"}`;
      info.appendChild(title);
      info.appendChild(meta);

      const controls = document.createElement("div");
      controls.className = "cart-controls";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.className = "ghost icon-btn";
      minus.textContent = "−";
      minus.addEventListener("click", () => updateQuantity(name, item.quantity - 1));

      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.step = item.unit === "kg" ? "0.01" : "1";
      input.className = "qty-input";
      input.value = item.quantity;
      input.addEventListener("change", (e) => updateQuantity(name, e.target.value));

      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "ghost icon-btn";
      plus.textContent = "+";
      plus.addEventListener("click", () => updateQuantity(name, item.quantity + 1));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost icon-btn remove-item";
      remove.textContent = "✕";
      remove.addEventListener("click", () => {
        cart.delete(name);
        renderCart();
        renderMenu();
      });

      controls.append(minus, input, plus, remove);
      row.append(info, controls);
      cartContainer.appendChild(row);
    });

  const total = calculateTotal(Array.from(cart.values()));
  updateOrderTotal(total);
}

function formatPrice(item) {
  const unitLabel = item.displayUnit || item.unit;
  return `${Number(item.price).toFixed(2)} €/${unitLabel}`;
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 0), 0);
}

function updateOrderTotal(total) {
  if (!orderTotalEl) return;
  orderTotalEl.textContent = `Total: ${total.toFixed(2)} €`;
}

function isValidPhone(value) {
  return /^\+?\d{9,15}$/.test(normalizePhone(value));
}

function isValidPickupDate(dateStr) {
  if (!dateStr) return false;
  const pickup = new Date(dateStr);
  if (Number.isNaN(pickup.getTime())) return false;
  const min = new Date();
  min.setDate(min.getDate() + 1);
  min.setHours(0, 0, 0, 0);
  return pickup >= min;
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/[\s\-().]/g, "")
    .replace(/^\+?/, (m) => (m === "+" ? "+" : ""));
}

function sortOrders(list) {
  const mode = sortSelect?.value || "date_desc";
  const sorted = [...list];
  const dateValue = (o) => {
    if (o.pickupDate) return new Date(o.pickupDate).getTime();
    if (o.createdAt) return new Date(o.createdAt).getTime();
    return 0;
  };
  if (mode === "date_asc") {
    sorted.sort((a, b) => dateValue(a) - dateValue(b));
  } else if (mode === "status_asc") {
    sorted.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
  } else if (mode === "status_desc") {
    sorted.sort((a, b) => (b.status || "").localeCompare(a.status || ""));
  } else {
    sorted.sort((a, b) => dateValue(b) - dateValue(a));
  }
  return sorted;
}

function getViewOrders() {
  const statusFilter = filterSelect.value;
  const term = (searchInput?.value || "").toLowerCase();
  const filtered = cachedOrders.filter((o) => {
    const statusOk = statusFilter ? o.status === statusFilter : true;
    const matchesTerm =
      !term ||
      o.customerName?.toLowerCase().includes(term) ||
      o.phone?.toLowerCase().includes(term);
    return statusOk && matchesTerm;
  });
  return sortOrders(filtered);
}

function setActiveTab(tab) {
  if (tab !== "detail") {
    detailTabBtn?.classList.add("hidden");
    detailPanel?.classList.add("hidden");
  } else {
    detailTabBtn?.classList.remove("hidden");
    detailPanel?.classList.remove("hidden");
  }
  if (tab !== "multi") {
    multiTabBtn?.classList.add("hidden");
    multiPanel?.classList.add("hidden");
  } else {
    multiTabBtn?.classList.remove("hidden");
    multiPanel?.classList.remove("hidden");
  }
  tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  tabPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.tab === tab));
}

async function showOrderDetail(orderId) {
  let order = cachedOrders.find((o) => o.id === orderId);
  if (!order) return;

  if (order.status === "registrado") {
    await updateOrderStatus(order.id, "recibido", { reloadDetail: true });
    order = cachedOrders.find((o) => o.id === orderId) || order;
  }

  currentDetailId = order.id;
  detailTabBtn?.classList.remove("hidden");
  detailPanel?.classList.remove("hidden");
  setActiveTab("detail");
  detailEmpty.hidden = true;
  detailName.textContent = order.customerName || "Pedido";
  detailDate.textContent = order.pickupDate ? `Entrega: ${formatDateTime(order.pickupDate)}` : "";
  detailNotes.textContent = order.notes ? `Notas: ${order.notes}` : "";
  if (detailStatusLabel) {
    detailStatusLabel.textContent = statusLabels[order.status] || order.status || "";
  }

  detailItems.innerHTML = "";
  (order.items || []).forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.name}</td><td>${item.quantity}</td><td>${item.unit}</td>`;
    detailItems.appendChild(tr);
  });

  renderQuickStatus(order);
}

function renderQuickStatus(order) {
  if (!detailQuickStatus) return;
  const quick = [
    { key: "en_proceso", label: "En proceso" },
    { key: "completado", label: "Completado" },
    { key: "entregado", label: "Entregado" },
  ];
  detailQuickStatus.innerHTML = "";
  quick.forEach(({ key, label }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quick-btn";
    btn.innerHTML = `<span>${statusIcons[key] || ""}</span><span>${label}</span>`;
    btn.addEventListener("click", () => updateOrderStatus(order.id, key, { reloadDetail: true }));
    detailQuickStatus.appendChild(btn);
  });
}

async function updateOrderStatus(orderId, status, { reloadDetail = false } = {}) {
  await fetch(`/api/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  await loadOrders();
  if (reloadDetail) {
    await showOrderDetail(orderId);
  }
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function formatForInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function startEdit(orderId) {
  const order = cachedOrders.find((o) => o.id === orderId);
  if (!order) return;
  editingOrderId = order.id;
  editingOrderStatus = order.status;
  form.customerName.value = order.customerName || "";
  form.phone.value = order.phone || "";
  form.pickupDate.value = formatForInput(order.pickupDate) || "";
  form.notes.value = order.notes || "";

  cart.clear();
  (order.items || []).forEach((item) => {
    const base = menuLookup[item.name] || {};
    cart.set(item.name, {
      name: item.name,
      price: item.price ?? base.price ?? 0,
      unit: item.unit ?? base.unit ?? "unidad",
      displayUnit: base.displayUnit || item.unit,
      quantity: Number(item.quantity) || 0,
    });
  });
  renderCart();
  renderMenu();
  toggleEditMode(true);
  setActiveTab("create");
}

function startEditCurrent() {
  if (currentDetailId) {
    startEdit(currentDetailId);
  }
}

async function deleteOrder(orderId) {
  if (!window.confirm("¿Eliminar este pedido?")) return;
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "eliminado" }),
    });
    if (!res.ok) {
      const msg = await res.text();
      alert(msg || "No se pudo eliminar el pedido.");
      return;
    }
  } catch (err) {
    alert("No se pudo eliminar el pedido (sin conexión con el servidor).");
    return;
  }

  // Limpia caches locales y UI
  cachedOrders = cachedOrders.filter((o) => o.id !== orderId);
  selectedIds.delete(orderId);
  lastViewOrders = getViewOrders();
  renderOrders(lastViewOrders);
  renderSummary(cachedOrders);
  refreshMultiTab();

  if (currentDetailId === orderId) {
    currentDetailId = null;
    detailTabBtn?.classList.add("hidden");
    detailPanel?.classList.add("hidden");
    setActiveTab("orders");
  }
}

function deleteCurrentOrder() {
  if (currentDetailId) {
    deleteOrder(currentDetailId);
  }
}

function toggleEditMode(active) {
  if (!submitBtn) return;
  submitBtn.textContent = active ? "Guardar cambios" : "Guardar pedido";
}

function showSaveMessage() {
  if (!saveMessage) return;
  saveMessage.hidden = false;
  setTimeout(() => {
    saveMessage.hidden = true;
  }, 2500);
}


function renderOrders(orders) {
  ordersTableBody.innerHTML = "";
  if (!orders.length) {
    ordersEmpty.hidden = false;
    return;
  }
  ordersEmpty.hidden = true;

  orders.forEach((order) => {
    const tr = document.createElement("tr");

    const total = order.totalPrice ?? calculateTotal(order.items || []);
    const itemsCount = (order.items || []).reduce((sum, it) => sum + Number(it.quantity || 0), 0);

    tr.innerHTML = `
      <td class="select-cell"><input type="checkbox" data-id="${order.id}" ${selectedIds.has(order.id) ? "checked" : ""}></td>
      <td>${order.customerName || ""}</td>
      <td>${order.phone || ""}</td>
      <td>${order.createdAt ? formatDateTime(order.createdAt) : ""}</td>
      <td>${order.pickupDate ? formatDateTime(order.pickupDate) : ""}</td>
      <td>${order.notes || ""}</td>
      <td>${total.toFixed(2)} €</td>
      <td>${itemsCount}</td>
      <td>${statusLabels[order.status] || order.status}</td>
      <td class="table-actions"></td>
    `;

    tr.addEventListener("dblclick", () => showOrderDetail(order.id));

    const selectBox = tr.querySelector('input[type="checkbox"]');
    selectBox.addEventListener("click", (e) => e.stopPropagation());
    selectBox.addEventListener("change", (e) => {
      if (e.target.checked) {
        selectedIds.add(order.id);
      } else {
        selectedIds.delete(order.id);
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
      }
      refreshMultiTab();
    });

    const actionsCell = tr.lastElementChild;
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "ghost";
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      startEdit(order.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "ghost danger";
    deleteBtn.textContent = "🗑️";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteOrder(order.id);
    });

    actionsCell.append(editBtn, deleteBtn);

    ordersTableBody.appendChild(tr);
  });

  if (selectAllCheckbox) {
    const allChecked = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));
    selectAllCheckbox.checked = allChecked;
  }
}

function renderSummary(allOrders) {
  const total = allOrders.length;
  const byStatus = allOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const parts = STATUSES.filter((s) => s !== "eliminado").map((s) => `${statusLabels[s]}: ${byStatus[s] || 0}`);
  summary.textContent = total === 0 ? "Sin pedidos" : `Total: ${total} · ${parts.join(" · ")}`;
}

function toggleSelectAll(checked) {
  if (checked) {
    cachedOrders.forEach((o) => selectedIds.add(o.id));
  } else {
    selectedIds.clear();
  }
  renderOrders(cachedOrders);
  refreshMultiTab();
}

function refreshMultiTab() {
  const selected = cachedOrders.filter((o) => selectedIds.has(o.id));
  const hasSelection = selected.length > 0;

  if (!hasSelection) {
    if (multiTabBtn) multiTabBtn.classList.add("hidden");
    if (multiPanel) multiPanel.classList.add("hidden");
    if (multiContainer) multiContainer.innerHTML = "";
    if (multiEmpty) multiEmpty.hidden = false;
    if (multiCount) multiCount.textContent = "Selecciona pedidos en la tabla.";
    if ([...tabButtons].some((b) => b.classList.contains("active") && b.dataset.tab === "multi")) {
      setActiveTab("orders");
    }
    return;
  }

  if (multiTabBtn) multiTabBtn.classList.remove("hidden");
  if (multiPanel) multiPanel.classList.remove("hidden");

  if (multiCount) multiCount.textContent = `Mostrando ${selected.length} pedido(s)`;
  if (multiEmpty) multiEmpty.hidden = true;
  if (multiContainer) {
    multiContainer.innerHTML = "";
    selected.forEach((order) => {
      const card = document.createElement("div");
      card.className = "multi-card";
      card.addEventListener("dblclick", () => showOrderDetail(order.id));

      const title = document.createElement("h4");
      title.textContent = order.customerName || "Pedido";
      const status = document.createElement("div");
      status.className = "multi-status";
      status.textContent = statusLabels[order.status] || order.status;
      const meta = document.createElement("p");
      meta.className = "multi-meta";
      meta.textContent = order.pickupDate ? `Entrega: ${formatDateTime(order.pickupDate)}` : "";

      const list = document.createElement("ul");
      list.className = "multi-items";
      (order.items || []).forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${item.name}</span><span>${item.quantity} ${item.unit}</span>`;
        list.appendChild(li);
      });

      card.append(status, title, meta, list);
      multiContainer.appendChild(card);
    });
  }
}

function getExportData() {
  const rows = lastViewOrders.length ? lastViewOrders : getViewOrders();
  return rows.map((o) => ({
    cliente: o.customerName || "",
    telefono: o.phone || "",
    fechaAlta: o.createdAt ? formatDateTime(o.createdAt) : "",
    fechaRecogida: o.pickupDate ? formatDateTime(o.pickupDate) : "",
    notas: o.notes || "",
    importe: (o.totalPrice ?? calculateTotal(o.items || [])).toFixed(2),
    estado: statusLabels[o.status] || o.status || "",
  }));
}

function exportCsv() {
  const data = getExportData();
  const header = ["Cliente", "Teléfono", "Fecha alta", "Fecha recogida", "Notas", "Importe", "Estado"];
  const toCsvVal = (v) => {
    const str = String(v ?? "");
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const lines = [header.map(toCsvVal).join(",")].concat(
    data.map((row) =>
      [row.cliente, row.telefono, row.fechaAlta, row.fechaRecogida, row.notas, row.importe, row.estado]
        .map(toCsvVal)
        .join(",")
    )
  );
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pedidos.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportXls() {
  const data = getExportData();
  const rows = data
    .map(
      (row) =>
        `<tr><td>${row.cliente}</td><td>${row.telefono}</td><td>${row.fechaAlta}</td><td>${row.fechaRecogida}</td><td>${row.notas}</td><td>${row.importe}</td><td>${row.estado}</td></tr>`
    )
    .join("");
  const table = `<table><thead><tr><th>Cliente</th><th>Teléfono</th><th>Fecha alta</th><th>Fecha recogida</th><th>Notas</th><th>Importe</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`;
  const blob = new Blob([table], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pedidos.xls";
  link.click();
  URL.revokeObjectURL(url);
}

function exportPdf() {
  const data = getExportData();
  const rows = data
    .map(
      (row) =>
        `<tr><td>${row.cliente}</td><td>${row.telefono}</td><td>${row.fechaAlta}</td><td>${row.fechaRecogida}</td><td>${row.notas}</td><td>${row.importe}</td><td>${row.estado}</td></tr>`
    )
    .join("");
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Pedidos</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 6px; font-size: 13px; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h3>Pedidos</h3>
        <table>
          <thead><tr><th>Cliente</th><th>Teléfono</th><th>Fecha alta</th><th>Fecha recogida</th><th>Notas</th><th>Importe</th><th>Estado</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
