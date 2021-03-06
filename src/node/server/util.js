
const { Readable } = require("stream")
const path = require('path')
const fs = require('fs')
const LRUCache = require('lru-cache')

exports.readStream = async function (stream) {

    if (!(stream instanceof Readable)) {
        return stream ? stream.toString() : ''
    }

    return new Promise((resolve, reject) => {
        let str = ''
        stream
            .on('data', data => {
                str = str + data.toString()
            }).on('end', () => {
                resolve(str)
            })
    })
}

exports.resolveVue = function resolveVue(root) {
    const compilerPkgPath = path.resolve(root, 'node_modules', '@vue/compiler-sfc/package.json')
    const compilerPkg = require(compilerPkgPath)
    const compilerPath = path.join(path.dirname(compilerPkgPath), compilerPkg.main)

    const resolvePath = name => path.resolve(root, 'node_modules', `@vue/${name}/dist/${name}.esm-bundler.js`)
    const runtimeDomPath = resolvePath('runtime-dom')
    const runtimeCorePath = resolvePath('runtime-core')
    const reactivityPath = resolvePath('reactivity')
    const sharedPath = resolvePath('shared')

    return {
        compiler: compilerPath,
        vue: runtimeDomPath,
        '@vue/runtime-dom': runtimeDomPath,
        '@vue/runtime-core': runtimeCorePath,
        '@vue/reactivity': reactivityPath,
        '@vue/shared': sharedPath,
        // else
        'lodash-es': path.resolve(root, 'node_modules', 'lodash-es/lodash.js'),
        isLocal: true
    }
}


const imageRE = /\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/
const mediaRE = /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/
const fontsRE = /\.(woff2?|eot|ttf|otf)(\?.*)?$/i

/**
 * Check if a file is a static asset that vite can process.
 */
exports.isStaticAsset = (file) => {
    return imageRE.test(file) || mediaRE.test(file) || fontsRE.test(file)
}

const cssPreprocessLangRE = /(.+)\.(less|sass|scss|styl|stylus|postcss)$/
exports.isCSSRequest = (file) =>
    file.endsWith('.css') || cssPreprocessLangRE.test(file)

exports.isImportRequest = (ctx) => {
    return ctx.query.import != null
}

exports.clientPublicPath = `/vite/client`



exports.codegenCss = (id, css, modules) => {

    let code =
        `import { updateStyle } from "${exports.clientPublicPath}"\n` +
        `const css = ${JSON.stringify(css)}\n` +
        `updateStyle(${JSON.stringify(id)}, css)\n`
    if (modules) {
        code += `export default ${JSON.stringify(modules)}`
    } else {
        code += `export default css`
    }
    return code
}


exports.port = 3000


const fsReadCache = new LRUCache({
    max: 10000
})

exports.cachedRead = function cachedRead(ctx, file) {
    const lastModified = fs.statSync(file).mtimeMs
    const cached = fsReadCache.get(file)

    if (cached && cached.lastModified === lastModified) {
        return cached.content
    }

    const content = fs.readFileSync(file, 'utf8')

    fsReadCache.set(file, {
        content,
        lastModified
    })

    return content
}