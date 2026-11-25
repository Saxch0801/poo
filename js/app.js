/** Punto de entrada: crea los servicios y la interfaz y conecta todo. */
class App {
  constructor() { this.items = []; }

  async init() {
    this.db = new Database(Config.DB_NAME, Config.DB_VERSION);
    const persistent = await this.db.open(Config.STORES);
    if (!persistent) Toast.show('Sin almacenamiento persistente: los datos se perderán al cerrar');

    this.auth = new AuthService(this.db);
    this.products = new ProductService(this.db);

    this.header = new Header(() => this.logout());
    this.authView = new AuthView(this.auth, (user, first) => this.enter(user, first));
    this.form = new ProductForm({
      getItems: () => this.items,
      onSubmit: (rec, isEdit) => this.save(rec, isEdit)
    });
    this.list = new ProductList({
      onEdit: p => this.form.edit(p),
      onDelete: p => this.remove(p)
    });

    const user = await this.auth.restore();
    if (user) await this.enter(user, false);
  }

  async enter(user, first) {
    if (first) await this.products.claimOrphans(user.email);
    this.auth.user = user;
    this.authView.hide();
    Utils.$('app').hidden = false;
    this.header.showUser(user);
    this.form.reset();
    await this.refresh();
  }

  logout() {
    this.auth.logout();
    this.items = [];
    Utils.$('app').hidden = true;
    this.header.hide();
    this.authView.show();
    Toast.show('Sesión cerrada');
  }

  async refresh() {
    this.items = await this.products.list(this.auth.user.email);
    this.list.render(this.items);
    this.header.setStats(ProductService.stats(this.items));
  }

  async save(rec, isEdit) {
    rec.uid = this.auth.user.email;
    const prev = isEdit ? this.items.find(p => p.id === rec.id) : null;
    rec.creado = prev ? prev.creado : Date.now();
    await this.products.save(rec);
    await this.refresh();
    Toast.show(isEdit ? 'Producto actualizado' : 'Producto agregado');
  }

  async remove(p) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    await this.products.remove(p.id);
    if (this.form.editId === p.id) this.form.reset();
    await this.refresh();
    Toast.show('Producto eliminado');
  }
}

new App().init();
