<script setup lang="ts">
import { inject, reactive, computed, onMounted, onUnmounted, ref } from 'vue'
import { SETTINGS_KEY } from './composables/useSettings'
import { get_notation, list_notations } from './core/registry'
import { init_dataset } from './core/tree'
import type { TreeNode } from './core/tree'
import NotationTree from './components/NotationTree.vue'
import { get_last_focus, focus_node, focus_node_input } from './composables/useFocusTracker'
import { export_analysis, import_analysis } from './core/analysis'
import { export_to_xlsx, import_from_xlsx, download_buffer } from './core/xlsx_io'

const { settings, update } = inject(SETTINGS_KEY)!

const notations = list_notations()

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
        const matched = import_analysis(r, [{ expr, analysis: [] }], n as any, 'FS')
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

        <div class="toolbar">
            <div class="toolbar-row">
                <label>
                    Navigate to:
                    <input ref="find_input" type="text" @keydown="on_find_keydown"/>
                    <button @mousedown.prevent="handle_find">Find</button>
                </label>
            </div>
            <div class="toolbar-row">
                <span>
                    Tier:
                    <button class="tier-btn" @mousedown="update({ tier: Math.max(settings.tier - 1, 0) })"><span
                        class="tier-icon">−</span></button>
                    {{ tier_name }}
                    <button class="tier-btn" @mousedown="update({ tier: settings.tier + 1 })"><span
                        class="tier-icon">+</span></button>
                </span>
                <span class="toolbar-sep"></span>
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

    font-family: inherit;
}

.tab > button[disabled] {
    background-color: #60a;
    color: #fff;
}

/* 工具栏 */
.toolbar {
    margin: 6px 0;
}

.toolbar-row {
    margin: 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.toolbar-sep {
    width: 1px;
    height: 1.2em;
    background: #ccc;
}

/* 按钮统一样式 */
.toolbar button {
    padding: 2px 10px;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    border: 1px solid #bbb;
    border-radius: 5px;
    background: #f8f8f8;
    cursor: pointer;
    font-size: 14px;

    min-width: 4ch;
}

.toolbar button:hover {
    background: #e8e8e8;
}

.toolbar button:active {
    background: #d0d0d0;
}

.tier-icon {
    display: inline-block;
}

.toolbar .tier-btn {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-family: sans-serif;
    font-size: 16px;
    min-width: 0;
    line-height: 1;
    box-sizing: border-box;
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

.expr-display {
    font-family: "Comic Sans MS", sans-serif;
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
    padding-left: 0;
    margin: 0;
}

.tree-children {
    padding-left: 24px;
    position: relative;
}

.tree-item {
    position: relative;
}

.tree-item::before {
    content: '';
    position: absolute;
    left: -16px;
    top: 0;
    bottom: 0;
    border-left: 1px solid #ddd;
}

.tree-item:last-child::before {
    border-left: none;
}

.tree-item::after {
    content: '';
    position: absolute;
    left: -16px;
    top: 0.6em;
    width: 14px;
    border-bottom: 1px solid #ddd;
}

.tree-item:last-child::after {
    width: 14px;
}

.tree-children > .tree-item:last-child::before {
    border-left: 1px solid #ddd;
}

.tree-children > .tree-item:only-child::before {
    border-left: 1px solid #ddd;
}

.fold-icon {
    display: inline-block;
    width: 1em;
    cursor: pointer;
    user-select: none;
    font-size: 0.75em;
    color: #888;
    vertical-align: middle;
}

.fold-icon--spacer {
    cursor: default;
    visibility: hidden;
}

.fold-icon:hover {
    color: #333;
}

/* 输入框统一样式 */
.toolbar input[type="text"],
.tree-item input[type="text"] {
    font-family: inherit;
    padding: 2px 8px;
    height: 24px;
    border: 1px solid #bbb;
    border-radius: 5px;
    font-size: 14px;
    line-height: 1.4;
    box-sizing: border-box;
    background: #fff;
}

.toolbar input[type="text"]:focus,
.tree-item input[type="text"]:focus {
    outline: none;
    border-color: #7af;
    box-shadow: 0 0 0 2px rgba(100, 160, 255, 0.25);
}

.tree-item input[type="text"] {
    width: 180px;
    margin-left: 4px;
}

body {
    font-family: "Comic Sans MS", sans-serif;
}

body::after {
    content: "";
    display: block;
    height: 100vh;
}
</style>
