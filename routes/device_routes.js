const express = require('express')
const router = express.Router()
const { checkConnection } = require('../services/ssh_service')
const { NETWORK } = require('../utils/config')

router.get('/connected', checkConnection)
router.get('/config', (req, res) => {
    res.json({
        cameraUrl: `http://${NETWORK.ZEROTIER_IP}:8889/cam/`,
    })
})

module.exports = router
