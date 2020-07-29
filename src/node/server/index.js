
const Koa = require('koa')
const chokidar = require('chokidar')
const slash = require('slash')
const path = require('path')
const serverStaticPlugin = require('./serverStaticPlugin')
const moduleRewritePlugin = require('./moduleRewritePlugin')
const { moduleResolvePlugin, moduleFileToIdMap } = require('./moduleResolvePlugin')
const { vuePlugin } = require("./vuePlugin")
const buildHtmlPlugin = require('./buildHtmlPlugin')
const cssResolvePlugin = require('./cssResolvePlugin')
const clientPlugin = require("./clientPlugin")
const hmrPlugin = require('./hmrPlugin')


function createServer() {
    const root = process.cwd()
    const app = new Koa()

    const server = require('http').createServer(app.callback())

    const watcher = chokidar.watch(root, {
        ignored: [/\bnode_modules\b/, /\b\.git\b/]
    })

    const fileToRequestCache = new Map()


    const resolver = {
        fileToRequest(filePath) {
            if (fileToRequestCache.has(filePath)) {
                return fileToRequestCache.get(filePath)
            }
            const res = defaultFileToRequest(filePath, root)
            fileToRequestCache.set(filePath, res)
            return res
        }

    }

    const context = {
        root,
        app,
        server,
        port: 3000,
        watcher,
        resolver
    }

    const middlewares = [
        buildHtmlPlugin,
        moduleRewritePlugin,
        cssResolvePlugin,
        moduleResolvePlugin,
        vuePlugin,
        clientPlugin,
        hmrPlugin,
        serverStaticPlugin
    ]

    middlewares.forEach(middleware => middleware(context))

    const listen = server.listen.bind(server)
    server.listen = ((port, ...args) => {
        context.port = port
        return listen(port, ...args)
    })
    return server

    // return app;
}

function defaultFileToRequest(filePath, root) {
    const moduleRequest = moduleFileToIdMap.get(filePath)
    if (moduleRequest) {
        return moduleRequest
    }
    return `/${slash(path.relative(root, filePath))}`
}




module.exports = createServer()