
const path = require('path')
const fs = require('fs').promises

const { resolveVue } = require("./util")

const defaultExportRE = /((?:^|\n|;)\s*)export default/
module.exports = function vuePlugin({ app, root }) {
    app.use(async (ctx, next) => {
        if (!ctx.path.endsWith('.vue')) {
            return await next()
        }

        const vueResolved = resolveVue(root)
        const filePath = path.join(root, ctx.path)
        const content = await fs.readFile(filePath, 'utf8')

        const { parse, compileTemplate } = require(vueResolved['compiler'])
        let { descriptor } = parse(content)

        if (!ctx.query.type) {
            let code = ``

            if (descriptor.script) {
                let content = descriptor.script.content;
                let replaced = content.replace(defaultExportRE, '$1const __script =')
                code += replaced
            }
            if (descriptor.template) {
                const templateRequest = ctx.path + `?type=template`
                code += `\n import {render as __render} from ${JSON.stringify(templateRequest)}`
                code += `\n __script.render=__render`

                ctx.type = "js"
                code += `\n export default __script`
                ctx.body = code
            }
        }
        if (ctx.query.type === 'template') {
            ctx.type = 'js'
            let content = descriptor.template.content
            const { code } = compileTemplate({ source: content })
            ctx.body = code
        }
        if (ctx.query.type === 'style') {
            const styleBlock = descriptor.styles[0]
            // todo
        }
    })
}