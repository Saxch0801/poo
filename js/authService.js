/** Error de autenticación asociado a un campo del formulario. */
class AuthError extends Error {
  constructor(field, message) { super(message); this.field = field; }
}

/** Registro, inicio de sesión y manejo de la sesión actual. */
class AuthService {
  constructor(db) {
    this.db = db;
    this.user = null;
    this.fails = 0;
    this.lockUntil = 0;
  }

  /** Contraseña -> hash PBKDF2-SHA256 en base64. */
  async hash(password, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: Config.PBKDF2_ITER }, key, 256);
    return Utils.toB64(bits);
  }

  async register({ nombre, email, password }) {
    if (await this.db.get('usuarios', email)) throw new AuthError('u-mail', 'Ya existe una cuenta con ese correo.');
    const first = (await this.db.count('usuarios')) === 0;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const user = { email, nombre, salt: Utils.toB64(salt), hash: await this.hash(password, salt), creado: Date.now() };
    await this.db.put('usuarios', user);
    return { user: this._public(user), first };
  }

  async login(email, password) {
    const wait = Math.ceil((this.lockUntil - Date.now()) / 1000);
    if (wait > 0) throw new AuthError('l-all', `Demasiados intentos. Espera ${wait} s e inténtalo de nuevo.`);

    const u = await this.db.get('usuarios', email);
    // Se calcula el hash aunque el usuario no exista, para que el tiempo no delate cuentas.
    const h = await this.hash(password, u ? Utils.fromB64(u.salt) : new Uint8Array(16));
    if (!u || h !== u.hash) {
      if (++this.fails >= Config.MAX_INTENTOS) { this.fails = 0; this.lockUntil = Date.now() + Config.BLOQUEO_MS; }
      throw new AuthError('l-all', 'Correo o contraseña incorrectos.');
    }
    this.fails = 0;
    return this._public(u);
  }

  /** Guarda la sesión (solo el correo). `keep` la conserva al cerrar el navegador. */
  start(user, keep) {
    this.user = user;
    this._clear();
    try { (keep ? localStorage : sessionStorage).setItem('sesion', user.email); } catch { /* sin almacenamiento */ }
  }

  async restore() {
    let email = null;
    try { email = sessionStorage.getItem('sesion') || localStorage.getItem('sesion'); } catch { /* ignorar */ }
    if (!email) return null;
    const u = await this.db.get('usuarios', email);
    if (!u) { this._clear(); return null; }
    this.user = this._public(u);
    return this.user;
  }

  logout() { this.user = null; this._clear(); }

  _clear() { try { sessionStorage.removeItem('sesion'); localStorage.removeItem('sesion'); } catch { /* ignorar */ } }
  _public(u) { return { email: u.email, nombre: u.nombre }; }
}
