// Setup Page JavaScript

let currentConfig = null;

// Load current configuration
async function loadCurrentConfig() {
  try {
    const response = await fetch('/api/config');
    currentConfig = await response.json();

    // Populate agent fields
    document.getElementById('agentName').value = currentConfig.agent.name;
    document.getElementById('agentVoice').value = currentConfig.agent.voice;
    document.getElementById('systemPrompt').value = currentConfig.agent.systemPrompt;

    // Populate analytics keywords
    document.getElementById('taskKeywords').value = currentConfig.analytics.taskCompletion.keywords.join(', ');
    document.getElementById('issueKeywords').value = currentConfig.analytics.issueReport.keywords.join(', ');
    document.getElementById('supplyKeywords').value = currentConfig.analytics.supplyRequest.keywords.join(', ');

    // Load workers
    loadWorkers();

    showToast('Configuration loaded', 'success');
  } catch (error) {
    showToast('Failed to load configuration', 'danger');
    console.error(error);
  }
}

// Test OpenAI API key
async function testApiKey() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const statusDiv = document.getElementById('apiKeyStatus');

  if (!apiKey) {
    statusDiv.innerHTML = '<div class="alert alert-warning">Please enter an API key</div>';
    return;
  }

  statusDiv.innerHTML = '<div class="alert alert-info">Testing API key...</div>';

  try {
    const response = await fetch('/api/test/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });

    const result = await response.json();

    if (result.success) {
      statusDiv.innerHTML = '<div class="alert alert-success">✅ API key is valid!</div>';

      // Save to localStorage for now (in production, save securely on server)
      localStorage.setItem('openai_api_key', apiKey);
    } else {
      statusDiv.innerHTML = `<div class="alert alert-danger">❌ ${result.error}</div>`;
    }
  } catch (error) {
    statusDiv.innerHTML = '<div class="alert alert-danger">Failed to test API key</div>';
    console.error(error);
  }
}

// Save agent configuration
async function saveAgentConfig() {
  const name = document.getElementById('agentName').value.trim();
  const voice = document.getElementById('agentVoice').value;
  const systemPrompt = document.getElementById('systemPrompt').value.trim();

  if (!name || !systemPrompt) {
    showToast('Please fill in all fields', 'warning');
    return;
  }

  try {
    const response = await fetch('/api/config/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, voice, systemPrompt })
    });

    const result = await response.json();

    if (result.success) {
      showToast('Agent configuration saved!', 'success');
    } else {
      showToast('Failed to save configuration', 'danger');
    }
  } catch (error) {
    showToast('Error saving configuration', 'danger');
    console.error(error);
  }
}

// Save analytics configuration
async function saveAnalyticsConfig() {
  const taskKeywords = document.getElementById('taskKeywords').value
    .split(',')
    .map(k => k.trim())
    .filter(k => k);

  const issueKeywords = document.getElementById('issueKeywords').value
    .split(',')
    .map(k => k.trim())
    .filter(k => k);

  const supplyKeywords = document.getElementById('supplyKeywords').value
    .split(',')
    .map(k => k.trim())
    .filter(k => k);

  try {
    const response = await fetch('/api/config/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskCompletion: { keywords: taskKeywords, action: 'log_completion' },
        issueReport: { keywords: issueKeywords, action: 'create_ticket' },
        supplyRequest: { keywords: supplyKeywords, action: 'log_supply_need' }
      })
    });

    const result = await response.json();

    if (result.success) {
      showToast('Keywords saved!', 'success');
    } else {
      showToast('Failed to save keywords', 'danger');
    }
  } catch (error) {
    showToast('Error saving keywords', 'danger');
    console.error(error);
  }
}

// Load workers list
async function loadWorkers() {
  if (!currentConfig) {
    await loadCurrentConfig();
  }

  const workersList = document.getElementById('workersList');
  const workers = currentConfig.workers;

  if (Object.keys(workers).length === 0) {
    workersList.innerHTML = '<p class="help-text">No workers added yet</p>';
    return;
  }

  workersList.innerHTML = Object.entries(workers)
    .map(([id, worker]) => `
      <div class="worker-item">
        <div class="worker-info">
          <h4>${worker.name} (${id})</h4>
          <p>${worker.role} • ${worker.shift} shift</p>
        </div>
        <button class="btn-delete" onclick="deleteWorker('${id}')">Delete</button>
      </div>
    `)
    .join('');
}

// Add new worker
async function addWorker() {
  const workerId = document.getElementById('workerId').value.trim();
  const name = document.getElementById('workerName').value.trim();
  const role = document.getElementById('workerRole').value.trim();
  const shift = document.getElementById('workerShift').value;

  if (!workerId || !name || !role) {
    showToast('Please fill in all worker fields', 'warning');
    return;
  }

  try {
    const response = await fetch('/api/config/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId, name, role, shift })
    });

    const result = await response.json();

    if (result.success) {
      showToast('Worker added!', 'success');

      // Clear form
      document.getElementById('workerId').value = '';
      document.getElementById('workerName').value = '';
      document.getElementById('workerRole').value = '';

      // Reload workers list
      await loadCurrentConfig();
    } else {
      showToast('Failed to add worker', 'danger');
    }
  } catch (error) {
    showToast('Error adding worker', 'danger');
    console.error(error);
  }
}

// Delete worker
async function deleteWorker(workerId) {
  if (!confirm(`Delete worker ${workerId}?`)) return;

  try {
    const response = await fetch(`/api/config/workers/${workerId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      showToast('Worker deleted', 'success');
      await loadCurrentConfig();
    } else {
      showToast('Failed to delete worker', 'danger');
    }
  } catch (error) {
    showToast('Error deleting worker', 'danger');
    console.error(error);
  }
}

// Load config on page load
window.addEventListener('DOMContentLoaded', loadCurrentConfig);
