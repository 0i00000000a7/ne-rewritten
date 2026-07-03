<script setup lang="ts">
defineProps<{ html: string }>();
</script>

<template>
    <div class="latex-wrapper" v-html="html"></div>
</template>

<style scoped>
.latex-wrapper {
    padding: 4px 8px;
    min-width: 40px;
    min-height: 24px;
}
.latex-wrapper :deep(.katex) {
    font-size: 1.1em;
}
</style>
