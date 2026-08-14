/* Sources used in this file:
  - Custom backend API: https://web2-course-project-back-end-ylzw.onrender.com. */

const API_URL = 'https://web2-course-project-back-end-ylzw.onrender.com';

// Elements
const overviewSection = document.getElementById('studies-overview');
const detailSection = document.getElementById('study-detail-view');
const resultsContainer = document.getElementById('studies-results');
const detailContent = document.getElementById('study-detail-content');
const loadingState = document.getElementById('loading');
const searchForm = document.getElementById('pubmed-search-form');
const searchInput = document.getElementById('pubmed-query');
const backBtn = document.getElementById('back-to-results');
const loadMoreBtn = document.getElementById('load-more-btn');

// Pagination State
let currentCursor = '*';
let currentQuery = '';
let isFetching = false;

// --- 1. Handle Search & Pagination ---
// Search and pagination below rely on the backend proxy.
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  // Reset state for a fresh search
  currentQuery = query;
  currentCursor = '*';
  resultsContainer.innerHTML = '';
  loadMoreBtn.classList.add('hidden');
  
  await fetchAndRenderStudies();
});

loadMoreBtn.addEventListener('click', async () => {
  await fetchAndRenderStudies();
});

async function fetchAndRenderStudies() {
  if (isFetching) return;
  isFetching = true;
  
  loadingState.classList.remove('hidden');
  loadMoreBtn.classList.add('hidden');

  try {
    const response = await fetch(`${API_URL}/api/pubmed/search?q=${encodeURIComponent(currentQuery)}&cursorMark=${encodeURIComponent(currentCursor)}`);
    const result = await response.json();
    
    loadingState.classList.add('hidden');

    if (!result.data || result.data.length === 0) {
      if (currentCursor === '*') {
        resultsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 1.1rem;">No studies found. Try broadening your search terms.</p>';
      }
      isFetching = false;
      return;
    }

    renderOverview(result.data);

    // If there is a next page, update the cursor and show the button
    if (result.nextCursorMark && result.nextCursorMark !== currentCursor) {
      currentCursor = result.nextCursorMark;
      loadMoreBtn.classList.remove('hidden');
    }

  } catch (error) {
    console.error("Search failed:", error);
    loadingState.classList.add('hidden');
    resultsContainer.innerHTML += '<p style="color: var(--primary);">⚠️ Failed to connect to the literature database.</p>';
  }
  
  isFetching = false;
}

// --- 2. Render Clean Overview Cards ---
function renderOverview(studies) {
  // Append new studies instead of clearing the container
  studies.forEach((study) => {
    const card = document.createElement('div');
    card.className = 'card detail-card'; 
    card.style.display = 'block'; 
    card.style.transition = 'transform 0.2s ease, border-color 0.2s ease';
    
    card.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <span class="tag" style="align-self: flex-start;">PMID: ${study.id}</span>
        <h3 style="font-size: 1.25rem; color: var(--text-dark); margin: 0; text-transform: none;">${study.title}</h3>
        <p style="color: var(--text-body); font-weight: 500;">${study.authors}</p>
        <p style="color: var(--text-muted); font-size: 0.85rem;">${study.journal} • ${study.pubDate}</p>
      </div>
    `;

    card.addEventListener('click', () => showDetailView(study));
    resultsContainer.appendChild(card);
  });
}

// --- 3. Render Detail View (Abstracts) ---
// Abstract rendering and outbound PubMed links are populated from the proxy response.
function showDetailView(study) {
  overviewSection.classList.add('hidden');
  detailSection.classList.remove('hidden');
  
  const abstractHtml = study.abstract 
    ? `<p style="line-height: 1.8; font-size: 1.05rem; color: var(--text-body);">${study.abstract}</p>`
    : `<p style="color: var(--text-muted); font-style: italic;">No abstract available for this publication.</p>`;

  detailContent.innerHTML = `
    <div class="detail-header">
      <span class="tag" style="margin-bottom: 1rem;">PMID: ${study.id}</span>
      <h1 style="font-size: 2rem; margin-bottom: 1rem; text-transform: none;">${study.title}</h1>
      <p style="color: var(--text-dark); font-weight: 600; font-size: 1.1rem;">${study.authors}</p>
      <p style="color: var(--text-muted); margin-top: 0.5rem;">${study.journal} • Published: ${study.pubDate}</p>
    </div>
    
    <div class="detail-full-width">
      <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">Abstract</h3>
      <div style="background: var(--card-bg-subtle); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        ${abstractHtml}
      </div>
      
      <div style="margin-top: 2.5rem;">
        <a href="${study.link}" target="_blank" class="cta-btn" style="text-decoration: none; padding: 0.75rem 2rem; font-size: 1rem;">
          Read Original Article on PubMed ↗
        </a>
      </div>
    </div>
  `;
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 4. Back Button Logic ---
backBtn.addEventListener('click', () => {
  detailSection.classList.add('hidden');
  overviewSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- 5. URL Parameter Initialization ---
window.addEventListener('DOMContentLoaded', async () => {
  // Check if we arrived here from a compound detail view link
  const urlParams = new URLSearchParams(window.location.search);
  const queryParam = urlParams.get('q');
  
  if (queryParam) {
    // Populate the search bar so the user sees what was searched
    searchInput.value = queryParam;
    
    // Set the state and run the initial fetch
    currentQuery = queryParam;
    currentCursor = '*';
    resultsContainer.innerHTML = '';
    
    await fetchAndRenderStudies();
  }
});