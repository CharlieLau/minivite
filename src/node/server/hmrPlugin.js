const WebSocket = require('ws')
const { isCSSRequest } = require('./util')

const importerMap = new Map()
const importeeMap = new Map()
exports.importerMap = importerMap
exports.importeeMap = importeeMap

exports.hmrPlugin = function hmrPlugin({ root, app, server, watcher }) {
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

    const send = (watcher.send = (payload) => {
        const stringified = JSON.stringify(payload, null, 2)

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(stringified)
            }
        })
    })


    watcher.on('change', file => {
        if (!(file.endsWith('.vue') || isCSSRequest(file))) {
            // everything except plain .css are considered HMR dependencies.
            // plain css has its own HMR logic in ./serverPluginCss.ts.
            handleJSReload(file)
        }
    })
}