const fs = require('fs').promises
const chalk = require('chalk')
const moduleRE = /^\/@modules\//

const { resolveVue } = require('./util')


module.exports = function ({ app, root }) {

    app.use(async (ctx, next) => {
        const vueResolved = resolveVue(root)
        if (!moduleRE.test(ctx.path)) {
            return await next()
        }
        const name = ctx.path.replace(moduleRE, '')
        ctx.type = 'js'
        const resolvedPath = vueResolved[name]
        if (!resolvedPath) {
            console.log(chalk.red('[es module]') + ` can't resolved: ${name}`)
            return await next()
        }
        const content = await fs.readFile(resolvedPath, 'utf8')
        ctx.body = content
    })
}   