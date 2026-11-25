/** Operaciones sobre productos. Cada producto pertenece a un usuario (uid = correo). */
class ProductService {
  constructor(db) { this.db = db; }

  async list(uid) {
    const all = await this.db.getAll('productos');
    return all.filter(p => p.uid === uid);
  }

  save(product) { return this.db.put('productos', product); }
  remove(id) { return this.db.delete('productos', id); }

  /** Asigna a `uid` los productos que no tenían dueño (datos de versiones anteriores). */
  async claimOrphans(uid) {
    const all = await this.db.getAll('productos');
    await Promise.all(all.filter(p => !p.uid).map(p => this.db.put('productos', { ...p, uid })));
  }

  static stats(items) {
    return {
      total: items.length,
      valor: items.reduce((sum, p) => sum + p.precio * p.stock, 0),
      bajo: items.filter(p => p.stock <= Config.STOCK_BAJO).length
    };
  }

  static filter(items, { q, cat, sort }) {
    const term = Utils.normalize(q.trim());
    const out = items.filter(p =>
      (!cat || p.categoria === cat) &&
      (!term || Utils.normalize(`${p.nombre} ${p.codigo} ${p.desc || ''} ${p.categoria}`).includes(term)));
    const by = {
      nuevo: (a, b) => (b.creado || 0) - (a.creado || 0),
      nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
      precioA: (a, b) => a.precio - b.precio,
      precioD: (a, b) => b.precio - a.precio,
      stock: (a, b) => a.stock - b.stock
    };
    return out.sort(by[sort] || by.nuevo);
  }
}
