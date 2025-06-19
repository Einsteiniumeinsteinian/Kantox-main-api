const express = require('express');
const { checkReadiness } = require('../controllers/health.controller');
const router = express.Router()

router.get('/', (req, res) => res.send('OK'));
router.get('/ready', checkReadiness)

module.exports = router