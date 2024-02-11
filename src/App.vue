<template>
  <div class="common-layout" style="height: 100%;">
    <el-container style="height: 100%;">
      <el-header>
        <Header></Header>
      </el-header>
      <el-main>
        <Welcome v-if="menuStore.menuIndex === '1'" />
        <Suspense v-else-if="menuStore.menuIndex === '2'">
          <template #default>
            <Blacksmith />
          </template>
          <template #fallback>
            <div>加载中...</div>
          </template>
        </Suspense>
        <Suspense v-else-if="menuStore.menuIndex === '3'">
          <template #default>
            <Setting />
          </template>
          <template #fallback>
            <div>加载中...</div>
          </template>
        </Suspense>
      </el-main>
      <el-footer class="toolbox-footer">
        <Footer></Footer>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import Welcome from './components/Welcome.vue'
import Blacksmith from './components/Blacksmith.vue'
import Setting from './components/Setting.vue'
import { useMenuStore } from './store/menu'
import { useDataStore } from './store/data'
import path from 'path'
import fs from 'fs'
import { ipcRenderer } from 'electron'
import { ElMessage } from 'element-plus'

const menuStore = useMenuStore()
const config = useDataStore()
const configJson = require(path.join(process.cwd(), 'config.json'))
config.standardScore = configJson["standardScore"]
config.attriScoreLine = configJson["attriScoreLine"]
config.primaScoreLine = configJson["primaScoreLine"]
config.vaildline = configJson["vaildline"]
config.scanfrequency = configJson["scanfrequency"]

const saveData = () => {

  console.log('ipc触发')
  const configWrite = {
    "standardScore": config.standardScore,
    "attriScoreLine": config.attriScoreLine,
    "primaScoreLine": config.primaScoreLine,
    "vaildline": config.vaildline,
    "scanfrequency": config.scanfrequency
  }

  const configWrite_json = JSON.stringify(configWrite)

  fs.writeFile('config.json', configWrite_json, (err) => {
    if (err) {
      ElMessage.error(`配置文件保存错误：${err}`)
      console.log(err)
      setTimeout(()=>{
        ipcRenderer.send('quit')
      },1000)
    }
    console.log("JSON data is saved.");
    ipcRenderer.send('quit')
  })
}

ipcRenderer.on('save-data', saveData)
</script>

<style>
.toolbox-footer {
  line-height: 60px;
}
</style>
