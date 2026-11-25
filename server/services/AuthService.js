const crypto = require('crypto');
const { promisify } = require('util');
const HashTable = require('../structures/HashTable');
const { DomainError } = require('../errors');

const scrypt = promisify(crypto.scrypt);
const MAX_FAILS = 5, LOCK_MS = 30000;
const SESSION_MS = 12 * 3600e3, KEEP_MS = 7 * 24 * 3600e3;

/** Usuarios (tabla hash por correo), contraseñas con scrypt y sesiones por cookie. */
class AuthService {
  constructor(storage) {
    this.storage = storage;
    this.users = new HashTable();
    this.sessions = new Map();     // token -> { user, exp }
    this.fails = new Map();        // correo -> { n, lock }
    storage.read('usuarios.json', []).forEach(u => this.users.set(u.email, u));
  }

  _hash(password, saltHex) { return scrypt(password, Buffer.from(saltHex, 'hex'), 32); }
  _save() { this.storage.write('usuarios.json', [...this.users.values()]); }

  async register({ nombre, email, password }) {
    const taken = () => new DomainError('u-mail', 'Ya existe una cuenta con ese correo.', 409);
    if (this.users.has(email)) throw taken();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = (await this._hash(password, salt)).toString('hex');
    if (this.users.has(email)) throw taken();               // otra petición pudo registrarlo mientras se calculaba
    this.users.set(email, { email, nombre, salt, hash, creado: Date.now() });
    this._save();
    return { email, nombre };
  }

  async login(email, password) {
    const f = this.fails.get(email) || { n: 0, lock: 0 };
    const wait = Math.ceil((f.lock - Date.now()) / 1000);
    if (wait > 0) throw new DomainError('l-all', `Demasiados intentos. Espera ${wait} s e inténtalo de nuevo.`, 429);

    const u = this.users.get(email);
    // Se calcula el hash aunque no exista la cuenta, para que el tiempo no delate qué correos existen.
    const h = await this._hash(password, u ? u.salt : '00'.repeat(16));
    if (!u || !crypto.timingSafeEqual(h, Buffer.from(u.hash, 'hex'))) {
      if (this.fails.size > 1000) this.fails.clear();
      if (++f.n >= MAX_FAILS) { f.n = 0; f.lock = Date.now() + LOCK_MS; }
      this.fails.set(email, f);
      throw new DomainError('l-all', 'Correo o contraseña incorrectos.', 401);
    }
    this.fails.delete(email);
    return { email: u.email, nombre: u.nombre };
  }

  createSession(user, keep) {
    const token = crypto.randomBytes(32).toString('hex');
    const ms = keep ? KEEP_MS : SESSION_MS;
    this.sessions.set(token, { user, exp: Date.now() + ms });
    return { token, maxAge: keep ? ms / 1000 : null };
  }

  userFrom(token) {
    const s = token && this.sessions.get(token);
    if (!s) return null;
    if (s.exp < Date.now()) { this.sessions.delete(token); return null; }
    return s.user;
  }

  destroy(token) { this.sessions.delete(token); }
}
module.exports = AuthService;
