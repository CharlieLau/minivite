
const fs = require('fs')
const path = require('path')
const clientFilePath = path.resolve(__dirname, '../../client/client.js')
const { clientPublicPath } = require('./util')

module.exports = function ({ root, app }) {

    const clientCode = fs
        .readFileSync(clientFilePath, 'utf-8')
        .replace(`__MODE__`, JSON.stringify('development'))



    app.use(async (ctx, next) => {
        if (ctx.path === clientPublicPath) {
            ctx.type = 'js'
            ctx.body = clientCode
        } else {
            return next()
        }
    })
}