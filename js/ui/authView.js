/** Pantalla de inicio de sesión y registro. */
class AuthView {
  /** @param onEnter función (user, first) que se llama al entrar con éxito */
  constructor(auth, onEnter) {
    this.auth = auth;
    this.onEnter = onEnter;
    Utils.$('t-in').onclick = () => this.tab(false);
    Utils.$('t-up').onclick = () => this.tab(true);
    Utils.$('b-in').onclick = e => this.login(e.currentTarget);
    Utils.$('b-up').onclick = e => this.register(e.currentTarget);
    Utils.$('auth').addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') {
        (Utils.$('f-in').hidden ? Utils.$('b-up') : Utils.$('b-in')).click();
      }
    });
  }

  show() {
    ['l-pass', 'u-pass', 'u-pass2'].forEach(f => (Utils.$(f).value = ''));
    Utils.$('auth').hidden = false;
  }

  hide() { Utils.$('auth').hidden = true; }

  tab(register) {
    Utils.$('f-in').hidden = register;
    Utils.$('f-up').hidden = !register;
    Utils.$('t-in').classList.toggle('on', !register);
    Utils.$('t-up').classList.toggle('on', register);
  }

  async login(btn) {
    Utils.clearErrors(['l-mail', 'l-pass', 'l-all']);
    const email = Utils.$('l-mail').value.trim().toLowerCase();
    const pass = Utils.$('l-pass').value;
    if (!email) Utils.setError('l-mail', 'Escribe tu correo.');
    if (!pass) Utils.setError('l-pass', 'Escribe tu contraseña.');
    if (!email || !pass) return;

    btn.disabled = true;
    try {
      const user = await this.auth.login(email, pass);
      this.auth.start(user, Utils.$('l-keep').checked);
      Utils.$('l-pass').value = '';
      await this.onEnter(user, false);
    } catch (e) {
      Utils.setError(e.field || 'l-all', e.field ? e.message : 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      btn.disabled = false;
    }
  }

  async register(btn) {
    const fields = ['u-nombre', 'u-mail', 'u-pass', 'u-pass2'];
    Utils.clearErrors(fields);
    const data = {
      nombre: Utils.$('u-nombre').value.trim().replace(/\s+/g, ' '),
      email: Utils.$('u-mail').value.trim().toLowerCase(),
      password: Utils.$('u-pass').value,
      password2: Utils.$('u-pass2').value
    };
    const errors = Validator.register(data);
    fields.forEach(f => Utils.setError(f, errors[f]));
    if (Object.keys(errors).length) return;

    btn.disabled = true;
    try {
      const { user, first } = await this.auth.register(data);
      this.auth.start(user, false);
      Toast.show('Cuenta creada');
      ['u-pass', 'u-pass2'].forEach(f => (Utils.$(f).value = ''));
      await this.onEnter(user, first);
    } catch (e) {
      Utils.setError(e.field || 'u-mail', e.field ? e.message : 'No se pudo crear la cuenta. Inténtalo de nuevo.');
    } finally {
      btn.disabled = false;
    }
  }
}
