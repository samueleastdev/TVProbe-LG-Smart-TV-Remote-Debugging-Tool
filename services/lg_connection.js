// https://github.com/hobbyquaker/lgtv2/issues/20
const { LG } = require('../utils/config')

const lgtv = require('lgtv2')({
    url: `ws://${LG.IP}:3000`,
})

let pointerSocket = null

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
        }
    )
})

lgtv.on('error', (err) => console.error('LGTV error:', err))

function getPointerSocket() {
    return pointerSocket
}

module.exports = { lgtv, getPointerSocket }
