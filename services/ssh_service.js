const { exec } = require('child_process')
const { spawn } = require('child_process')
const { broadcastLog } = require('./websocket_service')
const { NETWORK } = require('../utils/config')

let latestDebugUrl = null
let runningProcess = null

const checkConnection = (req, res) => {
    exec("echo 'Connection successful'", (error, stdout, stderr) => {
        if (error) {
            console.error(`Command execution error: ${stderr}`)
            return res.status(500).json({ connected: false, error: stderr })
        }
        console.log(`Command execution successful: ${stdout}`)
        res.json({ connected: true, message: `System ready` })
    })
}

const sendCommandDevice = (command, res) => {
    const bashCommand = `bash -c "${command}"`
    exec(bashCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error}`)
            res.status(500).json({ error: stderr })
        } else {
            console.log('stdout:', stdout)
            res.json({ message: stdout.trim() })
        }
    })
}

const getAppId = async (ipkPath, input = null) => {
    return new Promise((resolve, reject) => {
        if (runningProcess) {
            console.log('⚠️ Another process is already running. Stop it first!')
            runningProcess.kill('SIGTERM')
            runningProcess = null
        }

        const cmd = `
            path=$(ar p "${ipkPath}" data.tar.gz | tar -tzf - | grep appinfo.json) &&
            ar p "${ipkPath}" data.tar.gz | tar -xzOf - "$path" | grep '"id"' | cut -d '"' -f4
        `

        runningProcess = exec(cmd, (error, stdout, stderr) => {
            runningProcess = null

            if (error) {
                console.error(`❌ Error extracting app ID: ${stderr || error.message}`)
                return reject(new Error('Failed to extract app ID'))
            }

            const appId = stdout.trim()

            if (!appId) {
                console.warn('⚠️ No app ID found in appinfo.json')
                return reject(new Error('No app ID found'))
            }

            console.log(`✅ Extracted app ID: ${appId}`)
            resolve(appId)
        })

        if (input) {
            runningProcess.stdin.write(input)
            runningProcess.stdin.end()
        }
    })
}

const runSSHCommandWithInput = async (command, input = null) => {
    return new Promise((resolve, reject) => {
        if (runningProcess) {
            console.log('⚠️ Another process is already running. Stop it first!')
            runningProcess.kill('SIGTERM')
            runningProcess = null
        }
        console.log('[Debug] command', command)
        runningProcess = spawn('bash', ['-c', command], {
            stdio: ['pipe', 'pipe', 'pipe'],
        })

        let output = ''

        runningProcess.stdout.on('data', data => {
            let message = data.toString()
            output += message
            console.log(output)

            if (message.includes('modelName')) {
                const lines = output.split('\n')
                let modelName = ''
                let updatedOutput = output

                lines.forEach(line => {
                    if (line.includes('modelName')) {
                        modelName = line.split(':')[1].trim()
                    }
                })

                let year = 'Unknown'
                if (/M/.test(modelName)) year = '2019'
                else if (/K/.test(modelName)) year = '2018'
                else if (/J/.test(modelName)) year = '2017'
                else if (/H/.test(modelName)) year = '2016'
                else if (/G/.test(modelName)) year = '2015'
                else if (/F/.test(modelName)) year = '2014'
                updatedOutput += `year: ${year}`
                broadcastLog(updatedOutput, 'persist')
            }

            if (message.includes('localhost')) {
                message = message.replace(/localhost/g, NETWORK.ZEROTIER_IP)
                const urlMatch = message.match(
                    /http:\/\/[a-zA-Z0-9.-]+:\d+\/devtools\/inspector\.html\?ws=[^ ]+/,
                )
                if (urlMatch) {
                    latestDebugUrl = urlMatch[0].trim()
                    broadcastLog('✅ Copy & open debug URL in Chromium on your computer')
                    broadcastLog(latestDebugUrl, 'url')
                }
            }

            if (input && message.toLowerCase().includes('input passphrase')) {
                message = '🔑 Sending passphrase...'
                broadcastLog(message)

                if (runningProcess && runningProcess.stdin) {
                    try {
                        runningProcess.stdin.write(`${input}\n`)
                    } catch (err) {
                        console.error('[SSH Service] Failed to write passphrase:', err)
                    }
                } else {
                    console.warn('[SSH Service] Cannot send passphrase, process not running.')
                }
            }
        })

        runningProcess.stderr.on('data', data => {
            const error = data.toString().trim()
            console.error(error)
            broadcastLog(`Error: ${error}`)
        })

        runningProcess.on('close', code => {
            const finalMessage = `Command "${command}" finished with code ${code}`
            console.log(finalMessage)
            runningProcess = null
            latestDebugUrl = null
            resolve(output.trim())
        })

        runningProcess.on('error', error => {
            console.log('[ERROR]', error)
            runningProcess = null
            latestDebugUrl = null
            reject(error)
        })
    })
}

const stopProcess = (req, res) => {
    if (runningProcess) {
        broadcastLog('⛔ Stopped the running process...', 'status')
        runningProcess.kill('SIGTERM')
        runningProcess = null
        res.status(200).json({ message: 'Process stopped successfully' })
    } else {
        res.status(400).json({ error: 'No running process to stop' })
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
    checkConnection,
    sendCommandDevice,
    runSSHCommandWithInput,
    getAppId,
    stopProcess,
    broadcastLog,
    delay,
}
