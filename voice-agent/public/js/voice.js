// Voice Interface JavaScript

let currentWorker = null;
let sessionStartTime = null;
let sessionStats = {
  tasks: 0,
  issues: 0,
  supplies: 0
};
let sessionDurationInterval = null;
let isRecording = false;

// Load workers on page load
window.addEventListener('DOMContentLoaded', loadWorkers);

async function loadWorkers() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();

    const workerList = document.getElementById('workerList');
    const noWorkersMessage = document.getElementById('noWorkersMessage');

    if (!config.workers || Object.keys(config.workers).length === 0) {
      workerList.style.display = 'none';
      noWorkersMessage.style.display = 'block';
      return;
    }

    workerList.innerHTML = Object.entries(config.workers)
      .map(([id, worker]) => `
        <div class="worker-card" onclick="selectWorker('${id}', '${worker.name}', '${worker.role}')">
          <h4>👷 ${worker.name}</h4>
          <p>${worker.role} • ${worker.shift} shift</p>
        </div>
      `)
      .join('');

  } catch (error) {
    showToast('Failed to load workers', 'danger');
    console.error(error);
  }
}

function selectWorker(workerId, name, role) {
  currentWorker = {
    id: workerId,
    name: name,
    role: role
  };

  // Hide worker selection, show voice interface
  document.getElementById('workerSelectionCard').style.display = 'none';
  document.getElementById('voiceInterface').style.display = 'block';

  // Update worker info
  document.getElementById('currentWorkerName').textContent = name;
  document.getElementById('currentWorkerRole').textContent = role;

  showToast(`Selected worker: ${name}`, 'success');

  // Initialize session
  initializeSession();
}

async function initializeSession() {
  try {
    const response = await fetch('/api/voice/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId: currentWorker.id })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Session initialized:', result);
    }
  } catch (error) {
    console.error('Failed to initialize session:', error);
  }
}

function startVoiceSession() {
  // Check if OpenAI API key is configured
  const apiKey = localStorage.getItem('openai_api_key');

  if (!apiKey) {
    showToast('Please configure your OpenAI API key in Setup first', 'warning');
    setTimeout(() => {
      window.location.href = '/setup';
    }, 2000);
    return;
  }

  // Start recording
  isRecording = true;
  sessionStartTime = Date.now();

  // Update UI
  document.getElementById('startVoiceBtn').style.display = 'none';
  document.getElementById('stopVoiceBtn').style.display = 'flex';

  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  const voiceStatus = document.getElementById('voiceStatus');

  statusIcon.textContent = '🎙️';
  statusText.textContent = 'Listening...';
  voiceStatus.classList.add('listening');

  // Start session duration timer
  startSessionTimer();

  // Clear conversation display
  const conversationDisplay = document.getElementById('conversationDisplay');
  conversationDisplay.innerHTML = '';

  showToast('Voice session started! Start speaking...', 'success');

  // In production, initialize OpenAI Realtime API here
  // For demo, simulate conversation
  simulateConversation();
}

function stopVoiceSession() {
  isRecording = false;

  // Update UI
  document.getElementById('stopVoiceBtn').style.display = 'none';
  document.getElementById('startVoiceBtn').style.display = 'flex';

  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  const voiceStatus = document.getElementById('voiceStatus');

  statusIcon.textContent = '✅';
  statusText.textContent = 'Session paused';
  voiceStatus.classList.remove('listening', 'recording');

  showToast('Voice session stopped', 'info');
}

function startSessionTimer() {
  sessionDurationInterval = setInterval(() => {
    if (!sessionStartTime) return;

    const duration = Date.now() - sessionStartTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    document.getElementById('sessionDuration').textContent =
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    document.getElementById('statDuration').textContent = `${minutes} min`;
  }, 1000);
}

function addMessage(sender, text, tags = []) {
  const conversationDisplay = document.getElementById('conversationDisplay');

  const messageClass = sender === 'worker' ? 'message-worker' : 'message-agent';
  const senderName = sender === 'worker' ? currentWorker.name : 'AI Assistant';

  const message = document.createElement('div');
  message.className = `message ${messageClass}`;
  message.innerHTML = `
    <div class="message-header">
      <span class="message-sender">${senderName}</span>
      <span class="message-time">${new Date().toLocaleTimeString()}</span>
    </div>
    <div class="message-text">${text}</div>
    ${tags.length > 0 ? `
      <div class="message-tags">
        ${tags.map(tag => `<span class="message-tag tag-${tag}">${tag}</span>`).join('')}
      </div>
    ` : ''}
  `;

  conversationDisplay.appendChild(message);
  conversationDisplay.scrollTop = conversationDisplay.scrollHeight;

  // Update stats if tags present
  if (tags.includes('task')) {
    sessionStats.tasks++;
    document.getElementById('statTasks').textContent = sessionStats.tasks;
  }
  if (tags.includes('issue')) {
    sessionStats.issues++;
    document.getElementById('statIssues').textContent = sessionStats.issues;
  }
  if (tags.includes('supply')) {
    sessionStats.supplies++;
    document.getElementById('statSupplies').textContent = sessionStats.supplies;
  }

  // Log to analytics
  logActivity(sender, text, tags);
}

async function logActivity(sender, text, tags) {
  try {
    await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: currentWorker.id,
        type: tags[0] ? `${tags[0]}_completion` : 'conversation',
        text: text,
        sender: sender
      })
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

function simulateConversation() {
  // Demo: Simulate a conversation for testing
  setTimeout(() => {
    addMessage('worker', 'Hey assistant, I just finished loading truck number 5', ['task']);
  }, 2000);

  setTimeout(() => {
    addMessage('agent', 'Great work! I\'ve logged truck 5 as loaded. That\'s your 3rd truck today. Keep it up! Next is truck 6.');
  }, 4000);

  setTimeout(() => {
    addMessage('worker', 'The forklift in bay 3 is making a weird noise', ['issue']);
  }, 8000);

  setTimeout(() => {
    addMessage('agent', 'Thanks for letting me know. I\'ve created a maintenance ticket for the forklift in bay 3. Maintenance will be notified. Is it still safe to use?');
  }, 10000);

  setTimeout(() => {
    addMessage('worker', 'Yeah, it\'s still working. Also, we\'re running low on packing tape', ['supply']);
  }, 14000);

  setTimeout(() => {
    addMessage('agent', 'Got it! I\'ve added packing tape to the supply order. It should arrive tomorrow morning. Anything else you need?');
  }, 16000);
}

function endSession() {
  if (confirm('End this session? All conversation data will be saved.')) {
    // Stop recording if active
    if (isRecording) {
      stopVoiceSession();
    }

    // Stop timer
    if (sessionDurationInterval) {
      clearInterval(sessionDurationInterval);
    }

    showToast('Session ended. Summary saved!', 'success');

    // Reset and go back to worker selection
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
}

// Handle browser back button
window.addEventListener('popstate', () => {
  if (isRecording) {
    stopVoiceSession();
  }
  if (sessionDurationInterval) {
    clearInterval(sessionDurationInterval);
  }
});
