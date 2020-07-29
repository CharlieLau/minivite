const fs = require('fs').promises
const chalk = require('chalk')
const moduleRE = /^\/@modules\//

const { resolveVue } = require('./util')
const { resolvePtr } = require('dns')


const moduleFileToIdMap = new Map()
const moduleIdToFileMap = new Map()

exports.moduleIdToFileMap = moduleIdToFileMap
exports.moduleFileToIdMap = moduleFileToIdMap

exports.moduleResolvePlugin = function moduleResolvePlugin({ app, root }) {

    app.use(async (ctx, next) => {
        const vueResolved = resolveVue(root)
        if (!moduleRE.test(ctx.path)) {
            return await next()
        }
        const name = decodeURIComponent(ctx.path.replace(moduleRE, ''))
        ctx.type = 'js'
        const resolvedPath = vueResolved[name]
        if (!resolvedPath) {
            console.log(chalk.red('[es module]') + ` can't resolved: ${name}`)
            return await next()
        }
        moduleIdToFileMap.set(name, resolvedPath)
        moduleFileToIdMap.set(resolvedPath, ctx.path)

        const content = await fs.readFile(resolvedPath, 'utf8')
        ctx.body = content
    })
}   