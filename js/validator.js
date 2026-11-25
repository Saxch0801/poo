/** Reglas de validación. Devuelven un objeto { campo: mensaje }. */
class Validator {
  static EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  static register({ nombre, email, password, password2 }) {
    const errors = {};
    if (nombre.length < 2) errors['u-nombre'] = 'Escribe tu nombre (mínimo 2 caracteres).';
    if (!Validator.EMAIL.test(email)) errors['u-mail'] = 'Escribe un correo válido.';
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors['u-pass'] = 'Mínimo 8 caracteres, con letras y números.';
    }
    if (password2 !== password) errors['u-pass2'] = 'Las contraseñas no coinciden.';
    return errors;
  }

  /** Valida un producto. Devuelve { errors, values } con los valores ya limpios. */
  static producto(raw, existentes, editId) {
    const errors = {};
    const v = {
      codigo: raw.codigo.trim().toUpperCase(),
      nombre: raw.nombre.trim().replace(/\s+/g, ' '),
      categoria: raw.categoria,
      precio: Number(raw.precio),
      stock: Number(raw.stock),
      desc: raw.desc.trim()
    };

    if (!v.codigo) errors.codigo = 'El código es obligatorio.';
    else if (!/^[A-Z0-9_-]{2,20}$/.test(v.codigo)) errors.codigo = 'Usa 2 a 20 letras, números, guion o guion bajo.';
    else if (existentes.some(p => p.codigo === v.codigo && p.id !== editId)) errors.codigo = 'Ya existe un producto con ese código.';

    if (v.nombre.length < 2) errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    if (!Config.CATEGORIAS.includes(v.categoria)) errors.categoria = 'Selecciona una categoría.';

    if (raw.precio === '' || isNaN(v.precio) || v.precio <= 0) errors.precio = 'Ingresa un precio mayor a 0.';
    else if (v.precio > 9999999) errors.precio = 'Precio demasiado alto.';
    else v.precio = Math.round(v.precio * 100) / 100;

    if (raw.stock === '' || !Number.isInteger(v.stock) || v.stock < 0) errors.stock = 'Stock: número entero, 0 o más.';
    if (v.desc.length > 300) errors.desc = 'Máximo 300 caracteres.';

    return { errors, values: v };
  }
}
