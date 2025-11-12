const express = require('express')
const router = express.Router()
const {
    launchDevApp,
    createDebugBuild,
    installAppOnDevice,
    openDeveloperApp,
    listAvailableIpks,
    fetchDeviceInfo,
} = require('../services/lg_service')
const { stopProcess } = require('../services/ssh_service')

router.get('/get_ipks', listAvailableIpks)
router.post('/run_dev_app', launchDevApp)
router.post('/run_install_app', installAppOnDevice)
router.post('/run_create_debug_app', createDebugBuild)
router.post('/open_dev_app', openDeveloperApp)
router.post('/get_device_info', fetchDeviceInfo)
router.post('/stop_process', stopProcess)

module.exports = router
