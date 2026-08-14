/* Sources used in this file:
  - Chart.js docs: https://www.chartjs.org/docs/latest/ for renderBiomarkerChart().
  - SmilesDrawer docs: https://github.com/reymond-group/smilesDrawer for the molecule canvas logic.
  - Claude share: https://claude.ai/share/67f2994a-74db-4d0a-8ca2-3a8ed30f2a1d for the scroll-restoration fix below. */



const API_URL = 'https://web2-course-project-back-end-ylzw.onrender.com';

let allCompounds = [];
let filteredCompounds = [];

// Element References
const mainContent = document.getElementById('main-content');
const heroSection = document.getElementById('hero-section'); 
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
const navStudiesCta = document.getElementById('nav-studies-cta');
const navAbout = document.getElementById('nav-about');
const backBtn = document.getElementById('back-btn');

let savedScrollY = 0;
let currentView = 'home';
let closeAnimationTimeout = null;


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

    const canonical = [
      'Steroid',
      'SARM',
      'Peptide Hormone',
      'Growth Hormone Secretagogue'
    ];

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
let biomarkerChartInstance = null;

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
      <p style="font-family: 'Space Grotesk', monospace; color: var(--primary); font-weight: 700; margin-bottom: 0.5rem; letter-spacing: 1px;">REF // ${item.compoundId.toUpperCase()}</p>
      <h1>${item.name}</h1>
      <div style="margin-top: 1rem;">${badgesHtml}</div>
    </div>

    <div class="detail-grid">
      <div class="detail-card">
        <h3>Potency Profile</h3>
        <div class="detail-row"><span style="color: var(--text-muted)">Anabolic Ratio</span><strong style="font-size: 1.1rem;">${item.anabolicRatio ?? 'N/A'}</strong></div>
        <div class="detail-row"><span style="color: var(--text-muted)">Androgenic Ratio</span><strong style="font-size: 1.1rem;">${item.androgenicRatio ?? 'N/A'}</strong></div>
        <div class="detail-row"><span style="color: var(--text-muted)">Half-Life</span><strong style="font-size: 1.1rem;">${item.halfLife} hrs</strong></div>
        <div class="detail-row"><span style="color: var(--text-muted)">Toxicity Rating</span><strong style="font-size: 1.1rem;">${item.toxicityLevel} / 5</strong></div>
      </div>

      <div class="detail-card">
        <h3>Mechanism of Action</h3>
        <p style="font-size: 1rem; line-height: 1.7;">${item.mechanismOfAction || 'No detailed mechanism provided.'}</p>
      </div>
      
      <!-- Chart Container spanning full width -->
      <div class="detail-card" style="grid-column: 1 / -1;">
        <h3>Biomarker Impact</h3>
        <div style="position: relative; height: 280px; width: 100%; margin-top: 1rem;">
          <canvas id="biomarkerChart"></canvas>
        </div>
      </div>
    </div>

    <div class="detail-full-width">
      <h3 style="margin-top: 2rem;">Chemical Structure</h3>
      <div style="background: var(--card-bg-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 2rem 1rem; text-align: center; display: flex; flex-direction: column; align-items: center;">
        ${item.chemicalStructure ? '<canvas id="molecule-canvas"></canvas>' : '<p style="color: var(--text-muted)">Structure not available</p>'}
        <p style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted); margin-top: 1rem; word-break: break-all; max-width: 80%;">${item.chemicalStructure || ''}</p>
      </div>

      <h3 style="margin-top: 2rem;">Reported Side Effects</h3>
      <div class="tag-list">${sideEffectsHtml}</div>
      
      <h3 style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
        Related Literature (<span id="study-count">0</span>)
      </h3>
      <div id="compound-studies-container" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem;">
        ${item.studyIds && item.studyIds.length > 0 
          ? `<div style="text-align: center; color: var(--text-muted);"><div class="spinner" style="margin: 0 auto 1rem auto; width: 24px; height: 24px; border-width: 2px;"></div>Fetching clinical studies...</div>` 
          : '<p style="color: var(--text-muted)">No studies currently linked to this compound in the database.</p>'}
      </div>
    </div>
  `;

  // Chart.js-based render path; see source note at the top of this file.
  renderBiomarkerChart(item.biomarkers);

  // SmilesDrawer-based render path; see source note at the top of this file.
  if (item.chemicalStructure) {
    if (window.SmilesDrawer) {
      try {
        const smilesDrawer = new window.SmilesDrawer.Drawer({
          width: 500,
          height: 300,
          compactDrawing: false,
          themes: {
            light: {
              C: '#111827',
              O: '#d9534f',
              N: '#053BA8',
              F: '#10b981',
              S: '#f59e0b',
              Cl: '#10b981',
              Br: '#10b981',
              I: '#10b981',
              P: '#f59e0b',
              BACKGROUND: '#F8F9FA'
            }
          }
        });

        window.SmilesDrawer.parse(item.chemicalStructure, function(tree) {
          smilesDrawer.draw(tree, 'molecule-canvas', 'light', false);
        }, function(err) {
          console.error('SmilesDrawer failed to parse the structure:', err);
          // Fallback if the database has a standard formula instead of a SMILES string
          document.getElementById('molecule-canvas').style.display = 'none';
        });
      } catch (err) {
        console.error('Failed to initialize SmilesDrawer:', err);
      }
    } else {
      console.warn('SmilesDrawer library is not loaded.');
      document.getElementById('molecule-canvas').style.display = 'none';
    }
  }
  // Backend proxy lookup; see source note at the top of this file.
  loadCompoundStudies(item);
}

// --- Chart Generation Logic ---
function renderBiomarkerChart(biomarkers) {
  const ctx = document.getElementById('biomarkerChart');
  if (!ctx) return;

  // Destroy the old chart if it exists so they don't overlap
  if (biomarkerChartInstance) {
    biomarkerChartInstance.destroy();
  }

  // Extract values, default to 0 if missing
  const dataValues = [
    biomarkers?.testosteroneImpact || 0,
    biomarkers?.estrogenImpact || 0,
    biomarkers?.lipidImpact?.HDL || 0,
    biomarkers?.lipidImpact?.LDL || 0
  ];

  // Dynamic colors: Blue for positive numbers, Red for negative numbers
  const bgColors = dataValues.map(val => val < 0 ? 'rgba(255, 59, 48, 0.8)' : 'rgba(5, 59, 168, 0.8)');
  const borderColors = dataValues.map(val => val < 0 ? 'rgba(255, 59, 48, 1)' : 'rgba(5, 59, 168, 1)');

  biomarkerChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Testosterone', 'Estrogen', 'HDL', 'LDL'],
      datasets: [{
        label: 'Impact Variance',
        data: dataValues,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', 
      plugins: {
        legend: { display: false },
        tooltip: {
          padding: 12,
          callbacks: {
            label: (context) => {
              let suffix = '';
              if (context.label.includes('Testosterone')) suffix = ' ng/dL';
              if (context.label.includes('Estrogen')) suffix = ' pg/mL';
              return ` Impact: ${context.raw > 0 ? '+' : ''}${context.raw}${suffix}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          title: { display: true, text: 'Change from Baseline', font: { weight: 'bold' } }
        },
        y: {
          grid: { display: false },
          ticks: { font: { weight: '600', size: 13 } }
        }
      }
    }
  });
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
// The savedScrollY/currentView restoration logic below was fixed with Claude help;
// see the source note at the top of this file.
function switchView(view) {
  if (closeAnimationTimeout) {
    clearTimeout(closeAnimationTimeout);
    closeAnimationTimeout = null;
  }

  // Capture before any DOM changes collapse the page height
  if (view === 'detail') savedScrollY = window.scrollY;

  heroSection.classList.add('hidden');
  compoundSection.classList.add('hidden');
  detailView.classList.add('hidden');
  detailView.classList.remove('closing');

  navHome.classList.remove('active');
  navAbout?.classList.remove('active');

  document.body.classList.remove('detail-open');

  if (view === 'home') {
    heroSection.classList.remove('hidden');
    compoundSection.classList.remove('hidden');
    navHome.classList.add('active');
    window.dispatchEvent(new Event('scroll'));
  } else if (view === 'about') {
    aboutSection?.classList.remove('hidden');
    navAbout?.classList.add('active');
  } else if (view === 'detail') {
    // Reset animation so it replays on every open, not just the first
    detailView.style.animation = 'none';
    detailView.classList.remove('hidden');
    void detailView.offsetWidth; // force reflow before animation restarts
    detailView.style.animation = '';
    document.body.classList.add('detail-open');
  }

  if (view === 'detail') {
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else if (view === 'home') {
    // Defer until after layout reflow so the restored position isn't overwritten
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedScrollY, behavior: 'instant' });
    });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function closeDetailView() {
  if (detailView.classList.contains('closing')) return;
  detailView.classList.add('closing');
  // Match the 0.18s smoothExit animation duration
  closeAnimationTimeout = setTimeout(() => {
    closeAnimationTimeout = null;
    switchView('home');
  }, 180);
}

// --- 6. Event Listeners ---
window.addEventListener('DOMContentLoaded', async () => {
  await fetchCategories();
  await fetchCompounds();

  searchInput.addEventListener('input', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);
  sortSelect.addEventListener('change', applyFilters);

  navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });

  const featureExplorerButtons = document.querySelectorAll('.feature-cta[aria-label="Open Compound Explorer"], .feature-cta[aria-label="Open Biomarker Dashboard"]');
  featureExplorerButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Ensure the explorer content is visible, then scroll to it
      switchView('home');
      // Scroll to the Compound Explorer heading (more precise target) and account for the fixed navbar
      const target = document.querySelector('.compounds-title') || document.getElementById('compound-section');
      if (target) {
        // slight delay to allow view switch to apply
        setTimeout(() => {
          const navbar = document.querySelector('.navbar');
          const cssNavHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 56;
          const navHeight = (navbar && navbar.offsetHeight) ? navbar.offsetHeight : cssNavHeight;
          const y = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 12; // small gap
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, 80);
      }
    });
  });

  // Ensure all close buttons (top-right X or detail-close) close the detail view.
  // backBtn already has the .detail-close class, so it's included in this
  // querySelectorAll — no need to bind it a second time separately.
  document.querySelectorAll('.detail-close').forEach(el => el.addEventListener('click', () => closeDetailView()));
});

// --- 7. Fetch Specific Studies for a Compound ---
// This search flow is built around the backend's Europe PMC proxy endpoint.
async function loadCompoundStudies(item) {
  const container = document.getElementById('compound-studies-container');
  const countSpan = document.getElementById('study-count');
  
  try {
    let query = '';

    // 1. Check if specific PMIDs are linked in MongoDB
    if (item.studyIds && Array.isArray(item.studyIds) && item.studyIds.length > 0) {
      query = item.studyIds.map(id => `EXT_ID:${id}`).join(' OR ');
    } else {
      // 2. Automatic Fallback: Search Europe PMC by compound name
      query = `"${item.name}" AND (pharmacology OR trial OR toxicity OR safety)`;
    }

    const response = await fetch(`${API_URL}/api/pubmed/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    
    const hitCount = result.hitCount || (result.data ? result.data.length : 0);
    countSpan.textContent = hitCount;

    if (hitCount === 0) {
      container.innerHTML = '<p style="color: var(--text-muted)">No literature currently found for this compound.</p>';
      return;
    }

    // Generate the link to the dedicated studies page, passing the query in the URL
    const studiesUrl = `studies.html?q=${encodeURIComponent(query)}`;

    // Render a clean CTA box linking to the library
    container.innerHTML = `
      <div style="background: var(--card-bg-subtle); border: 1px solid var(--border-color); padding: 2rem; border-radius: var(--radius-md); text-align: center;">
        <h4 style="font-size: 1.25rem; color: var(--text-dark); margin-bottom: 0.5rem;">${hitCount} Clinical Studies Found</h4>
        <p style="color: var(--text-body); margin-bottom: 1.5rem; font-size: 16px;">
          Explore peer-reviewed literature, toxicity reports, and pharmacological data associated with ${item.name}.
        </p>
        <a href="${studiesUrl}" class="cta-btn" style="text-decoration: none; padding: 0.75rem 2rem; font-size: 1rem; display: inline-flex; align-items: center; gap: 0.5rem;">
          Open in Research Library
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    `;
    
  } catch (error) {
    console.error('Failed to fetch compound studies:', error);
    container.innerHTML = '<p style="color: var(--primary);">⚠️ Unable to load related literature count.</p>';
  }
}