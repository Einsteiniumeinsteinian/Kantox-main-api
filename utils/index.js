const { default: axios } = require("axios");
const AUXILIARY_SERVICE_URL = process.env.AUXILIARY_SERVICE_URL || 'http://localhost:3001'

// Utility function to call auxiliary service
async function callAuxiliaryService(endpoint) {
  try {
    const response = await axios.get(`${AUXILIARY_SERVICE_URL}${endpoint}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'main-api/1.0.0',
        'X-Request-ID': generateRequestId()
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error calling auxiliary service ${endpoint}:`, error.message);
    throw new Error(`Auxiliary service error: ${error.message}`);
  }
}

// Utility function to generate request ID
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Utility function to get auxiliary service version
async function getAuxiliaryServiceVersion() {
  try {
    const response = await callAuxiliaryService('/version');
    return response.version || 'unknown';
  } catch (error) {
    console.error('Failed to get auxiliary service version:', error.message);
    return 'unknown';
  }
}

module.exports = {callAuxiliaryService, getAuxiliaryServiceVersion}