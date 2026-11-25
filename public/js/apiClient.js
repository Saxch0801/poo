/** Error devuelto por el servidor (con el campo del formulario al que corresponde, si lo hay). */
class ApiError extends Error {
  constructor(message, field, status) { super(message); this.field = field; this.status = status; }
}

/** Cliente de la API del servidor. */
class ApiClient {
  async request(method, url, body) {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'same-origin'
      });
    } catch {
      throw new ApiError('No se pudo conectar con el servidor.', null, 0);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.error || 'Error del servidor.', data.field, res.status);
    return data;
  }

  me() { return this.request('GET', '/api/me').then(d => d.user); }
  register(d) { return this.request('POST', '/api/register', d).then(r => r.user); }
  login(email, password, keep) { return this.request('POST', '/api/login', { email, password, keep }).then(r => r.user); }
  logout() { return this.request('POST', '/api/logout'); }

  list({ q, cat, sort }) { return this.request('GET', '/api/productos?' + new URLSearchParams({ q, cat, sort })); }
  create(rec) { return this.request('POST', '/api/productos', rec); }
  update(id, rec) { return this.request('PUT', '/api/productos/' + id, rec); }
  remove(id) { return this.request('DELETE', '/api/productos/' + id); }
  undo() { return this.request('POST', '/api/deshacer'); }
}
