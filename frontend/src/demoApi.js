// Demo mode: an in-browser stand-in for the FastAPI backend, used for the
// GitHub Pages demo. Data is sample data kept in this browser's localStorage,
// and the assistant is rule-based instead of the LangGraph + Groq agent.

const STORAGE_KEY = 'pharmarep-demo-v1';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

const SEED = [
  {
    id: 1, hcp_name: 'Dr. Patel', hcp_specialty: 'Cardiology', hcp_location: 'Mumbai, MH',
    interaction_type: 'in-person', interaction_date: daysAgo(2), products_discussed: 'CardioMax',
    notes: 'Presented the CardioMax phase III data. Dr. Patel was interested in the reduced dosing frequency and asked for patient leaflets.',
    summary: 'Presented CardioMax phase III data; Dr. Patel was interested in the reduced dosing frequency. Requested patient leaflets.',
    sentiment: 'positive', follow_up_required: 'Yes', follow_up_notes: 'Deliver patient leaflets next week', rep_name: 'Field Rep',
  },
  {
    id: 2, hcp_name: 'Dr. Singh', hcp_specialty: 'Neurology', hcp_location: 'Delhi, DL',
    interaction_type: 'virtual', interaction_date: daysAgo(5), products_discussed: 'NeuroPlus',
    notes: 'Video call about NeuroPlus. Dr. Singh raised a concern about drowsiness reported by two patients and wants more safety data.',
    summary: 'Discussed NeuroPlus over video; Dr. Singh raised a concern about drowsiness in two patients. Wants more safety data.',
    sentiment: 'negative', follow_up_required: 'Yes', follow_up_notes: 'Send safety data summary', rep_name: 'Field Rep',
  },
  {
    id: 3, hcp_name: 'Dr. Mehta', hcp_specialty: 'Endocrinology', hcp_location: 'Pune, MH',
    interaction_type: 'phone', interaction_date: daysAgo(8), products_discussed: 'GlucoBalance',
    notes: 'Short phone call to confirm the GlucoBalance sample delivery. No new questions.',
    summary: 'Confirmed GlucoBalance sample delivery by phone. No new questions raised.',
    sentiment: 'neutral', follow_up_required: 'No', follow_up_notes: '', rep_name: 'Field Rep',
  },
  {
    id: 4, hcp_name: 'Dr. Singh', hcp_specialty: 'Neurology', hcp_location: 'Delhi, DL',
    interaction_type: 'in-person', interaction_date: daysAgo(14), products_discussed: 'NeuroPlus',
    notes: 'Clinic visit. Dr. Singh was receptive to the NeuroPlus efficacy results and agreed to try it with a few patients.',
    summary: 'Clinic visit on NeuroPlus; Dr. Singh was receptive to the efficacy results. Agreed to trial it with a few patients.',
    sentiment: 'positive', follow_up_required: 'No', follow_up_notes: '', rep_name: 'Field Rep',
  },
  {
    id: 5, hcp_name: 'Dr. Iyer', hcp_specialty: 'Pulmonology', hcp_location: 'Chennai, TN',
    interaction_type: 'email', interaction_date: daysAgo(20), products_discussed: 'RespiClear',
    notes: 'Emailed the RespiClear dosing guide. Dr. Iyer replied that it is too expensive for most of her patients.',
    summary: 'Shared the RespiClear dosing guide by email; Dr. Iyer considers it too expensive for most patients.',
    sentiment: 'negative', follow_up_required: 'Yes', follow_up_notes: 'Check patient assistance programme', rep_name: 'Field Rep',
  },
  {
    id: 6, hcp_name: 'Dr. Patel', hcp_specialty: 'Cardiology', hcp_location: 'Mumbai, MH',
    interaction_type: 'phone', interaction_date: daysAgo(30), products_discussed: 'CardioMax, NeuroPlus',
    notes: 'Introductory call. Dr. Patel agreed to a meeting to see the CardioMax data.',
    summary: 'Introductory call; Dr. Patel agreed to an in-person meeting to review CardioMax data.',
    sentiment: 'positive', follow_up_required: 'No', follow_up_notes: '', rep_name: 'Field Rep',
  },
].map((item) => ({ ...item, created_at: item.interaction_date, updated_at: item.interaction_date }));

const KNOWN_PRODUCTS = ['CardioMax', 'NeuroPlus', 'GlucoBalance', 'RespiClear'];
const POSITIVE = ['interested', 'positive', 'agreed', 'agree', 'keen', 'impressed', 'happy', 'supportive',
  'willing', 'receptive', 'enthusiastic', 'liked', 'will prescribe', 'good feedback'];
const NEGATIVE = ['concern', 'not interested', 'declined', 'skeptical', 'sceptical', 'unhappy', 'side effect',
  'complain', 'reluctant', 'refused', 'expensive', 'negative', 'worried'];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // localStorage unavailable or corrupted: fall back to the sample data
  }
  return structuredClone(SEED);
}

let items = load();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full or blocked: keep working in memory
  }
}

export function resetDemoData() {
  items = structuredClone(SEED);
  save();
}

function countMatches(text, words) {
  const lower = text.toLowerCase();
  return words.filter((w) => lower.includes(w)).length;
}

function detectSentiment(text) {
  const pos = countMatches(text, POSITIVE);
  const neg = countMatches(text, NEGATIVE);
  if (pos > neg) return 'positive';
  if (neg > pos) return 'negative';
  return 'neutral';
}

function summarize(notes, products) {
  const sentences = notes.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  let summary = sentences.slice(0, 2).join(' ');
  if (summary.length > 220) summary = `${summary.slice(0, 217)}...`;
  if (products && !summary.toLowerCase().includes(products.split(',')[0].trim().toLowerCase())) {
    summary += ` Products discussed: ${products}.`;
  }
  return summary;
}

const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at);
const formatDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// ─── Same interface as the real API (see api.js) ──────────────────────────────

export async function listInteractions() {
  await delay(250);
  return structuredClone([...items].sort(byNewest));
}

export async function createInteraction(data) {
  await delay(500);
  const now = new Date().toISOString();
  const interaction = {
    hcp_specialty: '', hcp_location: '', interaction_type: 'in-person', products_discussed: '',
    follow_up_required: 'No', follow_up_notes: '', rep_name: 'Field Rep',
    ...data,
    id: Math.max(0, ...items.map((i) => i.id)) + 1,
    interaction_date: now,
    created_at: now,
    updated_at: now,
    summary: data.summary || summarize(data.notes || '', data.products_discussed),
    sentiment: detectSentiment(data.notes || ''),
  };
  items.push(interaction);
  save();
  return structuredClone(interaction);
}

export async function updateInteraction(id, data) {
  await delay(300);
  const interaction = items.find((i) => i.id === Number(id));
  if (!interaction) throw new Error('Interaction not found');
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) interaction[key] = value;
  }
  interaction.updated_at = new Date().toISOString();
  save();
  return structuredClone(interaction);
}

export async function deleteInteraction(id) {
  await delay(250);
  items = items.filter((i) => i.id !== Number(id));
  save();
}

// ─── Rule-based assistant ─────────────────────────────────────────────────────

function findDoctor(message) {
  const match = message.match(/\bdr\.?\s+([a-z][a-z'-]+)/i);
  if (!match) return null;
  const name = match[1];
  return `Dr. ${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function findInteractionId(message) {
  const match = message.match(/#\s*(\d+)|\binteraction\s+(\d+)/i);
  return match ? Number(match[1] || match[2]) : null;
}

function findProducts(message) {
  const lower = message.toLowerCase();
  const known = [...new Set([...KNOWN_PRODUCTS, ...items.flatMap((i) => (i.products_discussed || '').split(','))])]
    .map((p) => p.trim())
    .filter(Boolean);
  const found = known.filter((p) => lower.includes(p.toLowerCase()));
  if (found.length) return found.join(', ');
  const about = message.match(/\babout\s+([A-Z][\w-]+)/);
  return about ? about[1] : '';
}

function detectType(message) {
  if (/\b(virtual|video|zoom|teams|online)\b/i.test(message)) return 'virtual';
  if (/\b(email|emailed|mail)\b/i.test(message)) return 'email';
  if (/\b(call|called|phone)\b/i.test(message)) return 'phone';
  return 'in-person';
}

function describe(i) {
  return `#${i.id} · ${formatDate(i.interaction_date)} · ${i.hcp_name} (${i.interaction_type})` +
    `${i.products_discussed ? ` · ${i.products_discussed}` : ''} · ${i.sentiment}`;
}

async function logFromChat(message, doctor) {
  const existing = items.find((i) => i.hcp_name === doctor);
  const type = detectType(message);
  const products = findProducts(message);
  const label = { 'in-person': 'In-person meeting', phone: 'Phone call', email: 'Email', virtual: 'Virtual meeting' }[type];
  const sentiment = detectSentiment(message);
  const tone = { positive: 'The HCP responded positively.', negative: 'The HCP raised concerns.', neutral: '' }[sentiment];
  const interaction = await createInteraction({
    hcp_name: doctor,
    hcp_specialty: existing?.hcp_specialty || '',
    hcp_location: existing?.hcp_location || '',
    interaction_type: type,
    products_discussed: products,
    notes: message,
    summary: `${label} with ${doctor}${products ? ` about ${products}` : ''}. ${tone}`.trim(),
  });
  return `Logged interaction #${interaction.id} with ${doctor}.\n\n` +
    `Type: ${interaction.interaction_type}\n` +
    `Products: ${interaction.products_discussed || 'none detected'}\n` +
    `Sentiment: ${interaction.sentiment}\n` +
    `Summary: ${interaction.summary}`;
}

function history(doctor) {
  const list = [...items].filter((i) => !doctor || i.hcp_name === doctor).sort(byNewest).slice(0, doctor ? 10 : 5);
  if (!list.length) return doctor ? `I found no interactions with ${doctor}.` : 'There are no interactions yet.';
  const title = doctor ? `Interactions with ${doctor}:` : 'Most recent interactions:';
  return `${title}\n${list.map((i) => `• ${describe(i)}`).join('\n')}`;
}

function analyze(doctor) {
  const list = items.filter((i) => i.hcp_name === doctor).sort(byNewest);
  if (!list.length) return `I found no interactions with ${doctor} to analyse.`;
  const counts = { positive: 0, neutral: 0, negative: 0 };
  list.forEach((i) => { counts[i.sentiment] = (counts[i.sentiment] || 0) + 1; });
  const products = [...new Set(list.flatMap((i) => (i.products_discussed || '').split(',').map((p) => p.trim())).filter(Boolean))];
  const pending = list.filter((i) => i.follow_up_required === 'Yes');
  const latest = list[0];

  let recommendation;
  if (latest.sentiment === 'negative') {
    recommendation = `The latest interaction was negative. Address the concern first: ${latest.follow_up_notes || 'follow up on the issue raised'}.`;
  } else if (counts.positive >= list.length / 2) {
    recommendation = 'Engagement is strong. A good next step is an in-person visit with outcome data or samples.';
  } else {
    recommendation = 'Engagement is mixed. Keep contact regular and bring evidence that targets their specialty.';
  }

  return `Engagement analysis for ${doctor} (${list[0].hcp_specialty || 'specialty unknown'}):\n\n` +
    `• Interactions: ${list.length}, latest on ${formatDate(latest.interaction_date)}\n` +
    `• Sentiment: ${counts.positive} positive, ${counts.neutral} neutral, ${counts.negative} negative\n` +
    `• Products discussed: ${products.join(', ') || 'none recorded'}\n` +
    `• Open follow-ups: ${pending.length}${pending.length ? ` (${pending.map((i) => `#${i.id}`).join(', ')})` : ''}\n\n` +
    `Recommendation: ${recommendation}`;
}

async function scheduleFollowUp(message, id) {
  const interaction = items.find((i) => i.id === id);
  if (!interaction) return `Interaction #${id} does not exist.`;
  const note = message.match(/\b(?:to|about|for)\s+(?!interaction\b)(.+)$/i)?.[1]?.replace(/#\s*\d+/, '').trim();
  await updateInteraction(id, {
    follow_up_required: 'Yes',
    follow_up_notes: note && note.length > 3 ? note : interaction.follow_up_notes || 'Follow-up scheduled from the AI assistant',
  });
  return `Follow-up scheduled for interaction #${id} with ${interaction.hcp_name}.`;
}

const HELP = 'In this demo I can:\n' +
  '• Log an interaction: "Met Dr. Rao today, she was interested in CardioMax"\n' +
  '• Show history: "Show recent interactions" or "Show interactions with Dr. Singh"\n' +
  '• Analyse engagement: "Analyze engagement with Dr. Patel"\n' +
  '• Schedule a follow-up: "Schedule a follow-up for interaction #3"';

export async function sendChat(message) {
  await delay(700);
  const doctor = findDoctor(message);
  const id = findInteractionId(message);

  if (/follow[\s-]?up|schedule|remind/i.test(message) && id) return scheduleFollowUp(message, id);
  if (/analy[sz]e|engagement|insight/i.test(message)) {
    return doctor ? analyze(doctor) : 'Which doctor should I analyse? For example: "Analyze engagement with Dr. Singh".';
  }
  if (/\b(log|record|met|meeting|visited|visit|called|call|emailed)\b/i.test(message)) {
    return doctor ? logFromChat(message, doctor) : 'Which doctor was the interaction with? Include a name like "Dr. Patel".';
  }
  if (/show|list|recent|history|all|past/i.test(message)) return history(doctor);
  return HELP;
}
