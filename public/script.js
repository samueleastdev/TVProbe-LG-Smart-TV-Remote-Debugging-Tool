const ws = new WebSocket(`ws://${window.location.hostname}:3001`)

const passphraseInput = document.getElementById('passphrase')
const copyDebugUrlBtn = document.getElementById('copyDebugUrlBtn')
const debugUrlText = document.getElementById('debugUrlText')
const logContainer = document.getElementById('output')
const connectionStatus = document.getElementById('connectionStatus')
const videoIframe = document.getElementById('videoIframe')

const submitDeviceInfo = document.getElementById('submitDeviceInfo')
const openDevApp = document.getElementById('openDevApp')
const stopProcess = document.getElementById('stopProcess')
const submitPassphrase = document.getElementById('submitPassphrase')

const settingsModal = document.getElementById('settingsModal')
const openSettingsBtn = document.getElementById('openSettingsBtn')
const closeSettingsBtn = document.getElementById('closeSettingsBtn')

const remoteContainer = document.getElementById('remoteContainer')
const openRemoteBtn = document.getElementById('openRemoteBtn')

const buildAppModal = document.getElementById('buildAppModal')
const openBuildAppBtn = document.getElementById('openBuildAppBtn')
const closeBuildAppBtn = document.getElementById('closeBuildAppBtn')
const submitBuildApp = document.getElementById('submitBuildApp')

const savedPassphrase = localStorage.getItem('savedPassphrase')
if (savedPassphrase) passphraseInput.value = savedPassphrase

ws.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (data.type === 'url') {
        const logIframe = document.getElementById('logIframe')
        if (logIframe) logIframe.src = data.message

        if (debugUrlText) debugUrlText.textContent = data.message

        const debugUrlAlert = document.getElementById('debugUrlAlert')
        if (debugUrlAlert) {
            debugUrlAlert.innerHTML = `🧩 <b>Debug Mode Active:</b> <a href="${data.message}" target="_blank" class="underline text-white hover:text-yellow-300">${data.message}</a>. Important please use the correct version of <b>Chromium</b> to debug https://webostv.developer.lge.com/develop/getting-started/app-debugging`
            debugUrlAlert.classList.remove('hidden')
        }
    }

    if (logContainer) {
        logContainer.textContent += `${data.message}\n`
        logContainer.scrollTop = logContainer.scrollHeight
    }
}

ws.onerror = () => console.error('WebSocket connection error.')
ws.onclose = () => console.log('WebSocket connection closed.')

async function getIPLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        const locationAlert = document.getElementById('locationAlert')
        locationAlert.innerHTML = `
            🌍 <b>Your VPN/ISP Location:</b> ${data.city}, ${data.region}, ${data.country_name} (${data.country})
            <br> 🔗 <b>IP:</b> ${data.ip} | <b>ISP:</b> ${data.org}
        `
        locationAlert.classList.remove('hidden')
    } catch (error) {
        console.error('Error fetching IP location:', error)
    }
}

function adjustIframeAspectRatio() {
    if (videoIframe) {
        videoIframe.style.height = `${(videoIframe.offsetWidth * 9) / 16}px`
    }
}
window.addEventListener('resize', adjustIframeAspectRatio)

function checkConnection() {
    fetch('/device/connected')
        .then((res) => res.json())
        .then((data) => {
            connectionStatus.textContent = data.connected
                ? data.message
                : 'Failed'
            connectionStatus.className = `ml-4 px-2 py-1 rounded-full text-sm text-white ${
                data.connected ? 'bg-green-500' : 'bg-red-500'
            }`
        })
        .catch(() => {
            connectionStatus.textContent = 'Failed'
            connectionStatus.className =
                'ml-4 px-2 py-1 bg-red-500 text-white rounded-full text-sm'
        })
}

function sendTvCommand(cmd) {
    if (!cmd) return
    fetch(`/keys/down?press=${encodeURIComponent(cmd)}`)
}

document.querySelectorAll('#remoteContainer .btn').forEach((btn) => {
    btn.addEventListener('click', () => sendTvCommand(btn.dataset.cmd))
})

openSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden')
    settingsModal.classList.add('flex')
})

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden')
    settingsModal.classList.remove('flex')
})

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.add('hidden')
        settingsModal.classList.remove('flex')
    }
})

openRemoteBtn.addEventListener('click', () => {
    remoteContainer.classList.toggle('hidden')
})

let isDragging = false
let offsetX, offsetY

remoteContainer.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.btn')) {
        isDragging = true
        offsetX = e.clientX - remoteContainer.offsetLeft
        offsetY = e.clientY - remoteContainer.offsetTop
        remoteContainer.style.cursor = 'grabbing'
    }
})

document.addEventListener('mouseup', () => {
    isDragging = false
    remoteContainer.style.cursor = 'grab'
})

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        remoteContainer.style.left = `${e.clientX - offsetX}px`
        remoteContainer.style.top = `${e.clientY - offsetY}px`
    }
})

openBuildAppBtn.addEventListener('click', () => {
    console.log('Opening Build App Modal')
    buildAppModal.classList.remove('hidden')
    buildAppModal.classList.add('flex')
})

closeBuildAppBtn.addEventListener('click', () => {
    buildAppModal.classList.add('hidden')
    buildAppModal.classList.remove('flex')
})

buildAppModal.addEventListener('click', (e) => {
    if (e.target === buildAppModal) {
        buildAppModal.classList.add('hidden')
        buildAppModal.classList.remove('flex')
    }
})

submitBuildApp.addEventListener('click', async () => {
    let appName = document.getElementById('buildAppName').value.trim()
    const appUrl = document.getElementById('buildAppUrl').value.trim()

    if (!appName || !appUrl) {
        alert('Please enter both App Name and URL')
        return
    }

    appName = appName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')

    if (!appName) {
        alert('App name must contain at least one letter or number')
        return
    }

    let validUrl = true
    try {
        const parsedUrl = new URL(appUrl)
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            validUrl = false
        }
    } catch {
        validUrl = false
    }

    if (!validUrl) {
        alert('Please enter a valid URL starting with http:// or https://')
        return
    }

    submitBuildApp.disabled = true
    submitBuildApp.textContent = 'Building...'

    try {
        const res = await fetch('/lg/run_create_debug_app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: appUrl, name: appName }),
        })

        const result = await res.json()
        if (res.ok) {
            alert(
                `${
                    result.message || 'App built successfully!'
                }\nApp ID: ${appName}`
            )
        } else {
            alert(`Failed: ${result.error}`)
        }
    } catch (err) {
        alert(`Error building app: ${err.message}`)
    } finally {
        submitBuildApp.disabled = false
        submitBuildApp.textContent = 'Submit Build'
        buildAppModal.classList.add('hidden')
        buildAppModal.classList.remove('flex')
    }
})

openDevApp.addEventListener('click', () =>
    fetch('/lg/open_dev_app', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => alert(data.message))
)

stopProcess.addEventListener('click', () =>
    fetch('/lg/stop_process', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => alert(data.message))
)

submitPassphrase.addEventListener('click', () => {
    logContainer.textContent = ''
    const passphrase = passphraseInput.value.trim()
    localStorage.setItem('savedPassphrase', passphrase)
    if (!passphrase) return alert('Please enter a passphrase!')
    fetch('/lg/run_dev_app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
    })
})

submitDeviceInfo.addEventListener('click', () => {
    logContainer.textContent = ''
    fetch('/lg/get_device_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: passphraseInput.value }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.error) alert(`Error: ${data.error}`)
        })
})

const clipboard = new ClipboardJS('#copyDebugUrlBtn')
clipboard.on('success', (e) => {
    copyDebugUrlBtn.textContent = 'Copied!'
    setTimeout(() => (copyDebugUrlBtn.textContent = 'Copy to Clipboard'), 2000)
    e.clearSelection()
})
clipboard.on('error', () => alert('Failed to copy. Please copy manually.'))

async function setupVideoStream() {
    try {
        const res = await fetch('/device/config')
        const data = await res.json()
        if (data.cameraUrl && videoIframe) {
            videoIframe.src = data.cameraUrl
            console.log('Camera stream set to:', data.cameraUrl)
        }
    } catch (err) {
        console.error('Failed to load camera URL:', err)
    }
}

async function getIpks() {
    try {
        const response = await fetch('/lg/get_ipks')
        const data = await response.json()
        console.log('IPK data:', data)

        const container = document.getElementById('ipkList')
        container.innerHTML = ''

        if (!data.files || data.files.length === 0) {
            container.innerHTML = `<p class="text-gray-400">No .ipk files found.</p>`
            return
        }

        data.files.forEach((file) => {
            const card = document.createElement('div')
            card.className = 'ipk-card'

            const name = document.createElement('p')
            name.textContent = file.name

            const installButton = document.createElement('button')
            installButton.textContent = 'Install'
            installButton.addEventListener('click', async () => {
                installButton.disabled = true
                installButton.textContent = 'Running...'

                try {
                    const res = await fetch('/lg/run_install_app', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filePath: file.path }),
                    })
                    const result = await res.json()
                    if (res.ok) {
                        console.log(`Installed: ${file.name}`)
                    } else {
                        alert(`Failed: ${result.error}`)
                    }
                } catch (err) {
                    console.log(`Error installing ${file.name}: ${err.message}`)
                } finally {
                    installButton.disabled = false
                    installButton.textContent = 'Install'
                }
            })

            card.appendChild(name)
            card.appendChild(installButton)
            container.appendChild(card)
        })
    } catch (error) {
        console.error('Error fetching IPK list:', error)
        const container = document.getElementById('ipkList')
        container.innerHTML = `<p class="text-red-400">Error loading IPK list.</p>`
    }
}

window.addEventListener('load', () => {
    adjustIframeAspectRatio()
    checkConnection()
    getIPLocation()
    getIpks()
    setupVideoStream()
})
