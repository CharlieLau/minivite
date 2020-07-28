
const path = require('path')
const fs = require('fs').promises
const hash_sum = require('hash-sum')
const { resolveVue, clientPublicPath, codegenCss } = require("./util")

const defaultExportRE = /((?:^|\n|;)\s*)export default/
module.exports = function vuePlugin({ app, root }) {
    app.use(async (ctx, next) => {
        if (!ctx.path.endsWith('.vue')) {
            return await next()
        }

        const vueResolved = resolveVue(root)
        const filePath = path.join(root, ctx.path)
        const content = await fs.readFile(filePath, 'utf8')
        const publicPath = ctx.path;
        const id = hash_sum(publicPath)


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

            }
            let hasScoped = false
            if (descriptor.styles) {
                descriptor.styles.forEach((s, i) => {
                    const styleRequest = publicPath + `?type=style&index=${i}`
                    if (s.scoped) hasScoped = true
                    code += `\nimport ${JSON.stringify(styleRequest)}`
                })
            }
            if (hasScoped) {
                code += `\n__script.__scopeId = "data-v-${id}"`
            }
            ctx.body = code
        }
        if (ctx.query.type === 'template') {
            ctx.type = 'js'
            let content = descriptor.template.content

            const { code } = compileTemplate({
                source: content,
                // src 重写
                transformAssetUrls: {
                    base: path.posix.dirname(publicPath),
                }
            })
            ctx.body = code
        }
        if (ctx.query.type === 'style') {
            const index = Number(ctx.query.index)
            const styleBlock = descriptor.styles[index]
            // todo
            const id = hash_sum(publicPath)
            ctx.type = 'js'
            const code = styleBlock.content
            ctx.body = codegenCss(`${id}-${index}`, code)
        }
    })
}