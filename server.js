const express = require('express');
const bodyParser = require('body-parser');
const voucher_codes = require('voucher-code-generator');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from 'public' folder

// JSON file for persistent storage
const CODES_FILE = path.join(__dirname, 'generated_codes.json');

/**
 * Load codes from JSON file.
 */
function loadCodesFromFile() {
  if (fs.existsSync(CODES_FILE)) {
    try {
      const data = fs.readFileSync(CODES_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading codes file:', error.message);
      return [];
    }
  }
  return [];
}

/**
 * Save codes to JSON file.
 */
function saveCodeToFile(code, type) {
  try {
    let codes = loadCodesFromFile();
    
    // Check for duplicates
    if (codes.some(c => c.code === code)) {
      return { success: false, message: 'Duplicate code rejected', isDuplicate: true };
    }

    const codeEntry = {
      code: code,
      type: type,
      generatedAt: new Date().toISOString(),
      id: codes.length + 1
    };

    codes.push(codeEntry);
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2), 'utf8');
    return { success: true, message: 'Code saved', codeEntry };
  } catch (error) {
    console.error('Error saving code:', error.message);
    return { success: false, message: 'Error saving code: ' + error.message };
  }
}

/**
 * Get all codes from JSON file.
 */
function getAllCodes() {
  return loadCodesFromFile();
}

/**
 * Check if a code already exists.
 */
function codeExists(code) {
  const codes = loadCodesFromFile();
  return codes.some(c => c.code === code);
}

// In-memory set for faster duplicate checks during current session
let generatedCodesSet = new Set(getAllCodes().map(c => c.code));

/**
 * POST /api/generate
 * Generates a new code (7 chars)
 * 
 * Body:
 *   - type: "alphabetic" (A-Z only) or "alphanumeric" (A-Z + 0-9)
 * 
 * Response:
 *   - code: the generated code (7 chars, uppercase)
 *   - type: the type requested
 *   - totalGenerated: count of codes generated so far
 */
app.post('/api/generate', (req, res) => {
  const { type } = req.body;

  if (!type || (type !== 'alphabetic' && type !== 'alphanumeric')) {
    return res.status(400).json({
      error: 'Invalid type. Must be "alphabetic" or "alphanumeric".'
    });
  }

  // Generate code without storage - infinite generation enabled
  const charset = type === 'alphabetic'
    ? voucher_codes.charset('alphabetic')
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // uppercase alphanumeric

  const generated = voucher_codes.generate({
    length: 7,
    count: 1,
    charset: charset
  });

  const code = generated[0].toUpperCase(); // Ensure uppercase

  res.json({
    code: code,
    type: type,
    totalGenerated: generatedCodesSet.size,
    message: 'Storage disabled - codes are not persisted'
  });
});

/**
 * GET /api/codes
 * Returns the list of all generated codes.
 */
app.get('/api/codes', (req, res) => {
  const codes = getAllCodes();
  res.json({
    codes: codes.map(c => ({ code: c.code, type: c.type })),
    total: codes.length
  });
});

/**
 * POST /api/reset
 * Clears all generated codes (for testing).
 */
app.post('/api/reset', (req, res) => {
  try {
    fs.unlinkSync(CODES_FILE);
    generatedCodesSet.clear();
    res.json({ message: 'All codes cleared.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset codes: ' + error.message });
  }
});

/**
 * GET /api/codes/details
 * Returns detailed code information (with timestamps and IDs).
 */
app.get('/api/codes/details', (req, res) => {
  const codes = getAllCodes();
  res.json(codes);
});

/**
 * GET /api/stats
 * Returns statistics about generated codes.
 */
app.get('/api/stats', (req, res) => {
  const codes = getAllCodes();
  const alphabetic = codes.filter(c => c.type === 'alphabetic').length;
  const alphanumeric = codes.filter(c => c.type === 'alphanumeric').length;

  res.json({
    totalCodes: codes.length,
    alphabetic: alphabetic,
    alphanumeric: alphanumeric,
    firstGenerated: codes.length > 0 ? codes[0].generatedAt : null,
    lastGenerated: codes.length > 0 ? codes[codes.length - 1].generatedAt : null
  });
});

/**
 * GET /
 * Serves the frontend HTML.
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/generate     - generate a new code');
  console.log('  GET  /api/codes        - list all generated codes');
  console.log('  GET  /api/codes/details - detailed code info (with timestamps)');
  console.log('  GET  /api/stats        - statistics about generated codes');
  console.log('  POST /api/reset        - clear all codes (testing)');
  console.log(`\nCodes stored in: ${CODES_FILE}`);
});
