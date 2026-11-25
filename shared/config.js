/** Constantes compartidas por el navegador y el servidor. */
const Config = Object.freeze({
  CATEGORIAS: ['Electrónica', 'Hogar', 'Ropa', 'Alimentos', 'Papelería', 'Otros'],
  STOCK_BAJO: 5,
  MAX_IMG_MB: 3,
  IMG_TYPES: ['image/jpeg', 'image/png', 'image/webp']
});
if (typeof module !== 'undefined') module.exports = Config;
