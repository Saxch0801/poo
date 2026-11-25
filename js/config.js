/** Constantes de la aplicación. */
const Config = Object.freeze({
  DB_NAME: 'productos_db',
  DB_VERSION: 2,
  STORES: [
    { name: 'productos', keyPath: 'id', auto: true },
    { name: 'usuarios', keyPath: 'email' }
  ],
  CATEGORIAS: ['Electrónica', 'Hogar', 'Ropa', 'Alimentos', 'Papelería', 'Otros'],
  STOCK_BAJO: 5,
  MAX_IMG_MB: 3,
  IMG_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_INTENTOS: 5,
  BLOQUEO_MS: 30000,
  PBKDF2_ITER: 150000
});
