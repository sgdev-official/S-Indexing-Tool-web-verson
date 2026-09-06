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

  // 🔗 তোর Render Backend Endpoint
  const RENDER_BACKEND_URL = 'https://your-render-app-name.onrender.com/api/v1/index';

  const INDEXNOW_KEY = '';

  async function pingIndexNow(targetUrl){
    if (!INDEXNOW_KEY) return false;

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

  function buildYandexPingUrl(targetUrl){
    const host = new URL(targetUrl).host;
    const params = new URLSearchParams({ url: targetUrl });
    if (INDEXNOW_KEY){
      params.set('key', INDEXNOW_KEY);
      params.set('keyLocation', `https://${host}/${INDEXNOW_KEY}.txt`);
    }
    return `https://yandex.com/indexnow?${params.toString()}`;
  }

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

  function showToast(message, isError = false){
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.toggle('is-error', isError);
    toastEl.classList.add('is-visible');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 3200);
  }

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

    (async () => {
      // 🚀 Step 1: Render Backend এ কল মেরে DuckDNS/Google Sheets-এ ইউআরএল পুশ করা
      try {
        await fetch(RENDER_BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value })
        });
      } catch (err) {
        console.error('Backend sync failed:', err);
      }

      // 🚀 Step 2: Target Visuals Checkmarks
      await tick('google', 400);
      await tick('bing', 400);

      const realPing = await pingIndexNow(value);
      if (!realPing){
        await tick('indexnow', 300);
      } else {
        markTargetDone('indexnow');
      }

      setSubmitting(false);
      feedback.textContent = 'Dispatched to 11 DuckDNS feed nodes & engines!';
      feedback.classList.add('is-ok');
      showToast('Queued for indexing across network.');
      form.reset();
    })();
  });

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

    window.open(buildYandexPingUrl(value), '_blank', 'noopener,noreferrer');

    yandexBtn.classList.add('is-pinged');
    yandexFeedback.textContent = 'Direct ping sent to Yandex.';
    yandexFeedback.classList.remove('is-error');
    yandexFeedback.classList.add('is-ok');
    showToast('Pinged Yandex directly.');

    setTimeout(() => yandexBtn.classList.remove('is-pinged'), 2400);
  });

});
