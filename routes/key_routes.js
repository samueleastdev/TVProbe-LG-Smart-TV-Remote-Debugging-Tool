const express = require('express')
const router = express.Router()
const { handleKeyPress } = require('../services/key_service')

router.get('/down', async (req, res) => {
    const key = req.query.press
    console.log(`Key down pressed: ${key}`)

    try {
        const success = await handleKeyPress(key)
        if (success) {
            res.json({ status: 'ok', key })
        } else {
            res.status(400).json({
                status: 'error',
                message: 'Unknown key or socket not ready',
            })
        }
    } catch (err) {
        console.error('Error handling key press:', err)
        res.status(500).json({ status: 'error', message: err.message })
    }
})

module.exports = router
