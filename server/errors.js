/** Error esperado (validación, no encontrado, etc.) con código HTTP y campo del formulario. */
class DomainError extends Error {
  constructor(field, message, status = 400) { super(message); this.field = field; this.status = status; }
}
module.exports = { DomainError };
