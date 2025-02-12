<template>
  <div class="PluginView-Container fake-background" :class="{ active: status === 4, done }">
    <div class="PluginView-Loader cubic-transition">
      <Loading />
      <span>插件正在加载中...</span>
    </div>
    <webview ref="webviewDom" :class="{ exist: status === 3 || status === 4 }" />
  </div>
</template>

<script>

export default {
  name: "PluginView",
}
</script>

<script setup>
import { nextTick, onMounted, onUpdated, ref, watchEffect } from "vue";
import { forDialogMention } from "@modules/mention/dialog-mention";
import { pluginManager } from "@modules/samples/node-api";
import Loading from "@comp/icon/LoadingIcon.vue";

const props = defineProps({
  plugin: {
    type: Object,
    required: true
  }
})
const loadDone = ref(false)
const status = computed(() => props.plugin?._status || 0)
const done = computed(() => (status.value === 3 || status.value === 4) && loadDone.value)

const webviewDom = ref(null)

function init() {
  const viewData = props.plugin.webview;
  if ( !viewData ) return
  const { _, attrs, styles, js } = viewData

  pluginManager.setPluginWebviewInit(props.plugin.pluginInfo.name)
  props.plugin.isWebviewInit = true

  const webview = webviewDom.value
  console.log( props.plugin, webview )

  viewData.el = webview.parentElement

  Object.keys(attrs).forEach(key => {
    webview.setAttribute(key, attrs[key])
  })

  _.preload && webview.setAttribute('preload', "file://" + _.preload)

  webview.addEventListener('crashed', () => {
    console.log("Webview crashed", props.plugin)
  })

  webview.addEventListener('did-fail-load', async (e) => {
    console.log("Webview did-fail-load", e, props.plugin)

    await forDialogMention( props.plugin.pluginInfo.name, e.errorDescription, props.plugin.pluginInfo.icon, [
      {
        content: "忽略加载",
        type: 'info',
        onClick: () => true
      },
      {
        content: "重启插件",
        type: 'warning',
        onClick: () => pluginManager.reloadPlugin(props.plugin.pluginInfo.name) && true
      }
    ] )

  })

  webview.addEventListener('did-finish-load', () => {
    if ( status.value === 4 )
      webview.openDevTools()

    webview.insertCSS(`${styles}`)
    webview.executeJavaScript(String.raw `${js}`)

    webview.send('@talex-plugin:preload', "${name}")

    console.log("Webview did-finish-load", props.plugin)
    loadDone.value = true
  })

  loadDone.value = false
  webview.setAttribute('src', _.indexPath )
}

watch(status, (val, oldVal) => {
  if ( props.plugin?.isWebviewInit ) return

  if ( (val === 3 && oldVal === 4) || (oldVal === 3 && val === 4) ) init()
  // else if ( val === 4 ) webviewDom.value.openDevTools()
  // else webviewDom.value.closeDevTools()
})
</script>

<style lang="scss" scoped>
.PluginView-Loader {
  position: absolute;
  display: flex;
  padding: 8px;

  gap: 12px;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  left: 50%;
  top: 50%;

  border-radius: 8px;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -50%);
}

.PluginView-Container {
  &.done {
    .PluginView-Loader {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.2);
    }
  }
  &.active {
    opacity: 1;
  }
  webview {
    height: 100%;
  }
  position: absolute;

  left: 0;
  top: 0;

  width: 100%;
  height: 100%;

  opacity: 0;
}
</style>