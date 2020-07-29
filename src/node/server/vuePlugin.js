const path = require('path')
const fs = require('fs').promises
const hash_sum = require('hash-sum')
const LRUCache = require('lru-cache')
const { resolveVue, codegenCss, cachedRead } = require("./util")

const defaultExportRE = /((?:^|\n|;)\s*)export default/
const vueCache = new LRUCache({
    max: 65535
})

exports.resolveCompiler = (root) => {
    const vueResolved = resolveVue(root)
    return require(vueResolved['compiler'])
}

exports.vuePlugin = function vuePlugin({ app, root, watcher, resolver }) {
    app.use(async (ctx, next) => {
        if (!ctx.path.endsWith('.vue')) {
            return await next()
        }

        const filePath = path.join(root, ctx.path)
        const publicPath = ctx.path;
        const id = hash_sum(publicPath)
        let map
        let descriptor = await parseSFC(root, filePath, ctx.body)
        const { compileTemplate } = exports.resolveCompiler(root)
        if (!ctx.query.type) {
            let code = ``
            let cached = vueCache.get(filePath)
            if (cached && cached.script) {
                ctx.type = "js"
                return ctx.body = cached.script.code
            }

            if (descriptor.script) {
                let content = descriptor.script.content;
                let replaced = content.replace(defaultExportRE, '$1const __script =')
                code += replaced
                map = descriptor.script.map
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
            if (descriptor.template) {
                const templateRequest = ctx.path + `?type=template`
                code += `\n import {render as __render} from ${JSON.stringify(templateRequest)}`
                code += `\n __script.render=__render`
            }
            code += `\n__script.__hmrId = ${JSON.stringify(publicPath)}`
            code += `\n__script.__file = ${JSON.stringify(filePath)}`
            code += `\n export default __script`

            cached = cached || { styles: [], customs: [] }
            cached.script = {
                code,
                map
            }
            vueCache.set(filePath, cached)
            ctx.type = "js"
            ctx.body = code
        }
        if (ctx.query.type === 'template') {
            let cached = vueCache.get(filePath)
            if (cached && cached.template) {
                ctx.type = "js"
                return ctx.body = cached.template.code
            }

            ctx.type = 'js'
            let content = descriptor.template.content
            const scoped = descriptor.styles.some((s) => s.scoped)
            const { code, map } = compileTemplate({
                source: content,
                filename: filePath,
                inMap: descriptor.template.map,
                // src 重写
                transformAssetUrls: {
                    base: path.posix.dirname(publicPath),
                },
                compilerOptions: {
                    scopeId: scoped ? `data-v-${id}` : null,
                    runtimeModuleName: '/@modules/vue'
                }
            })

            cached = cached || { styles: [], customs: [] }
            cached.template = {
                code,
                map
            }
            vueCache.set(filePath, cached)
            ctx.body = code
        }
        if (ctx.query.type === 'style') {
            const index = Number(ctx.query.index)
            const styleBlock = descriptor.styles[index]
            let cached = vueCache.get(filePath)
            const cachedEntry = cached && cached.styles && cached.styles[index]
            if (cachedEntry) {
                ctx.type = 'js'
                return ctx.body = cachedEntry.code
            }
            const { compileStyleAsync } = exports.resolveCompiler(root)

            const id = hash_sum(publicPath)
            ctx.type = 'js'
            const source = styleBlock.content
            const result = await compileStyleAsync({
                source,
                filename: filePath + `?type=style&index=${index}`,
                id: `data-v-${id}`,
                scoped: styleBlock.scoped != null
            })

            const genCode = codegenCss(`${id}-${index}`, result.code)
            cached = cached || { styles: [], customs: [] }
            cached.styles[index] = {
                ...result,
                code: genCode
            }
            vueCache.set(filePath, cached)
            ctx.body = genCode
        }
    })

    watcher.on('change', async file => {
        if (file.endsWith('.vue')) {
            const timestamp = Date.now()
            await handleVueReload(file, timestamp)
        }
    })

    const handleVueReload = (watcher.handleVueReload = async (filePath, timestamp) => {
        const publicPath = resolver.fileToRequest(filePath)
        const cacheEntry = vueCache.get(filePath)
        const { send } = watcher
        vueCache.del(filePath)

        const descriptor = await parseSFC(root, filePath)
        if (!descriptor) {
            // read failed
            return
        }

        const prevDescriptor = cacheEntry && cacheEntry.descriptor
        if (!prevDescriptor) {
            // the file has never been accessed yet
            return
        }

        let needReload = false
        let needRerender = false
        // 如果 script 部分不同则需要 reload
        if (!isEqual(descriptor.script, prevDescriptor.script)) {
            needReload = true
        }

        // 如果 template 部分不同则需要 rerender
        if (!isEqual(descriptor.template, prevDescriptor.template)) {
            needRerender = true
        }
        const styleId = hash_sum(publicPath)

        // 获取之前的 style 以及下一次（或者说热更新）的 style
        const prevStyles = prevDescriptor.styles || []
        const nextStyles = descriptor.styles || []

        // 如果不需要 reload，则查看是否需要更新 style
        if (!needReload) {
            nextStyles.forEach((_, i) => {
                if (!prevStyles[i] || !isEqual(prevStyles[i], nextStyles[i])) {
                    const path = `${publicPath}?type=style&index=${i}`
                    send({
                        type: 'style-update',
                        path,
                        index: i,
                        id: `${styleId}-${i}`,
                        timestamp
                    })
                }
            })
        }


        // 如果 style 标签及内容删掉了，则需要发送 `style-remove` 的通知
        prevStyles.slice(nextStyles.length).forEach((_, i) => {
            send({
                type: 'style-remove',
                path: publicPath,
                id: `${styleId}-${i + nextStyles.length}`
            })
        })
        // 如果需要 reload 发送 `vue-reload` 通知
        if (needReload) {
            send({
                type: 'vue-reload',
                path: publicPath,
                timestamp
            })
        } else if (needRerender) {
            // 否则发送 `vue-rerender` 通知
            send({
                type: 'vue-rerender',
                path: publicPath,
                timestamp
            })
        }
    })


    async function parseSFC(root, filePath, content) {
        let cached = vueCache.get(filePath)
        if (cached && cached.descriptor) {
            return cached.descriptor
        }
        if (!content) {
            try {
                content = cachedRead(null, filePath)
            } catch (e) {
                console.log(e)
                return
            }
        }

        const { parse } = exports.resolveCompiler(root)

        const { descriptor, errors } = parse(content, {
            filename: filePath,
            sourceMap: true
        })

        if (errors.length) {
            console.error(chalk.red(`\n[vite] SFC parse error: `))
        }

        cached = cached || { styles: [], customs: [] }
        cached.descriptor = descriptor
        vueCache.set(filePath, cached)
        return descriptor
    }

    function isEqual(a, b) {
        if (!a && !b) return true
        if (!a || !b) return false
        // src imports will trigger their own updates
        if (a.content !== b.content) return false
        const keysA = Object.keys(a.attrs)
        const keysB = Object.keys(b.attrs)
        if (keysA.length !== keysB.length) {
            return false
        }
        return keysA.every((key) => a.attrs[key] === b.attrs[key])
    }

}

