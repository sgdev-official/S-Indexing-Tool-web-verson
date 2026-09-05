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

});
