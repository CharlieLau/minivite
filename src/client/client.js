window.process = {
    env: {
        NODE_ENV: "development"
    }
};

console.log('[vite] connecting...')
const socketProtocol = location.protocol === 'https:' ? 'wss' : 'ws'
const socketUrl = `${socketProtocol}://${location.hostname}:${__PORT__}`
const socket = new WebSocket(socketUrl, 'vite-hmr')


socket.addEventListener('message', async ({ data }) => {
    const payload = JSON.parse(data)
    handleMessage(payload)
})


async function handleMessage(payload) {
    const { type, path, id, index, timestamp, customData } = payload
    switch (type) {
        case 'connected':
            console.log(`[vite] connected.`)
            break
        case 'vue-reload':
            import(`${path}?t=${timestamp}`).then((m) => {
                __VUE_HMR_RUNTIME__.reload(path, m.default)
                console.log(`[vite] ${path} reloaded.`) // 调用 HMRRUNTIME 的方法更新
            })
            break
        case 'vue-rerender':
            import(`${path}?type=template&t=${timestamp}`).then((m) => {
                __VUE_HMR_RUNTIME__.rerender(path, m.render)
                console.log(`[vite] ${path} template updated.`) // 调用 HMRRUNTIME 的方法更新
            })
            break
        case 'style-update':
            // check if this is referenced in html via <link>
            const el = document.querySelector(`link[href*='${path}']`);
            if (el) {
                el.setAttribute('href', `${path}${path.includes('?') ? '&' : '?'}t=${timestamp}`);
                break;
            }
            // imported CSS
            const importQuery = path.includes('?') ? '&import' : '?import';
            await import(`${path}${importQuery}&t=${timestamp}`);
            console.log(`[vite] ${path} updated.`);

            break
        case 'style-remove':
            removeStyle(payload.id)
            break;
        case 'full-reload':
            location.reload()
        default:
    }
}

const sheetsMap = new Map()
export function updateStyle(id, content) {
    let style = sheetsMap.get(id)
    if (style && !(style instanceof HTMLStyleElement)) {
        removeStyle(id)
        style = undefined
    }

    if (!style) {
        style = document.createElement('style')
        style.setAttribute('type', 'text/css')
        style.innerHTML = content
        document.head.appendChild(style)
    } else {
        style.innerHTML = content
    }
    sheetsMap.set(id, style)
}


function removeStyle(id) {
    let style = sheetsMap.get(id)
    if (style) {
        if (style instanceof CSSStyleSheet) {
            // @ts-ignore
            const index = document.adoptedStyleSheets.indexOf(style)
            // @ts-ignore
            document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
                (s) => s !== style
            )
        } else {
            document.head.removeChild(style)
        }
        sheetsMap.delete(id)
    }
}