window.process = {
    env: {
        NODE_ENV: 'development'
    }
}



console.log('[vite] connecting...')
const socketProtocol = location.protocol === 'https:' ? 'wss' : 'ws'
const socketUrl = `${socketProtocol}://${location.hostname}:${__PORT__}`
const socket = new WebSocket(socketUrl, 'vite-hmr')


socket.addEventListener('message', async ({ data }) => {
    const payload = JSON.parse(data)
    handleMessage(payload)
})

async function handleMessage(payload) {
    switch (payload.type) {
        case 'connected':
            console.log(`[vite] connected.`)
            break
        default:
    }
}

const sheetsMap = new Map()
export function updateStyle(id, content) {
    let style = sheetsMap.get(id)
    if (!style) {
        style = document.createElement('style')
        style.setAttribute('type', 'text/css')
        style.innerHTML = content
        document.head.appendChild(style)
    } else {
        style.innerHTML = content
    }
}