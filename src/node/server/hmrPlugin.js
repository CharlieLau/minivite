const WebSocket = require('ws')
module.exports = function ({ root, app, server }) {
    app.use(async (ctx, next) => {
        return next()
    })
    const wss = new WebSocket.Server({ noServer: true })
    server.on('upgrade', (req, socket, head) => {
        if (req.headers['sec-websocket-protocol'] === 'vite-hmr') {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req)
            })
        }
    })

    wss.on('connection', (socket) => {
        socket.send(JSON.stringify({ type: 'connected' }))
    })

    wss.on('error', (e) => {
    })
}