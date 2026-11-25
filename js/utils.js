/** Funciones de apoyo para el DOM, formato y errores de formulario. */
class Utils {
  static $(id) { return document.getElementById(id); }

  static el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  static money(n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
  }

  static normalize(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /** Muestra u oculta el error de un campo (input con id=campo, mensaje en id=e-campo). */
  static setError(field, msg = '') {
    const e = Utils.$('e-' + field);
    if (e) e.textContent = msg;
    const i = Utils.$(field);
    if (i) i.classList.toggle('invalid', !!msg);
  }

  static clearErrors(fields) { fields.forEach(f => Utils.setError(f)); }

  static toB64(buf) {
    const a = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s);
  }

  static fromB64(str) {
    const b = atob(str);
    const a = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return a;
  }
}
