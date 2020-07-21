
const KoaStatic = require('koa-static')
const path = require('path')
const { isStaticAsset } = require('./util')
module.exports = function ({ app, root }) {

    app.use(KoaStatic(root))
    app.use(KoaStatic(path.resolve(root, 'public')))
}   