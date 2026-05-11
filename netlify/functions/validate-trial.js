// netlify/functions/validate-trial.js
// Trial token generation and validation for token-chart.html

const crypto = require('crypto');

// Extended trial emails (60 days instead of 14)
const EXTENDED_TRIAL_EMAILS = ['mwtfinance@bellsouth.net'];

// Secret for signing tokens (use a strong, random value in production)
// In Netlify, this should be an environment variable
const SECRET = process.env.TRIAL_TOKEN_SECRET || 'your-secret-key-change-in-production';

const STANDARD_TRIAL_DAYS = 14;
const EXTENDED_TRIAL_DAYS = 60;

/**
 * Generate a signed trial token
 * Token format: base64(email|expiryTime|signature)
 */
function generateToken(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const isExtended = EXTENDED_TRIAL_EMAILS.includes(normalizedEmail);
  const trialDays = isExtended ? EXTENDED_TRIAL_DAYS : STANDARD_TRIAL_DAYS;
  
  // Calculate expiry timestamp (milliseconds)
  const expiryTime = Date.now() + (trialDays * 24 * 60 * 60 * 1000);
  
  // Create signature to prevent tampering
  const data = `${normalizedEmail}|${expiryTime}`;
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(data)
    .digest('hex');
  
  const token = `${data}|${signature}`;
  const encodedToken = Buffer.from(token).toString('base64');
  
  return {
    token: encodedToken,
    expiryTime,
    daysGranted: trialDays,
    isExtended
  };
}

/**
 * Validate a trial token
 * Returns: { valid: boolean, email: string, expiryTime: number, daysRemaining: number }
 */
function validateToken(encodedToken) {
  try {
    const token = Buffer.from(encodedToken, 'base64').toString('utf-8');
    const parts = token.split('|');
    
    if (parts.length !== 3) return { valid: false, reason: 'Invalid token format' };
    
    const [email, expiryTimeStr, signature] = parts;
    const expiryTime = parseInt(expiryTimeStr, 10);
    
    // Verify signature
    const data = `${email}|${expiryTime}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(data)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return { valid: false, reason: 'Invalid signature' };
    }
    
    // Check expiry
    const now = Date.now();
    if (now > expiryTime) {
      return { valid: false, reason: 'Trial expired', email, expiryTime };
    }
    
    const daysRemaining = Math.ceil((expiryTime - now) / (24 * 60 * 60 * 1000));
    
    return {
      valid: true,
      email,
      expiryTime,
      daysRemaining
    };
  } catch (err) {
    return { valid: false, reason: 'Token validation error: ' + err.message };
  }
}

/**
 * Netlify Function Handler
 */
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { action, email, token } = body;

    // Action: Generate a new trial token
    if (action === 'generate') {
      if (!email || typeof email !== 'string') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Email is required' })
        };
      }

      const result = generateToken(email);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      };
    }

    // Action: Validate an existing token
    if (action === 'validate') {
      if (!token || typeof token !== 'string') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Token is required' })
        };
      }

      const result = validateToken(token);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid action. Use "generate" or "validate"' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error: ' + err.message })
    };
  }
};
