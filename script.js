/* =========================================================
   S-Indexer — front-end interactions (no backend wired up)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const form         = document.getElementById('submit-form');
  const input        = document.getElementById('target-url');
  const feedback     = document.getElementById('url-feedback');
  const submitBtn    = document.getElementById('submit-btn');
  const submitSpin   = document.getElementById('submit-spinner');
  const submitLabel  = submitBtn.querySelector('.si-btn-label');
  const toastEl      = document.getElementById('si-toast');
  const targetItems  = document.querySelectorAll('#target-list .si-target-item');
  const yandexBtn    = document.getElementById('yandex-ping-btn');
  const yandexInput  = document.getElementById('yandex-url');
  const yandexFeedback = document.getElementById('yandex-feedback');

  let toastTimer = null;

  /* ---------------------------------------------------------
     IndexNow — https://www.indexnow.org
     Fill in INDEXNOW_KEY and host the matching
     <key>.txt file at your domain root before going live.
     --------------------------------------------------------- */
  const INDEXNOW_KEY = ''; // e.g. 'a1b2c3d4e5f6...'

  async function pingIndexNow(targetUrl){
    if (!INDEXNOW_KEY) return false; // not configured yet — caller simulates instead

    try {
      const host = new URL(targetUrl).host;
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host,
          key: INDEXNOW_KEY,
          keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
          urlList: [targetUrl],
        }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  /* ---------------------------------------------------------
     Direct Yandex ping — Yandex.Webmaster runs its own
     IndexNow-compatible endpoint at yandex.com/indexnow, so a
     single GET fires the ping without going through the
     shared api.indexnow.org relay above.
     https://yandex.com/support/webmaster/indexnow/reference.html
     --------------------------------------------------------- */
  function buildYandexPingUrl(targetUrl){
    const host = new URL(targetUrl).host;
    const params = new URLSearchParams({ url: targetUrl });
    if (INDEXNOW_KEY){
      params.set('key', INDEXNOW_KEY);
      params.set('keyLocation', `https://${host}/${INDEXNOW_KEY}.txt`);
    }
    return `https://yandex.com/indexnow?${params.toString()}`;
  }

  /* ---------------------------------------------------------
     Per-engine checklist
     --------------------------------------------------------- */
  function resetTargets(){
    targetItems.forEach(item => item.classList.remove('is-done'));
  }

  function markTargetDone(name){
    const item = document.querySelector(`.si-target-item[data-target="${name}"]`);
    if (item) item.classList.add('is-done');
  }

  function tick(name, delay){
    return new Promise(resolve => {
      setTimeout(() => {
        markTargetDone(name);
        resolve();
      }, delay);
    });
  }

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  function showToast(message, isError = false){
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.toggle('is-error', isError);
    toastEl.classList.add('is-visible');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 3200);
  }

  /* ---------------------------------------------------------
     URL validation
     --------------------------------------------------------- */
  function isValidUrl(value){
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (err) {
      return false;
    }
  }

  function setFieldError(message){
    input.classList.add('is-invalid');
    feedback.textContent = message;
    feedback.classList.remove('is-ok');
    feedback.classList.add('is-error');
  }

  function clearFieldState(){
    input.classList.remove('is-invalid');
    feedback.textContent = '';
    feedback.classList.remove('is-error', 'is-ok');
  }

  input.addEventListener('input', () => {
    if (input.classList.contains('is-invalid') && isValidUrl(input.value)){
      clearFieldState();
    }
  });

  yandexInput.addEventListener('input', () => {
    if (yandexInput.classList.contains('is-invalid') && isValidUrl(yandexInput.value)){
      yandexInput.classList.remove('is-invalid');
      yandexFeedback.textContent = '';
      yandexFeedback.classList.remove('is-error', 'is-ok');
    }
  });

  /* ---------------------------------------------------------
     Submit handling (dummy — no backend yet)
     --------------------------------------------------------- */
  function setSubmitting(isSubmitting){
    submitBtn.disabled = isSubmitting;
    submitSpin.classList.toggle('d-none', !isSubmitting);
    submitLabel.textContent = isSubmitting ? 'Submitting…' : 'Submit for Indexing';
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const value = input.value.trim();

    if (!value){
      setFieldError('Enter a URL before submitting.');
      input.focus();
      return;
    }

    if (!isValidUrl(value)){
      setFieldError('That doesn\'t look like a valid URL. Include https:// and try again.');
      input.focus();
      return;
    }

    clearFieldState();
    resetTargets();
    setSubmitting(true);

    // Google & Bing indexing APIs require server-side auth, so those two
    // stay simulated here. IndexNow needs no auth, so it's a real call
    // once INDEXNOW_KEY above is set — falls back to simulated otherwise.
    (async () => {
      await tick('google', 500);
      await tick('bing', 500);

      const realPing = await pingIndexNow(value);
      if (!realPing){
        await tick('indexnow', 400);
      } else {
        markTargetDone('indexnow');
      }

      setSubmitting(false);
      feedback.textContent = 'Submitted.';
      feedback.classList.add('is-ok');
      showToast('Queued for indexing.');
      form.reset();
    })();
  });

  /* ---------------------------------------------------------
     Force Yandex Ping — fires immediately, independent of
     the Submit for Indexing queue above.
     --------------------------------------------------------- */
  yandexBtn.addEventListener('click', () => {
    const value = yandexInput.value.trim();

    if (!value || !isValidUrl(value)){
      yandexFeedback.textContent = 'Enter a valid URL above first.';
      yandexFeedback.classList.remove('is-ok');
      yandexFeedback.classList.add('is-error');
      yandexInput.classList.add('is-invalid');
      yandexInput.focus();
      return;
    }

    yandexInput.classList.remove('is-invalid');

    // A GET request that Yandex's own endpoint accepts — opening it
    // directly sidesteps the browser CORS restrictions a fetch() would hit.
    window.open(buildYandexPingUrl(value), '_blank', 'noopener,noreferrer');

    yandexBtn.classList.add('is-pinged');
    yandexFeedback.textContent = 'Direct ping sent to Yandex.';
    yandexFeedback.classList.remove('is-error');
    yandexFeedback.classList.add('is-ok');
    showToast('Pinged Yandex directly.');

    setTimeout(() => yandexBtn.classList.remove('is-pinged'), 2400);
  });

});
