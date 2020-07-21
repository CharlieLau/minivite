
const Koa = require('koa')
const serverStaticPlugin = require('./serverStaticPlugin')
const moduleRewritePlugin = require('./moduleRewritePlugin')
const moduleResolvePlugin = require('./moduleResolvePlugin')
const vuePlugin = require("./vuePlugin")
const buildHtmlPlugin = require('./buildHtmlPlugin')
const cssResolvePlugin = require('./cssResolvePlugin')


function createServer() {
    const root = process.cwd()
    const app = new Koa()

    const context = {
        root,
        app
    }

    const middlewares = [
        buildHtmlPlugin,
        moduleRewritePlugin,
        cssResolvePlugin,
        moduleResolvePlugin,
        vuePlugin,
        serverStaticPlugin
    ]

    middlewares.forEach(middleware => middleware(context))

    return app;
}



module.exports = createServer()