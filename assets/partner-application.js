// Prepared WhatsApp interest or verified private intake. No storage or transmission
// happens on page load, and a WhatsApp draft is never reported as an application.
const form = document.querySelector('[data-partner-application]');
if (form) {
  const bm = document.documentElement.lang.toLowerCase().startsWith('ms');
  const copy = bm ? {
    prepare: 'Sediakan permohonan WhatsApp', continue: 'Teruskan dengan selamat', send: 'Hantar permohonan', saving: 'Menyimpan permohonan…',
    focus: 'Pilih sekurang-kurangnya satu jenis ruang.', invalid: 'Semak medan yang ditandakan sebelum meneruskan.',
    prepared: 'Draf sedia untuk disemak. Belum dihantar atau disimpan oleh Idyra. Buka WhatsApp, semak mesej dan tekan Hantar di sana.',
    ready: 'Pengesahan selesai. Tekan Hantar permohonan untuk menghantar maklumat anda.',
    verify: 'Lengkapkan pengesahan keselamatan di bawah sebelum menghantar.',
    verifyFailed: 'Pengesahan tidak dapat diselesaikan. Cuba lagi atau hubungi kami melalui WhatsApp.',
    unavailable: 'Simpanan belum disahkan. Maklumat anda kekal dalam borang ini. Cuba lagi atau gunakan pautan WhatsApp di bawah.',
    limited: 'Terlalu banyak percubaan. Sila tunggu sebelum mencuba lagi, atau hubungi kami melalui WhatsApp.',
    received: 'Permohonan diterima. Rujukan: ', receivedNote: ' Kami akan menghubungi anda tentang minat anda. Ini bukan pengesahan pelantikan atau terma komisen.',
    draftTitle: 'Hai Idyra, saya berminat dengan program rakan kongsi perintis.',
    labels: { name: 'Nama', email: 'E-mel', phone: 'Telefon', city: 'Kawasan', focus: 'Jenis ruang', language: 'Bahasa pilihan', message: 'Pengenalan' },
    sectors: { industrial: 'Kilang dan gudang', commercial: 'Kedai, kafe dan pejabat', home: 'Kediaman' },
    languages: { ms: 'Bahasa Melayu', en: 'Bahasa Inggeris', both: 'Bahasa Melayu dan Inggeris' },
    permission: 'Saya bersetuju Idyra menghubungi saya tentang minat ini. Saya faham terma program perlu dipersetujui secara berasingan.',
  } : {
    prepare: 'Prepare WhatsApp application', continue: 'Continue securely', send: 'Send application', saving: 'Saving application…',
    focus: 'Choose at least one kind of space.', invalid: 'Check the highlighted fields before continuing.',
    prepared: 'Your draft is ready to review. It has not been sent or saved by Idyra. Open WhatsApp, review the message and press Send there.',
    ready: 'Verification complete. Press Send application to send your details.',
    verify: 'Complete the security check below before sending.',
    verifyFailed: 'The security check could not finish. Try again or contact us through WhatsApp.',
    unavailable: 'The save has not been confirmed. Your details remain in this form. Try again or use the WhatsApp link below.',
    limited: 'There have been too many attempts. Please wait before trying again, or contact us through WhatsApp.',
    received: 'Application received. Reference: ', receivedNote: ' We will contact you about your interest. This is not confirmation of appointment or commission terms.',
    draftTitle: 'Hi Idyra, I am interested in the referral partner pilot.',
    labels: { name: 'Name', email: 'Email', phone: 'Phone', city: 'Area', focus: 'Spaces', language: 'Preferred language', message: 'Introduction' },
    sectors: { industrial: 'Factories and warehouses', commercial: 'Shops, cafés and offices', home: 'Homes' },
    languages: { ms: 'Bahasa Melayu', en: 'English', both: 'BM and English' },
    permission: 'I agree that Idyra may contact me about this interest. I understand programme terms must be agreed separately.',
  };
  const panel = form.closest('.pa-panel');
  const status = panel.querySelector('[data-pa-status]');
  const button = form.querySelector('[data-pa-submit]');
  const draft = panel.querySelector('[data-pa-draft]');
  const challenge = form.querySelector('[data-pa-challenge]');
  const api = form.dataset.paMode === 'api';
  let token = '', widget = null, challengeLoading = null, submissionId = '', previousPayload = '', sending = false, retryUntil = 0, submissionError = false;
  const announce = (message, error = false, focus = false) => {
    status.textContent = message; status.dataset.error = String(error);
    if (focus) status.focus({ preventScroll: false });
  };
  function values() {
    const data = new FormData(form);
    return {
      name: String(data.get('name') || '').trim(), email: String(data.get('email') || '').trim(),
      phone: String(data.get('phone') || '').trim(), city: String(data.get('city') || '').trim(),
      focus: data.getAll('focus'), language: String(data.get('language') || ''), message: String(data.get('message') || '').trim(),
      consent: data.get('consent') === 'on', privacyVersion: form.dataset.paVersion, website: String(data.get('website') || ''),
    };
  }
  function markFields(fields) {
    for (const element of form.elements) element.removeAttribute?.('aria-invalid');
    for (const key of Object.keys(fields || {})) {
      for (const element of form.querySelectorAll(`[name="${CSS.escape(key)}"]`)) element.setAttribute('aria-invalid', 'true');
    }
  }
  function valid(data) {
    const firstFocus = form.querySelector('input[name="focus"]');
    firstFocus.setCustomValidity(data.focus.length ? '' : copy.focus);
    for (const key of ['name', 'city']) {
      const element = form.elements.namedItem(key);
      element.setCustomValidity(data[key].length >= 2 && data[key].length <= 100 && !/[<>\u0000-\u001f\u007f]/.test(data[key]) ? '' : copy.invalid);
    }
    const phone = form.elements.namedItem('phone');
    const digits = data.phone.replace(/\D/g, '').length;
    phone.setCustomValidity(!data.phone || /^[+()\d .-]+$/.test(data.phone) && digits >= 7 && digits <= 15 ? '' : copy.invalid);
    if (data.website) { announce(copy.invalid, true, true); return false; }
    if (!form.reportValidity()) { announce(copy.invalid, true); return false; }
    return true;
  }
  form.addEventListener('input', () => {
    markFields({});
    for (const element of form.elements) element.setCustomValidity?.('');
    if (!draft.hidden) { draft.hidden = true; panel.querySelector('[data-pa-send]').removeAttribute('href'); }
  });
  function prepareWhatsApp(data) {
    const rows = [copy.draftTitle, ''];
    for (const key of ['name', 'email', 'phone', 'city', 'focus', 'language', 'message']) {
      const value = key === 'focus' ? data.focus.map(v => copy.sectors[v]).join(', ') : key === 'language' ? copy.languages[data[key]] : data[key];
      if (value) rows.push(`${copy.labels[key]}: ${value}`);
    }
    rows.push('', copy.permission);
    const text = rows.join('\n');
    panel.querySelector('[data-pa-preview]').value = text;
    panel.querySelector('[data-pa-send]').href = `https://wa.me/${form.dataset.paWa}?text=${encodeURIComponent(text)}`;
    draft.hidden = false;
    announce(copy.prepared, false, true);
  }
  async function ensureChallenge() {
    if (widget !== null) { window.turnstile.reset(widget); return; }
    if (challengeLoading) return challengeLoading;
    challenge.hidden = false;
    if (!submissionError) announce(copy.verify);
    challengeLoading = new Promise((resolve, reject) => {
      if (window.turnstile) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true; script.defer = true;
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.append(script);
    }).then(() => {
      if (!window.turnstile) throw new Error('Verifier unavailable');
      widget = window.turnstile.render(challenge, {
        sitekey: form.dataset.paSitekey, action: 'partner_apply', theme: 'auto', size: 'flexible', language: bm ? 'ms' : 'en',
        // A refreshed security token says nothing about whether the application
        // was saved. Keep a failed submission visible until a deliberate retry.
        callback: result => { token = result; button.textContent = copy.send; if (!submissionError && !sending) announce(copy.ready); },
        'expired-callback': () => { token = ''; button.textContent = copy.continue; if (!submissionError && !sending) announce(copy.verify); },
        'error-callback': () => { token = ''; button.textContent = copy.continue; if (!submissionError && !sending) announce(copy.verifyFailed, true); },
      });
    }).catch(() => { challengeLoading = null; if (!submissionError) announce(copy.verifyFailed, true, true); });
    return challengeLoading;
  }
  button.disabled = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const data = values();
    if (!valid(data)) return;
    if (!api) { prepareWhatsApp(data); return; }
    if (Date.now() < retryUntil) { announce(copy.limited, true, true); return; }
    if (!token) { await ensureChallenge(); return; }
    if (!crypto.randomUUID) { announce(copy.unavailable, true, true); return; }
    const fingerprint = JSON.stringify(data);
    if (fingerprint !== previousPayload || !submissionId) { submissionId = crypto.randomUUID(); previousPayload = fingerprint; }
    sending = true; submissionError = false; button.disabled = true; button.textContent = copy.saving;
    announce(copy.saving);
    form.setAttribute('aria-busy', 'true'); markFields({});
    try {
      const result = await fetch(form.dataset.paEndpoint, {
        method: 'POST', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, submissionId, turnstileToken: token }),
        signal: AbortSignal.timeout(15000),
      });
      const payload = await result.json();
      if ([200, 201].includes(result.status) && payload.ok === true && payload.status === 'received' && /^IDYRA-P-[a-f\d-]{36}$/i.test(payload.reference) && Number.isFinite(Date.parse(payload.receivedAt))) {
        form.reset(); form.hidden = true; token = ''; if (widget !== null) window.turnstile.remove(widget);
        announce(`${copy.received}${payload.reference}.${copy.receivedNote}`, false, true); return;
      }
      submissionError = true;
      if (result.status === 422) { markFields(payload.fields); announce(copy.invalid, true, true); }
      else if (result.status === 429) {
        retryUntil = Date.now() + Math.min(3600, Math.max(1, Number(result.headers.get('Retry-After')) || 600)) * 1000;
        announce(copy.limited, true, true);
      } else if (result.status === 403) announce(copy.verifyFailed, true, true);
      else { if (result.status === 409) { submissionId = ''; previousPayload = ''; } announce(copy.unavailable, true, true); }
      token = ''; if (widget !== null) window.turnstile.reset(widget);
    } catch { submissionError = true; announce(copy.unavailable, true, true); token = ''; if (widget !== null) window.turnstile.reset(widget); }
    finally { sending = false; button.disabled = false; button.textContent = token ? copy.send : copy.continue; form.removeAttribute('aria-busy'); }
  });
}
