const { getAuxiliaryServiceVersion, callAuxiliaryService } = require("../utils");

async function listParameters(req, res){
    try {
        const auxiliaryVersion = await getAuxiliaryServiceVersion();
        const parameters = await callAuxiliaryService('/aws/parameters/list');
       
        res.json({
          success: true,
          data: parameters,
          versions: {
            'main-api': process.env.SERVICE_VERSION,
            'auxiliary-service': auxiliaryVersion
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          versions: {
            'main-api': process.env.SERVICE_VERSION,
            'auxiliary-service': await getAuxiliaryServiceVersion()
          },
          timestamp: new Date().toISOString()
        });
      }
}

async function getParameterValue(req,res){
    try {
        const parameterName = req.query.name;

        const auxiliaryVersion = await getAuxiliaryServiceVersion();
        const parameter = await callAuxiliaryService(`/aws/parameters?name=${parameterName}`);
        
       
        res.json({
          success: true,
          data: parameter,
          versions: {
            'main-api': process.env.SERVICE_VERSION,
            'auxiliary-service': auxiliaryVersion
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: error.message,
          versions: {
            'main-api': process.env.SERVICE_VERSION,
            'auxiliary-service': await getAuxiliaryServiceVersion()
          },
          timestamp: new Date().toISOString()
        });
      }
}

module.exports = {listParameters, getParameterValue}