// Business Voice Agent Configuration
module.exports = {
  // Voice Agent Personality & Behavior
  agent: {
    name: "WorkMate",
    voice: "alloy", // Options: alloy, echo, fable, onyx, nova, shimmer
    language: "en-US",

    systemPrompt: `You are WorkMate, a helpful voice assistant for workers.

Your role:
- Help workers with their daily tasks
- Answer questions about procedures
- Log task completions and issues
- Provide encouragement and support
- Track inventory and supply needs

Guidelines:
- Keep responses short and clear (workers are busy)
- Be friendly but professional
- Always confirm when logging information
- Offer help proactively
- Speak naturally, like a helpful coworker

When a worker reports completing a task, confirm and encourage them.
When they report an issue, acknowledge and assure them it's logged.
When they ask for help, provide clear, actionable guidance.`,

    // Conversation settings
    conversationConfig: {
      turnDetection: {
        type: "server_vad", // Voice Activity Detection
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      temperature: 0.8,
      max_response_output_tokens: 150 // Keep responses concise
    }
  },

  // Business Analytics - What to track
  analytics: {
    // Keywords that trigger tracking
    taskCompletion: {
      keywords: ["finished", "completed", "done", "wrapped up"],
      action: "log_completion"
    },

    issueReport: {
      keywords: ["broken", "issue", "problem", "not working", "error"],
      action: "create_ticket"
    },

    supplyRequest: {
      keywords: ["need", "running low", "out of", "order"],
      action: "log_supply_need"
    },

    helpRequest: {
      keywords: ["help", "how do", "what is", "can you"],
      action: "track_help_request"
    },

    // What data to collect
    dataPoints: [
      "worker_id",
      "timestamp",
      "task_type",
      "completion_time",
      "location",
      "issues_reported",
      "supplies_needed",
      "sentiment",
      "keywords"
    ]
  },

  // Business Rules - Automated actions
  businessRules: {
    // Auto-escalate critical issues
    criticalKeywords: ["emergency", "urgent", "safety", "injury"],

    // Alert thresholds
    alerts: {
      maxIssuesPerWorker: 3, // Alert if worker reports 3+ issues
      lowSupplyKeywords: ["running low", "almost out"],
      productivityDrop: 0.3 // Alert if 30% below average
    },

    // Integration endpoints (customize these)
    webhooks: {
      issueTracking: "https://your-system.com/api/issues",
      inventorySystem: "https://your-system.com/api/inventory",
      alertsEndpoint: "https://your-system.com/api/alerts"
    }
  },

  // Dashboard settings
  dashboard: {
    port: 3000,
    refreshInterval: 5000, // 5 seconds
    metricsToShow: [
      "active_workers",
      "tasks_completed",
      "issues_reported",
      "supplies_needed",
      "average_sentiment",
      "productivity_score"
    ]
  },

  // Worker profiles (example - load from database in production)
  workers: {
    // Format: worker_id: { name, role, shift }
    "W001": { name: "John", role: "Warehouse", shift: "morning" },
    "W002": { name: "Sarah", role: "Technician", shift: "afternoon" },
    "W003": { name: "Mike", role: "Delivery", shift: "morning" }
  }
};
