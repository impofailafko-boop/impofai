/**
 * Dynamic Variables Builder
 *
 * Builds personalized Slovak prompts and first messages for ElevenLabs agent
 * based on worker context.
 */

/**
 * Build Slovak system prompt with worker context
 * @param {Object} context - Worker context from getWorkerContext
 * @returns {string} Slovak system prompt (500-800 chars)
 */
export function buildSlovakPrompt(context) {
  const workerName = context.worker?.name || 'zamestnanec';
  const workerRole = context.worker?.role || 'pracovník';

  // Time-based greeting
  const hour = new Date().getHours();
  let timeGreeting;
  if (hour < 12) {
    timeGreeting = 'Dobré ráno';
  } else if (hour < 17) {
    timeGreeting = 'Dobrý deň';
  } else {
    timeGreeting = 'Dobrý večer';
  }

  // Build contextual prompt
  const prompt = `Si ImpofAI, priateľský AI asistent ktorý pomáha firmám lepšie porozumieť ich prevádzke.

Práve hovoríš s ${workerName}, ktorý pracuje ako ${workerRole}.

TVOJE CIELE (PRIORITNE):
1. Na ZAČIATKU KAŽDÉHO rozhovoru použi funkciu get_context s worker_id
2. **KRITICKÉ:** KEĎ spomenie AKÝKOĽVEK problém, OKAMŽITE použi funkciu log_issue
   - Neodkladaj to na koniec
   - Buď VEĽMI špecifický v popise (cituj jeho presné slová)
   - Aj malé problémy sú dôležité

ŠTYL ROZHOVORU:
- Používaj neformálny tón ("ty" nie "vy")
- Buď priateľský, teplý, empatický
- Reaguj prirodzene ako kamarát, nie ako robot
- Používaj slovenské výrazy a idiomy prirodzene
- Ak nevieš, povedz to úprimne

NÁSTROJE:
- get_context(worker_id): Získaj kontext o pracovníkovi pred začiatkom
- log_issue(worker_id, issue_description, severity, location): Zaznamenaj problém OKAMŽITE

Tvoja úloha je počúvať, rozumieť a zaznamenávať. ${timeGreeting}!`;

  return prompt;
}

/**
 * Build Slovak first message (greeting)
 * @param {Object} context - Worker context from getWorkerContext
 * @returns {string} Slovak first message (80-150 chars)
 */
export function buildSlovakFirstMessage(context) {
  const workerName = context.worker?.name || 'kamarát';

  // Time-based greeting
  const hour = new Date().getHours();
  let timeGreeting;
  if (hour < 12) {
    timeGreeting = 'Dobré ráno';
  } else if (hour < 17) {
    timeGreeting = 'Dobrý deň';
  } else {
    timeGreeting = 'Dobrý večer';
  }

  // Priority 1: New worker (first conversation)
  if (context.is_new_worker) {
    return `${timeGreeting}! Volám sa ImpofAI a som tvoj AI asistent. Rád ťa spoznávam! Ako sa máš dnes?`;
  }

  // Priority 2: Returning worker with active issues they reported
  if (context.active_issues && context.active_issues.length > 0) {
    const issue = context.active_issues[0];
    const shortDesc = issue.description.length > 50
      ? issue.description.substring(0, 50) + '...'
      : issue.description;
    return `${timeGreeting}, ${workerName}! Pamätám si, že si minule spomínal ${shortDesc}. Ako sa to vyvíja?`;
  }

  // Priority 3: Returning worker with conversation history
  if (context.recent_conversations && context.recent_conversations.length > 0) {
    const lastTopics = context.recent_conversations[0].topics;
    if (lastTopics && lastTopics.length > 0) {
      return `Ahoj, ${workerName}! Ako sa dnes máš? Minule sme sa rozprávali o ${lastTopics[0]}. Čo je dnes na srdci?`;
    } else {
      return `Ahoj, ${workerName}! Vítaj späť! Ako sa ti dnes darí?`;
    }
  }

  // Priority 4: Default (fallback)
  return `${timeGreeting}, ${workerName}! Ako sa máš? Čo ťa dnes trápi?`;
}

/**
 * Get time-based greeting (helper)
 * @returns {string} Slovak greeting based on time of day
 */
export function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Dobré ráno';
  if (hour < 17) return 'Dobrý deň';
  return 'Dobrý večer';
}

export default {
  buildSlovakPrompt,
  buildSlovakFirstMessage,
  getTimeGreeting
};
