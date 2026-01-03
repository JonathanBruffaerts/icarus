const API_URL = 'https://web2-course-project-back-end-ylzw.onrender.com'; 
let allCompounds = [];
let pinnedCompounds = [];

// 1. Fetch and Display
async function loadCompounds() {
    try {
        const response = await fetch(`${API_URL}/compounds`);
        allCompounds = await response.json();
        
        renderGrid(allCompounds, 'compound-grid');
        
        // Hide spinner once data is ready
        document.getElementById('loading').style.display = 'none';
    } catch (err) {
        document.getElementById('loading').innerHTML = `
            <p style="color: red;">⚠️ Connection Error: Failed to reach research cluster.</p>
        `;
    }
}

function renderGrid(data, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${item.name}</h3>
            <p>Half-life: ${item.halfLife}h</p>
            <p><strong>${item.administrationRoute}</strong></p>
        `;
        
        // Interaction: Click card for details
        card.addEventListener('click', (e) => {
            if(e.target.classList.contains('pin-btn')) return;
            showDetails(item);
        });

        container.appendChild(card);
    });
}


// 2. Detail View
function showDetails(item) {
    // Hide the list and show the detail section
    document.getElementById('compound-section').classList.add('hidden');
    const detailView = document.getElementById('detail-view');
    detailView.classList.remove('hidden');
    
    // Inject rich content
    document.getElementById('detail-content').innerHTML = `
        <div class="detail-header">
            <h1>${item.name} <small>(${item.compoundId})</small></h1>
            <div class="tags">
                ${(Array.isArray(item.category) ? item.category : [item.category]).map(cat => `<span class="badge">${cat}</span>`).join('')}
            </div>
        </div>

        <div class="detail-grid">
            <div class="detail-card">
                <h3>Potency Profile</h3>
                <p><strong>Anabolic Ratio:</strong> ${item.anabolicRatio}</p>
                <p><strong>Androgenic Ratio:</strong> ${item.androgenicRatio}</p>
                <p><strong>Half-Life:</strong> ${item.halfLife} hours</p>
                <p><strong>Toxicity Level:</strong> ${item.toxicityLevel} / 5</p>
            </div>

            <div class="detail-card">
                <h3>Biomarker Impact</h3>
                <p><strong>Testosterone:</strong> ${item.biomarkers?.testosteroneImpact} ng/dL</p>
                <p><strong>Estrogen:</strong> ${item.biomarkers?.estrogenImpact} pg/mL</p>
                <hr>
                <p><strong>HDL (Good Cholesterol):</strong> ${item.biomarkers?.lipidImpact?.HDL}</p>
                <p><strong>LDL (Bad Cholesterol):</strong> ${item.biomarkers?.lipidImpact?.LDL}</p>
            </div>
        </div>

        <div class="detail-full-width">
            <h3>Mechanism of Action</h3>
            <p>${item.mechanismOfAction}</p>
            
            <h3>Chemical Structure</h3>
            <code>${item.chemicalStructure}</code>

            <h3>Side Effects</h3>
            <div class="tags">
                ${item.sideEffects.map(effect => `<span class="tag">${effect}</span>`).join('')}
            </div>
        </div>
    `;
}

window.addEventListener('DOMContentLoaded', () => {
    // Back button logic
    document.getElementById('back-btn').addEventListener('click', () => {
        document.getElementById('detail-view').classList.add('hidden');
        document.getElementById('compound-section').classList.remove('hidden');
    });

    
    document.getElementById('nav-home').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('compound-section').classList.remove('hidden');
        const aboutSection = document.getElementById('about-section');
        if (aboutSection) aboutSection.classList.add('hidden');
        document.getElementById('detail-view').classList.add('hidden');
    });


    document.getElementById('nav-about').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('compound-section').classList.add('hidden');
        document.getElementById('about-section').classList.remove('hidden');
        document.getElementById('detail-view').classList.add('hidden');
    });

    loadCompounds();
});