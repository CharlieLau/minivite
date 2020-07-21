
const KoaStatic = require('koa-static')
const path = require('path')
const { isStaticAsset } = require('./util')
module.exports = function ({ app, root }) {




    app.use(KoaStatic(root))
    app.use(KoaStatic(path.resolve(root, 'public')))

    app.use(async (ctx, next) => {
        if (ctx.body || ctx.status !== 404) {
            return
        }
        if (ctx.path.startsWith('/public/') && isStaticAsset(ctx.path)) {
            console.error(
                chalk.yellow(
                    `[vite] files in the public directory are served at the root path.\n` +
                    `  ${chalk.blue(ctx.path)} should be changed to ${chalk.blue(
                        ctx.path.replace(/^\/public\//, '/')
                    )}.`
                )
            )
        }
    })
}   