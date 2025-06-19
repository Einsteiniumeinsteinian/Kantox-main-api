const { default: axios } = require("axios");
const { getAuxiliaryServiceVersion } = require("../utils");


async function checkReadiness(req, res){
    try {
        // Check if auxiliary service is reachable
        await axios.get(`${process.env.AUXILIARY_SERVICE_URL}/health`, { timeout: 5000 });
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          versions: {
                  'main-api': process.env.SERVICE_VERSION,
                  'auxiliary-service': await getAuxiliaryServiceVersion()
                },
          service: 'main-api'
        });
      } catch (error) {
        res.status(503).json({
          status: 'not ready',
          error: 'Auxiliary service not available',
          timestamp: new Date().toISOString(),
          versions: {
            'main-api': process.env.SERVICE_VERSION,
            'auxiliary-service': await getAuxiliaryServiceVersion()
          },
          service: 'main-api'
        });
      }
}

module.exports = {checkReadiness}