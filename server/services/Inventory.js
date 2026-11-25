const LinkedList = require('../structures/LinkedList');
const HashTable = require('../structures/HashTable');
const Stack = require('../structures/Stack');
const Queue = require('../structures/Queue');
const Config = require('../../shared/config');
const { DomainError } = require('../errors');

const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const SORTS = {
  nuevo: (a, b) => (b.creado || 0) - (a.creado || 0),
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  precioA: (a, b) => a.precio - b.precio,
  precioD: (a, b) => b.precio - a.precio,
  stock: (a, b) => a.stock - b.stock
};

/**
 * Inventario de un usuario. Combina las estructuras de datos:
 *  - LinkedList: guarda los productos
 *  - HashTable porId / porCodigo: encuentran un producto en O(1) y evitan códigos repetidos
 *  - Stack: acciones para deshacer
 *  - Queue: bitácora de actividad reciente
 */
class Inventory {
  constructor(data = {}) {
    this.lista = new LinkedList();
    this.porId = new HashTable();
    this.porCodigo = new HashTable();
    this.undo = new Stack(30);
    this.bitacora = new Queue(15);
    this.nextId = data.nextId || 1;
    (data.productos || []).forEach(p => this._insert(p));
    (data.bitacora || []).forEach(b => this.bitacora.enqueue(b));
  }

  _insert(p) {
    const node = this.lista.append(p);
    this.porId.set(p.id, node);
    this.porCodigo.set(p.codigo, node);
  }
  _remove(node) {
    this.lista.removeNode(node);
    this.porId.delete(node.value.id);
    this.porCodigo.delete(node.value.codigo);
  }
  _replace(node, p) {
    this.porCodigo.delete(node.value.codigo);
    node.value = p;
    this.porCodigo.set(p.codigo, node);
  }
  _log(msg) { this.bitacora.enqueue({ t: Date.now(), msg }); }
  _node(id) {
    const node = this.porId.get(id);
    if (!node) throw new DomainError(null, 'Producto no encontrado.', 404);
    return node;
  }

  add(values) {
    if (this.porCodigo.has(values.codigo)) throw new DomainError('codigo', 'Ya existe un producto con ese código.', 409);
    const p = { ...values, id: this.nextId++, creado: Date.now() };
    this._insert(p);
    this.undo.push({ tipo: 'alta', id: p.id });
    this._log(`Agregaste "${p.nombre}"`);
    return p;
  }

  update(id, values) {
    const node = this._node(id);
    const other = this.porCodigo.get(values.codigo);
    if (other && other !== node) throw new DomainError('codigo', 'Ya existe un producto con ese código.', 409);
    const prev = node.value;
    this._replace(node, { ...prev, ...values, id, creado: prev.creado });
    this.undo.push({ tipo: 'edicion', prev });
    this._log(`Editaste "${values.nombre}"`);
  }

  remove(id) {
    const node = this._node(id);
    this.undo.push({ tipo: 'baja', producto: node.value });
    this._log(`Eliminaste "${node.value.nombre}"`);
    this._remove(node);
  }

  /** Revierte la última acción (pop de la pila). */
  deshacer() {
    const op = this.undo.peek();
    if (!op) throw new DomainError(null, 'No hay nada que deshacer.', 400);

    const prod = op.tipo === 'baja' ? op.producto : op.tipo === 'edicion' ? op.prev : null;
    const owner = prod && this.porCodigo.get(prod.codigo);
    if (owner && owner.value.id !== prod.id) {
      throw new DomainError(null, 'No se puede deshacer: otro producto ya usa ese código.', 409);
    }
    this.undo.pop();

    if (op.tipo === 'alta') {
      const node = this.porId.get(op.id);
      if (node) { this._log(`Deshiciste el alta de "${node.value.nombre}"`); this._remove(node); }
    } else if (op.tipo === 'edicion') {
      const node = this.porId.get(op.prev.id);
      if (node) { this._replace(node, op.prev); this._log(`Deshiciste la edición de "${op.prev.nombre}"`); }
    } else {
      this._insert(op.producto);
      this._log(`Recuperaste "${op.producto.nombre}"`);
    }
  }

  list({ q = '', cat = '', sort = 'nuevo' }) {
    const term = norm(q.trim());
    const out = [];
    for (const p of this.lista) {
      if (cat && p.categoria !== cat) continue;
      if (term && !norm(`${p.nombre} ${p.codigo} ${p.desc || ''} ${p.categoria}`).includes(term)) continue;
      out.push(p);
    }
    return out.sort(SORTS[sort] || SORTS.nuevo);
  }

  stats() {
    let valor = 0, bajo = 0;
    for (const p of this.lista) { valor += p.precio * p.stock; if (p.stock <= Config.STOCK_BAJO) bajo++; }
    return { total: this.lista.size, valor, bajo };
  }

  toJSON() { return { nextId: this.nextId, productos: this.lista.toArray(), bitacora: this.bitacora.toArray() }; }
}
module.exports = Inventory;
