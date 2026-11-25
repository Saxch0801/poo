/** Mensajes breves en pantalla. */
class Toast {
  static show(msg) {
    const t = Utils.$('toast');
    t.textContent = msg;
    t.className = 'on';
    clearTimeout(Toast._timer);
    Toast._timer = setTimeout(() => (t.className = ''), 2200);
  }
}
