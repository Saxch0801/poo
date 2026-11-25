/** Lista doblemente enlazada. Guarda el inventario en orden de llegada. */
class LinkedList {
  constructor() { this.head = null; this.tail = null; this.size = 0; }

  /** Agrega al final. Devuelve el nodo para poder borrarlo luego en O(1). */
  append(value) {
    const node = { value, prev: this.tail, next: null };
    if (this.tail) this.tail.next = node; else this.head = node;
    this.tail = node;
    this.size++;
    return node;
  }

  /** Quita un nodo conocido, sin recorrer la lista. O(1). */
  removeNode(node) {
    if (node.prev) node.prev.next = node.next; else this.head = node.next;
    if (node.next) node.next.prev = node.prev; else this.tail = node.prev;
    this.size--;
  }

  *[Symbol.iterator]() { for (let n = this.head; n; n = n.next) yield n.value; }
  toArray() { return [...this]; }
}
module.exports = LinkedList;
