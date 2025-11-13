// https://github.com/hobbyquaker/lgtv2/issues/20
const wol = require('wake_on_lan')
const LGTV = require('lgtv2')
const { LG } = require('../utils/config')

let lgtv
let pointerSocket = null

function connectToTV() {
    lgtv = LGTV({
        url: `ws://${LG.IP}:3000`,
    })

    lgtv.on('connect', () => {
        console.log('Connected to LG TV')

        lgtv.getSocket(
            'ssap://com.webos.service.networkinput/getPointerInputSocket',
            (err, sock) => {
                if (err) {
                    console.error('Failed to get pointer socket:', err)
                    return
                }
                pointerSocket = sock
                console.log('Pointer socket ready')
            },
        )
    })

    lgtv.on('error', err => {
        console.error('LGTV error:', err.message || err)
        wol.wake(LG.MAC_ADDRESS, error => {
            if (error) {
                console.error('Failed to send WoL packet:', error)
                return
            }

            setTimeout(() => {
                console.log('Retrying connection...')
                connectToTV()
            }, 10000)
        })
    })
}

function getPointerSocket() {
    return pointerSocket
}

connectToTV()

module.exports = { lgtv, getPointerSocket }
