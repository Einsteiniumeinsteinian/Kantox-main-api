const express = require('express')
const { getParameterValue, listParameters } = require('../controllers/parameter.controller')
const router = express.Router({ mergeParams: true })

router.get('/', getParameterValue)
router.get('/list', listParameters)

module.exports = router
