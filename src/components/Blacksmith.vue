<template>
    <el-row>
        <el-col :span="10">
            <el-row justify="space-around">
                <el-col :span="6">
                    <el-button @click="takeScreenshot" type="primary">截图</el-button>
                </el-col>
                <el-col style="margin-top: 5px;" :span="16">
                    <el-text class="mx-1 bold" size="large">请打开装备详情界面</el-text>
                </el-col>
            </el-row>
            <el-row justify="space-around">
                <el-col :span="7" style="margin-top: 5px;">
                    <el-text class="mx-1 bold" size="large">自动扫描：</el-text>
                </el-col>
                <el-col :span="6">
                    <el-input v-model="autoscan">
                        <template class="w-25" #append>
                            <el-text class="mx-1 bold" size="large">s</el-text>
                        </template>
                    </el-input>
                </el-col>
                <el-col :span="4">
                    <el-switch v-model="autoscanswitch" inline-prompt active-text="开启" inactive-text="关闭" @change="auto" />
                </el-col>
            </el-row>
            <el-descriptions v-if="score_line" class="gear-info" title="装备信息" :column="1">
                <el-descriptions-item label="强化等级">
                    {{ enhancementLevel !== undefined ? '+' + enhancementLevel : '' }}
                </el-descriptions-item>
                <el-descriptions-item label="装备部位">{{ part }}</el-descriptions-item>
                <el-descriptions-item :label="`主属性：${primaryAttribute[0]}`">{{ primaryAttribute[1] }}</el-descriptions-item>
                <el-descriptions-item :label="attribute[0][0]">{{ attribute[0][1] }}</el-descriptions-item>
                <el-descriptions-item :label="attribute[1][0]">{{ attribute[1][1] }}</el-descriptions-item>
                <el-descriptions-item :label="attribute[2][0]">{{ attribute[2][1] }}</el-descriptions-item>
                <el-descriptions-item :label="attribute[3][0]">{{ attribute[3][1] }}</el-descriptions-item>
                <el-descriptions-item label="套装">{{ set }}</el-descriptions-item>
                <el-descriptions-item v-if="reforge_mode" label="分数">{{ score_reforge }}</el-descriptions-item>
                <el-descriptions-item v-else label="分数">{{ score }}</el-descriptions-item>
                <el-descriptions-item label="目标分数">{{ score_line }}</el-descriptions-item>
                <!-- <el-descriptions-item label="预期分数">{{ expectantScore }}</el-descriptions-item> -->
            </el-descriptions>
        </el-col>
        <el-col :span="14">
            <!-- <el-row>
                <el-col>
                    <el-image v-if="src" :src="src">
                        <template #placeholder>
                            <div class="image-slot">Loading<span class="dot">...</span></div>
                        </template>
                    </el-image>
                </el-col>
            </el-row> -->
            <el-row v-if="score_line">
                <el-col>
                    <el-text class="mx-1" size="large">强化建议：</el-text>
                    <el-text class="mx-1" :class="enhancedRecommendation[1]" size="large">{{ enhancedRecommendation[0]
                    }}</el-text>
                </el-col>
                <el-col style="margin-top: 10px; margin-bottom: 10px;">
                    <el-text class="mx-1" size="large">可用英雄：{{ heroesNum }} 位</el-text>
                </el-col>
                <el-col>
                    <el-scrollbar style="height: 320px; overflow-y: auto;min-width: 300px;">
                        <el-row v-if="enhancedRecommendation">
                            <!-- topHeroes中的el-col部分移入el-scrollbar -->
                            <el-col :span="12" v-for="hero in topHeroes" :key="hero.heroCode">
                                <el-row style="margin-bottom: 0;">
                                    <el-col :span="7">
                                        <el-avatar :size="50" :src="hero.avatar" />
                                    </el-col>
                                    <el-col :span="17">
                                        <el-row style="margin-bottom: 0;" justify="space-around">
                                            <el-col style="margin-top: 7px;" :span="12">
                                                <el-image v-for="equipImage in hero.equipImages"
                                                    style="width: 20px; margin-right: 5px;" :src="equipImage.imagePath" />
                                            </el-col>
                                            <el-col style="margin-top: 10px;" :span="12">
                                                <el-text style="bottom: 7px;" class="mx-1" size="large" type="success">{{
                                                    hero.validscore
                                                }}%</el-text>
                                            </el-col>
                                        </el-row>
                                        <el-row>
                                            <el-text class="mx-1 bold">{{ hero.chineseName }}</el-text>
                                        </el-row>
                                    </el-col>
                                </el-row>
                                <el-descriptions :size="'small'" :column="2" class="hero-info">
                                    <el-descriptions-item v-for="(attribute, index) in hero.attributes" :key="index"
                                        :label="attribute[0]">
                                        <el-text class="mx-1 bold" size="small">{{ attribute[1] }}</el-text>
                                        <!-- <el-rate v-model="attribute[1]" disabled show-score text-color="#ff9900"
                                            :size="'small'" score-template="" /> -->
                                    </el-descriptions-item>
                                </el-descriptions>
                            </el-col>
                        </el-row>
                    </el-scrollbar>
                </el-col>
            </el-row>
        </el-col>
    </el-row>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { exec, spawn } from 'child_process'
import { useAdbStore } from '../store/status'
import { useIosStore } from '../store/status'
import path from 'path'
import fs from 'fs'
import { ElInfiniteScroll, ElMessage } from 'element-plus'
import { ipcRenderer } from 'electron'
import { ITEM_RENDER_EVT } from 'element-plus/es/components/virtual-list/src/defaults'

const Sharp = require('sharp')
const src = ref('')
const adbStore = useAdbStore()
const iosStore = useIosStore()
const enhancementLevel = ref(0)
const part = ref('')
const primaryAttribute = ref<string[]>(['', ''])
const attribute = ref<[string, string][]>([["", ""], ["", ""], ["", ""], ["", ""]])
const score = ref(0)
const score_reforge = ref('')
const enhancedRecommendation = ref<string[]>([])
const score_line = ref(0)
const expectantScore = ref(0)
const set = ref('')
const autoscan = ref('4')
const autoscanswitch = ref(false)
let reforge_mode: Boolean = false
let check: Boolean = false
let moreblack: Boolean = false
let boxPos: [number, number]
let ioscheck = 0
const heroesNum = ref(0)

interface HeroAttribute {
    [index: number]: [string, number] // [属性名称, 属性值]
}
interface Hero {
    heroCode: string
    attributes: HeroAttribute[]
    validscore: number
    rate: number
    avatar: string
    equipImages: EquipImage[]
    chineseName: string
}
interface EquipImage {
    equipCode: string // 装备编码
    imagePath: string // 装备图片路径
}
// 使用 ref 创建响应式引用
const topHeroes = ref<Hero[]>([])
const setMapping: { [key: string]: string } = {
    "破灭": "set_cri_dmg",
    "愤怒": "set_rage",
    "命中": "set_acc",
    "穿透": "set_penetrate",
    "攻击": "set_att",
    "抵抗": "set_res",
    "憎恨": "set_revenge",
    "防御": "set_def",
    "吸血": "set_vampire",
    "伤口": "set_scar",
    "生命": "set_max_hp",
    "反击": "set_counter",
    "守护": "set_shield",
    "速度": "set_speed",
    "夹攻": "set_coop",
    "激流": "set_torrent",
    "暴击": "set_cri",
    "免疫": "set_immune"
}
type StatsMapping = {
    [key in string]: string
}
const statsMapping: StatsMapping = {
    "攻击力": "atk",
    "防御力": "def",
    "生命值": "hp",
    "效果命中": "eff",
    "效果抗性": "efr",
    "速度": "spd",
    "暴击伤害": "chd",
    "暴击率": "chc"
}
type scoremap = {
    [key in string]: number[]
}
let standardScore: scoremap = {}
type attriscoremap = {
    [key in string]: number
}
let attriScoreLine: attriscoremap = {}
let primaScoreLine: attriscoremap = {}
let vaildline = 0

onMounted(() => {
    ElMessage('初始化中……')
    const configJson = require(path.join(process.cwd(), 'config.json'))
    standardScore = configJson["standardScore"]
    attriScoreLine = configJson["attriScoreLine"]
    primaScoreLine = configJson["primaScoreLine"]
    vaildline = configJson["vaildline"]
    ioscheck = iosStore.status
})

const child = spawn(path.join(process.cwd(), 'PaddleOCR-json', 'PaddleOCR-json.exe'), {
    cwd: path.join(process.cwd(), 'PaddleOCR-json'),
    stdio: ['pipe', 'pipe', 'pipe']
})
const translateSetName = (cnName: string) => {
    return setMapping[cnName]
}
const translateStatName = (cnStatName: string): string => {
    return statsMapping[cnStatName]
}

const auto = () => {
    if (autoscanswitch.value) {
        let time = parseFloat(autoscan.value) * 1000
        const scanInterval = setInterval(() => {
            if (!autoscanswitch.value) {
                clearInterval(scanInterval)
            }
            takeScreenshot()
        }, time)
    }
}

// 从子进程接收数据
child.stdout.on('data', (data: Buffer) => {
    let strOut: string = data.toString()
    // 检测启动成功
    if (strOut.includes('OCR init completed.')) {
        console.log('初始化完成！')
        ElMessage({
            message: '初始化完成！',
            type: 'success',
        })
    } else if (strOut.includes('PaddleOCR-json v1.3.0')) {
        console.log(strOut)
    } else {
        try {
            let jsonOutput = JSON.parse(strOut)
            if (jsonOutput.code === 100) {
                const gearInfo = jsonOutput.data.filter((item: { score: number }) => item.score >= 0.5).map((item: { text: string }) => item.text)
                const boxInfo = jsonOutput.data.filter((item: { score: number }) => item.score >= 0.5).map((item: { box: string }) => item.box)
                console.log(gearInfo)
                if (check) {
                    let redOrpurple = false
                    let havePart = false
                    if (gearInfo.includes("制作")) {
                        reforge_mode = true
                        check = false
                        getReforgeGearInfo()
                    } else {
                        //遍历寻找等级和装备类型位置
                        for (let t of gearInfo) {
                            if (t.includes("英雄")) {
                                redOrpurple = true
                                boxPos = boxInfo[gearInfo.indexOf(t)][0]
                                havePart = true
                            }
                            if (t.includes("传说")) {
                                boxPos = boxInfo[gearInfo.indexOf(t)][0]
                                havePart = true
                            }
                            if (t.includes("+")) {
                                enhancementLevel.value = parseInt(t.replace("+", ""), 10) || 0 // 强化等级 去掉 "+" 并转化为数字
                            }
                        }
                        if (havePart === false) {
                            ElMessage({
                                message: '未检测到装备类型',
                                type: 'error',
                            })
                            console.log("未检测到装备类型")
                            return
                        }
                        //等级不到12的紫装
                        if (redOrpurple && enhancementLevel.value < 12) {
                            moreblack = true
                        }
                        if (gearInfo.includes("强化装备")) {
                            check = false
                            getEnhanceGearInfo()
                        } else {
                            check = false
                            getBagGearInfo()
                        }
                    }
                } else if (reforge_mode) {  //装备重铸界面
                    let box_sort: [number, number][] = []
                    boxInfo.forEach((item: [number, number][]) => {
                        const x = item[0][0];
                        const y = item[0][1];
                        box_sort.push([x, y]);
                    });
                    const gearInfo_sort = insertionSort(gearInfo, box_sort)
                    //console.log(gearInfo_sort)
                    if (gearInfo_sort.length !== 15) {
                        ElMessage({
                            message: '数据可能不正确，请确认图片内容',
                            type: 'error',
                        })
                        console.log("数据可能不正确，请确认图片内容")
                        return
                    }

                    const mergedItem = []
                    mergedItem.push(gearInfo_sort[0])
                    mergedItem.push(`${gearInfo_sort[1]} > ${gearInfo_sort[2]}`)
                    primaryAttribute.value = mergedItem
                    const merged_before = []
                    const merged_after = []
                    const mergedItems = []
                    for (let i = 3; i < gearInfo_sort.length; i += 3) {
                        if (i + 2 < gearInfo_sort.length) {
                            const mergedArrayb = [gearInfo_sort[i], gearInfo_sort[i + 1]]
                            merged_before.push(mergedArrayb)
                            const mergedArraya = [gearInfo_sort[i], gearInfo_sort[i + 2]]
                            merged_after.push(mergedArraya)
                            const mergedArray = [gearInfo_sort[i], `${gearInfo_sort[i + 1]} -> ${gearInfo_sort[i + 2]}`]
                            mergedItems.push(mergedArray)
                        }
                    }
                    attribute.value = mergedItems as [string, string][]
                    const score_before = calculateScore(merged_before as [string, string][])
                    const score_after = calculateScore(merged_after as [string, string][])
                    score.value = score_after
                    score_reforge.value = `${score_before} > ${score_after}`
                    score_line.value = scoreLine()
                    enhancedRecommendation.value = calculateAnalysis()
                } else {
                    if (moreblack) {
                        //在索引8之后插入元素
                        gearInfo.splice(9, 0, '', '')
                    }
                    if (gearInfo.length !== 12) {
                        ElMessage({
                            message: '数据可能不正确，请确认图片内容',
                            type: 'error',
                        })
                        console.log("数据可能不正确，请确认图片内容")
                        return
                    }
                    part.value = gearInfo[0]
                    const mergedItem = []
                    mergedItem.push(gearInfo[1])
                    mergedItem.push(gearInfo[2])
                    primaryAttribute.value = mergedItem
                    const mergedItems = []
                    for (let i = 3; i < gearInfo.length; i += 2) {
                        if (i + 1 < gearInfo.length) {
                            const mergedArray = [gearInfo[i], gearInfo[i + 1]]
                            mergedItems.push(mergedArray)
                        }
                    }
                    attribute.value = mergedItems as [string, string][]
                    const original_string = gearInfo[11]
                    const modified_string = original_string.substring(0, 2)
                    set.value = modified_string
                    score.value = calculateScore(attribute.value)
                    //目标分数
                    score_line.value = scoreLine()
                    enhancedRecommendation.value = calculateAnalysis()
                    //expectantScore.value = parseFloat((expectant() + score.value).toFixed(2))
                    ipcRenderer.send('query-database', translateSetName(set.value))
                }
            } else {
                if (jsonOutput.code === 101) {
                    ElMessage({
                        message: '没有获取到数据，请确认图片内容',
                        type: 'error',
                    })
                }
                console.log('Code is not 100, original output:', strOut)
            }
        } catch (e) {
            console.error('Error parsing JSON:', e)
        }
    }
})

const insertionSort = (name: Array<string>, pos: [number, number][]) => {
    const length = name.length;
    if (length <= 1) {
        return name;
    }
    for (let i = 1; i < length; i++) {
        let ele = pos[i][1]
        for (let j = i - 1; j >= 0; j--) {
            if ((pos[j][1] - ele) > 5) {  // y坐标升序排列，误差5以内 
                const temp_pos = pos[j]
                pos[j] = pos[j + 1]
                pos[j + 1] = temp_pos
                const temp_name = name[j]
                name[j] = name[j + 1]
                name[j + 1] = temp_name
            } else {
                break;
            }
        }
    }
    for (let n = 1; n < length; n += 3) {
        for (let i = n; i < n + 2; i++) {
            let ele = pos[i][0]
            for (let j = i - 1; j >= (n - 1); j--) {
                if (pos[j][0] > ele) {  // x坐标升序排列
                    const temp_pos = pos[j]
                    pos[j] = pos[j + 1]
                    pos[j + 1] = temp_pos
                    const temp_name = name[j]
                    name[j] = name[j + 1]
                    name[j + 1] = temp_name
                } else {
                    break;
                }
            }
        }
    }
    return name
}

const queryResultListener = (event: any, result: { error?: any; data: any }) => {
    if (result.error) {
        console.error('Error in database query', result.error)
    } else {
        recommendGear(result)
    }
}
// 监听sql
ipcRenderer.on('query-result', queryResultListener)

const recommendGear = (heros: { data: any[] }) => {
    const resultArray = attribute.value
        .map(item => item[0]) // 获取 item[0] 的值
        .filter(item => item !== '') // 使用 filter 去掉空字符串
    const isSpecialPart = ["项链", "戒指", "鞋子"].includes(part.value)
    let primaryAttributeName = isSpecialPart ? translateStatName(primaryAttribute.value[0]) : ''

    const uniqueAttributes = new Set(resultArray)
    // 计算每个英雄的优先级
    const heroPriorities = heros.data.flatMap(hero => {
        let validscore = 0
        let attributesArray: any[][] = []
        let highWeightAttributesCount = 0 // 用于统计权重大于1的属性数量
        let vaildattribute: Array<string> = []
        uniqueAttributes.forEach(cnName => {
            const engName = translateStatName(cnName)
            const heroattribute = hero[engName] || 0
            if (checkAttribute(engName, hero[engName])) {
                highWeightAttributesCount++
                vaildattribute.push(cnName)
            }
            attributesArray.push([cnName, heroattribute])
        })
        // 检查是否至少有三个属性的权重大于1
        if (highWeightAttributesCount < 2) {
            return [] // 条件不满足，跳过此英雄
        }
        if (highWeightAttributesCount == uniqueAttributes.size) {
            validscore = 100
        } else {
            validscore = calculatevaild(vaildattribute)
        }

        if (isSpecialPart) {
            // 检查主属性优先级
            if (checkPrimary(primaryAttributeName, hero[primaryAttributeName]) == false) {
                return [] // 主属性不满足条件，跳过此英雄
            }
        }

        // 解析 "equip_list" 字段为数组
        const equipList = JSON.parse(hero.equip_list)
        // 遍历装备列表，为每个装备生成图片路径
        const equipImages = equipList.map((equipCode: string) => {
            const imagePath = path.join('tiezhu:', process.cwd(), 'avatar', equipCode + '.png')
            return { equipCode, imagePath }
        })

        const imagePath = path.join('tiezhu:', process.cwd(), 'avatar', hero.herocode + '.png')

        // 构建返回值对象，将解析后的 "equip_list" 添加到返回值中
        return [{ heroCode: hero.herocode, attributes: attributesArray, validscore, rate: hero.rate, avatar: imagePath, equipImages, chineseName: hero.chinese_name }]
    })


    // 过滤掉有效分数占比不足的装备
    const filteredHeroes = heroPriorities.filter(hero => hero.validscore > vaildline)
    heroesNum.value = filteredHeroes.length
    topHeroes.value = filteredHeroes.sort((a, b) => b.validscore - a.validscore)
}

const calculatevaild = (cnAttribute: Array<string>) => {
    let vaildcalculate: [string, string][] = []
    attribute.value.forEach(item => {
        if (cnAttribute.includes(item[0])) {
            vaildcalculate.push(item)
        }
    })
    const vaildscore = ((calculateScore(vaildcalculate) / score.value) * 100).toFixed()
    return Number(vaildscore)
}

const checkAttribute = (engName: string, attributeValue: number) => {
    switch (engName) {
        case 'atk': if (attributeValue > attriScoreLine['atk']) {
            return true
        } return false
        case 'def': if (attributeValue > attriScoreLine['def']) {
            return true
        } return false
        case 'hp': if (attributeValue > attriScoreLine['hp']) {
            return true
        } return false
        case 'spd': if (attributeValue > attriScoreLine['spd']) {
            return true
        } return false
        case 'chc': if (attributeValue > attriScoreLine['chc']) {
            return true
        } return false
        case 'chd': if (attributeValue > attriScoreLine['chd']) {
            return true
        } return false
        case 'eff': if (attributeValue > attriScoreLine['eff']) {
            return true
        } return false
        case 'efr': if (attributeValue > attriScoreLine['efr']) {
            return true
        } return false
    }
}

const checkPrimary = (engName: string, attributeValue: number) => {
    switch (engName) {
        case 'atk': if (attributeValue > primaScoreLine['atk']) {
            return true
        } return false
        case 'def': if (attributeValue > primaScoreLine['def']) {
            return true
        } return false
        case 'hp': if (attributeValue > primaScoreLine['hp']) {
            return true
        } return false
        case 'spd': if (attributeValue > primaScoreLine['spd']) {
            return true
        } return false
        case 'chc': if (attributeValue > primaScoreLine['chc']) {
            return true
        } return false
        case 'chd': if (attributeValue > primaScoreLine['chd']) {
            return true
        } return false
        case 'eff': if (attributeValue > primaScoreLine['eff']) {
            return true
        } return false
        case 'efr': if (attributeValue > primaScoreLine['efr']) {
            return true
        } return false
    }
}

// 监听退出事件
child.on('close', () => {
    console.log('子进程退出')
})
// 因为这个工具的作者把info输出在了stderr，所以不要做错误处理
// child.stderr.on('data', (data) => {
//     console.error(`子进程错误输出：${data}`)
// })

//截图
const takeScreenshot = () => {
    const tempFolderPath = path.join(process.cwd(), 'temp') // 指定temp文件夹的路径
    // 检查temp文件夹是否存在，不存在则创建它
    if (!fs.existsSync(tempFolderPath)) {
        fs.mkdirSync(tempFolderPath)
    }

    //初始化
    reforge_mode = false
    enhancementLevel.value = 0
    attribute.value = [["", ""], ["", ""], ["", ""], ["", ""]]
    moreblack = false

    if (ioscheck === 1) {
        const iosPath = path.join(process.cwd(), 'platform-tools', 'ios.exe')
        const screenshotFilePath = path.join(tempFolderPath, 'screenshot.png') // 指定截图文件的路径
        const iosCommand = `${iosPath} screenshot --nojson --output=${screenshotFilePath} --udid=${iosStore.udid}`
        console.log(iosCommand)
        exec(iosCommand, async (error, stdout, stderr) => {
            if (error) {
                console.error('截图错误:', error)
                return
            }
            if (stderr) {
                console.error('截图错误:', stderr)
                return
            }
            // 检查 stdout 是否包含 "file pulled" 字符串
            if (stdout.includes('screenshot.png')) {
                console.log(stdout)
                await checkMode()
                const randomVersion = Math.random().toString(36).substring(7)
                const imagePath = path.join('tiezhu:', process.cwd(), 'temp', 'screenshot.png')
                src.value = `${imagePath}?v=${randomVersion}`
            } else {
                console.error("截图失败，未能成功拉取文件")
            }
        })
    } else {
        if (adbStore.status === 0) {
            ElMessage({
                message: '尚未连接',
                type: 'error',
            })
            return
        }
        const selectedDeviceId = adbStore.device
        const adbPath = path.join(process.cwd(), 'platform-tools', 'adb.exe')
        const screenshotFilePath = path.join(tempFolderPath, 'screenshot.png') // 指定截图文件的路径
        const adbCommand = adbPath + ' -s ' + selectedDeviceId + ' shell screencap -p /sdcard/screenshot.png && ' + adbPath + ' -s ' + selectedDeviceId + ' pull /sdcard/screenshot.png ' + screenshotFilePath

        exec(adbCommand, async (error, stdout, stderr) => {
            if (error) {
                console.error('截图错误:', error)
                return
            }
            if (stderr) {
                console.error('截图错误:', stderr)
                return
            }
            // 检查 stdout 是否包含 "file pulled" 字符串
            if (stdout.includes("file pulled")) {
                await checkMode()
                const randomVersion = Math.random().toString(36).substring(7)
                const imagePath = path.join('tiezhu:', process.cwd(), 'temp', 'screenshot.png')
                src.value = `${imagePath}?v=${randomVersion}`
            } else {
                console.error("截图失败，未能成功拉取文件")
            }
        })
    }

    const activeElement = document.activeElement as HTMLElement
    if (activeElement) {
        activeElement.blur()
    }
}

//Ocr识别
const textOcr = async (imagePath: string): Promise<any> => {
    // 准备待发送的指令
    const imgObj = { "image_path": path.join(process.cwd(), imagePath) }
    const imgStr = JSON.stringify(imgObj) + "\n"
    child.stdin.write(imgStr)
}

//获取界面信息
const checkMode = async () => {
    const processedImagePath = path.join('temp', 'check_mode.png') // 使用 path.join 拼接路径
    check = true
    const ioscropOptions = { left: 0, top: 162, width: 2388, height: 1344 }
    const cropOptions = { left: 85, top: 0, width: 750, height: 185 }
    const blackOverlay = Buffer.from(
        `<svg width="750" height="185">
                <rect x="180" y="0" width="570" height="140" fill="black" />
                <rect x="0" y="70" width="40" height="80" fill="black" />
                <rect x="0" y="150" width="420" height="35" fill="black" />
        </svg>`
    )
    if (ioscheck === 1) {
        await Sharp(path.join('temp', 'screenshot.png')) // 使用 path.join 拼接路径
            .extract(ioscropOptions)
            .resize(1600, 900)
            .toFile(path.join('temp', 'resized.png'))
    } else {
        await Sharp(path.join('temp', 'screenshot.png')) // 使用 path.join 拼接路径
            .resize(1600, 900)
            .toFile(path.join('temp', 'resized.png'))
    }

    await Sharp(path.join('temp', 'resized.png')) // 使用 path.join 拼接路径
        .extract(cropOptions)
        .composite([{ input: blackOverlay, top: 0, left: 0 }])
        .toFile(processedImagePath)

    await textOcr(processedImagePath)
}

const getBagGearInfo = async () => {
    const processedImagePath = path.join('temp', 'gear_info.png') // 使用 path.join 拼接路径
    let blackAttri: string = '<rect x="0" y="415" width="380" height="65" fill="black" />'
    if (moreblack) {
        blackAttri = '<rect x="0" y="385" width="380" height="95" fill="black" />'
    }
    let cropOptions = { left: 0, top: 0, width: 370, height: 530 }
    cropOptions['left'] = boxPos[0] - 140 + 85
    cropOptions['top'] = boxPos[1]
    const blackOverlay = Buffer.from(
        `<svg width="370" height="530">
                <rect x="0" y="0" width="185" height="25" fill="black" />
                <rect x="0" y="25" width="370" height="205" fill="black" />
                <rect x="0" y="230" width="50" height="40" fill="black" />
                <rect x="0" y="270" width="370" height="20" fill="black" />
                ${blackAttri}
                <rect x="0" y="480" width="60" height="50" fill="black" />
                <rect x="117" y="480" width="253" height="50" fill="black" />
        </svg>`
    )
    await Sharp(path.join('temp', 'resized.png')) // 使用 path.join 拼接路径
        .extract(cropOptions)
        .composite([{ input: blackOverlay, top: 0, left: 0 }])
        .toFile(processedImagePath)
    await textOcr(processedImagePath)
}

const getReforgeGearInfo = async () => {
    const processedImagePath = path.join('temp', 'gear_info.png') // 使用 path.join 拼接路径
    let cropOption = { left: 480, top: 480, width: 500, height: 180 }
    const blackOverlay = Buffer.from(
        `<svg width="500" height="180">
                <rect x="0" y="0" width="45" height="40" fill="black" />
                <rect x="360" y="0" width="30" height="180" fill="black" />
        </svg>`
    )
    await Sharp(path.join('temp', 'resized.png')) // 使用 path.join 拼接路径
        .extract(cropOption)
        .composite([{ input: blackOverlay, top: 0, left: 0 }])
        .toFile(processedImagePath)

    await textOcr(processedImagePath)
}

//获取强化界面装备信息
const getEnhanceGearInfo = async () => {
    const processedImagePath = path.join('temp', 'gear_info.png') // 使用 path.join 拼接路径
    let blackAttri: string = '<rect x="0" y="380" width="435" height="60" fill="black" />'
    if (moreblack) {
        blackAttri = '<rect x="0" y="335" width="435" height="105" fill="black" />'
    }
    const cropOptions = { left: 35, top: 102, width: 435, height: 500 }
    const blackOverlay = Buffer.from(
        `<svg width="435" height="500">
                <rect x="0" y="0" width="184" height="60" fill="black" />
                <rect x="0" y="50" width="435" height="110" fill="black" />
                <rect x="0" y="160" width="50" height="60" fill="black" />
                <rect x="0" y="210" width="435" height="30" fill="black" />
                ${blackAttri}
                <rect x="0" y="440" width="60" height="60" fill="black" />
                <rect x="112" y="440" width="323" height="60" fill="black" />
        </svg>`
    )
    await Sharp(path.join('temp', 'resized.png')) // 使用 path.join 拼接路径
        .extract(cropOptions)
        .composite([{ input: blackOverlay, top: 0, left: 0 }])
        .toFile(processedImagePath)
    await textOcr(processedImagePath)
}

const calculateScore = (attribute: [string, string][]): number => {
    let score = 0
    for (let [name, value] of attribute) {
        switch (name) {
            case "攻击力":
                if (value.includes("%")) {
                    score += parseFloat(value.replace('%', '')) * 1
                } else {
                    score += parseFloat(value) * 3.46 / 39
                }
                break
            case "防御力":
                if (value.includes("%")) {
                    score += parseFloat(value.replace('%', '')) * 1
                } else {
                    score += parseFloat(value) * 4.99 / 31
                }
                break
            case "生命值":
                if (value.includes("%")) {
                    score += parseFloat(value.replace('%', '')) * 1
                } else {
                    score += parseFloat(value) * 3.09 / 174
                }
                break
            case "效果命中":
            case "效果抗性":
                score += parseFloat(value.replace('%', '')) * 1
                break
            case "速度":
                score += parseFloat(value) * 2
                break
            case "暴击伤害":
                score += parseFloat(value.replace('%', '')) * 1.125
                break
            case "暴击率":
                score += parseFloat(value.replace('%', '')) * 1.5
                break
        }
    }
    const roundedScore = parseFloat(score.toFixed(2))
    return roundedScore
}

const calculateAnalysis = () => {
    const left = standardScore["left"]
    const right = standardScore["right"]
    if (["武器", "铠甲", "头盔"].includes(part.value)) {
        if (reforge_mode) {
            if (score.value >= standardScore["reforge"][0]) return ["建议重铸", "pass"]
            else return ["分数不够，不建议重铸", "fail"]
        }
        if (enhancementLevel.value < 3 && score.value >= left[0]) return ["继续强化", "pass"]
        else if (enhancementLevel.value < 6 && score.value >= left[1]) return ["继续强化", "pass"]
        else if (enhancementLevel.value < 9 && score.value >= left[2]) return ["继续强化", "pass"]
        else if (enhancementLevel.value < 12 && score.value >= left[3]) return ["继续强化", "pass"]
        else if (enhancementLevel.value < 15 && score.value >= left[4]) return ["继续强化", "pass"]
        else if (enhancementLevel.value == 15 && score.value >= left[5]) return ["+15保留,进入重铸页面查看分数", "pass"]
        else return ["分数过低，建议放弃", "fail"]
    } else {
        if (reforge_mode) {
            if (score.value >= standardScore["reforge"][1]) return ["建议重铸", "pass"]
            else return ["分数不够，不建议重铸", "fail"]
        }
        if (["攻击力", "防御力", "生命值"].includes(primaryAttribute.value[0]) && !primaryAttribute.value[1].includes('%')) {
            return ["固定值主属性，建议放弃", "fail"]
        } else {
            if (enhancementLevel.value < 3 && score.value >= right[0]) return ["继续强化", "pass"]
            else if (enhancementLevel.value < 6 && score.value >= right[1]) return ["继续强化", "pass"]
            else if (enhancementLevel.value < 9 && score.value >= right[2]) return ["继续强化", "pass"]
            else if (enhancementLevel.value < 12 && score.value >= right[3]) return ["继续强化", "pass"]
            else if (enhancementLevel.value < 15 && score.value >= right[4]) return ["继续强化", "pass"]
            else if (enhancementLevel.value == 15 && score.value >= right[5]) return ["+15保留,进入重铸页面查看分数", "pass"]
            else return ["分数过低，建议放弃", "fail"]
        }
    }
}
const scoreLine = () => {
    const left = standardScore["left"]
    const right = standardScore["right"]
    if (["武器", "铠甲", "头盔"].includes(part.value)) {
        if (reforge_mode) {
            return standardScore["reforge"][0]
        }
        if (enhancementLevel.value < 3) return left[0]
        else if (enhancementLevel.value < 6) return left[1]
        else if (enhancementLevel.value < 9) return left[2]
        else if (enhancementLevel.value < 12) return left[3]
        else if (enhancementLevel.value < 15) return left[4]
        else if (enhancementLevel.value == 15) return left[5]
        else return 0
    } else {
        if (reforge_mode) {
            return standardScore["reforge"][1]
        }
        if (enhancementLevel.value < 3) return right[0]
        else if (enhancementLevel.value < 6) return right[1]
        else if (enhancementLevel.value < 9) return right[2]
        else if (enhancementLevel.value < 12) return right[3]
        else if (enhancementLevel.value < 15) return right[4]
        else if (enhancementLevel.value == 15) return right[5]
        else return 0
    }
}


const expectant = (): number => {
    let expectant = 0
    for (let [name, value] of attribute.value) {
        switch (name) {
            case "攻击力":
                if (value.includes("%")) {
                    expectant += (4 + 8) / 2
                } else {
                    expectant += (33 + 46) / 2 / 39
                }
                break
            case "防御力":
                if (value.includes("%")) {
                    expectant += (4 + 8) / 2
                } else {
                    expectant += (28 + 35) / 2 / 31
                }
                break
            case "生命值":
                if (value.includes("%")) {
                    expectant += (4 + 8) / 2
                } else {
                    expectant += (157 + 202) / 2 / 174
                }
                break
            case "效果命中":
            case "效果抗性":
                expectant += (4 + 8) / 2
                break
            case "速度":
                expectant += (2 + 4) / 2 * 2
                break
            case "暴击伤害":
                if (value.includes("%")) {
                    expectant += (4 + 7) / 2 * 1.125
                }
                break
            case "暴击率":
                if (value.includes("%")) {
                    expectant += (3 + 5) / 2 * 1.5
                }
                break
        }
    }
    return expectant / 4 * Math.floor((17 - enhancementLevel.value) / 3)
}

onUnmounted(() => {
    //停止监听
    ipcRenderer.removeListener('query-result', queryResultListener)

    // 杀死子进程（如果有的话）
    if (child) {
        child.kill()
    }

    // 删除temp文件夹下的所有图片文件
    const tempFolderPath = path.join(process.cwd(), 'temp')
    if (fs.existsSync(tempFolderPath)) {
        fs.readdirSync(tempFolderPath).forEach((file) => {
            const filePath = path.join(tempFolderPath, file)
            if (fs.statSync(filePath).isFile() && /\.(png|jpg|jpeg|gif|bmp)$/i.test(file)) {
                fs.unlinkSync(filePath) // 删除图片文件
            }
        })
    }
})
</script>

<style lang="scss">
.gear-info {
    margin-top: 20px;
    padding-right: 20px;
}

.gear-info .el-descriptions__label {
    width: 120px;
    display: inline-block;
}

.el-input-group__append {
    padding: 0 15px;
}

.gear-info .el-descriptions__cell {
    padding-bottom: 5px !important;
}

.gear-info .el-descriptions__content {
    font-weight: bold;
}

.hero-info {
    margin-bottom: 10px;
}

.hero-info .el-descriptions__label {
    width: 48px;
    display: inline-block;
}

.hero-info .el-descriptions__cell {
    padding-bottom: 0 !important;
    line-height: 18px !important;
}

.pass {
    color: green;
    font-weight: bold;
}

.fail {
    color: red;
    font-weight: bold;
}

.bold {
    font-weight: bold;
}
</style>
  ../store/status