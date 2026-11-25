const fs = require('fs');
const path = require('path');

/**
 * Persistencia en archivos JSON. Escribe a un archivo temporal y lo renombra,
 * así un corte de luz a mitad de escritura no deja el archivo a medias.
 * Para usar MySQL bastaría una clase con los mismos métodos read() y write().
 */
class FileStorage {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(dir, { recursive: true });
  }
  read(name, fallback) {
    try { return JSON.parse(fs.readFileSync(path.join(this.dir, name), 'utf8')); }
    catch { return fallback; }
  }
  write(name, data) {
    const file = path.join(this.dir, name);
    fs.writeFileSync(file + '.tmp', JSON.stringify(data, null, 2));
    fs.renameSync(file + '.tmp', file);
  }
}
module.exports = FileStorage;
