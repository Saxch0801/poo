/** Capa de datos: IndexedDB con respaldo en memoria si el navegador no la permite. */
class Database {
  constructor(name, version) {
    this.name = name;
    this.version = version;
    this.db = null;
    this.meta = {};
    this.mem = {};
    this.seq = 0;
  }

  /** Abre la base y crea los almacenes. Devuelve false si usa el respaldo en memoria. */
  open(stores) {
    stores.forEach(s => (this.meta[s.name] = s));
    return new Promise(resolve => {
      try {
        const req = indexedDB.open(this.name, this.version);
        req.onupgradeneeded = () => {
          stores.forEach(s => {
            if (!req.result.objectStoreNames.contains(s.name)) {
              req.result.createObjectStore(s.name, { keyPath: s.keyPath, autoIncrement: !!s.auto });
            }
          });
        };
        req.onsuccess = () => { this.db = req.result; resolve(true); };
        req.onerror = () => resolve(false);
      } catch { resolve(false); }
    });
  }

  _store(name, mode) { return this.db.transaction(name, mode).objectStore(name); }
  _mem(name) { return this.mem[name] || (this.mem[name] = new Map()); }
  _req(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(name) {
    return this.db ? this._req(this._store(name, 'readonly').getAll()) : [...this._mem(name).values()];
  }

  async get(name, key) {
    if (!this.db) return this._mem(name).get(key) || null;
    return (await this._req(this._store(name, 'readonly').get(key))) || null;
  }

  async count(name) {
    return this.db ? this._req(this._store(name, 'readonly').count()) : this._mem(name).size;
  }

  async put(name, rec) {
    const { keyPath, auto } = this.meta[name];
    if (this.db) {
      const key = await this._req(this._store(name, 'readwrite').put(rec));
      rec[keyPath] = key;
      return rec;
    }
    if (auto && rec[keyPath] == null) rec[keyPath] = ++this.seq;
    this._mem(name).set(rec[keyPath], rec);
    return rec;
  }

  async delete(name, key) {
    if (this.db) await this._req(this._store(name, 'readwrite').delete(key));
    else this._mem(name).delete(key);
  }
}
