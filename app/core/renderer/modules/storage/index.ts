import {reactive, unref, watch} from 'vue'
import { languages } from '@modules/lang'
import {AccountStorage} from "@modules/storage/accounter";
import themeStyle from "~/views/settings/ThemeStyle.vue";

const storages = new Map<string, TouchStorage<any>>()

export class TouchStorage<T extends object> {

    #qualifiedName: string

    #autoSave: boolean = false
    #_autoSave

    _onUpdate: Array<Function> = []
    _initData: T

    data: typeof reactive<T>

    constructor(qName: string, initData: T, onUpdate?: Function) {
        if ( storages.has(qName) ) throw new Error(`Storage ${qName} already exists!`)

        this.#qualifiedName = qName
        this._initData = initData
        this.data = reactive(window.$nodeApi.getConfig(qName))

        Object.keys(initData).forEach(key => {
          if ( this.data.hasOwnProperty(key) ) return
            this.data[key] = initData[key]
        })

        if ( onUpdate ) this._onUpdate = [onUpdate]

        storages.set(qName, this)
    }

    setAutoSave(autoSave: boolean) {
        this.#autoSave = autoSave

        if ( !autoSave ) {
            this.#_autoSave?.()
        } else {
            this.#_autoSave = watch(this.data, async () => {

                this._onUpdate?.forEach(fn => fn())

                await window.$nodeApi.saveConfig(this.#qualifiedName, JSON.stringify(this.data), false)
            }, { deep: true, immediate: true })
        }

        return this

    }

    onUpdate(fn: Function) {
        this._onUpdate.push(fn)
    }

    offUpdate(fn: Function) {
        this._onUpdate.splice(this._onUpdate.indexOf(fn), 1)
    }

}

export interface IPaintCustom {
    1: string
}

export class StorageManager {

    paintCustom: TouchStorage<IPaintCustom> = new TouchStorage<IPaintCustom>('paint-custom.ini', { 1: 'Flat' }).setAutoSave(true)

    themeStyle: object

    appSetting: object

    account: AccountStorage
    constructor() {

        this.account = reactive(new AccountStorage(window.$nodeApi.getConfig('account.ini')))

        this.appSetting = reactive(window.$nodeApi.getConfig('app-setting.ini'))
        if( !this.appSetting.hasOwnProperty('autoStart') ) this.appSetting = reactive({
            autoStart: false,
            defaultApp: 0,
            plugin: {
                sync: 0,
                syncLatest: false,
                dataSync: false
            },
            dev: {
                autoCloseDev: true
            },
            lang: {
                followSystem: true,
                locale: 0
            },
            keyBind: {
                summon: 0,
                home: 0,
                plugins: 0,
                settings: 0
            }
        })
        watch(this.appSetting, async () => {

            if ( this.appSetting['lang']['followSystem'] )
                // @ts-ignore
                window.$i18n.global.locale.value = languages[navigator.language.toLowerCase()]
            else
                // @ts-ignore
                window.$i18n.global.locale.value = languages[this.appSetting['lang']['locale']]['key']

            await this._save('app-setting.ini', this.appSetting)

        }, { immediate: true, deep: true })

        this.themeStyle = reactive(window.$nodeApi.getConfig('theme-style.ini'))
        if( !this.themeStyle.hasOwnProperty('dark') ) this.themeStyle = reactive({
            dark: false,
            coloring: true,
            blur: false,
            contrast: false,
            autoDark: false
        })

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const callback = (e) => {
            if( !this.themeStyle['autoDark'] ) return
            this.themeStyle['dark'] = e.matches
        };
        media.addEventListener('change', callback);
        callback(media);

        watch(this.themeStyle, async () => {
            const clsL = document.body.parentNode['classList']

            this.themeStyle['dark'] ? clsL.add('dark') : clsL.remove('dark')
            this.themeStyle['blur'] ? clsL.add('blur') : clsL.remove('blur')
            this.themeStyle['coloring'] ? clsL.add('coloring') : clsL.remove('coloring')
            this.themeStyle['autoDark'] &&  callback(media);

            await this._save('theme-style.ini', this.themeStyle)

        }, { deep: true, immediate: true })

    }

    async _save(name: string, data: object, clear: boolean = false) {
        return window.$nodeApi.saveConfig(name, JSON.stringify(data), clear)
    }

}

window.onbeforeunload = () => {
    for (const storage of storages.values()) {
        window.$nodeApi.saveConfig(storage['#qualifiedName'], JSON.stringify(unref(storage.data) || storage._initData), true)
    }
}

export function genStorageManager() {

    return new StorageManager()
}