#!/usr/bin/env node

const express = require('express');
const config = require('../config/agent-config');

const app = express();
const port = process.env.DASHBOARD_PORT || config.dashboard.port;

// In-memory storage (in production, use a real database)
let globalAnalytics = {
  activeWorkers: [],
  sessionsToday: 0,
  totalTasks: 0,
  totalIssues: 0,
  totalSupplies: 0,
  recentActivities: [],
  workerMetrics: {}
};

app.use(express.json());
app.use(express.static('public'));

// API Endpoints

// Get dashboard data
app.get('/api/analytics', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    metrics: {
      activeWorkers: globalAnalytics.activeWorkers.length,
      sessionsToday: globalAnalytics.sessionsToday,
      tasksCompleted: globalAnalytics.totalTasks,
      issuesReported: globalAnalytics.totalIssues,
      suppliesNeeded: globalAnalytics.totalSupplies
    },
    recentActivities: globalAnalytics.recentActivities.slice(-10),
    workerMetrics: globalAnalytics.workerMetrics
  });
});

// Log activity from voice agent
app.post('/api/activity', (req, res) => {
  const activity = req.body;
  globalAnalytics.recentActivities.push({
    ...activity,
    timestamp: new Date().toISOString()
  });

  // Update metrics
  if (activity.type === 'task_completion') globalAnalytics.totalTasks++;
  if (activity.type === 'issue_report') globalAnalytics.totalIssues++;
  if (activity.type === 'supply_request') globalAnalytics.totalSupplies++;

  res.json({ success: true });
});

// Serve HTML dashboard
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Voice Agent - Analytics Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      margin-bottom: 30px;
      text-align: center;
    }
    .header h1 {
      color: #333;
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .header p {
      color: #666;
      font-size: 1.1em;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      text-align: center;
      transition: transform 0.2s;
    }
    .metric-card:hover {
      transform: translateY(-5px);
    }
    .metric-value {
      font-size: 3em;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    .metric-label {
      color: #666;
      font-size: 1.1em;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .activity-feed {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .activity-feed h2 {
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #667eea;
    }
    .activity-item {
      padding: 15px;
      margin-bottom: 10px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .activity-time {
      color: #999;
      font-size: 0.9em;
    }
    .activity-text {
      color: #333;
      margin-top: 5px;
      font-weight: 500;
    }
    .status-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      background: #10b981;
      border-radius: 50%;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }
    .empty-state-icon {
      font-size: 4em;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎤 Business Voice Agent Dashboard</h1>
      <p><span class="status-indicator"></span>Live Analytics - Updating every 5 seconds</p>
    </div>

    <div class="metrics-grid" id="metricsGrid">
      <!-- Metrics will be inserted here -->
    </div>

    <div class="activity-feed">
      <h2>📊 Recent Activity</h2>
      <div id="activityList">
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <p>No activity yet. Start a conversation with the voice agent!</p>
          <p style="margin-top: 10px; font-size: 0.9em;">Run: <code>npm run demo</code></p>
        </div>
      </div>
    </div>
  </div>

  <script>
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        updateDashboard(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    }

    function updateDashboard(data) {
      // Update metrics
      const metricsHTML = \`
        <div class="metric-card">
          <div class="metric-label">Active Workers</div>
          <div class="metric-value">\${data.metrics.activeWorkers}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Tasks Completed</div>
          <div class="metric-value">\${data.metrics.tasksCompleted}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Issues Reported</div>
          <div class="metric-value">\${data.metrics.issuesReported}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Supplies Needed</div>
          <div class="metric-value">\${data.metrics.suppliesNeeded}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Sessions Today</div>
          <div class="metric-value">\${data.metrics.sessionsToday}</div>
        </div>
      \`;
      document.getElementById('metricsGrid').innerHTML = metricsHTML;

      // Update activity feed
      const activityList = document.getElementById('activityList');
      if (data.recentActivities && data.recentActivities.length > 0) {
        const activitiesHTML = data.recentActivities
          .reverse()
          .map(activity => \`
            <div class="activity-item">
              <div class="activity-time">\${new Date(activity.timestamp).toLocaleTimeString()}</div>
              <div class="activity-text">\${activity.text || activity.message || 'Activity recorded'}</div>
            </div>
          \`)
          .join('');
        activityList.innerHTML = activitiesHTML;
      }
    }

    // Fetch data immediately and then every 5 seconds
    fetchAnalytics();
    setInterval(fetchAnalytics, 5000);
  </script>
</body>
</html>
  `);
});

app.listen(port, () => {
  console.log('\n' + '='.repeat(60));
  console.log('  📊 BUSINESS VOICE AGENT - ANALYTICS DASHBOARD');
  console.log('='.repeat(60) + '\n');
  console.log(`  🌐 Dashboard running at: http://localhost:${port}`);
  console.log(`  📈 Real-time analytics updating every ${config.dashboard.refreshInterval / 1000}s`);
  console.log('\n  Open your browser to view live metrics!');
  console.log('\n' + '='.repeat(60) + '\n');
});
