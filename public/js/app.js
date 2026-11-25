/** Punto de entrada: crea la interfaz y la conecta con la API. */
class App {
  constructor() { this.api = new ApiClient(); }

  async init() {
    this.header = new Header(() => this.logout());
    this.authView = new AuthView(this.api, user => this.enter(user));
    this.form = new ProductForm({ onSubmit: (rec, isEdit) => this.save(rec, isEdit) });
    this.list = new ProductList({
      onEdit: p => this.form.edit(p),
      onDelete: p => this.remove(p),
      onUndo: () => this.undo(),
      onFilter: () => this.refresh()
    });
    this.log = new ActivityLog();

    try {
      const user = await this.api.me();
      if (user) await this.enter(user);
    } catch {
      Toast.show('No se pudo conectar con el servidor');
    }
  }

  async enter(user) {
    this.authView.hide();
    Utils.$('app').hidden = false;
    this.header.showUser(user);
    this.form.reset();
    await this.refresh();
  }

  showLogin() {
    Utils.$('app').hidden = true;
    this.header.hide();
    this.authView.show();
  }

  async logout() {
    try { await this.api.logout(); } catch { /* ignorar */ }
    this.showLogin();
    Toast.show('Sesión cerrada');
  }

  async refresh() {
    try {
      const data = await this.api.list(this.list.filters());
      this.list.render(data);
      this.header.setStats(data.stats);
      this.log.render(data.bitacora);
    } catch (e) {
      if (e.status === 401) { this.showLogin(); Toast.show('Tu sesión expiró. Inicia sesión de nuevo.'); }
      else Toast.show(e.message);
    }
  }

  async save(rec, isEdit) {
    if (isEdit) await this.api.update(rec.id, rec);
    else await this.api.create(rec);
    await this.refresh();
    Toast.show(isEdit ? 'Producto actualizado' : 'Producto agregado');
  }

  async remove(p) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Puedes recuperarlo con Deshacer.`)) return;
    try {
      await this.api.remove(p.id);
      if (this.form.editId === p.id) this.form.reset();
      await this.refresh();
      Toast.show('Producto eliminado');
    } catch (e) { Toast.show(e.message); }
  }

  async undo() {
    try {
      await this.api.undo();
      this.form.reset();
      await this.refresh();
      Toast.show('Acción deshecha');
    } catch (e) { Toast.show(e.message); }
  }
}

new App().init();
