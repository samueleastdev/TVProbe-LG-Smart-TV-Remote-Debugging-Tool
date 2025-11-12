const express = require('express')
const cors = require('cors')
const path = require('path')
const http = require('http')
const { NETWORK } = require('./utils/config')

const app = express()
const server = http.createServer(app)
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())

const keyRoutes = require('./routes/key_routes')
const deviceRoutes = require('./routes/device_routes')
const activeUsersRoutes = require('./routes/active_users_routes')
const lgRoutes = require('./routes/lg_routes')

const { wss } = require('./services/websocket_service')

app.use('/keys', keyRoutes)
app.use('/device', deviceRoutes)
app.use('/users', activeUsersRoutes)
app.use('/lg', lgRoutes)

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request)
    })
})

server.listen(3001, () => {
    console.log(`Server running on http://localhost:3001 / http://${NETWORK.ZEROTIER_IP}:3001`)
})
