const http = require("http");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");
const PUBLIC_DIR = path.join(__dirname, "public");

const STATUSES = ["registrado", "recibido", "en_proceso", "completado", "entregado", "eliminado"];

ensureDataFile();

const server = http.createServer(async (req, res) => {
  try {
    // API routes
    if (req.url.startsWith("/api/orders")) {
      await handleApi(req, res);
      return;
    }

    // Static assets
    serveStatic(req, res);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
});

server.listen(PORT, () => {
  console.log(`Orders app running on http://localhost:${PORT}`);
});

async function handleApi(req, res) {
  // GET /api/orders
  if (req.method === "GET" && req.url === "/api/orders") {
    const orders = loadOrders();
    sendJson(res, 200, { orders });
    return;
  }

  // POST /api/orders
  if (req.method === "POST" && req.url === "/api/orders") {
    const body = await parseJsonBody(req, res);
    if (!body) return;

    const validation = validateNewOrder(body);
    if (!validation.ok) {
      sendJson(res, 400, { error: validation.error });
      return;
    }

    const orders = loadOrders();
    const newOrder = {
      id: randomUUID(),
      customerName: body.customerName.trim(),
      phone: String(body.phone).trim(),
      pickupDate: body.pickupDate,
      items: body.items.map((item) => ({
        name: item.name.trim(),
        unit: item.unit,
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
      status: "registrado",
      createdAt: new Date().toISOString(),
    };

    newOrder.totalPrice = newOrder.items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
    newOrder.notes = (body.notes || "").trim();

    orders.push(newOrder);
    saveOrders(orders);
    sendJson(res, 201, { order: newOrder });
    return;
  }

  // PATCH /api/orders/:id
  if (req.method === "PATCH" && req.url.startsWith("/api/orders/")) {
    const id = req.url.split("/").pop();
    const body = await parseJsonBody(req, res);
    if (!body) return;

    let nextStatus = body.status == null ? "eliminado" : String(body.status).trim();
    if (!nextStatus) nextStatus = "eliminado";
    if (!STATUSES.includes(nextStatus)) {
      sendJson(res, 400, { error: `Estado no válido (${nextStatus})` });
      return;
    }

    const orders = loadOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      sendJson(res, 404, { error: "Pedido no encontrado" });
      return;
    }

    orders[idx].status = nextStatus;
    orders[idx].updatedAt = new Date().toISOString();
    saveOrders(orders);
    sendJson(res, 200, { order: orders[idx] });
    return;
  }

  // PUT /api/orders/:id
  if (req.method === "PUT" && req.url.startsWith("/api/orders/")) {
    const id = req.url.split("/").pop();
    const body = await parseJsonBody(req, res);
    if (!body) return;

    const validation = validateNewOrder(body);
    if (!validation.ok) {
      sendJson(res, 400, { error: validation.error });
      return;
    }

    const orders = loadOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      sendJson(res, 404, { error: "Pedido no encontrado" });
      return;
    }

    const updated = {
      ...orders[idx],
      customerName: body.customerName.trim(),
      phone: String(body.phone).trim(),
      pickupDate: body.pickupDate,
      notes: (body.notes || "").trim(),
      items: body.items.map((item) => ({
        name: item.name.trim(),
        unit: item.unit,
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
      totalPrice: body.totalPrice ?? calculateTotal(body.items),
      status: STATUSES.includes(body.status) ? body.status : orders[idx].status,
      updatedAt: new Date().toISOString(),
    };

    orders[idx] = updated;
    saveOrders(orders);
    sendJson(res, 200, { order: updated });
    return;
  }

  // DELETE /api/orders/:id
  if (req.method === "DELETE" && req.url.startsWith("/api/orders/")) {
    const id = req.url.split("/").pop();
    const orders = loadOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      sendJson(res, 404, { error: "Pedido no encontrado" });
      return;
    }
    orders[idx].status = "eliminado";
    orders[idx].updatedAt = new Date().toISOString();
    saveOrders(orders);
    sendJson(res, 200, { order: orders[idx] });
    return;
  }

  sendJson(res, 404, { error: "Ruta no encontrada" });
}

function serveStatic(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  if (pathname === "/") {
    pathname = "/index.html";
  }

  const filePath = path.join(PUBLIC_DIR, pathname);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { "Content-Type": contentTypeFor(path.extname(filePath)) });
    stream.pipe(res);
  });
}

function parseJsonBody(req, res) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      // Simple guard: 1MB max
      if (body.length > 1e6) {
        res.writeHead(413);
        res.end();
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body || "{}");
        resolve(data);
      } catch (err) {
        sendJson(res, 400, { error: "JSON no válido" });
        resolve(null);
      }
    });
  });
}

function validateNewOrder(body) {
  if (!body.customerName || !body.phone || !body.pickupDate || !Array.isArray(body.items)) {
    return { ok: false, error: "Faltan campos obligatorios" };
  }

  const phoneDigits = String(body.phone).replace(/[^\d+]/g, "");
  if (!/^\+?\d{9,15}$/.test(phoneDigits)) {
    return { ok: false, error: "Teléfono no válido" };
  }

  if (!isValidPickupDate(body.pickupDate)) {
    return { ok: false, error: "La fecha debe ser a partir de mañana" };
  }

  const itemsOk =
    body.items.length > 0 &&
    body.items.every(
      (i) =>
        i.name &&
        typeof i.name === "string" &&
        ["unidad", "kg"].includes(i.unit) &&
        !isNaN(Number(i.price)) &&
        !isNaN(Number(i.quantity))
    );

  if (!itemsOk) return { ok: false, error: "Revisa los datos de los platos" };

  return { ok: true };
}

function loadOrders() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const orders = JSON.parse(raw);
    let dirty = false;
    const normalized = (orders || []).map((o) => {
      const copy = { ...o };
      if (copy.notes === undefined) {
        copy.notes = "";
        dirty = true;
      }
      if (copy.totalPrice === undefined && Array.isArray(copy.items)) {
        copy.totalPrice = calculateTotal(copy.items);
        dirty = true;
      }
      return copy;
    });
    if (dirty) {
      saveOrders(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
}

function calculateTotal(items) {
  return (items || []).reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
}

function isValidPickupDate(dateStr) {
  if (!dateStr) return false;
  const pickup = new Date(dateStr);
  if (Number.isNaN(pickup.getTime())) return false;
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return pickup >= tomorrow;
}

function ensureDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]");
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function contentTypeFor(ext) {
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    default:
      return "text/plain; charset=utf-8";
  }
}
