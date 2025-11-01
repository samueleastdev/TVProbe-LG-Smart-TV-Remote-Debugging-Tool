const { getPointerSocket } = require('./lg_connection')
const { sendButton } = require('../utils/helpers')

async function handleKeyPress(cmd) {
    if (!cmd) {
        console.warn('No command provided')
        return false
    }

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
