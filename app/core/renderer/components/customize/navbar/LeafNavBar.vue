<template>
  <ul class="NavBar-Home" @click="activePlugin = ''">
    <IconButton direct="/home" icon="home-3" />
    <IconButton direct="/market" icon="quill-pen"></IconButton>
    <IconButton direct="/plugin" icon="plug-2" />
    <IconButton direct="/setting" icon="settings-6"></IconButton>
  </ul>

  <ul class="NavBar-Programs">
    <slot name="plugin-nav" />
  </ul>
</template>

<script name="LeafNavBar" setup>
import IconButton from '@comp/base/button/IconButton.vue'
import { inject } from "vue";

const activePlugin = inject('activePlugin')

</script>

<style lang="scss" scoped>
.NavBar-Programs {
  position: relative;
  padding: 0;
  display: flex;
  flex-direction: column;

  width: 100%;

  box-sizing: border-box;
  border-radius: 8px;
  --fake-color: var(--el-fill-color-light);
  --fake-radius: 8px;
  --fake-opacity: .35;

  :deep(.IconButton-Container) {
    transform: scale(.75);
  }
}

.NavBar-Home {
  * {
    -webkit-app-region: no-drag;
  }
  position: relative;
  margin: 0;
  padding: 10px 0;
  display: flex;
  flex-direction: column;

  justify-content: space-between;

  width: 100%;
  height: 50%;

  box-sizing: border-box;
}
</style>