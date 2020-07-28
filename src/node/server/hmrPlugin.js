const WebSocket = require('ws')
const { isCSSRequest } = require('./util')
module.exports = function ({ root, app, server, watcher }) {
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

    const handleJSReload = (watcher.handleJSReload = (filePath, timestamp = Date.now()) => {

    })


    watcher.on('change', file => {
        if (!(file.endsWith('.vue') || isCSSRequest(file))) {
            // everything except plain .css are considered HMR dependencies.
            // plain css has its own HMR logic in ./serverPluginCss.ts.
            handleJSReload(file)
        }
    })
}