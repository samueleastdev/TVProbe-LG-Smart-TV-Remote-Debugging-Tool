const { runSSHCommandWithInput, delay } = require('./ssh_service.js')
const { getPointerSocket, lgtv } = require('./lg_connection.js')
const { broadcastLog } = require('./websocket_service.js')
const { sendButton } = require('../utils/helpers')
const fs = require('fs').promises
const path = require('path')

const { LG } = require('../utils/config')
let passphrase = null

async function runDevApp(req, res) {
    const passphraseInput = req.body.passphrase
    if (!passphraseInput) {
        return res.status(400).json({ error: 'Passphrase is required' })
    }

    passphrase = passphraseInput

    try {
        const sock = getPointerSocket()
        if (!sock) {
            console.error('Pointer socket not ready')
            return false
        }

        broadcastLogs('🔧 Starting open debugger please wait a few seconds...')

        lgtv.request('ssap://system.launcher/launch', { id: LG.DEV_APP_ID })

        await delay(6000)

        await sendButton(sock, 'UP')
        await sendButton(sock, 'UP')
        await sendButton(sock, 'UP')
        await sendButton(sock, 'UP')
        await sendButton(sock, 'DOWN', 1000)
        await sendButton(sock, 'ENTER', 2000)

        broadcastLogs('🔑 Turn on key server...')
        await runSSHCommandWithInput(`ares-setup-device --reset`)
        broadcastLogs(`📡 Adding webOS TV device ${LG.IP}...`)

        await runSSHCommandWithInput(
            `ares-setup-device --add ${LG.DEVICE_NAME} --info "{'host':'${LG.IP}', 'port':'6633', 'username':'prisoner', 'privatekey':'ssh', 'default':true}"`
        )

        broadcastLogs('🔑 Retrieving SSH key from webOS TV...')

        await runSSHCommandWithInput(
            `ares-novacom --device ${LG.DEVICE_NAME} --getkey`,
            passphrase
        )

        broadcastLogs(`📦 Installing the app ${LG.APP_FILE}...`)

        await runSSHCommandWithInput(
            `ares-install --device ${LG.DEVICE_NAME} '${path.resolve(
                __dirname,
                `../tvapp/${LG.APP_FILE}`
            )}'`
        )

        broadcastLogs('🔍 Starting app inspection...')

        await delay(2000)

        broadcastLogs(
            '✅ Finished to debug copy and paste this url into Chromium...'
        )

        await runSSHCommandWithInput(
            `ares-inspect --device ${LG.DEVICE_NAME} '${LG.APP_ID}'`
        )
        res.status(200).json({
            message: 'Passphrase saved and command executed successfully',
        })
    } catch (error) {
        console.error(`Error executing command: ${error.message}`)
        res.status(500).json({
            error: `Failed to execute command: ${error.message}`,
        })
    }
}

function broadcastLogs(text) {
    broadcastLog(text)
    lgtv.request('ssap://system.notifications/createToast', {
        message: text,
    })
}

async function updateIndexHtml(newUrl) {
    try {
        const filePath = path.resolve(__dirname, '../tvapp/index.html')
        const newContent = `<!DOCTYPE html>
<html>
    <script>
            location.href = '${newUrl}';
    </script>
</html>`
        console.log('[Debug] newContent', newContent)
        await fs.writeFile(filePath, newContent, 'utf-8')
        console.log('[Success] Updated index.html successfully.')
    } catch (error) {
        console.error('Error updating index.html:', error)
        throw error
    }
}

async function runInstallApp(req, res) {
    const url = req.body.url
    if (!url) {
        return res.status(400).json({ error: 'Passphrase is required' })
    }

    try {
        broadcastLog('🔧 Updating app index.html...')
        await updateIndexHtml(url)

        const tvAppPath = path.resolve(__dirname, '../tvapp/')
        broadcastLog(`📦 Packaging app in ${tvAppPath}`)

        // Run ares-package inside the tvapp directory
        await runSSHCommandWithInput(`cd ${tvAppPath} && ares-package .`)

        res.status(200).json({
            message: 'App packaged successfully, you can now run it below.',
        })
    } catch (error) {
        console.error(`Error executing command: ${error.message}`)
        res.status(500).json({
            error: `Failed to execute command: ${error.message}`,
        })
    }
}

const openDevApp = async (req, res) => {
    try {
        broadcastLogs('Opening developer mode app on device...')
        lgtv.request('ssap://system.launcher/launch', { id: LG.DEV_APP_ID })
    } catch (error) {
        console.error(`Error executing command: ${error.message}`)
        res.status(500).json({
            error: `Failed to execute command: ${error.message}`,
        })
    }
}

const parseDeviceStats = (output) => {
    const lines = output.split('\n')
    let stats = {
        timestamp: new Date().toISOString(),
        cpu: [],
        memory: {},
    }

    let isCpuSection = false
    let isMemorySection = false

    for (let line of lines) {
        line = line.trim()

        if (line.includes('(%)   overall')) {
            isCpuSection = true
            isMemorySection = false
            continue
        } else if (line.includes('(KB)    total')) {
            isCpuSection = false
            isMemorySection = true
            continue
        }

        if (isCpuSection && line.startsWith('cpu')) {
            const parts = line.split(/\s+/)
            stats.cpu.push({
                id: parts[0],
                overall: parseFloat(parts[1]),
                usermode: parseFloat(parts[2]),
                kernelmode: parseFloat(parts[3]),
                others: parseFloat(parts[4]),
            })
        }

        if (isMemorySection && line.startsWith('memory')) {
            const parts = line.split(/\s+/)
            stats.memory = {
                total: parseInt(parts[1], 10),
                used: parseInt(parts[2], 10),
                free: parseInt(parts[3], 10),
                shared: parseInt(parts[4], 10),
                buff_cache: parseInt(parts[5], 10),
                available: parseInt(parts[6], 10),
            }
        }
    }

    return stats
}

const getDeviceStats = async (req, res) => {
    try {
        const output = await runSSHCommandWithInput(
            `ares-device -d ${LG.DEVICE_NAME} -r`
        )
        const parsedData = parseDeviceStats(output)
        res.status(200).json(parsedData)
    } catch (error) {
        console.error(`Error executing command: ${error.message}`)
        res.status(500).json({
            error: `Failed to execute command: ${error.message}`,
        })
    }
}

const getDeviceInfo = async (req, res) => {
    try {
        broadcastLog('Fetching device info...')
        await runSSHCommandWithInput(`ares-device -i -d ${LG.DEVICE_NAME}`)
    } catch (error) {
        console.error(`Error executing command: ${error.message}`)
        res.status(500).json({
            error: `Failed to execute command: ${error.message}`,
        })
    }
}

module.exports = {
    runDevApp,
    runInstallApp,
    openDevApp,
    getDeviceStats,
    getDeviceInfo,
}
