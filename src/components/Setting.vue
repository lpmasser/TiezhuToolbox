<template>
    <el-row>
        <el-text class="mx-1 title" style="margin-left: 10px;"> · 强化及重铸分数线</el-text>
    </el-row>
    <el-row v-if="vaildline">
        <el-col :span="8">
            <el-row justify="space-evenly">
                <el-text class="mx-1" size="large" tag="b">左三分数线</el-text>
            </el-row>
            <el-row v-for="(item, index) in enhanceLevel" justify="space-evenly">
                <el-text class="mx-1" style="width: 80px;" size="large">强化：{{ item }}</el-text>
                <el-input-number @change="changeStandardScore" :min="0" :max="80" style="width: 100px;" v-model="standardScore[`left`][index]" />
            </el-row>
        </el-col>
        <el-col :span="8">
            <el-row justify="space-evenly">
                <el-text class="mx-1" size="large" tag="b">右三分数线</el-text>
            </el-row>
            <el-row v-for="(item, index) in enhanceLevel" justify="space-evenly">
                <el-text class="mx-1" style="width: 80px;" size="large">强化：{{ item }}</el-text>
                <el-input-number @change="changeStandardScore" :min="0" :max="80" style="width: 100px;" v-model="standardScore[`right`][index]" />
            </el-row>
        </el-col>
        <el-col :span="8">
            <el-row justify="space-evenly">
                <el-text class="mx-1" size="large" tag="b">重铸分数线</el-text>
            </el-row>
            <el-row v-for="(item, index) in reforge" justify="space-evenly">
                <el-text class="mx-1" style="width: 120px;" size="large">{{ item }}重铸分数：</el-text>
                <el-input-number @change="changeStandardScore" style="width: 100px;" v-model="standardScore[`reforge`][index]" />
            </el-row>
        </el-col>
    </el-row>
    <el-divider />
    <el-row>
        <el-text class="mx-1 title" style="margin-left: 10px;"> · 装备及英雄有效分数</el-text>
    </el-row>
    <el-row v-if="vaildline">
        <el-col :span="8">
            <el-row justify="space-evenly">
                <el-text class="mx-1" size="large" tag="b">英雄副属性有效分数</el-text>
            </el-row>
            <el-row v-for="item in attributeName" justify="space-evenly">
                <el-text class="mx-1" style="width: 80px;" size="large">{{ statsMapping[item] }}：</el-text>
                <el-input-number @change="changeAttriScoreLine" :min="0" :max="400" style="width: 110px;" v-model="attriScoreLine[item]" />
            </el-row>
        </el-col>
        <el-col :span="8">
            <el-row justify="space-evenly">
                <el-text class="mx-1" size="large" tag="b">英雄主属性有效分数</el-text>
            </el-row>
            <el-row v-for="item in attributeName" justify="space-evenly">
                <el-text class="mx-1" style="width: 80px;" size="large">{{ statsMapping[item] }}：</el-text>
                <el-input-number @change="changePrimaScoreLine" :min="0" :max="400" style="width: 110px;" v-model="primaScoreLine[item]" />
            </el-row>
        </el-col>
        <el-col :span="8">
            <el-row justify="space-evenly">
                <el-text class="mx-1" size="large" tag="b">装备有效分数</el-text>
            </el-row>
            <el-row justify="space-evenly">
                <el-text class="mx-1" style="width: 120px;" size="large">有效分数占比%</el-text>
                <el-input-number @change="changeVaildline" :min="0" :max="99" style="width: 110px;" v-model="vaildline" />
            </el-row>
        </el-col>
    </el-row>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { ElMessage, configProviderContextKey } from 'element-plus'
import { useDataStore } from '../store/data'
import fs from 'fs'
import path from 'path'
type scoremap = {
    [key in string]: number[]
}
const standardScore = ref<scoremap>({})
type attriscoremap = {
    [key in string]: number
}
const attriScoreLine = ref<attriscoremap>({})
const primaScoreLine = ref<attriscoremap>({})
const vaildline = ref(0)
const enhanceLevel = ['+0', '+3', '+6', '+9', '+12', '+15']
const reforge = ['左三', '右三']
const attributeName = ['atk', 'def', 'hp', 'spd', 'chc', 'chd', 'eff', 'efr']
type StatsMapping = {
    [key in string]: string
}
const statsMapping: StatsMapping = {
    "atk": "攻击力",
    "def": "防御力",
    "hp": "生命值",
    "eff": "效果命中",
    "efr": "效果抗性",
    "spd": "速度",
    "chd": "暴击伤害",
    "chc": "暴击率"
}
const config = useDataStore()

const changeStandardScore = ()=>{
    config.standardScore = standardScore.value
}
const changeAttriScoreLine = ()=>{
    config.attriScoreLine = attriScoreLine.value
}
const changePrimaScoreLine = ()=>{
    config.primaScoreLine = primaScoreLine.value
}
const changeVaildline = ()=>{
    config.vaildline = vaildline.value
}

onMounted(() => {
    standardScore.value = config.standardScore
    attriScoreLine.value = config.attriScoreLine
    primaScoreLine.value = config.primaScoreLine
    vaildline.value = config.vaildline
})
</script>

<style lang="scss">
.title {
    font-weight: bold;
    font-size: 20px;
}
</style>