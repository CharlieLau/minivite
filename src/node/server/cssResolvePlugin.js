const fs = require('fs').promises
const path = require('path')
const { clientPublicPath } = require('./util')

module.exports = function ({ app, root }) {

    app.use(async (ctx, next) => {
        if (!ctx.path.endsWith('.css')) {
            return next()
        }
        const content = await fs.readFile(path.join(root, ctx.path), 'utf8')
        ctx.type = "js"
        const code = `
            import {updateStyle} from '${clientPublicPath}'
            const css =${JSON.stringify(content)}
            updateStyle('${ctx.path}',css)
            export default css
        `
        ctx.body = code
    })
}   