/** Encabezado: estadísticas del inventario y datos del usuario. */
class Header {
  constructor(onLogout) {
    Utils.$('out').addEventListener('click', onLogout);
  }

  showUser(user) {
    Utils.$('me-n').textContent = 'Hola, ' + user.nombre.split(' ')[0];
    Utils.$('me').hidden = false;
    Utils.$('stats').hidden = false;
  }

  hide() {
    Utils.$('me').hidden = true;
    Utils.$('stats').hidden = true;
  }

  setStats({ total, valor, bajo }) {
    Utils.$('s-n').textContent = total;
    Utils.$('s-v').textContent = Utils.money(valor);
    Utils.$('s-l').textContent = bajo;
  }
}
