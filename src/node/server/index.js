
const Koa = require('koa')
const chokidar = require('chokidar')
const serverStaticPlugin = require('./serverStaticPlugin')
const moduleRewritePlugin = require('./moduleRewritePlugin')
const moduleResolvePlugin = require('./moduleResolvePlugin')
const vuePlugin = require("./vuePlugin")
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
    const context = {
        root,
        app,
        server,
        port: 3000,
        watcher
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



module.exports = createServer()