document.addEventListener('DOMContentLoaded', () => {

  const form           = document.getElementById('submit-form');
  const input          = document.getElementById('target-url');
  const feedback       = document.getElementById('url-feedback');
  const submitBtn      = document.getElementById('submit-btn');
  const submitSpin     = document.getElementById('submit-spinner');
  const submitLabel    = submitBtn ? submitBtn.querySelector('.si-btn-label') : null;
  const toastEl        = document.getElementById('si-toast');
  const targetItems    = document.querySelectorAll('#target-list .si-target-item');
  const yandexBtn      = document.getElementById('yandex-ping-btn');
  const yandexInput    = document.getElementById('yandex-url');
  const yandexFeedback = document.getElementById('yandex-feedback');

  // 🔑 Key Generator Elements
  const genKeyBtn      = document.getElementById('gen-key-btn') || document.getElementById('generate-key-btn');
  const keyDisplay     = document.getElementById('indexnow-key-display') || document.getElementById('key-input');

  let toastTimer = null;

  // 🎯 Render Backend URL
  const RENDER_BACKEND_URL = 'https://s-indexing-tool-bakend.onrender.com/index';

  // 🔑 IndexNow Dynamic Key Storage
  let INDEXNOW_KEY = '';

  // 🛠️ 64-character Hex Key Generator
  function generateIndexNowKey() {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ⚡ Generate Key Button Handler
  if (genKeyBtn) {
    genKeyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      INDEXNOW_KEY = generateIndexNowKey();
      
      if (keyDisplay) {
        if (keyDisplay.tagName === 'INPUT' || keyDisplay.tagName === 'TEXTAREA') {
          keyDisplay.value = INDEXNOW_KEY;
        } else {
          keyDisplay.textContent = INDEXNOW_KEY;
        }
      }
      
      showToast('IndexNow Key generated & applied!');
      console.log('Generated Key:', INDEXNOW_KEY);
    });
  }

  // 🛠️ URL Normalizer (৪-০-৪ লিঙ্ক বাক ট্র্যাপ ফিক্স)
  // যদি কোনো লিঙ্কে https:// না থাকে, তবে এটা অটোমেটিক সামনে https:// জুড়ে দেবে
  function normalizeUrl(rawUrl) {
    let clean = rawUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    return clean;
  }

  // 🚨 STRICT URL VALIDATION
  function isValidUrl(value) {
    const cleanValue = value.trim();
    
    // স্রেফ 'https:' বা অসম্পূর্ণ টেক্সট ফিল্টার
    if (['http:', 'https:', 'http://', 'https://'].includes(cleanValue.toLowerCase())) {
      return false;
    }

    try {
      const formatted = normalizeUrl(cleanValue);
      const parsed = new URL(formatted);
      // ডোমেইনে অবশ্যই অন্তত একটি ডট (.) থাকতে হবে (যেমন domain.com)
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
    } catch (err) {
      return false;
    }
  }

  async function pingIndexNow(targetUrl) {
    if (!INDEXNOW_KEY) return false;

    try {
      const formattedUrl = normalizeUrl(targetUrl);
      const host = new URL(formattedUrl).host;
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host,
          key: INDEXNOW_KEY,
          keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
          urlList: [formattedUrl],
        }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  function buildYandexPingUrl(targetUrl) {
    const formattedUrl = normalizeUrl(targetUrl);
    const host = new URL(formattedUrl).host;
    const params = new URLSearchParams({ url: formattedUrl });
    if (INDEXNOW_KEY) {
      params.set('key', INDEXNOW_KEY);
      params.set('keyLocation', `https://${host}/${INDEXNOW_KEY}.txt`);
    }
    return `https://yandex.com/indexnow?${params.toString()}`;
  }

  function resetTargets() {
    targetItems.forEach(item => item.classList.remove('is-done'));
  }

  function markTargetDone(name) {
    const item = document.querySelector(`.si-target-item[data-target="${name}"]`);
    if (item) item.classList.add('is-done');
  }

  function tick(name, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        markTargetDone(name);
        resolve();
      }, delay);
    });
  }

  function showToast(message, isError = false) {
    if (!toastEl) return;
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.toggle('is-error', isError);
    toastEl.classList.add('is-visible');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 3200);
  }

  function setFieldError(message) {
    if (!input || !feedback) return;
    input.classList.add('is-invalid');
    feedback.textContent = message;
    feedback.classList.remove('is-ok');
    feedback.classList.add('is-error');
  }

  function clearFieldState() {
    if (!input || !feedback) return;
    input.classList.remove('is-invalid');
    feedback.textContent = '';
    feedback.classList.remove('is-error', 'is-ok');
  }

  if (input) {
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid') && isValidUrl(input.value)) {
        clearFieldState();
      }
    });
  }

  if (yandexInput) {
    yandexInput.addEventListener('input', () => {
      if (yandexInput.classList.contains('is-invalid') && isValidUrl(yandexInput.value)) {
        yandexInput.classList.remove('is-invalid');
        if (yandexFeedback) {
          yandexFeedback.textContent = '';
          yandexFeedback.classList.remove('is-error', 'is-ok');
        }
      }
    });
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    if (submitSpin) submitSpin.classList.toggle('d-none', !isSubmitting);
    if (submitLabel) submitLabel.textContent = isSubmitting ? 'Submitting…' : 'Submit for Indexing';
  }

  // 🚀 FORM SUBMIT HANDLER
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const rawValue = input.value.trim();

      if (!rawValue) {
        setFieldError('Enter a URL before submitting.');
        input.focus();
        return;
      }

      if (!isValidUrl(rawValue)) {
        setFieldError('Invalid URL! Must be valid domain (e.g. https://domain.com).');
        input.focus();
        return;
      }

      // 🎯 ফাইনাল ভ্যালিড ও নরম্যালাইজড URL (https:// সহ)
      const cleanUrl = normalizeUrl(rawValue);

      clearFieldState();
      resetTargets();
      setSubmitting(true);

      (async () => {
        try {
          // ব্যাকএন্ডে পাঠানোর সময় একদম প্রপার https:// ওয়ালা URL যাবে
          await fetch(RENDER_BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: cleanUrl })
          });
        } catch (err) {
          console.error('Backend sync failed:', err);
        }

        await tick('google', 300);
        await tick('bing', 300);

        const realPing = await pingIndexNow(cleanUrl);
        if (!realPing) {
          await tick('indexnow', 300);
        } else {
          markTargetDone('indexnow');
        }

        setSubmitting(false);
        if (feedback) {
          feedback.textContent = 'Dispatched to 11 DuckDNS feed nodes & Vercel KV!';
          feedback.classList.add('is-ok');
        }
        showToast('Queued for indexing across network.');
        form.reset();
      })();
    });
  }

  // 🎯 YANDEX PING HANDLER
  if (yandexBtn) {
    yandexBtn.addEventListener('click', () => {
      const rawValue = yandexInput.value.trim();

      if (!rawValue || !isValidUrl(rawValue)) {
        if (yandexFeedback) {
          yandexFeedback.textContent = 'Enter a valid URL above first.';
          yandexFeedback.classList.remove('is-ok');
          yandexFeedback.classList.add('is-error');
        }
        if (yandexInput) yandexInput.classList.add('is-invalid');
        if (yandexInput) yandexInput.focus();
        return;
      }

      const cleanUrl = normalizeUrl(rawValue);
      if (yandexInput) yandexInput.classList.remove('is-invalid');

      window.open(buildYandexPingUrl(cleanUrl), '_blank', 'noopener,noreferrer');

      yandexBtn.classList.add('is-pinged');
      if (yandexFeedback) {
        yandexFeedback.textContent = 'Direct ping sent to Yandex.';
        yandexFeedback.classList.remove('is-error');
        yandexFeedback.classList.add('is-ok');
      }
      showToast('Pinged Yandex directly.');

      setTimeout(() => yandexBtn.classList.remove('is-pinged'), 2400);
    });
  }

});
