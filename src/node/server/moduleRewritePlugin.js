
const path = require('path')
const { readStream } = require('./util')

const { parse } = require('es-module-lexer')

const MagicString = require('magic-string')

const MODULE_NAME_REG = /^[^\.\/]/
const CSS_RE = /\.css$/
module.exports = function ({ app, root }) {
    app.use(async (ctx, next) => {
        await next()
        if (ctx.response.is('js') && (ctx.path !== '/vite/client' && ctx.path !== '/vite/hmr')) {
            const data = await readStream(ctx.body)
            const str = new MagicString(data)
            const imports = parse(data)[0]
            imports.forEach(pos => {
                const { s, e } = pos
                const moduleName = data.substring(s, e)

                if (MODULE_NAME_REG.test(moduleName)) {
                    str.overwrite(s, e, `/@modules/${moduleName}`)
                } else if (CSS_RE.test(moduleName)) {
                    const relativeP = path.relative(root, path.join(root, 'src', moduleName))
                    str.overwrite(s, e, `/${relativeP}?import`)
                }
            })
            ctx.body = str.toString()
        }
    })
}