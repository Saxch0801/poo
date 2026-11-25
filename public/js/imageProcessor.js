/** Validación y reducción de imágenes antes de guardarlas. */
class ImageProcessor {
  static validate(file) {
    if (!Config.IMG_TYPES.includes(file.type)) return 'Formato no válido. Usa JPG, PNG o WEBP.';
    if (file.size > Config.MAX_IMG_MB * 1024 * 1024) return `La imagen supera los ${Config.MAX_IMG_MB} MB.`;
    return '';
  }

  static load(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => resolve(img);
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /** Devuelve un data URL JPEG con el lado mayor limitado a `max` píxeles. */
  static async toDataUrl(file, max = 480) {
    const img = await ImageProcessor.load(file);
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }
}
