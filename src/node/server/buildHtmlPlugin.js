const path = require('path')
const fs = require('fs').promises
const { clientPublicPath } = require('./util')
module.exports = function ({ root, app }) {
    app.use(async (ctx, next) => {
        if (ctx.path === '/') {
            const htmlPath = path.resolve(root, 'index.html')
            let content = await fs.readFile(htmlPath, 'utf8')

            content = content.replace(/<head>/, function (...args) {
                return `<head><script type="module">import '${clientPublicPath}'</script>`
            })
            ctx.type = 'html'
            ctx.body = content
            return
        }
        return next()
    })
}


