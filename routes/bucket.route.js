const express = require('express')
const { listBuckets } = require('../controllers/bucket.controller')
const router = express.Router()

router.get('/', listBuckets)

module.exports = router