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

  let toastTimer = null;

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
    setSubmitting(true);

    // Simulate a network round-trip to the (not-yet-connected) backend.
    setTimeout(() => {
      setSubmitting(false);
      feedback.textContent = 'Submitted.';
      feedback.classList.add('is-ok');
      showToast('Queued for indexing.');
      form.reset();
    }, 900);
  });

});
