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

  /** Muestra u oculta el error de un campo (input con id=campo, mensaje en id=e-campo). */
  static setError(field, msg = '') {
    const e = Utils.$('e-' + field);
    if (e) e.textContent = msg;
    const i = Utils.$(field);
    if (i) i.classList.toggle('invalid', !!msg);
  }

  static clearErrors(fields) { fields.forEach(f => Utils.setError(f)); }
}
