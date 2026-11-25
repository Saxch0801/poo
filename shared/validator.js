/** Reglas de validación. Se usan en el navegador (para avisar rápido) y en el servidor (la que cuenta). */
class Validator {
  static EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  static register(raw) {
    const s = k => String(raw[k] ?? '');
    const errors = {};
    if (s('nombre').length < 2) errors['u-nombre'] = 'Escribe tu nombre (mínimo 2 caracteres).';
    if (!Validator.EMAIL.test(s('email'))) errors['u-mail'] = 'Escribe un correo válido.';
    const pw = s('password');
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) errors['u-pass'] = 'Mínimo 8 caracteres, con letras y números.';
    if (raw.password2 !== undefined && s('password2') !== pw) errors['u-pass2'] = 'Las contraseñas no coinciden.';
    return errors;
  }

  /** Valida un producto. Devuelve { errors, values } con los valores ya limpios. */
  static producto(raw) {
    const s = k => String(raw[k] ?? '');
    const errors = {};
    const v = {
      codigo: s('codigo').trim().toUpperCase(),
      nombre: s('nombre').trim().replace(/\s+/g, ' '),
      categoria: s('categoria'),
      precio: Number(s('precio')),
      stock: Number(s('stock')),
      desc: s('desc').trim()
    };

    if (!v.codigo) errors.codigo = 'El código es obligatorio.';
    else if (!/^[A-Z0-9_-]{2,20}$/.test(v.codigo)) errors.codigo = 'Usa 2 a 20 letras, números, guion o guion bajo.';

    if (v.nombre.length < 2) errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    else if (v.nombre.length > 60) errors.nombre = 'Máximo 60 caracteres.';
    if (!Config.CATEGORIAS.includes(v.categoria)) errors.categoria = 'Selecciona una categoría.';

    if (s('precio') === '' || isNaN(v.precio) || v.precio <= 0) errors.precio = 'Ingresa un precio mayor a 0.';
    else if (v.precio > 9999999) errors.precio = 'Precio demasiado alto.';
    else v.precio = Math.round(v.precio * 100) / 100;

    if (s('stock') === '' || !Number.isInteger(v.stock) || v.stock < 0) errors.stock = 'Stock: número entero, 0 o más.';
    if (v.desc.length > 300) errors.desc = 'Máximo 300 caracteres.';

    return { errors, values: v };
  }
}
if (typeof module !== 'undefined') module.exports = Validator;
