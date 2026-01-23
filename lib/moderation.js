// Simple content moderation utilities
// Uses hardcoded list of offensive words for demonstration purposes

// List of offensive words to detect (using mild examples for demonstration)
const OFFENSIVE_WORDS = [
  'spam',
  'idiot',
  'stupid',
  'hate',
  'kill',
  'die',
  'moron',
  'dumb',
  'loser',
  'trash'
];

// Regular expressions for common offensive patterns
const OFFENSIVE_PATTERNS = [
  /\b(f+u+c+k+)\b/gi,
  /\b(s+h+i+t+)\b/gi,
  /\b(d+a+m+n+)\b/gi,
  /\b(a+s+s+h+o+l+e+)\b/gi,
  /\b(b+i+t+c+h+)\b/gi
];

/**
 * Detects if a message contains hate speech or offensive content
 * @param {string} message - The message to analyze
 * @returns {boolean} - True if hate speech is detected, false otherwise
 */
function detectHateSpeech(message) {
  if (!message || typeof message !== 'string') {
    return false;
  }

  const lowerMessage = message.toLowerCase();

  // Check against hardcoded offensive words
  for (const word of OFFENSIVE_WORDS) {
    if (lowerMessage.includes(word.toLowerCase())) {
      return true;
    }
  }

  // Check against offensive patterns
  for (const pattern of OFFENSIVE_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

/**
 * Censors offensive content in a message by replacing it with asterisks
 * @param {string} message - The message to censor
 * @returns {string} - The censored message
 */
function censorMessage(message) {
  if (!message || typeof message !== 'string') {
    return message;
  }

  let censoredMessage = message;

  // Censor hardcoded offensive words
  for (const word of OFFENSIVE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    censoredMessage = censoredMessage.replace(regex, '*'.repeat(word.length));
  }

  // Censor patterns
  for (const pattern of OFFENSIVE_PATTERNS) {
    censoredMessage = censoredMessage.replace(pattern, (match) => {
      return '*'.repeat(match.length);
    });
  }

  return censoredMessage;
}

module.exports = {
  detectHateSpeech,
  censorMessage
};