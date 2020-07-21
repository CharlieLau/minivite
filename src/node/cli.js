
const chalk = require('chalk')
const argv = require('minimist')(process.argv.slice(2))



    ; (async () => {
        /**
         *  -- mode 
         *  -- help
         *  -- verson
         */
        const { h, help, mode, v, version } = argv
        const command = argv._[0]
        if (v || version) {
            console.log(chalk.cyan(`mini-vite v${require('../../package.json').version}`))
        } else if (h || help) {
            console.log(`
                Usage mini-vite [command] [args] [--options]
                Commands:
                mini-vite
                mini-vite serve
            `)
        }
        if (!command || command === "serve") {
            runServe()
        }

    })();



async function runServe() {
    const Server = require('./server')

    Server.listen(3000, () => {
        console.log(chalk.cyan('[mini-vite]') + 'Server: http://localhost:3000')
    })
}

