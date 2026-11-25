/** Formulario de alta y edición de productos. */
class ProductForm {
  static FIELDS = ['codigo', 'nombre', 'categoria', 'precio', 'stock', 'desc'];

  /**
   * @param getItems  función que devuelve los productos actuales (para validar códigos repetidos)
   * @param onSubmit  función async (registro, esEdicion) que guarda el producto
   */
  constructor({ getItems, onSubmit }) {
    this.getItems = getItems;
    this.onSubmit = onSubmit;
    this.editId = null;
    this.foto = null;

    const select = Utils.$('categoria');
    Config.CATEGORIAS.forEach(c => {
      const o = Utils.el('option', '', c);
      o.value = c;
      select.appendChild(o);
    });

    Utils.$('save').addEventListener('click', () => this.submit());
    Utils.$('cancel').addEventListener('click', () => this.reset());
    Utils.$('foto').addEventListener('change', e => this.pickImage(e.target));
    ProductForm.FIELDS.forEach(f => Utils.$(f).addEventListener('input', () => Utils.setError(f)));
  }

  async pickImage(input) {
    Utils.setError('foto');
    const file = input.files[0];
    if (!file) return;
    const msg = ImageProcessor.validate(file);
    if (msg) { Utils.setError('foto', msg); input.value = ''; return; }
    try {
      this.foto = await ImageProcessor.toDataUrl(file);
      this.preview();
    } catch {
      Utils.setError('foto', 'El archivo no es una imagen válida.');
      input.value = '';
    }
  }

  preview() {
    const img = Utils.$('prev');
    if (this.foto) { img.src = this.foto; img.style.display = 'block'; }
    else { img.removeAttribute('src'); img.style.display = 'none'; }
  }

  async submit() {
    const raw = {};
    ProductForm.FIELDS.forEach(f => (raw[f] = Utils.$(f).value));
    const { errors, values } = Validator.producto(raw, this.getItems(), this.editId);
    ProductForm.FIELDS.forEach(f => Utils.setError(f, errors[f]));

    const first = Object.keys(errors)[0];
    if (first) { Toast.show('Revisa los campos marcados'); Utils.$(first).focus(); return; }

    const isEdit = this.editId !== null;
    const record = { ...values, foto: this.foto };
    if (isEdit) record.id = this.editId;
    try {
      await this.onSubmit(record, isEdit);
      this.reset();
    } catch {
      Toast.show('Error al guardar. Inténtalo de nuevo');
    }
  }

  reset() {
    this.editId = null;
    this.foto = null;
    ProductForm.FIELDS.forEach(f => { Utils.$(f).value = ''; Utils.setError(f); });
    Utils.$('foto').value = '';
    Utils.setError('foto');
    this.preview();
    this._labels('Nuevo producto', 'Guardar producto', 'Limpiar');
  }

  edit(p) {
    this.editId = p.id;
    this.foto = p.foto || null;
    ProductForm.FIELDS.forEach(f => { Utils.$(f).value = p[f] ?? ''; Utils.setError(f); });
    Utils.$('foto').value = '';
    this.preview();
    this._labels('Editar producto', 'Guardar cambios', 'Cancelar edición');
    Utils.$('codigo').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  _labels(title, save, cancel) {
    Utils.$('ftitle').textContent = title;
    Utils.$('save').textContent = save;
    Utils.$('cancel').textContent = cancel;
  }
}
