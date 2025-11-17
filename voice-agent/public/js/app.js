// Business Voice Agent - Main JavaScript

// Fetch and update system info
async function updateSystemInfo() {
  try {
    const [healthResponse, analyticsResponse] = await Promise.all([
      fetch('/health'),
      fetch('/api/analytics')
    ]);

    const health = await healthResponse.json();
    const analytics = await analyticsResponse.json();

    // Update uptime
    const uptime = Math.floor(health.uptime / 60);
    document.getElementById('uptime').textContent = `${uptime} min`;

    // Update analytics
    document.getElementById('sessions').textContent = analytics.metrics.sessionsToday;
    document.getElementById('workers').textContent = analytics.metrics.activeWorkers;
    document.getElementById('tasks').textContent = analytics.metrics.tasksCompleted;

    // Update status badge
    document.getElementById('statusBadge').innerHTML = `
      <span class="status-dot"></span>
      <span>Online</span>
    `;
  } catch (error) {
    console.error('Error fetching system info:', error);
    document.getElementById('statusBadge').innerHTML = `
      <span class="status-dot" style="background: var(--danger)"></span>
      <span>Offline</span>
    `;
  }
}

// Initialize
if (document.getElementById('systemInfo')) {
  updateSystemInfo();
  setInterval(updateSystemInfo, 5000); // Update every 5 seconds
}

// Utility: Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.zIndex = '1000';
  toast.style.minWidth = '250px';
  toast.style.animation = 'slideIn 0.3s ease-out';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Service Worker for PWA (optional)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // Service worker registration failed, continue without it
  });
}
