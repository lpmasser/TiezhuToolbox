<template>
    <el-row>
        <el-col :span="12">
            <el-radio-group v-model="devicechoice" style="margin-bottom: 20px">
                <el-radio-button :label="0">电脑模拟器</el-radio-button>
                <el-radio-button :label="1">ipad</el-radio-button>
            </el-radio-group>
            <el-col v-if="devicechoice === 0">
                <el-row>
                    <el-col>
                        <el-autocomplete v-model="state" :fetch-suggestions="querySearch" placeholder="输入模拟器端口"
                            @select="handleSelect" class="port-input" clearable>
                            <template #default="{ item }">
                                <span class="name">{{ item.name }}</span>
                                <span class="value">{{ item.value }}</span>
                            </template>
                        </el-autocomplete>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col>
                        <el-button @click="connectADB">连接</el-button>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col>
                        <el-select v-model="value" placeholder="选择模拟器" @change="handleChange" class="device-select">
                            <el-option v-for="item in options" :value="item.value" />
                        </el-select>
                    </el-col>
                </el-row>
            </el-col>
            <el-col v-else="devicechoice === 1">
                <el-row>
                    <el-col :span="8">
                        <el-button @click="connectios">识别</el-button>
                    </el-col>
                    <el-col :span="16">
                        <el-button @click="imageMount">加载镜像</el-button>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col>
                        <el-select v-model="iosudid" placeholder="设备udid" @change="ioshandleChange" class="ios-select">
                            <el-option :value="iosudid" />
                        </el-select>
                    </el-col>
                </el-row>
            </el-col>
        </el-col>
        <el-col :span="12">
            <el-row>
                <el-text type="danger">仅支持16:9 分辨率请勿太低</el-text>
            </el-row>
            <el-row>
                <el-text>输入端口号后连接模拟器 默认端口号不一定对请自己查看</el-text>
            </el-row>
            <el-row>
                <el-text>连接ios设备之前 请打开开发者模式</el-text>
            </el-row>
            <el-row>
                <el-text>ios识别速度会慢一些 介意勿用</el-text>
            </el-row>
            <el-row>
                <el-text>推荐装备后的百分比 为有效分数占比</el-text>
            </el-row>
            <el-row>
                <el-text>本软件fork自</el-text>
                <el-link href="https://github.com/Mooooooon/TiezhuToolbox" type="primary" target="_blank">Github</el-link>
            </el-row>
            <el-row>
                <el-text>fork地址为</el-text>
                <el-link href="https://github.com/lpmasser/TiezhuToolbox" type="primary" target="_blank">Github</el-link>
            </el-row>
        </el-col>
    </el-row>
</template>
  
<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { exec } from 'child_process'
import { useAdbStore } from '../store/status'
import { useIosStore } from '../store/status'
import { usetypeStore } from '../store/status'
import path from 'path'

const adbStore = useAdbStore()
const iosStore = useIosStore()
const typeStore = usetypeStore()
const value = ref(adbStore.device)
interface NameItem {
    value: string
    name: string
}

const state = ref('')
const names = ref<NameItem[]>([])
const options = ref<NameItem[]>([])
const devicechoice = ref(0)
const iosudid = ref(iosStore.udid)

const querySearch = (queryString: string, cb: (arg0: { value: string; name: string }[]) => void) => {
    const results = queryString
        ? names.value.filter(createFilter(queryString))
        : names.value
    // call callback function to return suggestion objects
    cb(results)
}
const createFilter = (queryString: string) => {
    return (restaurant: { value: string }) => {
        return (
            restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
        )
    }
}
const loadAll = () => {
    return [
        { value: '62001', name: '夜神模拟器' },
        { value: '16384', name: 'MuMu模拟器 12' },
        { value: '7555', name: 'MuMu模拟器 6' },
        { value: '6555', name: '天天模拟器' },
        { value: '5555', name: 'BlueStacks' },
    ]
}
const handleSelect = (item: NameItem) => {
    console.log(item)
    adbStore.port = item.value
}
const handleChange = (newValue: string) => {
    adbStore.device = newValue
    typeStore.type = 'success'
    typeStore.word = 'ADB已连接'
    console.log('选择的设备已更新:', adbStore.device)
}
const ioshandleChange = (newValue: string) => {
    iosStore.udid = newValue
    typeStore.type = 'success'
    typeStore.word = 'IOS已连接'
    console.log('选择的设备已更新:', iosStore.udid)
}

const connectADB = () => {
    ElMessage('模拟器连接中……')
    const adbPath = path.join(process.cwd(), 'platform-tools', 'adb.exe')
    exec(adbPath + ' connect 127.0.0.1:' + state.value, (error, stdout, stderr) => {
        ElMessage.closeAll()
        if (error) {
            ElMessage.error(error.message)
            return
        }
        if (stderr) {
            ElMessage.error(stderr)
            return
        }
        if (stdout.includes("connected to")) {
            ElMessage({
                message: '模拟器连接成功。',
                type: 'success',
            })
            adbStore.status = 1
            exec(adbPath + ' devices', (error, stdout, stderr) => {
                if (error) {
                    console.error('获取设备列表失败:', error)
                    return
                }
                console.log('连接的设备:', stdout)
                // 分割字符串以获取设备列表
                let devices = stdout.split('\n')
                    .filter(line => line.includes('device'))
                    .map(line => {
                        const deviceValue = line.replace('device', '').trim()
                        return { value: deviceValue, name: deviceValue }
                    })
                if (devices.length > 0 && devices[0].value === 'List of s attached') {
                    devices = devices.slice(1) // 移除数组的第一个元素
                }
                options.value = devices  // 更新 Pinia store 中的设备列表
                adbStore.deviceList = options.value
                console.log('更新后的设备:', options.value)

                // 自动选择选项
                if (options.value.length === 1) {
                    value.value = options.value[0].value
                    adbStore.device = options.value[0].value
                    console.log('自动选择的设备:', adbStore.device)
                    typeStore.type = 'success'
                    typeStore.word = 'ADB已连接'
                }
            })
        } else {
            ElMessage.error('模拟器连接失败。')
        }
    })
    const activeElement = document.activeElement as HTMLElement
    if (activeElement) {
        activeElement.blur()
    }
}

onMounted(() => {
    names.value = loadAll()
    state.value = adbStore.port
    options.value = adbStore.deviceList
})

const connectios = () => {
    ElMessage('列表获取中……')
    const iosPath = path.join(process.cwd(), 'platform-tools', 'ios.exe')
    exec(iosPath + ' list --nojson', (error, stdout, stderr) => {
        ElMessage.closeAll()
        if (error) {
            ElMessage.error(error.message)
            return
        }
        if (stderr) {
            ElMessage.error(stderr)
            return
        }
        if (stdout) {
            ElMessage({
                duration: 1000,
                message: '检测到ios设备。',
                type: 'success',
            })
            iosStore.status = 1
            let udid_all = stdout.replace(' ', '').split('/n')
            if (udid_all.length === 1) {
                typeStore.type = 'success'
                typeStore.word = 'IOS已连接'
                iosudid.value = udid_all[0]
                iosStore.udid = udid_all[0]
            }
        } else {
            ElMessage.error('未检测到设备')
        }
    })
    const activeElement = document.activeElement as HTMLElement
    if (activeElement) {
        activeElement.blur()
    }
}

const imageMount = () => {
    ElMessage('镜像加载中……')
    let iosPath = ''
    let imagePath = ''
    if (iosStore.udid != '') {
        iosPath = path.join(process.cwd(), 'platform-tools', 'ios.exe')
        imagePath = path.join(process.cwd(), 'DeveloperDiskImage', 'DeveloperDiskImage.dmg') + ' --nojson' + ` --udid=${iosStore.udid}`
    } else {
        iosPath = path.join(process.cwd(), 'platform-tools', 'ios.exe')
        imagePath = path.join(process.cwd(), 'DeveloperDiskImage', 'DeveloperDiskImage.dmg') + ' --nojson'
    }
    exec(iosPath + ' image mount --path=' + imagePath, (error, stdout, stderr) => {
        ElMessage.closeAll()
        if (error) {
            ElMessage.error(error.message)
            return
        }
        if (stderr) {
            if (stderr.includes('there is already a developer image mounted')) {
                ElMessage('存在已加载的镜像,如需重新加载请重启iOS设备')
            } else if (stderr.includes('success mounting image')) {
                ElMessage({
                    duration: 1000,
                    message: '加载完成',
                    type: 'success',
                })
            } else {
                ElMessage.error(stderr)
                return
            }
        }
        if (stdout) {
            ElMessage({
                duration: 1000,
                message: '加载完成',
                type: 'success',
            })
        }
    })
    const activeElement = document.activeElement as HTMLElement
    if (activeElement) {
        activeElement.blur()
    }
}

</script>
  
<style>
.port-input,
.device-select {
    width: 220px;
}

.ios-select {
    width: 250px;
}

.name {
    width: 65%;
    display: block;
    float: left;
}

.value {
    width: 35%;
    display: block;
    float: left;
}

.el-row {
    margin-bottom: 10px;
}
</style>
  ../store/status