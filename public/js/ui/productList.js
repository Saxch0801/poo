/** Listado de productos. Los filtros se envían al servidor. */
class ProductList {
  /**
   * @param onEdit    (producto) al pulsar Editar
   * @param onDelete  (producto) al pulsar Eliminar
   * @param onUndo    al pulsar Deshacer
   * @param onFilter  cuando cambia búsqueda, categoría u orden
   */
  constructor({ onEdit, onDelete, onUndo, onFilter }) {
    this.onEdit = onEdit;
    this.onDelete = onDelete;
    this.items = [];
    this.total = 0;

    const cat = Utils.$('fcat');
    Config.CATEGORIAS.forEach(c => {
      const o = Utils.el('option', '', c);
      o.value = c;
      cat.appendChild(o);
    });
    let timer;
    ['q', 'fcat', 'sort'].forEach(id => Utils.$(id).addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(onFilter, 200);
    }));
    Utils.$('undo').addEventListener('click', onUndo);
  }

  filters() {
    return { q: Utils.$('q').value, cat: Utils.$('fcat').value, sort: Utils.$('sort').value };
  }

  render({ items, total, puedeDeshacer }) {
    this.items = items;
    this.total = total;
    Utils.$('undo').disabled = !puedeDeshacer;
    this.draw();
  }

  draw() {
    const view = this.items;
    const total = this.total;
    Utils.$('count').textContent = `${view.length} de ${total} producto${total === 1 ? '' : 's'}`;

    const grid = Utils.$('list');
    grid.textContent = '';
    grid.classList.toggle('is-empty', !view.length);
    if (!view.length) {
      grid.appendChild(Utils.el('div', 'empty',
        total ? 'Sin resultados para tu búsqueda.' : 'Aún no hay productos. Agrega el primero con el formulario.'));
      return;
    }
    view.forEach(p => grid.appendChild(this.card(p)));
  }

  card(p) {
    const card = Utils.el('div', 'p');

    const img = Utils.el('div', 'img');
    if (p.foto) {
      const i = Utils.el('img');
      i.src = p.foto;
      i.alt = p.nombre;
      img.appendChild(i);
    } else {
      img.textContent = '📦';
    }
    img.appendChild(Utils.el('div', 'tagp', Utils.money(p.precio)));
    card.appendChild(img);

    const body = Utils.el('div', 'b');
    body.appendChild(Utils.el('h3', '', p.nombre));
    body.appendChild(Utils.el('div', 'cod', p.codigo));
    body.appendChild(Utils.el('span', 'tag', p.categoria));
    const low = p.stock <= Config.STOCK_BAJO;
    const stock = Utils.el('div', 'cod' + (low ? ' low' : ''),
      `Stock: ${p.stock}${p.stock === 0 ? ' (agotado)' : low ? ' (bajo)' : ''}`);
    stock.style.marginTop = '8px';
    body.appendChild(stock);
    if (p.desc) {
      const d = Utils.el('div', 'cod', p.desc);
      d.style.marginTop = '4px';
      body.appendChild(d);
    }
    card.appendChild(body);

    const actions = Utils.el('div', 'f');
    const edit = Utils.el('button', '', 'Editar');
    const del = Utils.el('button', 'del', 'Eliminar');
    edit.type = del.type = 'button';
    edit.onclick = () => this.onEdit(p);
    del.onclick = () => this.onDelete(p);
    actions.append(edit, del);
    card.appendChild(actions);
    return card;
  }
}
