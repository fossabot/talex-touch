import { lstat } from 'fs/promises'
import { cwd } from 'process'
import { ipcRenderer } from 'electron'
import { forDialogMention } from '@modules/mention/dialog-mention'
import Logo from '@assets/TalexTouchChat-Small.png'

ipcRenderer.on('@main-process-message', (_event, arg) => {

  const header = arg.header

  if( !header ) {
    console.error(_event, arg)
    throw new Error("Invalid message!")
  }

  const { status } = arg
  const { _: mainType, sync } = header.type

  if( status === 'reply' ) {

    if( sync )
      syncMap.get(sync)?.({
        origin: arg,
        data: arg.data._
      })
    else typeMap.get(mainType)?.forEach( (type) => type({
      origin: arg,
      data: arg.data._
    }) )

  } else {

    // send
    typeMap.get(mainType)?.forEach( (type) => {

      let replied = false

      const handIn = {
        origin: arg,
        data: arg.data._,
        reply: (data: any, options: any = null) => {
          if( replied ) return
          replied = true

          if( sync ) {

            _event.sender.send('@main-process-message', {
              status: 'reply',
              timeStamp: new Date().getTime(),
              header: {
                type: {
                  _: mainType,
                  sync
                },
                options
              },
              data: {
                _: data,
              }
            })

          } else {

            _event.returnValue = {
              status: 'reply',
              timeStamp: new Date().getTime(),
              header: {
                type: {
                  _: mainType,
                },
                options
              },
              data: {
                _: data,
              }
            }

          }

        }
      }

      const res = type(handIn)

      if( res instanceof Promise ) return

      res && handIn.reply(res)

    })

  }

  console.log('[Receive Main-process message]:', arg)

})

const typeMap = new Map<string, Array<Function>>()
const syncMap = new Map<string, Function>()

export async function asyncMainProcessMessage(type: string, data: any = null, options = { timeout: 10000 }) {
  const onlyID = new Date().getTime() + "#" + type + "@" + Math.random().toString(12)

  let timer

  return new Promise((resolve, reject) => {

    if ( options?.timeout ) {
      timer = setTimeout(() => {
        reject({ type, status: 'timeout', data })
      }, options.timeout)
    }

    ipcRenderer.send('@main-process-message', {
      status: 'send',
      timeStamp: new Date().getTime(),
      header: {
        type: {
          _: type,
          sync: onlyID
        },
        ...options
      },
      data: {
        _: data,
      }
    })

    syncMap.set(onlyID, (data: any) => {

      syncMap.delete(onlyID)

      clearTimeout(timer)

      resolve(data)

    });

  })

}

export function postMainProcessMessage(type: string, data: any = null, options: object = {}) {

  const res = ipcRenderer.sendSync('@main-process-message', {
    status: 'send',
    timeStamp: new Date().getTime(),
    header: {
      type: {
        _: type,
      },
      ...options
    },
    data: {
      _: data,
    }
  })

  if( res.status === 'reply' ) return res.data._

  return res

}

export function registerTypeProcess(type: string, callback: Function) {

    if ( !typeMap.has(type) ) {
        typeMap.set(type, [])
    }

    typeMap.get(type).push(callback)

}

lstat(cwd()).then(async stats => {
  ipcRenderer.send('win-done')

  console.log('attempt to get plugin list')

  console.log( pluginManager.getPluginList() )

  console.log("async action: ", await asyncMainProcessMessage('test-async'))

}).catch(err => {
  console.error(err)
})

class PluginManager {

  constructor() {

    registerTypeProcess('plugin-crashed', async ({ reply, data }) => {

      await forDialogMention( data.name, data.message, data.plugin.pluginInfo.icon, [
        {
          content: "卸载插件",
          type: 'info',
          onClick: async () => {

            return this.disablePlugin(data.plugin.pluginInfo.name)

          }
        },
        {
          content: "重启插件",
          type: 'warning',
          onClick: async () => this.reloadPlugin(data.plugin.pluginInfo.name)
        }
      ] )

      reply("accepted")

    })

  }

  _pluginAsync(action: string, pluginName: string, data = {}) {
    return asyncMainProcessMessage('plugin-action', {
      action,
      pluginName,
      ...data
    })
  }

  async reloadPlugin(name) {
    return this._pluginAsync('reload', name)
  }

  async enablePlugin(name) {
    return this._pluginAsync('enable', name)
  }

  async disablePlugin(name) {
    return this._pluginAsync('disable', name)
  }

  getPluginList() {
    return postMainProcessMessage('plugin-list')
  }

  changeActivePlugin(name: string) {
    return postMainProcessMessage('change-active-plugin', name)
  }

}

<<<<<<< HEAD
export const pluginManager = new PluginManager()

export class BaseNodeApi {

  _action(action: string, data = {}) {
    return asyncMainProcessMessage('main-window', {
      action,
      ...data
    })
  }

  _app(action: string, data = {}) {
    return asyncMainProcessMessage('app-action', {
      action,
      ...data
    })
  }

  _appSync(action: string, data = {}) {
    return postMainProcessMessage('app-action', {
      action,
      ...data
    })
  }

  _storage(action: string, data = {}) {
    return postMainProcessMessage('app-storage', {
      action,
      ...data
    })
  }

  _storageAsync(action: string, data = {}) {
    return asyncMainProcessMessage('app-storage', {
      action,
      ...data
    })
  }

  close() {
    return this._action('close')
  }

  minimize() {
    return this._action('minimize')
  }

  openDevTools() {
    return this._action('dev-tools')
  }

  getPackageJSON() {
    return this._appSync('get-package')
  }

  async getPath(name: string) {
    return (await this._app('get-path', { name }))['data']
  }

  getProcessCwd() {
    return postMainProcessMessage('process-cwd')
  }

  getConfig(name) {
    return this._storage(name)
  }

  saveConfig(name, content, clear) {
    return this._storageAsync(name, { save: true, content, clear })
  }

  reloadConfig(name) {
    return this._storage(name, { reload: true })
  }

}

export function genBaseNodeApi() {

  return new BaseNodeApi()
}
=======
export const pluginManager = new PluginManager()
>>>>>>> parent of a8d59a2 (@initial 1.22)
