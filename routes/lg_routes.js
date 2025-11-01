const express = require('express')
const router = express.Router()
const {
    runDevApp,
    runInstallApp,
    openDevApp,
    getDeviceStats,
    getDeviceInfo,
} = require('../services/lg_service')
const { stopProcess } = require('../services/ssh_service')

router.get('/get_device_stats', getDeviceStats)
router.post('/run_dev_app', runDevApp)
router.post('/run_install_app', runInstallApp)
router.post('/open_dev_app', openDevApp)
router.post('/get_device_info', getDeviceInfo)
router.post('/stop_process', stopProcess)

module.exports = router
