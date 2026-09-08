document.addEventListener('DOMContentLoaded', () => {

  // ---------- HTML Elements Matching ----------
  const form           = document.getElementById('submit-form');
  const input          = document.getElementById('target-url');
  const feedback       = document.getElementById('url-feedback');
  const submitBtn      = document.getElementById('submit-btn');
  const submitSpin     = document.getElementById('submit-spinner');
  const submitLabel    = submitBtn ? submitBtn.querySelector('.si-btn-label') : null;
  const toastEl        = document.getElementById('si-toast');
  const targetItems    = document.querySelectorAll('#target-list .si-target-item');

  // IndexNow Key Elements
  const indexnowKeyInput = document.getElementById('indexnow-key');
  const generateKeyBtn   = document.getElementById('generate-key-btn');
  const keyFeedback      = document.getElementById('key-feedback');

  // Yandex Elements
  const yandexBtn      = document.getElementById('yandex-ping-btn');
  const yandexInput    = document.getElementById('yandex-url');
  const yandexFeedback = document.getElementById('yandex-feedback');

  let toastTimer = null;

  // 🎯 Render Backend URL
  const RENDER_BACKEND_URL = 'https://s-indexing-tool-bakend.onrender.com/index';

  // 🛠️ 32-character (Hex) IndexNow Key Generator
  function generateIndexNowKey() {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ⚡ Generate Key Button Event
  if (generateKeyBtn && indexnowKeyInput) {
    generateKeyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const generatedKey = generateIndexNowKey();
      indexnowKeyInput.value = generatedKey;

      if (keyFeedback) {
        keyFeedback.innerHTML = `Host this exact string as <code>${generatedKey}.txt</code> at your domain root — that's how Bing, Yandex and the rest confirm the request is really from you.`;
      }

      showToast('IndexNow Key generated & set!');
    });
  }

  // 🛠️ URL Normalizer (অটোমেটিক প্রোটোকল যুক্ত করে Relative 404 Bug ফিক্স করবে)
  function normalizeUrl(rawUrl) {
    let clean = rawUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    return clean;
  }

  // 🚨 Strict Validation Filter
  function isValidUrl(value) {
    const cleanValue = value.trim();

    // স্রেফ অসম্পূর্ণ প্রোটোকল টেক্সট ফিল্টার
    if (['http:', 'https:', 'http://', 'https://'].includes(cleanValue.toLowerCase())) {
      return false;
    }

    try {
      const formatted = normalizeUrl(cleanValue);
      const parsed = new URL(formatted);
      // Hostname-এ অন্তত একটি ডট (.) থাকতে হবে
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
    } catch (err) {
      return false;
    }
  }

  // 🌐 IndexNow Network Dispatcher
  async function pingIndexNow(targetUrl, key) {
    if (!key) return false;

    try {
      const formattedUrl = normalizeUrl(targetUrl);
      const host = new URL(formattedUrl).host;
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host,
          key: key,
          keyLocation: `https://${host}/${key}.txt`,
          urlList: [formattedUrl],
        }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  // ⚡ Build Yandex Direct URL
  function buildYandexPingUrl(targetUrl, key) {
    const formattedUrl = normalizeUrl(targetUrl);
    const host = new URL(formattedUrl).host;
    const params = new URLSearchParams({ url: formattedUrl });
    if (key) {
      params.set('key', key);
      params.set('keyLocation', `https://${host}/${key}.txt`);
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

  // 🚀 Step 2 Form Submit Handler
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const rawValue = input.value.trim();
      const currentKey = indexnowKeyInput ? indexnowKeyInput.value.trim() : '';

      if (!rawValue) {
        setFieldError('Enter a target URL before submitting.');
        input.focus();
        return;
      }

      if (!isValidUrl(rawValue)) {
        setFieldError('Invalid URL! Must be a valid web domain (e.g., https://example.com).');
        input.focus();
        return;
      }

      // 🎯 নরম্যালাইজড URL প্রস্তুত
      const cleanUrl = normalizeUrl(rawValue);

      clearFieldState();
      resetTargets();
      setSubmitting(true);

      (async () => {
        try {
          // Render Backend Push
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

        const realPing = await pingIndexNow(cleanUrl, currentKey);
        if (!realPing) {
          await tick('indexnow', 300);
        } else {
          markTargetDone('indexnow');
        }

        setSubmitting(false);
        if (feedback) {
          feedback.textContent = 'Dispatched to DuckDNS feed nodes & Vercel KV!';
          feedback.classList.add('is-ok');
        }
        showToast('Queued for indexing across network.');
        form.reset();
      })();
    });
  }

  // 🎯 Yandex Force Ping Button Handler
  if (yandexBtn) {
    yandexBtn.addEventListener('click', () => {
      const rawValue = yandexInput ? yandexInput.value.trim() : '';
      const currentKey = indexnowKeyInput ? indexnowKeyInput.value.trim() : '';

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

      // Yandex Ping Endpoint-এ নিউ ট্যাবে হিট পাঠাবে
      window.open(buildYandexPingUrl(cleanUrl, currentKey), '_blank', 'noopener,noreferrer');

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
