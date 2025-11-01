let activeUsers = {}

function updateActiveUsers(ip) {
    activeUsers[ip] = Date.now()
}

function cleanUpInactiveUsers() {
    const timeout = 10 * 60 * 1000 // 10 minutes
    const now = Date.now()
    for (let ip in activeUsers) {
        if (now - activeUsers[ip] > timeout) {
            delete activeUsers[ip]
        }
    }
}

function getActiveUsers(req, res) {
    cleanUpInactiveUsers()
    res.json({ activeUsers: Object.keys(activeUsers) })
}

module.exports = { updateActiveUsers, cleanUpInactiveUsers, getActiveUsers }
