<script setup lang="ts">
import {inject, reactive, computed, onMounted, onUnmounted, ref} from 'vue'
import {SETTINGS_KEY} from './composables/useSettings'
import {get_notation, list_notations} from './core/registry'
import {init_dataset} from './core/tree'
import type {TreeNode} from './core/tree'
import NotationTree from './components/NotationTree.vue'
import {get_last_focus, focus_node, focus_node_input} from './composables/useFocusTracker'
import {export_analysis, import_analysis} from './core/analysis'
import {export_to_xlsx, import_from_xlsx, download_buffer} from './core/xlsx_io'

const {settings, update} = inject(SETTINGS_KEY)!

const notations = list_notations()

// 持久化各节记的树（reactive 使得嵌套变更被 Vue 追踪）
const trees = new Map<string, TreeNode<unknown>>()

function get_or_create_tree(id: string): TreeNode<unknown> | null {
    let root = trees.get(id)
    if (!root) {
        const n = get_notation(id)
        if (!n) return null
        root = reactive(init_dataset(n)) as TreeNode<unknown>
        trees.set(id, root)
    }
    return root
}

const current_id = computed(() => settings.value.current_notation_id)
const root = computed(() => get_or_create_tree(current_id.value))
const notation = computed(() => get_notation(current_id.value))

const tier_names = [
    'small', 'single', 'double', 'triple', 'quadruple',
    'quintuple', 'sextuple', 'septuple', 'octuple',
]

const tier_name = computed(() => {
    const t = settings.value.tier
    if (0 <= t && t <= 7) return tier_names[t] + ' expansion'
    return t + '-fold expansion'
})

// ---------------------------------------------------------------------------
// 导入 / 导出
// ---------------------------------------------------------------------------

const file_input = ref<HTMLInputElement>()

async function handle_export() {
    const n = notation.value
    const r = root.value
    if (!n || !r) return
    const entries = export_analysis(r)
    const buf = await export_to_xlsx(entries, n as any)
    download_buffer(buf, `${n.id}_analysis.xlsx`)
}

async function handle_import() {
    file_input.value?.click()
}

async function on_file_selected(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const n = notation.value
    const r = root.value
    if (!n || !r) return

    const buf = await file.arrayBuffer()
    const entries = await import_from_xlsx(buf, n as any)
    const matched = import_analysis(r, entries, n as any, 'FS')
    if (matched.length > 0) {
        const last = matched[matched.length - 1]
        const ed = (last.extraData ??= {}) as any
        ed.focus_on_mounted = true
    }
    input.value = ''
}

// ---------------------------------------------------------------------------
// 查找表达式
// ---------------------------------------------------------------------------

const find_input = ref<HTMLInputElement>()

function handle_find() {
    const n = notation.value
    const r = root.value
    const val = find_input.value?.value
    if (!n || !r || !val || !n.from_display) return
    try {
        const expr = n.from_display(val)
        const matched = import_analysis(r, [{expr, analysis: []}], n as any, 'FS')
        if (matched.length > 0) {
            focus_node_input(matched[0] as any)
        }
    } catch (_) {
    }
}

function on_find_keydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        e.preventDefault()
        handle_find()
    }
}

// ---------------------------------------------------------------------------
// 全局 Ctrl
// ---------------------------------------------------------------------------

function on_global_keydown(e: KeyboardEvent) {
    if (
        (e.ctrlKey || e.metaKey) &&
        !['c', 'v', 'a', 'x', 'z', 'r'].includes(e.key.toLowerCase())
    ) {
        e.preventDefault()
    }
    if (e.key.toLowerCase() === 'r' && e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        const path = get_last_focus()
        if (path) focus_node(path)
    }
}

onMounted(() => document.addEventListener('keydown', on_global_keydown))
onUnmounted(() => document.removeEventListener('keydown', on_global_keydown))
</script>

<template>
    <div>
        <div class="tab">
            <button
                v-for="n in notations"
                :key="n.id"
                :disabled="n.id === settings.current_notation_id"
                @mousedown="update({ current_notation_id: n.id })"
            >
                {{ n.name }}
            </button>
        </div>

        <div>
            <label>
                Navigate to:
                <input ref="find_input" type="text" @keydown="on_find_keydown"/>
                <button @mousedown.prevent="handle_find">Find</button>
            </label>
        </div>

        <div>
            Tier: {{ tier_name }}
            <button @mousedown="update({ tier: Math.max(settings.tier - 1, 0) })">-</button>
            <button @mousedown="update({ tier: settings.tier + 1 })">+</button>
            <button @mousedown="handle_export">Export</button>
            <button @mousedown="handle_import">Import</button>
            <input
                ref="file_input"
                type="file"
                accept=".xlsx"
                style="display:none"
                @change="on_file_selected"
            />
        </div>

        <div v-if="root && notation" class="preview-container">
            <NotationTree
                :root="root"
                :notation="(notation as any)"
                :tier="settings.tier"
            />
        </div>
        <div v-else>No notation selected</div>
    </div>
</template>

<style>
.tab > button {
    padding: 0 6px 2px;
    border: 2px solid #90f;
    border-radius: 10px;
    background-color: #daf;
    font-size: 20px;
}

.tab > button[disabled] {
    background-color: #60a;
    color: #fff;
}

.nowrap {
    white-space: nowrap;
}

.preview-container {
    margin: 20px 0;
}

.shown-item {
    position: relative;
    cursor: pointer;
    min-height: 1.25em;
}

.shown-item:hover {
    background-color: #cff;
}

.shown-item.analyzed {
    background-color: #eee;
}

.shown-item.analyzed:hover {
    background-color: #bee;
}

.shown-item > span:empty::before {
    content: '(empty)';
    color: #999;
}

.tooltip {
    display: inline-block;
    position: absolute;
    z-index: 1073741824;
    bottom: 100%;
    padding: 2px 5px;
    background-color: #dfd;
    text-align: left;
}

ul {
    list-style: none;
    padding-left: 16px;
}

body::after {
    content: "";
    display: block;
    height: 100vh;
}
</style>
