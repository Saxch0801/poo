/** Bitácora de actividad reciente (viene de la cola del servidor). */
class ActivityLog {
  render(entries) {
    const ul = Utils.$('log');
    ul.textContent = '';
    if (!entries.length) { ul.appendChild(Utils.el('li', '', 'Sin actividad todavía.')); return; }
    entries.slice().reverse().forEach(e => {
      const li = Utils.el('li');
      const hora = new Date(e.t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      li.append(Utils.el('time', '', hora), document.createTextNode(e.msg));
      ul.appendChild(li);
    });
  }
}
