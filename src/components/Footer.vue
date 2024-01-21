<template>
    <el-text class="mx-1" :type="typeStore.type" size="large">
        连接状态: {{ typeStore.word }}
    </el-text>
    <el-text class="mx-1" style="float: right;">eloy修改版</el-text>
</template>

<script lang="ts" setup>
import { usetypeStore } from '../store/status'

const typeStore = usetypeStore()


</script>