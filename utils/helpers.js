function sendButton(sock, button, timeout = 1000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      sock.send('button', { name: button.toUpperCase() })
      resolve()
    }, timeout)
  })
}

module.exports = { sendButton }
