import fse from 'fs-extra'
import _path from 'path'
import { getConfig } from '../storage'
import { Plugin, PluginInfo, PluginStatus } from './plugin-base'
import { regChannel, regPluginChannel, sendMainChannelMsg } from '../../utils/channel-util'
import { PluginPackager } from "./plugin-packager";
import { genTouchApp } from '../touch-core'

export class PluginManager {

    #plugins = {}

    pluginsPath

    active: string | null = null

    get plugins() {
        return this.#plugins
    }

    async initial(_p: string) {

        this.pluginsPath = _p //_path.join(ProcessorVars.touchPath, 'plugins')

        this._listenerInitial()

        await this._initialPlugins()

    }

    async _initialPlugins() {

        for (const name of Object.keys(this.#plugins)) {
            await this.disablePlugin(name, true);
        }

        console.log("PluginManager: re-initial plugins ...")

        const fileLists = fse.readdirSync(this.pluginsPath)

        fileLists.forEach(file => this.loadPlugin(file))

        console.log("PluginManager: initial plugins done!")

        return this.#plugins

    }

    changeActivePlugin(name) {

        if (this.active) {

            const plugin: Plugin = this.#plugins[this.active]

            if (plugin) {

                plugin.status = PluginStatus.ENABLED

            }

        }

        if (name) {

            const plugin: Plugin = this.#plugins[name]
            if (!plugin) return 'no plugin'

            if (plugin.status !== PluginStatus.ENABLED) return 'plugin not enabled'

            this.active = name

            plugin.status = PluginStatus.ACTIVE

        }

        return 'success'

    }

    _listenerInitial() {

        regChannel('plugin-list', ({ reply }) => reply(this.#plugins))
        regChannel('plugin-list-refresh', async ({ reply }) => await this._initialPlugins())
        regChannel('change-active', ({ reply, data }) => reply(this.changeActivePlugin(data)))

        regChannel('plugin-action', async ({ reply, data }) => {

            const { action, pluginName } = data
            if (!action) return reply('no action')

            if (action === 'reload') {

                await this.disablePlugin(pluginName)

                reply(this.enablePlugin(pluginName))

            } else if (action === 'disable') {

                reply(await this.disablePlugin(pluginName))

            } else if (action === 'enable') {

                reply(await this.enablePlugin(pluginName))

            } else if (action === 'status') {

                reply(await this.#plugins[pluginName])

            } else if (action === 'fullscreen') {

                const plugin: Plugin = this.#plugins[pluginName]
                if (!plugin) return reply('no plugin')

                console.log("FullScreen: " + pluginName)

                const touchApp = genTouchApp()
                const mainWin = touchApp.window.window

                mainWin.setFullScreen(true)
                mainWin.webContents.executeJavaScript(`
                    document.body.parentElement.classList.toggle('fullscreen')
                `)

            } else if (action === 'webview-init') {

                const plugin: Plugin = this.#plugins[pluginName]
                if (!plugin) return reply('no plugin')

                plugin.isWebviewInit = true

            }

        })

        regPluginChannel('process-declare', ({ reply, plugin, data }) => {
            const plug = this.#plugins[plugin]
            if (!plug) return

            plug.process.push(data)

            console.log(`[Plugin] [ChildProcess-Declare] ${plugin} <-- ${data}`)
        })

        regPluginChannel('crash', async ({ reply, data, plugin }) => {

            await sendMainChannelMsg('plugin-crashed', {
                plugin: this.#plugins[plugin],
                ...data
            })

        })

        regPluginChannel('get-config', ({ reply, data }) => {

            // TODO permission dialog (application)

            reply(data ? getConfig(data) : "none config")

        })

        regPluginChannel('update-title', ({ reply, data }) => {

            const touchApp = genTouchApp()
            const mainWin = touchApp.window.window

            mainWin.setTitle(data.title)

            reply("success")

        })

        regPluginChannel('apply-for', async ({ reply, data, plugin }) => {

            console.log("[Plugin] [Apply-For] " + plugin + " <-- " + data.action)

            reply(await sendMainChannelMsg('plugin-apply-for', {
                ...data,
                args: [
                    plugin,
                    data.action,
                ]
            }))

        })

        regChannel('pack-export', async ({ reply, data }) => {
            const plug = this.#plugins[data.plugin]
            if (!plug) return

            console.log('[Plugin] Pack plugin ' + data.plugin + ' and export it.')

            new PluginPackager(plug, data.manifest, data.files).pack()
        })

    }

    loadPlugin(name) {
        const fileP = _path.join(this.pluginsPath, name)
        console.log("[PluginManager] Load plugin " + name + " from " + fileP)

        const fileInfo = fse.readFileSync(_path.join(fileP, 'init.json'))
        const readme = fse.existsSync(_path.join(fileP, 'README.md')) ? fse.readFileSync(_path.join(fileP, 'README.md')).toString() : ''

        // TODO init config validation
        const plugin = new Plugin(new PluginInfo(JSON.parse(fileInfo.toString()), fileP), fileInfo.toString(), readme)

        plugin.status = PluginStatus.LOADING

        if (name !== plugin.pluginInfo.name) {
            throw new Error('Plugin name not match')
        }

        if (this.#plugins[plugin.pluginInfo.name]) {

            throw new Error('Repeat plugin: ' + JSON.stringify(plugin) + " | " + JSON.stringify(this.#plugins))

        }

        plugin.status = PluginStatus.LOADED
        console.log("[PluginManager] Load plugin " + name + " done!")

        return this.#plugins[plugin.pluginInfo.name] = plugin
    }

    enablePlugin(name) {
        const plugin: Plugin = this.#plugins[name]
        if (!plugin) throw new Error('Unknown plugin: ' + name + " | " + JSON.stringify(this.#plugins))

        const fileP = _path.join(this.pluginsPath, name)

        const touchApp = genTouchApp()
        const mainWin = touchApp.window.window

        plugin._enabled(mainWin, fileP);

        return plugin

    }

    async disablePlugin(name, _delete = false) {
        const plugin: Plugin = this.#plugins[name]
        if (!plugin) throw new Error('Unknown plugin: ' + name + " | " + JSON.stringify(this.#plugins))

        console.log("[Plugin] Disabling plugin " + name)

        return await plugin._disabled() && (_delete && delete this.#plugins[name])

    }

}

export const pluginManager = new PluginManager()
