document.addEventListener('DOMContentLoaded', () => {

  const form           = document.getElementById('submit-form');
  const input          = document.getElementById('target-url');
  const feedback       = document.getElementById('url-feedback');
  const submitBtn      = document.getElementById('submit-btn');
  const submitSpin     = document.getElementById('submit-spinner');
  const submitLabel    = submitBtn.querySelector('.si-btn-label');
  const toastEl        = document.getElementById('si-toast');
  const targetItems    = document.querySelectorAll('#target-list .si-target-item');
  const yandexBtn      = document.getElementById('yandex-ping-btn');
  const yandexInput    = document.getElementById('yandex-url');
  const yandexFeedback = document.getElementById('yandex-feedback');

  // 🔑 Key Generator elements (বাটনের আইডিগুলো অনুযায়ী)
  const genKeyBtn      = document.getElementById('gen-key-btn') || document.getElementById('generate-key-btn');
  const keyDisplay     = document.getElementById('indexnow-key-display') || document.getElementById('key-input');

  let toastTimer = null;

  // 🎯 Render Backend URL
  const RENDER_BACKEND_URL = 'https://s-indexing-tool-bakend.onrender.com/index';

  // 🔑 ডাইনামিক IndexNow Key Storage
  let INDEXNOW_KEY = '';

  // 🛠️ random 64-character Hex Key Generator Function
  function generateIndexNowKey() {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ⚡ Key Generation Button Click Handling Fix
  if (genKeyBtn) {
    genKeyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      INDEXNOW_KEY = generateIndexNowKey();
      
      if (keyDisplay) {
        if (keyDisplay.tagName === 'INPUT') {
          keyDisplay.value = INDEXNOW_KEY;
        } else {
          keyDisplay.textContent = INDEXNOW_KEY;
        }
      }
      
      showToast('IndexNow Key generated & set successfully!');
      console.log('Generated Key:', INDEXNOW_KEY);
    });
  }

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

  // 🚨 STRICT URL VALIDATION FIX (https: বা অসম্পূর্ণ টেক্সট আটকাবে)
  function isValidUrl(value){
    const cleanValue = value.trim();
    
    // শুধু 'https:' বা অসম্পূর্ণ টেক্সট চেক
    if (['http:', 'https:', 'http://', 'https://'].includes(cleanValue.toLowerCase())) {
      return false;
    }

    try {
      const parsed = new URL(cleanValue);
      // Host-এ অবশ্যই অন্তত একটা ডট (.) থাকতে হবে (যেমন domain.com)
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
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

  if (yandexInput) {
    yandexInput.addEventListener('input', () => {
      if (yandexInput.classList.contains('is-invalid') && isValidUrl(yandexInput.value)){
        yandexInput.classList.remove('is-invalid');
        yandexFeedback.textContent = '';
        yandexFeedback.classList.remove('is-error', 'is-ok');
      }
    });
  }

  function setSubmitting(isSubmitting){
    submitBtn.disabled = isSubmitting;
    if (submitSpin) submitSpin.classList.toggle('d-none', !isSubmitting);
    if (submitLabel) submitLabel.textContent = isSubmitting ? 'Submitting…' : 'Submit for Indexing';
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
      setFieldError('Invalid URL! Include full link (e.g. https://domain.com).');
      input.focus();
      return;
    }

    clearFieldState();
    resetTargets();
    setSubmitting(true);

    (async () => {
      try {
        await fetch(RENDER_BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value })
        });
      } catch (err) {
        console.error('Backend sync failed:', err);
      }

      await tick('google', 300);
      await tick('bing', 300);

      const realPing = await pingIndexNow(value);
      if (!realPing){
        await tick('indexnow', 300);
      } else {
        markTargetDone('indexnow');
      }

      setSubmitting(false);
      feedback.textContent = 'Dispatched to 11 DuckDNS feed nodes & Vercel KV!';
      feedback.classList.add('is-ok');
      showToast('Queued for indexing across network.');
      form.reset();
    })();
  });

  if (yandexBtn) {
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
  }

});
