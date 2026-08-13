const API_URL = 'https://web2-course-project-back-end-ylzw.onrender.com';

// --- Auth Elements ---
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// --- Dashboard Elements ---
const form = document.getElementById('compound-form');
const adminList = document.getElementById('admin-list');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn'); 
const formTitle = document.getElementById('form-title');
const formMessage = document.getElementById('form-message');

// --- 1. Authentication Logic ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('admin-password').value;
  
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (response.ok) {
      const data = await response.json();
      sessionStorage.setItem('icarus_token', data.token);
      showDashboard();
    } else {
      loginError.textContent = "Incorrect password.";
    }
  } catch (err) {
    loginError.textContent = "Server connection failed.";
  }
});

function checkAuthOnLoad() {
  const token = sessionStorage.getItem('icarus_token');
  if (token) {
    showDashboard();
  }
}

function showDashboard() {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  fetchAdminCompounds(); 
}

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('icarus_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  };
};

// --- 2. Fetch & Render Logic ---
async function fetchAdminCompounds() {
  try {
    const response = await fetch(`${API_URL}/compounds`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server Error ${response.status}: ${errorText.substring(0, 100)}`);
    }

    const result = await response.json();
    renderList(result.data || []);
  } catch (error) {
    console.error("🔥 FETCH CRASHED:", error);
    document.getElementById('admin-list').innerHTML = `
      <div style="color: #d9534f; background: #fdf5f5; padding: 1rem; border-radius: 8px; border: 1px solid #d9534f;">
        <strong>Database Load Failed:</strong><br>
        <span style="font-size: 0.85rem; word-break: break-all;">${error.message}</span>
      </div>
    `;
  }
}

function renderList(compounds) {
  adminList.innerHTML = '';
  
  if (compounds.length === 0) {
    adminList.innerHTML = '<p class="text-muted">No compounds found.</p>';
    return;
  }

  compounds.forEach(c => {
    const row = document.createElement('div');
    row.className = 'admin-list-row';
    row.innerHTML = `
      <div>
        <strong>${c.name}</strong>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">ID: ${c.compoundId}</p>
      </div>
      <div class="admin-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    row.querySelector('.edit-btn').addEventListener('click', () => loadForm(c));
    row.querySelector('.delete-btn').addEventListener('click', () => deleteCompound(c.compoundId));
    
    adminList.appendChild(row);
  });
}

// --- 3. CRUD Operations ---
async function deleteCompound(id) {
  if (!confirm(`Are you sure you want to permanently delete ${id}?`)) return;

  try {
    const response = await fetch(`${API_URL}/compounds/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders() 
    });
    
    if (response.ok) {
      fetchAdminCompounds(); 
    } else {
      const err = await response.json();
      alert(`Failed to delete: ${err.message}`);
    }
  } catch (error) {
    alert('Network error while deleting.');
  }
}

function loadForm(compound) {
  document.getElementById('is-edit').value = "true";
  
  document.getElementById('compoundId').value = compound.compoundId;
  document.getElementById('compoundId').readOnly = true; 
  document.getElementById('compoundId').style.background = '#f0f0f0';

  document.getElementById('name').value = compound.name;
  document.getElementById('category').value = (compound.category || []).join(', ');
  document.getElementById('adminRoute').value = compound.administrationRoute;
  document.getElementById('anabolicRatio').value = compound.anabolicRatio;
  document.getElementById('androgenicRatio').value = compound.androgenicRatio;
  document.getElementById('toxicityLevel').value = compound.toxicityLevel;
  document.getElementById('halfLife').value = compound.halfLife;
  document.getElementById('mechanismOfAction').value = compound.mechanismOfAction;
  document.getElementById('chemicalStructure').value = compound.chemicalStructure || '';
  
  document.getElementById('testosteroneImpact').value = compound.biomarkers?.testosteroneImpact || 0;
  document.getElementById('estrogenImpact').value = compound.biomarkers?.estrogenImpact || 0;
  document.getElementById('hdlImpact').value = compound.biomarkers?.lipidImpact?.HDL || 0;
  document.getElementById('ldlImpact').value = compound.biomarkers?.lipidImpact?.LDL || 0;

  document.getElementById('sideEffects').value = (compound.sideEffects || []).join(', ');
  document.getElementById('studyIds').value = (compound.studyIds || []).join(', ');

  formTitle.textContent = "Edit Compound";
  submitBtn.textContent = "Update Compound";
  cancelBtn.classList.remove('hidden');
  window.scrollTo(0, 0);
}

function resetForm() {
  form.reset();
  document.getElementById('is-edit').value = "false";
  document.getElementById('compoundId').readOnly = false;
  document.getElementById('compoundId').style.background = 'transparent';
  formTitle.textContent = "Add New Compound";
  submitBtn.textContent = "Save Compound";
  cancelBtn.classList.add('hidden');
  formMessage.textContent = '';
}

cancelBtn.addEventListener('click', resetForm);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const isEdit = document.getElementById('is-edit').value === "true";
  const id = document.getElementById('compoundId').value.trim();

  const parseArray = (str) => str.split(',').map(s => s.trim()).filter(Boolean);

  const payload = {
    compoundId: id,
    name: document.getElementById('name').value.trim(),
    category: parseArray(document.getElementById('category').value),
    administrationRoute: document.getElementById('adminRoute').value.trim(),
    anabolicRatio: parseFloat(document.getElementById('anabolicRatio').value),
    androgenicRatio: parseFloat(document.getElementById('androgenicRatio').value),
    toxicityLevel: parseFloat(document.getElementById('toxicityLevel').value),
    halfLife: parseFloat(document.getElementById('halfLife').value),
    mechanismOfAction: document.getElementById('mechanismOfAction').value.trim(),
    chemicalStructure: document.getElementById('chemicalStructure').value.trim(),
    biomarkers: {
      testosteroneImpact: parseFloat(document.getElementById('testosteroneImpact').value),
      estrogenImpact: parseFloat(document.getElementById('estrogenImpact').value),
      lipidImpact: {
        HDL: parseFloat(document.getElementById('hdlImpact').value),
        LDL: parseFloat(document.getElementById('ldlImpact').value)
      },
      liverEnzymes: { ALT: 0, AST: 0 } 
    },
    sideEffects: parseArray(document.getElementById('sideEffects').value),
    studyIds: parseArray(document.getElementById('studyIds').value)
  };

  try {
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    const url = isEdit ? `${API_URL}/compounds/${id}` : `${API_URL}/compounds`;
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: getAuthHeaders(), 
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      formMessage.style.color = '#10b981'; 
      formMessage.textContent = isEdit ? "Successfully updated!" : "Successfully created!";
      resetForm();
      fetchAdminCompounds(); 
    } else {
      formMessage.style.color = '#d9534f'; 
      formMessage.textContent = result.message || result.error || "Submission failed.";
    }
  } catch (error) {
    formMessage.style.color = '#d9534f';
    formMessage.textContent = "Network error. Make sure backend is running.";
  } finally {
    submitBtn.textContent = isEdit ? "Update Compound" : "Save Compound";
    submitBtn.disabled = false;
  }
});

// Initialize page
window.addEventListener('DOMContentLoaded', checkAuthOnLoad);