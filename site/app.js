(() => {
  'use strict';

  const form = document.getElementById('reservation-form');
  const submitBtn = document.getElementById('submit-btn');
  const actions = document.getElementById('actions');
  const sendError = document.getElementById('send-error');
  const thanks = document.getElementById('thanks');
  const thanksName = document.getElementById('thanks-name');
  const submitLabel = submitBtn.innerHTML;

  // One id per reservation, so "Edit" + resubmit updates the same spreadsheet row
  // instead of adding a duplicate.
  let reservationId = null;
  const newId = () =>
    (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);

  const MSG = {
    required: 'This field is required. · <span lang="es">Este campo es obligatorio.</span>',
    count: 'Enter a whole number from 0 to 50. · <span lang="es">Escriba un número entero del 0 al 50.</span>',
    people: 'Enter the number of adults or children (at least 1 person). · <span lang="es">Escriba el número de adultos o niños (al menos 1 persona).</span>',
    phone: 'Enter a phone number with at least 10 digits. · <span lang="es">Escriba un número de teléfono de al menos 10 dígitos.</span>',
    email: 'Enter an email like name@example.com. · <span lang="es">Escriba un correo como nombre@ejemplo.com.</span>',
  };

  const field = id => document.getElementById(id);
  const isCount = v => /^\d{1,2}$/.test(v) && Number(v) <= 50;

  function check(id) {
    const v = field(id).value.trim();
    switch (id) {
      case 'fn': case 'ln':
        return v ? null : MSG.required;
      case 'ad': case 'ch': {
        // A blank count means 0, as long as the household has at least one person.
        if (v && !isCount(v)) return MSG.count;
        if (id === 'ch') return null;
        const ch = field('ch').value.trim();
        if (ch && !isCount(ch)) return null; // the Children field shows its own error
        return Number(v || 0) + Number(ch || 0) > 0 ? null : MSG.people;
      }
      case 'ph':
        if (!v) return MSG.required;
        return v.replace(/\D/g, '').length >= 10 ? null : MSG.phone;
      case 'em':
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : MSG.email;
    }
    return null;
  }

  function show(id, msg) {
    const input = field(id);
    const err = field(id + '-err');
    if (msg) {
      err.innerHTML = msg;
      err.hidden = false;
      input.setAttribute('aria-invalid', 'true');
    } else {
      err.hidden = true;
      err.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  }

  const IDS = ['fn', 'ln', 'ad', 'ch', 'ph', 'em'];

  // Validate a field when the user leaves it, and clear the error as soon as it's fixed.
  IDS.forEach(id => {
    const input = field(id);
    input.addEventListener('blur', () => { if (input.value.trim()) show(id, check(id)); });
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') show(id, check(id));
      // Typing a child count can fix the "at least 1 person" error shown on Adults.
      if (id === 'ch' && field('ad').getAttribute('aria-invalid') === 'true') show('ad', check('ad'));
    });
  });

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.setAttribute('aria-busy', String(busy));
    submitBtn.innerHTML = busy ? 'Sending… · <span lang="es">Enviando…</span>' : submitLabel;
  }

  function showSendError(html) {
    sendError.innerHTML = html;
    sendError.hidden = false;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    sendError.hidden = true;

    let firstBad = null;
    IDS.forEach(id => {
      const msg = check(id);
      show(id, msg);
      if (msg && !firstBad) firstBad = field(id);
    });
    if (firstBad) { firstBad.focus(); return; }

    const endpoint = (window.RESERVATION_ENDPOINT || '').trim();
    if (!endpoint) {
      showSendError('Online reservations are not set up yet. Please print this form and return it to Peas and Grace Pantry. · ' +
        '<span lang="es">Las reservaciones en línea aún no están disponibles. Por favor, imprima este formulario y devuélvalo a Peas and Grace Pantry.</span>');
      return;
    }

    reservationId = reservationId || newId();
    const data = new URLSearchParams();
    data.set('id', reservationId);
    data.set('firstName', field('fn').value.trim());
    data.set('lastName', field('ln').value.trim());
    data.set('adults', field('ad').value.trim() || '0');
    data.set('children', field('ch').value.trim() || '0');
    data.set('phone', field('ph').value.trim());
    data.set('email', field('em').value.trim());
    data.set('website', field('website').value);
    data.set('language', (navigator.language || '').slice(0, 10));

    setBusy(true);
    try {
      // A form-encoded body keeps this a "simple" request, which Apps Script accepts without a CORS preflight.
      const res = await fetch(endpoint, { method: 'POST', body: data });
      const json = await res.json();
      if (!json || json.ok !== true) throw new Error((json && json.error) || 'Request failed');

      thanksName.textContent = field('fn').value.trim() || 'friend';
      actions.hidden = true;
      thanks.hidden = false;
      thanks.focus();
    } catch (err) {
      console.error(err);
      showSendError('Sorry, your reservation could not be sent. Please check your connection and try again, or print this form. · ' +
        '<span lang="es">Lo sentimos, no se pudo enviar su reservación. Revise su conexión e inténtelo de nuevo, o imprima este formulario.</span>');
    } finally {
      setBusy(false);
    }
  });

  document.getElementById('print-btn').addEventListener('click', () => window.print());

  document.getElementById('edit-btn').addEventListener('click', () => {
    thanks.hidden = true;
    actions.hidden = false;
    field('fn').focus();
  });
})();
