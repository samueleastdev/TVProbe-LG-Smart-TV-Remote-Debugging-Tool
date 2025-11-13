const { lgtv, getPointerSocket } = require('./lg_connection')
const { sendButton } = require('../utils/helpers')
const wol = require('wake_on_lan')
const ping = require('ping')
const { LG } = require('../utils/config')

async function handleKeyPress(cmd) {
    if (!cmd) {
        console.warn('No command provided')
        return false
    }

    if (cmd === 'HOME') {
        lgtv.request('ssap://system.launcher/launch', { id: 'com.webos.app.home' }, (err, res) => {
            if (err) {
                console.error('Error opening home screen:', err)
            } else {
                console.log('Home screen opened:', res)
            }
        })
        return true
    }

    if (cmd === 'POWER') {
        isTVOn().then(on => {
            if (on) {
                lgtv.request('ssap://system/turnOff', (err, res) => {
                    if (err) {
                        console.error('Error powering off TV:', LG.MAC_ADDRESS)
                        wol.wake(LG.MAC_ADDRESS, function (error) {
                            if (error) {
                                console.error('Failed to send WoL packet:', error)
                            } else {
                                console.log(
                                    'Wake-on-LAN packet sent successfully to',
                                    LG.MAC_ADDRESS,
                                )
                            }
                        })
                    } else {
                        console.log('Power off command sent:', res)
                    }
                })
            } else {
                wol.wake(LG.MAC_ADDRESS, function (error) {
                    if (error) {
                        console.error('Failed to send WoL packet:', error)
                    } else {
                        console.log('Wake-on-LAN packet sent successfully to', LG.MAC_ADDRESS)
                    }
                })
            }
        })
        return true
    }

    const sock = getPointerSocket()
    if (!sock) {
        console.error('[LG] Pointer socket not ready')
        wol.wake(LG.MAC_ADDRESS, error => {
            if (error) {
                console.error('Failed to send WoL packet:', error)
                return
            }
        })
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

async function isTVOn() {
    try {
        const res = await ping.promise.probe(LG.IP, { timeout: 2 })
        return res.alive
    } catch {
        return false
    }
}

module.exports = { handleKeyPress }
