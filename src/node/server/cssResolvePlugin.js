const fs = require('fs').promises
const path = require('path')
const { codegenCss, isCSSRequest } = require('./util')

module.exports = function ({ app, root, watcher, resolver }) {

    app.use(async (ctx, next) => {
        if (!ctx.path.endsWith('.css')) {
            return next()
        }
        const content = await fs.readFile(path.join(root, ctx.path), 'utf8')
        ctx.type = "js"
        const code = codegenCss(ctx.path, content)
        ctx.body = code
    })

    watcher.on("change", file => {
        const publicPath = resolver.fileToRequest(file)
        if (isCSSRequest) {
            normalCssUpdate(publicPath)
        }
    })

    function normalCssUpdate(publicPath) {
        watcher.send({
            type: 'style-update',
            path: publicPath,
            changeSrcPath: publicPath,
            timestamp: Date.now()
        })
    }
}
