const API_URL = 'https://web2-course-project-back-end-ylzw.onrender.com'; 
let allCompounds = [];
let pinnedCompounds = [];

// 1. Fetch and Display
async function loadCompounds() {
    try {
        const response = await fetch(`${API_URL}/compounds`);
        allCompounds = await response.json();
        console.log(allCompounds);
        renderGrid(allCompounds, 'compound-grid');
        document.getElementById('loading').classList.add('hidden');
    } catch (err) {
        document.getElementById('loading').innerText = "Failed to load compounds.";
    }
}

function renderGrid(data, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <button class="pin-btn" data-id="${item.compoundId}">+</button>
            <h3>${item.name}</h3>
            <p>Half-life: ${item.halfLife}h</p>
            <p><strong>${item.administrationRoute}</strong></p>
        `;
        
        // Interaction: Click card for details
        card.addEventListener('click', (e) => {
            if(e.target.classList.contains('pin-btn')) return;
            showDetails(item);
        });

        // Interaction: Pin to Research Log
        card.querySelector('.pin-btn').addEventListener('click', () => pinCompound(item));

        container.appendChild(card);
    });
}

// 2. The "Spellbook" Logic (Research Log)
function pinCompound(item) {
    if (!pinnedCompounds.find(p => p.compoundId === item.compoundId)) {
        pinnedCompounds.push(item);
        renderGrid(pinnedCompounds, 'pinned-grid');
    }
}

// 3. Detail View
function showDetails(item) {
    document.getElementById('compound-section').classList.add('hidden');
    const detailView = document.getElementById('detail-view');
    detailView.classList.remove('hidden');
    
    document.getElementById('detail-content').innerHTML = `
        <h2>${item.name}</h2>
        <p>Mechanism: ${item.mechanismOfAction}</p>
        <ul>
            <li>Anabolic Ratio: ${item.anabolicRatio}</li>
            <li>Toxicity: ${item.toxicityLevel}/5</li>
        </ul>
    `;
}

window.addEventListener('DOMContentLoaded', () => {
// Back button logic

document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('compound-section').classList.remove('hidden');
});

loadCompounds();
});