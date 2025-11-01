const WebSocket = require('ws')

const wss = new WebSocket.Server({ noServer: true })
const wsClients = []

const handleConnection = (ws) => {
    wsClients.push(ws)

    ws.on('close', () => handleDisconnection(ws))
    ws.on('error', (error) => console.error('WebSocket error:', error))
}

const handleDisconnection = (ws) => {
    const index = wsClients.indexOf(ws)
    if (index !== -1) wsClients.splice(index, 1)
}

const broadcastLog = (message, type = 'log') => {
    const payload = JSON.stringify({ message, type })
    wsClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload)
        }
    })
}

wss.on('connection', handleConnection)

module.exports = { wss, wsClients, broadcastLog }
