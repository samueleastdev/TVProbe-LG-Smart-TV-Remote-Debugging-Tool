require('dotenv').config()

function requireEnv(key) {
    const value = process.env[key]
    if (!value) {
        console.error(`[Config Error] Missing required environment variable: ${key}`)
        process.exit(1)
    }
    return value
}

const LG = {
    IP: requireEnv('LG_IP'),
    MAC_ADDRESS: requireEnv('MAC_ADDRESS'),
    APP_FILE: process.env.LG_APP_FILE || 'remote-dev_1.0.0_all.ipk',
    APP_ID: process.env.LG_APP_ID || 'remote-dev',
    DEVICE_NAME: process.env.LG_DEVICE_NAME || 'tvapp',
    DEV_APP_ID: process.env.LG_DEV_APP_ID || 'com.palmdts.devmode',
}

const NETWORK = {
    ZEROTIER_IP: requireEnv('ZEROTIER_IP'),
}

module.exports = { LG, NETWORK }
