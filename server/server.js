'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

global.Config = require('../shared/config');          // el Validator compartido lee Config como global
const Validator = require('../shared/validator');
const { DomainError } = require('./errors');
const FileStorage = require('./storage/FileStorage');
const AuthService = require('./services/AuthService');
const Inventory = require('./services/Inventory');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const SHARED = path.join(ROOT, 'shared');
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const storage = new FileStorage(path.join(ROOT, 'data'));
const auth = new AuthService(storage);
const saved = storage.read('productos.json', {});     // { correo: { nextId, productos, bitacora } }
const inventarios = new Map();

function inventory(email) {
  if (!inventarios.has(email)) inventarios.set(email, new Inventory(saved[email]));
  return inventarios.get(email);
}
function persist(email) {
  saved[email] = inventory(email).toJSON();
  storage.write('productos.json', saved);
}

/* ---------- utilidades HTTP ---------- */
async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 2e6) throw new DomainError(null, 'La solicitud es demasiado grande.', 413);
    chunks.push(c);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}
function send(res, status, obj, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(obj));
}
function getCookie(req, name) {
  const m = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return m ? m.slice(name.length + 1) : null;
}
function sessionCookie(token, maxAge) {
  return `sid=${token}; HttpOnly; SameSite=Strict; Path=/` + (maxAge ? `; Max-Age=${maxAge}` : '');
}

function parseProducto(raw) {
  const { errors, values } = Validator.producto(raw);
  const first = Object.keys(errors)[0];
  if (first) throw new DomainError(first, errors[first], 400);
  const f = raw.foto;
  const okFoto = typeof f === 'string' && f.length < 1.5e6 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(f);
  values.foto = okFoto ? f : null;
  return values;
}

function view(inv, q) {
  return {
    items: inv.list({ q: q.get('q') || '', cat: q.get('cat') || '', sort: q.get('sort') || 'nuevo' }),
    total: inv.lista.size,
    stats: inv.stats(),
    bitacora: inv.bitacora.toArray(),
    puedeDeshacer: !inv.undo.isEmpty()
  };
}

/* ---------- API ---------- */
async function api(req, res, url) {
  const m = req.method, p = url.pathname;

  if (m === 'POST' && p === '/api/register') {
    const b = await readBody(req);
    const data = { nombre: String(b.nombre ?? '').trim().replace(/\s+/g, ' '), email: String(b.email ?? '').trim().toLowerCase(), password: String(b.password ?? '') };
    const errors = Validator.register(data);
    const first = Object.keys(errors)[0];
    if (first) throw new DomainError(first, errors[first], 400);
    const user = await auth.register(data);
    const s = auth.createSession(user, false);
    return send(res, 201, { user }, { 'Set-Cookie': sessionCookie(s.token, s.maxAge) });
  }

  if (m === 'POST' && p === '/api/login') {
    const b = await readBody(req);
    const user = await auth.login(String(b.email ?? '').trim().toLowerCase(), String(b.password ?? ''));
    const s = auth.createSession(user, !!b.keep);
    return send(res, 200, { user }, { 'Set-Cookie': sessionCookie(s.token, s.maxAge) });
  }

  if (m === 'POST' && p === '/api/logout') {
    auth.destroy(getCookie(req, 'sid'));
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  }

  const user = auth.userFrom(getCookie(req, 'sid'));
  if (m === 'GET' && p === '/api/me') return send(res, 200, { user });
  if (!user) throw new DomainError(null, 'Inicia sesión para continuar.', 401);
  const inv = inventory(user.email);

  if (p === '/api/productos' && m === 'GET') return send(res, 200, view(inv, url.searchParams));
  if (p === '/api/productos' && m === 'POST') {
    inv.add(parseProducto(await readBody(req)));
    persist(user.email);
    return send(res, 201, { ok: true });
  }
  if (p === '/api/deshacer' && m === 'POST') {
    inv.deshacer();
    persist(user.email);
    return send(res, 200, { ok: true });
  }

  const match = p.match(/^\/api\/productos\/(\d+)$/);
  if (match && m === 'PUT') {
    inv.update(Number(match[1]), parseProducto(await readBody(req)));
    persist(user.email);
    return send(res, 200, { ok: true });
  }
  if (match && m === 'DELETE') {
    inv.remove(Number(match[1]));
    persist(user.email);
    return send(res, 200, { ok: true });
  }
  throw new DomainError(null, 'Ruta no encontrada.', 404);
}

/* ---------- archivos estáticos ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

function serveStatic(res, pathname) {
  let base = PUBLIC, rel;
  try { rel = decodeURIComponent(pathname); } catch { res.writeHead(400); return res.end(); }
  if (rel.startsWith('/shared/')) { base = SHARED; rel = rel.slice(8); }
  if (rel === '/' || rel === '') rel = 'index.html';
  const file = path.normalize(path.join(base, rel));
  if (!file.startsWith(base + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(buf);
  });
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) await api(req, res, url);
    else serveStatic(res, url.pathname);
  } catch (e) {
    if (e instanceof DomainError) return send(res, e.status, { error: e.message, field: e.field });
    if (e instanceof SyntaxError) return send(res, 400, { error: 'JSON inválido.' });
    console.error(e);
    send(res, 500, { error: 'Error interno del servidor.' });
  }
}).listen(PORT, HOST, () => console.log(`Servidor listo en http://${HOST}:${PORT}`));
