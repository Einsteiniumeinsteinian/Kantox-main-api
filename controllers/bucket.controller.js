const { getAuxiliaryServiceVersion, callAuxiliaryService } = require("../utils");


async function listBuckets(req, res){
try {
    const auxiliaryVersion = await getAuxiliaryServiceVersion();
    const buckets = await callAuxiliaryService('/aws/s3/buckets');
   
    res.json({
      success: true,
      data: buckets,
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

module.exports = {listBuckets}