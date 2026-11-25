/** Cola circular (FIFO) de capacidad fija. Se usa para la bitácora de actividad reciente. */
class Queue {
  constructor(capacity = 15) {
    this.buf = new Array(capacity);
    this.cap = capacity;
    this.head = 0;
    this.size = 0;
  }
  enqueue(x) {
    if (this.size === this.cap) this.dequeue();               // si está llena, sale el más antiguo
    this.buf[(this.head + this.size) % this.cap] = x;
    this.size++;
  }
  dequeue() {
    if (!this.size) return undefined;
    const x = this.buf[this.head];
    this.buf[this.head] = undefined;
    this.head = (this.head + 1) % this.cap;
    this.size--;
    return x;
  }
  toArray() {
    const out = [];
    for (let i = 0; i < this.size; i++) out.push(this.buf[(this.head + i) % this.cap]);
    return out;
  }
}
module.exports = Queue;
