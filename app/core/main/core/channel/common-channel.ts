import packageJson from './../../../package.json'
import { regChannel } from '../../utils/channel-util'
import { ProcessorVars } from '../addon/initializer'
import { getConfig, reloadConfig, saveConfig } from '../storage'

import { app, shell } from 'electron'
import os from 'os'
import { genTouchApp } from '../touch-core'

export default function install() {

    const touchApp = genTouchApp()
    const mainWin = touchApp.window.window

    const typeMap = {
        'close': () => {
            mainWin.close()

            app.quit()

            process.exit(0)
        },
        'minimize': () => {
            mainWin.minimize()
        },
        'dev-tools': () => {
            mainWin.webContents.openDevTools({
                mode: 'detach'
            })
        },
        'get-path': ({ reply, data }) => {
            reply(app.getPath(data.name))
        },
        'get-package': ({ reply }) => {
            reply(packageJson)
        },
        'open-external': ({ data }) => {
            shell.openExternal(data.url)
        }
    }

    regChannel('main-window', ({ reply, data }) => {
        const action = data.action
        if (!action) return reply("No action")

        typeMap[action]?.({ reply, data })

    })

    regChannel('app-action', ({ reply, data }) => {
        const action = data.action
        if (!action) return reply("No action")

        typeMap[action]?.({ reply, data })

    })

    regChannel('app-storage', ({ reply, data }) => {
        const action = data.action
        if (!action) return reply("No action")

        if (data.save) {
            reply(saveConfig(action, data.content, data.clear))
        } else if (data.reload) {
            reply(reloadConfig(action))
        } else reply(getConfig(action))

    })

    regChannel('get-start-time', ({ reply }) => reply(ProcessorVars.startTime))

    regChannel('get-os', ({ reply }) => reply({
        arch: os.arch(),
        cpus: os.cpus(),
        endianness: os.endianness(),
        freemem: os.freemem(),
        homedir: os.homedir(),
        hostname: os.hostname(),
        loadavg: os.loadavg(),
        networkInterfaces: os.networkInterfaces(),
        platform: os.platform(),
        release: os.release(),
        tmpdir: os.tmpdir(),
        totalmem: os.totalmem(),
        type: os.type(),
        uptime: os.uptime(),
        userInfo: os.userInfo(),
        version: os.version()
    }))
}