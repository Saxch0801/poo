/** Pila (LIFO). Se usa para "Deshacer": la última acción es la primera que se revierte. */
class Stack {
  constructor(limit = 30) { this.items = []; this.limit = limit; }
  push(x) {
    this.items.push(x);
    if (this.items.length > this.limit) this.items.shift();   // descarta la acción más vieja
  }
  pop() { return this.items.pop(); }
  peek() { return this.items[this.items.length - 1]; }
  isEmpty() { return this.items.length === 0; }
  get size() { return this.items.length; }
}
module.exports = Stack;
