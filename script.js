const API_URL = 'https://web2-course-project-back-end-ylzw.onrender.com';

let allCompounds = [];
let filteredCompounds = [];

// Element References
const compoundSection = document.getElementById('compound-section');
const detailView = document.getElementById('detail-view');
const aboutSection = document.getElementById('about-section');

const gridContainer = document.getElementById('compound-grid');
const detailContent = document.getElementById('detail-content');
const loadingState = document.getElementById('loading');

const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-select');

const navHome = document.getElementById('nav-home');
const navAbout = document.getElementById('nav-about');
const backBtn = document.getElementById('back-btn');

// --- 1. Fetch & Initialize ---
async function fetchCompounds({ search = '', category = '', sort = 'name' } = {}) {
  try {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/compounds${query}`);
    if (!response.ok) {
      const text = await response.text();
      console.error(`Compounds fetch failed: ${response.status} ${response.statusText}`);
      console.error('Non-JSON response:', text.slice(0, 1000));
      loadingState.innerHTML = `<p style="color: var(--primary);">⚠️ Server responded ${response.status} ${response.statusText} when fetching compounds.</p>`;
      return;
    }

    let result = null;
    try {
      result = await response.json();
    } catch (err) {
      const text = await response.text();
      console.error('Failed to parse compounds JSON:', err);
      console.error('Response body (first 200 chars):', text.slice(0, 200));
      loadingState.innerHTML = `<p style="color: var(--primary);">⚠️ Invalid JSON received from server.</p>`;
      return;
    }

    // Safely unwrap the 'data' array from API response
    allCompounds = result.data || [];
    
    renderGrid(allCompounds);
    loadingState.classList.add('hidden');
  } catch (error) {
    console.error('Fetch error:', error);
    loadingState.innerHTML = `
      <p style="color: var(--primary);">⚠️ Unable to connect to database cluster.</p>
    `;
  }
}

async function fetchCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`);
    if (!response.ok) {
      const text = await response.text();
      console.error(`Categories fetch failed: ${response.status} ${response.statusText}`);
      console.error('Non-JSON response (first 500 chars):', text.slice(0, 500));
      return;
    }

    let json = null;
    try {
      json = await response.json();
    } catch (err) {
      const text = await response.text();
      console.error('Failed to parse categories JSON:', err);
      console.error('Response body (first 500 chars):', text.slice(0, 500));
      return;
    }

    const fetched = Array.isArray(json.data) ? json.data.map(String) : [];

    // Canonical labels stored in DB — ensure these are present and listed first
    const canonical = [
      'Steroid',
      'SARM',
      'Peptide Hormone',
      'Growth Hormone Secretagogue'
    ];

    // Preserve canonical order, then append any additional fetched categories
    const additional = fetched.filter(c => !canonical.includes(c));
    const finalList = [...canonical, ...additional];

    categoryFilter.innerHTML = '<option value="">None</option>' +
      finalList.map(category => `<option value="${category}">${category}</option>`).join('');
  } catch (error) {
    console.error('Category load error:', error);
  }
}

// --- 2. Render Cards Grid ---
function renderGrid(data) {
  gridContainer.innerHTML = '';

  if (data.length === 0) {
    gridContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No compounds found matching your criteria.</p>`;
    return;
  }

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p class="card-meta">Half-life: ${item.halfLife}h</p>
      <p class="card-tag">${item.administrationRoute}</p>
    `;

    card.addEventListener('click', () => showDetails(item));

    gridContainer.appendChild(card);
  });
}

// --- 3. Render Detail View ---
function showDetails(item) {
  switchView('detail');

  // Normalize Category Array
  const categories = Array.isArray(item.category) ? item.category : [item.category];
  const badgesHtml = categories.map(c => `<span class="badge">${catSanitize(c)}</span>`).join('');

  // Normalize Side Effects Array
  const sideEffects = Array.isArray(item.sideEffects) ? item.sideEffects : [];
  const sideEffectsHtml = sideEffects.length > 0 
    ? sideEffects.map(e => `<span class="tag">${catSanitize(e)}</span>`).join('') 
    : '<p style="color: var(--text-muted)">None reported</p>';

  detailContent.innerHTML = `
    <div class="detail-header">
      <h1>${item.name} <span class="id-sub">(${item.compoundId})</span></h1>
      <div>${badgesHtml}</div>
    </div>

    <div class="detail-grid">
      <div class="detail-card">
        <h3>Potency Profile</h3>
        <div class="detail-row"><span>Anabolic Ratio</span><strong>${item.anabolicRatio ?? 'N/A'}</strong></div>
        <div class="detail-row"><span>Androgenic Ratio</span><strong>${item.androgenicRatio ?? 'N/A'}</strong></div>
        <div class="detail-row"><span>Half-Life</span><strong>${item.halfLife} hours</strong></div>
        <div class="detail-row"><span>Toxicity Rating</span><strong>${item.toxicityLevel} / 5</strong></div>
      </div>

      <div class="detail-card">
        <h3>Biomarker Impact</h3>
        <div class="detail-row"><span>Testosterone</span><strong>${item.biomarkers?.testosteroneImpact ?? 'N/A'} ng/dL</strong></div>
        <div class="detail-row"><span>Estrogen</span><strong>${item.biomarkers?.estrogenImpact ?? 'N/A'} pg/mL</strong></div>
        <div class="detail-row"><span>HDL</span><strong>${item.biomarkers?.lipidImpact?.HDL ?? 'N/A'}</strong></div>
        <div class="detail-row"><span>LDL</span><strong>${item.biomarkers?.lipidImpact?.LDL ?? 'N/A'}</strong></div>
      </div>
    </div>

    <div class="detail-full-width">
      <h3>Mechanism of Action</h3>
      <p>${item.mechanismOfAction || 'No detailed mechanism provided.'}</p>

      <h3>Chemical Structure (SMILES / Formula)</h3>
      <code>${item.chemicalStructure || 'N/A'}</code>

      <h3>Side Effects</h3>
      <div class="tag-list">${sideEffectsHtml}</div>
    </div>
  `;
}

// --- 4. Filtering & Search Logic ---
function applyFilters() {
  fetchCompounds({
    search: searchInput.value.trim(),
    category: categoryFilter.value,
    sort: sortSelect.value
  });
}

// Helper sanitizer
function catSanitize(str) {
  return String(str).replace(/[&<>"']/g, '');
}

// --- 5. Navigation & View Switching ---
function switchView(view) {
  compoundSection.classList.add('hidden');
  detailView.classList.add('hidden');
  aboutSection.classList.add('hidden');

  navHome.classList.remove('active');
  navAbout.classList.remove('active');

  if (view === 'home') {
    compoundSection.classList.remove('hidden');
    navHome.classList.add('active');
  } else if (view === 'about') {
    aboutSection.classList.remove('hidden');
    navAbout.classList.add('active');
  } else if (view === 'detail') {
    detailView.classList.remove('hidden');
  }
}

// --- 6. Event Listeners ---
window.addEventListener('DOMContentLoaded', async () => {
  await fetchCategories();
  await fetchCompounds();

  searchInput.addEventListener('input', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);
  sortSelect.addEventListener('change', applyFilters);

  navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
  navAbout.addEventListener('click', (e) => { e.preventDefault(); switchView('about'); });
  backBtn.addEventListener('click', () => switchView('home'));
});