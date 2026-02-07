// Simple content moderation utilities
// Uses hardcoded list of offensive words for demonstration purposes
// Enhanced with ML-based hate speech detection

// List of offensive words to detect (using mild examples for demonstration)
const OFFENSIVE_WORDS = [
  // Basic insults
  'spam', 'idiot', 'stupid', 'moron', 'dumb', 'loser', 'trash',
  
  // Profanity  
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'asshole', 'bastard', 'crap', 'piss',
  
  // Sexual slurs
  'slut', 'whore', 'pussy', 'cock', 'dick', 'tits', 'boobs', 'nudes',
  
  // Derogatory terms
  'retard', 'gay', 'fag', 'faggot',
  
  // Racial slurs (be very careful with these)
  'nazi', 'nigger', 'chink', 'kike', 'spic',
  
  // Violence/threats
  'hate', 'kill', 'die', 'murder', 'beat', 'destroy',
  
  // Compound words (to catch variations)
  'motherfuck', 'motherfucker', 'bullshit', 'dumbass', 'shithead', 'fuckface',
  
  // Symbol variations that might slip through regex
  'fck', 'sht', 'dmn', 'btch', 'shthead', 'fuk', 'shyt', 'biatch', 'azz',
  
  // Common leetspeak that's missed
  'sh1t', 'fck', 'a55', 'a55hole', 'b1tch', 'sh*t', 'f*ck', 'a$$hole'
];

// Regular expressions for common offensive patterns (catch variations and leetspeak)
const OFFENSIVE_PATTERNS = [
  // Fixed regex patterns - removed global flag to avoid test() issues
  /\bf[\*\@\#\$\%\^]?u?c?k+/i,  // f*ck, f@ck, fu*k, fuck, fck
  /\bs[\*\@\#\$\%\^]?h?i?t+/i,  // s*it, sh*t, s@it, shit, sht
  /\ba[\*\@\#\$\%\^]?s+s?[\*\@\#\$\%\^s]?h?o?l?e?/i,  // a$$hole, a*s, a@s, ass, asshole
  /\bb[\*\@\#\$\%\^i1]?t?c?h+/i,  // b*tch, b1tch, bitch, btch
  /\bd[\*\@\#\$\%\^]?a?m+n?/i,   // d*mn, d@mn, damn, dmn
  
  // Compound profanity  
  /motherfuck/i,
  /mother[\s\*\-\_]*fuck/i,
  /bullshit/i,
  /bull[\s\*\-\_]*shit/i,
  /dumbass/i,
  /dumb[\s\*\-\_]*ass/i,
  /shithead/i,
  /shit[\s\*\-\_]*head/i,
  /fuckface/i,
  /fuck[\s\*\-\_]*face/i,
  
  // Spacing variations
  /ass[\s\*\-\_]*hole/i,
  /mother[\s\*\-\_]*fucker/i,
  
  // Sexual content
  /send nudes/i,
  /show me your/i,
  
  // Violence and threats
  /(kill|beat|destroy|murder) you/i,
  /go (die|kill yourself)/i,
  /you should (die|kill yourself)/i,
  /(eat|beat|kick) your ass/i,
  /i will (kill|beat|destroy|murder)/i,
  
  // Creative spelling
  /phuck/i,
  /shiit/i,
  /biatch/i,
  /azz/i
];

/**
 * Calls the ML hate speech detection service
 * @param {string} message - The message to analyze
 * @returns {Promise<boolean>} - True if hate speech is detected by ML, false otherwise
 */
async function detectHateSpeechML(message) {
  try {
    // Use require for node-fetch v2 compatibility
    const fetch = require('node-fetch');
    
    const response = await fetch('http://localhost:5001/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: message }),
      timeout: 3000 // 3 second timeout to maintain real-time performance
    });

    if (response.ok) {
      const result = await response.json();
      return result.hate === true;
    } else {
      console.warn('ML service returned error:', response.status);
      return false; // Fail safe - don't censor if ML service is down
    }
  } catch (error) {
    console.warn('ML hate detection service unavailable:', error.message);
    return false; // Fail safe - don't censor if ML service is down
  }
}

/**
 * Detects if a message contains hate speech or offensive content using keyword detection
 * @param {string} message - The message to analyze
 * @returns {boolean} - True if hate speech is detected, false otherwise
 */
function detectHateSpeechKeywords(message) {
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
 * Enhanced hate speech detection using both keyword and ML detection
 * @param {string} message - The message to analyze
 * @returns {Promise<{isHate: boolean, detectionMethod: string}>} - Detection result and method used
 */
async function detectHateSpeech(message) {
  if (!message || typeof message !== 'string') {
    return { isHate: false, detectionMethod: 'none' };
  }

  // First, check with keyword detection (fast)
  const keywordDetection = detectHateSpeechKeywords(message);
  
  if (keywordDetection) {
    return { isHate: true, detectionMethod: 'keywords' };
  }

  // If keyword detection doesn't find hate, check with ML service
  const mlDetection = await detectHateSpeechML(message);
  
  if (mlDetection) {
    return { isHate: true, detectionMethod: 'ml' };
  }

  return { isHate: false, detectionMethod: 'clean' };
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
  detectHateSpeechKeywords,
  detectHateSpeechML,
  censorMessage
};