// Dashboard JavaScript

let lastActivityCount = 0;

// Fetch and update analytics
async function updateDashboard() {
  try {
    const response = await fetch('/api/analytics');
    const data = await response.json();

    // Update metrics
    document.getElementById('activeWorkers').textContent = data.metrics.activeWorkers;
    document.getElementById('tasksCompleted').textContent = data.metrics.tasksCompleted;
    document.getElementById('issuesReported').textContent = data.metrics.issuesReported;
    document.getElementById('suppliesNeeded').textContent = data.metrics.suppliesNeeded;

    // Update activity feed
    updateActivityFeed(data.recentActivities);

    // Update worker metrics
    updateWorkerMetrics(data.workerMetrics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
  }
}

// Update activity feed
function updateActivityFeed(activities) {
  const feedDiv = document.getElementById('activityFeed');

  if (!activities || activities.length === 0) {
    feedDiv.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>No activity yet</p>
        <p class="help-text">Activities will appear here in real-time</p>
      </div>
    `;
    return;
  }

  // Check if there are new activities
  if (activities.length > lastActivityCount) {
    // Play notification sound or vibrate (optional)
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  }
  lastActivityCount = activities.length;

  feedDiv.innerHTML = activities
    .reverse()
    .slice(0, 10) // Show last 10
    .map(activity => {
      const time = new Date(activity.timestamp).toLocaleTimeString();
      const type = activity.type || 'info';
      const typeClass = `type-${type.split('_')[0]}`;

      return `
        <div class="activity-item">
          <div class="activity-time">${time}</div>
          <div class="activity-text">${activity.text || activity.message || 'Activity logged'}</div>
          ${activity.type ? `<span class="activity-type ${typeClass}">${activity.type.replace('_', ' ')}</span>` : ''}
        </div>
      `;
    })
    .join('');
}

// Update worker metrics
function updateWorkerMetrics(metrics) {
  const metricsDiv = document.getElementById('workerMetrics');

  if (!metrics || Object.keys(metrics).length === 0) {
    metricsDiv.innerHTML = '<p class="help-text">No active workers</p>';
    return;
  }

  metricsDiv.innerHTML = Object.entries(metrics)
    .map(([workerId, data]) => `
      <div class="worker-metric">
        <h4>👷 ${workerId}</h4>
        <div class="worker-stats">
          <span>✅ Tasks: ${data.tasksToday || 0}</span>
          <span>⚠️ Issues: ${data.issuesReported || 0}</span>
          <span>🕐 Last active: ${new Date(data.lastActive).toLocaleTimeString()}</span>
        </div>
      </div>
    `)
    .join('');
}

// Clear data
function clearData() {
  if (confirm('Clear all today\'s data? This cannot be undone.')) {
    // In production, call API to clear data
    showToast('Data cleared', 'success');
    updateDashboard();
  }
}

// Initialize dashboard
updateDashboard();
setInterval(updateDashboard, 3000); // Update every 3 seconds
