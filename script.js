/* =========================================================
   S-Indexer — front-end interactions (no backend wired up)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     Seed data for the live feed
     --------------------------------------------------------- */
  const ROTATION_NODES = ['node-eu-3', 'node-us-1', 'node-us-4', 'node-ap-2', 'node-eu-1'];

  const SEED_FEED = [
    { url: 'https://example.com/blog/launch-notes',        node: 'node-us-1', status: 'processed' },
    { url: 'https://example.com/pricing',                  node: 'node-eu-1', status: 'processed' },
    { url: 'https://shop.example.com/products/widget-42',  node: 'node-ap-2', status: 'queued' },
    { url: 'https://example.com/docs/getting-started',     node: 'node-us-4', status: 'processed' },
  ];

  const feedListEl   = document.getElementById('feed-list');
  const form         = document.getElementById('submit-form');
  const input        = document.getElementById('target-url');
  const feedback     = document.getElementById('url-feedback');
  const submitBtn    = document.getElementById('submit-btn');
  const submitSpin   = document.getElementById('submit-spinner');
  const submitLabel  = submitBtn.querySelector('.si-btn-label');
  const toastEl      = document.getElementById('si-toast');

  let toastTimer = null;

  /* ---------------------------------------------------------
     Render helpers
     --------------------------------------------------------- */
  function statusChip(status){
    const isProcessed = status === 'processed';
    const cls   = isProcessed ? 'si-chip-processed' : 'si-chip-queued';
    const label = isProcessed ? 'Processed' : 'Queued';
    return `<span class="si-chip ${cls}">${label}</span>`;
  }

  function buildRow({ url, node, status }){
    const row = document.createElement('div');
    row.className = 'si-feed-row';
    row.innerHTML = `
      <span class="si-feed-url" title="${escapeHtml(url)}">${escapeHtml(url)}</span>
      <span class="si-feed-node">${escapeHtml(node)}</span>
      ${statusChip(status)}
    `;
    return row;
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderSeedFeed(){
    feedListEl.innerHTML = '';
    if (SEED_FEED.length === 0){
      const empty = document.createElement('div');
      empty.className = 'si-feed-empty';
      empty.textContent = 'No submissions yet. Submit a URL above to see it here.';
      feedListEl.appendChild(empty);
      return;
    }
    SEED_FEED.forEach(item => feedListEl.appendChild(buildRow(item)));
  }

  function prependRow(item){
    const empty = feedListEl.querySelector('.si-feed-empty');
    if (empty) empty.remove();
    const row = buildRow(item);
    feedListEl.prepend(row);
  }

  function updateRowStatus(row, status){
    const chip = row.querySelector('.si-chip');
    if (!chip) return;
    chip.outerHTML = statusChip(status);
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
    setSubmitting(true);

    // Simulate a network round-trip to the (not-yet-connected) backend.
    setTimeout(() => {
      const node = ROTATION_NODES[Math.floor(Math.random() * ROTATION_NODES.length)];
      const entry = { url: value, node, status: 'queued' };

      prependRow(entry);
      setSubmitting(false);
      feedback.textContent = 'Added to the queue.';
      feedback.classList.add('is-ok');
      showToast(`Queued for indexing on ${node}`);

      form.reset();

      // Simulate the node picking it up and marking it processed.
      const rows = feedListEl.querySelectorAll('.si-feed-row');
      const newRow = rows[0];
      setTimeout(() => {
        if (newRow && newRow.isConnected){
          updateRowStatus(newRow, 'processed');
        }
      }, 2600);

    }, 900);
  });

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  renderSeedFeed();
});
