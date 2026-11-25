/** Tabla hash con encadenamiento. Redimensiona cuando el factor de carga pasa de 0.75. */
class HashTable {
  constructor(capacity = 16) {
    this.buckets = Array.from({ length: capacity }, () => []);
    this.size = 0;
  }

  _hash(key) {                                   // djb2
    let h = 5381;
    for (const ch of String(key)) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
    return h % this.buckets.length;
  }

  set(key, value) {
    const bucket = this.buckets[this._hash(key)];
    const entry = bucket.find(e => e.key === key);
    if (entry) { entry.value = value; return; }
    bucket.push({ key, value });
    if (++this.size / this.buckets.length > 0.75) this._resize();
  }

  get(key) {
    const entry = this.buckets[this._hash(key)].find(e => e.key === key);
    return entry ? entry.value : undefined;
  }

  has(key) { return this.get(key) !== undefined; }

  delete(key) {
    const bucket = this.buckets[this._hash(key)];
    const i = bucket.findIndex(e => e.key === key);
    if (i < 0) return false;
    bucket.splice(i, 1);
    this.size--;
    return true;
  }

  *values() { for (const b of this.buckets) for (const e of b) yield e.value; }

  _resize() {
    const old = this.buckets;
    this.buckets = Array.from({ length: old.length * 2 }, () => []);
    this.size = 0;
    for (const b of old) for (const e of b) this.set(e.key, e.value);
  }
}
module.exports = HashTable;
