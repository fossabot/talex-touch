<template>
  <div class="Home-Container">
    <div class="Home-Logo">
      <div class="Home-Logo-Bg">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300px" height="300px">
          <circle class="g-polygon-move" cx="150" cy="150" r="150" fill="none" />
        </svg>
      </div>

      <img src="@assets/logo.svg" alt="logo" />
    </div>

    <div class="Home-Text">
      <svg viewBox="0 0 400 200">
        <text x="0" y="70%"> TalexTouch </text>
      </svg>

      <p>{{ $t('app.description') }}</p>
    </div>

    <ul class="Home-Footer">
      <li>
        <remix-icon name="git-branch" />
        <span>main</span>
      </li>
      <li>
        <remix-icon name="github" />
        <span>{{ packageJson.version }}</span>
      </li>
      <li>
        <remix-icon name="bug" />
        <span>DISABLED</span>
      </li>
    </ul>
  </div>
</template>

<script>
import RemixIcon from '@comp/icon/RemixIcon.vue'

export default {
  name: "Home",
  components: { RemixIcon }
}
</script>

<script setup>
import { $t } from '@modules/lang'

const packageJson = window.$nodeApi.getPackageJSON()

</script>

<style lang="scss" scoped>
.Home-Footer {
  position: absolute;
  display: flex;
  justify-content: space-between;

  width: 50%;

  bottom: 20%;

  transition: all .25s ease-in-out;
  li {
    :deep(.remix) {
      position: relative;
      margin-left: -5px;
      margin-right: 5px;
      padding: 2px;
      top: .15em;

      border-radius: 50%;
      background-color: var(--el-fill-color-darker);
    }
    padding: 4px 12px;
    border-radius: 8px;
    list-style: none;

    background-color: var(--el-fill-color-light);
  }
}

@media screen and (min-width: 1600px) {
  .Home-Text {
    top: 40% !important;
  }

  .Home-Logo {
    top: 10% !important;
    zoom: 1.5;
  }

  .Home-Footer {
    bottom: 25% !important;
  }
}

.Home-Text {
  position: absolute;

  top: 50%;

  width: 50%;
  height: 30%;

  transition: all .25s ease-in-out;
  p {
    margin-top: -5%;

    opacity: .75;
    text-align: center;
  }

svg {
  width: 100%;
  height: 100%;

  margin-top: -100px;
}

  svg text {
    text-transform: uppercase;
    animation: stroke 5s infinite alternate;
    letter-spacing: 20px;
    font-size: 40px;
  }
  @keyframes stroke {
    0% {
      fill: rgba(72, 138, 20, 0);
      stroke: rgba(54, 95, 160, 1);
      stroke-dashoffset: 25%;
      stroke-dasharray: 0 50%;
      stroke-width: 0.2;
    }
    50% {
      fill: rgba(72, 138, 20, 0);
      stroke: rgba(54, 95, 160, 1);
      stroke-width: 0.5;
    }
    70% {
      fill: rgba(72, 138, 20, 0);
      stroke: rgba(54, 95, 160, 1);
      stroke-width: 1;
    }
    90%,
    100% {
      fill: rgba(72, 138, 204, 1);
      stroke: rgba(54, 95, 160, 0);
      stroke-dashoffset: -25%;
      stroke-dasharray: 50% 0;
      stroke-width: 0;
    }
  }
}

.Home-Logo {
  position: absolute;

  top: 15%;
  left: 50%;

  width: 150px;
  height: 150px;

  transform: translateX(-50%);
  transition: all .25s ease-in-out;
  filter: drop-shadow(0 0 4px var(--el-color-primary));
  img {
    position: absolute;

    top: 0;

  }

  .Home-Logo-Bg {
    svg {
      overflow: visible;
    }

    .g-polygon-wrap,
    .g-polygon-move {
      fill: none;
      stroke: var(--el-color-primary);
      stroke-width: 2;
      stroke-linejoin: round;
      stroke-linecap: round;
    }

    .g-polygon-move {
      transform-origin: center center;
      transform: scale(1.05);
      //stroke: linear-gradinet(180deg, red, transprent);
      stroke-width:1.5;
      stroke-dasharray: 280, 700;
      stroke-dashoffset: 8;
      animation: move 2.4s infinite linear;
    }

    @keyframes move {
      0% {
        stroke-dashoffset: 8;
      }
      100% {
        stroke-dashoffset: -972;
      }
    }

    transform: scale(.5) translate(-50%, -50%);
  }
}

.Home-Container {
  position: relative;
  //padding: 5%;
  display: flex;
  flex-direction: column;
  align-items: center;

  height: 100%;

  box-sizing: border-box;
}
</style>