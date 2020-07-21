

window.process = {
    env: {
        NODE_ENV: 'development'
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