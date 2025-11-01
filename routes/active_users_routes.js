const express = require('express')
const router = express.Router()
const { getActiveUsers } = require('../services/active_users_service')

router.get('/active', getActiveUsers)

module.exports = router
