const { runSSHCommandWithInput, getAppId, delay } = require('./ssh_service.js')
const { getPointerSocket, lgtv } = require('./lg_connection.js')
const { broadcastLog } = require('./websocket_service.js')
const { sendButton } = require('../utils/helpers')
const fs = require('fs').promises
const path = require('path')
const sharp = require('sharp')

const { LG } = require('../utils/config')
let passphrase = null

async function launchDevApp(req, res) {
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

        /*await sendButton(sock, 'UP')
        await sendButton(sock, 'UP')
        await sendButton(sock, 'UP')
        await sendButton(sock, 'UP')
        await sendButton(sock, 'DOWN', 1000)
        await sendButton(sock, 'ENTER', 2000)*/

        broadcastLogs('🔑 Turn on key server...')
        await runSSHCommandWithInput(`ares-setup-device --reset`)
        broadcastLogs(`📡 Adding webOS TV device ${LG.IP}...`)

        await runSSHCommandWithInput(
            `ares-setup-device --add ${LG.DEVICE_NAME} --info "{'host':'${LG.IP}', 'port':'6633', 'username':'prisoner', 'privatekey':'ssh', 'default':true}"`,
        )

        broadcastLogs('🔑 Retrieving SSH key from webOS TV...')

        await runSSHCommandWithInput(`ares-novacom --device ${LG.DEVICE_NAME} --getkey`, passphrase)

        broadcastLogs(`📦 Installing the app ${LG.APP_FILE}...`)

        await runSSHCommandWithInput(
            `ares-install --device ${LG.DEVICE_NAME} '${path.resolve(
                __dirname,
                `../tvapp/${LG.APP_FILE}`,
            )}'`,
        )

        broadcastLogs('🔍 Starting app inspection...')

        await delay(2000)

        broadcastLogs('✅ Finished to debug copy and paste this url into Chromium...')

        await runSSHCommandWithInput(`ares-inspect --device ${LG.DEVICE_NAME} '${LG.APP_ID}'`)
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

async function updateIndexHtml(newUrl, newAppId = null) {
    try {
        const htmlPath = path.resolve(__dirname, '../tvapp/index.html')
        const htmlContent = `<!DOCTYPE html>
<html>
    <script>
        location.href = '${newUrl}';
    </script>
</html>`

        await fs.writeFile(htmlPath, htmlContent, 'utf-8')
        const appInfoPath = path.resolve(__dirname, '../tvapp/appinfo.json')
        const appInfoRaw = await fs.readFile(appInfoPath, 'utf-8')
        const appInfo = JSON.parse(appInfoRaw)

        if (!newAppId) {
            try {
                const urlObj = new URL(newUrl)
                const hostName = urlObj.hostname.replace(/\./g, '-')
                newAppId = `${hostName}-app`
            } catch {
                newAppId = `remote-dev-${Date.now()}`
            }
        }

        appInfo.id = newAppId
        appInfo.title = newAppId

        await fs.writeFile(appInfoPath, JSON.stringify(appInfo, null, 2), 'utf-8')

        updateLargeIconWithText(newAppId)
    } catch (error) {
        console.error('❌ Error updating files:', error)
        throw error
    }
}

async function updateLargeIconWithText(newAppId) {
    const defaultIconPath = path.resolve(__dirname, '../tvapp/defaultIcon.png')
    const largeIconPath = path.resolve(__dirname, '../tvapp/largeIcon.png')
    const tempPath = largeIconPath.replace('.png', '_temp.png')

    try {
        const image = sharp(defaultIconPath)
        const metadata = await image.metadata()

        const svgOverlay = Buffer.from(
            `<svg width="${metadata.width}" height="${
                metadata.height
            }" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.4)" />
                <text x="50%" y="55%" font-size="100" text-anchor="middle" fill="white" font-family="Arial Black, Arial, sans-serif">
                <tspan textLength="${
                    metadata.width * 0.95
                }" lengthAdjust="spacingAndGlyphs">${newAppId}</tspan>
                </text>
            </svg>`,
        )

        await image.composite([{ input: svgOverlay }]).toFile(tempPath)

        await fs.rename(tempPath, largeIconPath)

        console.log(`[Success] Created largeIcon.png with ID text: ${newAppId}`)
    } catch (err) {
        console.warn('Could not update largeIcon.png:', err.message)
        try {
            await fs.unlink(tempPath)
        } catch {}
    }
}

async function createDebugBuild(req, res) {
    const url = req.body.url
    if (!url) {
        return res.status(400).json({ error: 'Passphrase is required' })
    }

    const name = req.body.name
    if (!name) {
        return res.status(400).json({ error: 'Name is required' })
    }

    try {
        broadcastLog('🔧 Updating app index.html...')
        await updateIndexHtml(url, name)

        const tvAppPath = path.resolve(__dirname, '../tvapp/')
        broadcastLog(`📦 Packaging app in ${tvAppPath}`)

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

async function installAppOnDevice(req, res) {
    const filePath = req.body.filePath
    if (!filePath) {
        return res.status(400).json({ error: 'File path is required' })
    }

    try {
        broadcastLog(`📦 Packaging app in ${filePath}`)

        await runSSHCommandWithInput(`ares-install --device ${LG.DEVICE_NAME} '${filePath}'`)

        const id = await getAppId(filePath)

        await runSSHCommandWithInput(`ares-inspect --device ${LG.DEVICE_NAME} '${id}'`)

        res.status(200).json({
            message: `App packaged successfully, you can now run it below. ${id}`,
        })
    } catch (error) {
        console.error(`Error executing command: ${error.message}`)
        res.status(500).json({
            error: `Failed to execute command: ${error.message}`,
        })
    }
}

const openDeveloperApp = async (req, res) => {
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

const fetchDeviceInfo = async (req, res) => {
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

const listAvailableIpks = async (req, res) => {
    try {
        const ipksFolder = path.resolve(__dirname, '../tvapp')
        const files = await fs.readdir(ipksFolder)

        const ipkFiles = files
            .filter(file => file.endsWith('.ipk'))
            .map(file => ({
                name: file,
                path: path.join(ipksFolder, file),
            }))

        if (ipkFiles.length === 0) {
            return res.status(404).json({ message: 'No .ipk files found in /ipks folder.' })
        }

        res.status(200).json({
            count: ipkFiles.length,
            files: ipkFiles,
        })
    } catch (error) {
        console.error(`Error reading ipk folder: ${error.message}`)
        res.status(500).json({
            error: `Failed to read ipk folder: ${error.message}`,
        })
    }
}

module.exports = {
    launchDevApp,
    createDebugBuild,
    installAppOnDevice,
    openDeveloperApp,
    listAvailableIpks,
    fetchDeviceInfo,
}
