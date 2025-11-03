const { lgtv, getPointerSocket } = require('./lg_connection')
const { sendButton } = require('../utils/helpers')

async function handleKeyPress(cmd) {
    if (!cmd) {
        console.warn('No command provided')
        return false
    }

    if (cmd === 'HOME') {
        lgtv.request(
            'ssap://system.launcher/launch',
            { id: 'com.webos.app.home' },
            (err, res) => {
                if (err) {
                    console.error('Error opening home screen:', err)
                } else {
                    console.log('Home screen opened:', res)
                }
            }
        )
        return true
    }

    /*if (cmd === 'POWER') {
        lgtv.request('ssap://system/turnOff', (err, res) => {
            if (err) {
                console.error('Error powering off TV:', err)
            } else {
                console.log('Power off command sent:', res)
            }
        })
        return true
    }*/

    const sock = getPointerSocket()
    if (!sock) {
        console.error('[LG] Pointer socket not ready')
        return false
    }

    try {
        await sendButton(sock, cmd)
        return true
    } catch (err) {
        console.error(`[LG] Failed to send command ${cmd}:`, err)
        return false
    }
}

module.exports = { handleKeyPress }
