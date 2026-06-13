<script setup lang="ts" generic="T">
import {ref, computed, onMounted} from 'vue'
import type {TreeNode} from '../core/tree'
import type {TreeNodeExtra} from '../core/extra'
import type {NotationDefinition} from '../utils'
import {expand_item} from '../core/expander'
import {find_next, find_prev} from '../core/tree'
import {focus_node, focus_node_input, set_last_focus} from '../composables/useFocusTracker'

const props = defineProps<{
    node: TreeNode<T>
    notation: NotationDefinition<T>
    tier?: number
}>()

const input_ref = ref<HTMLInputElement | null>(null)
const tooltip = ref(false)
const tooltipFS = ref<string[]>([])

// extraData 初始化
if (!props.node.extraData) props.node.extraData = {}
const ed = props.node.extraData as TreeNodeExtra
if (!Array.isArray(ed.analysis)) ed.analysis = []

// analysis[0] 的读写桥接（数组始终存在，元素可为 undefined）
const analysis0 = computed({
    get: () => ed.analysis![0] ?? '',
    set: (v: string) => { ed.analysis![0] = v },
})

const node_path = props.node.path ?? '' + props.node.index

// 设置 data-tree-path 并处理 focus_on_mounted
onMounted(() => {
    input_ref.value?.setAttribute('data-tree-path', node_path)
    if (ed.focus_on_mounted) {
        const el = input_ref.value
        if (el) {
            el.focus({preventScroll: true})
            const rect = el.getBoundingClientRect()
            const top = window.scrollY + rect.top - 60
            window.scrollTo({top, behavior: 'smooth'})
        }
        ed.focus_on_mounted = false
    }
})

// ---------------------------------------------------------------------------
// 悬停 tooltip
// ---------------------------------------------------------------------------

function on_enter() {
    if (!props.notation.is_limit(props.node.expr)) return
    const nmax = 3
    tooltipFS.value = []
    for (let n = 0; n <= nmax; n++) {
        tooltipFS.value.push(
            `${n}: ${props.notation.display(props.notation.FS(props.node.expr, n))}`,
        )
    }
    tooltip.value = true
}

function on_leave() {
    tooltip.value = false
}

// ---------------------------------------------------------------------------
// 展开
// ---------------------------------------------------------------------------

function do_expand(tier?: number) {
    const child = expand_item(
        props.node, props.notation, 'FS', tier ?? props.tier ?? 0,
    )
    if (child) focus_node_input(child)
}

function on_expr_click() {
    do_expand()
}

// ---------------------------------------------------------------------------
// 带 analysis 过滤的导航（Alt 键启用）
// ---------------------------------------------------------------------------

function has_analysis(node: TreeNode<unknown>): boolean {
    const ed = node.extraData as TreeNodeExtra | undefined
    return ed?.analysis?.[0] !== undefined
}

function find_prev_analysis(
    node: TreeNode<T>,
    skip: number,
): TreeNode<T> | undefined {
    let cur = find_prev(node, skip)
    while (cur && !has_analysis(cur as unknown as TreeNode<unknown>)) {
        cur = find_prev(cur, skip)
    }
    return cur
}

function find_next_analysis(
    node: TreeNode<T>,
    skip: number,
): TreeNode<T> | undefined {
    let cur = find_next(node, skip)
    while (cur && !has_analysis(cur as unknown as TreeNode<unknown>)) {
        cur = find_next(cur, skip)
    }
    return cur
}

// ---------------------------------------------------------------------------
// 键盘
// ---------------------------------------------------------------------------

function on_keydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.altKey) {
        if (
            !(
                e.ctrlKey &&
                ['c', 'v', 'a', 'x', 'z'].includes(e.key.toLowerCase())
            )
        ) {
            e.preventDefault()
        }
    }

    if (e.key === 'ArrowUp') {
        e.preventDefault()
        const base_skip = (e.ctrlKey ? 2 : 0) + (e.shiftKey ? 1 : 0)
        const target = e.altKey
            ? find_prev_analysis(props.node, base_skip)
            : find_prev(props.node, base_skip)
        if (target) focus_node(target.path ?? '' + target.index)
    } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const base_skip = (e.ctrlKey ? 2 : 0) + (e.shiftKey ? 1 : 0)
        const target = e.altKey
            ? find_next_analysis(props.node, base_skip)
            : find_next(props.node, base_skip)
        if (target) focus_node(target.path ?? '' + target.index)
    } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        do_expand()
    } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault()
        do_expand(1)
    } else if (e.key.toLowerCase() === 'h' && e.ctrlKey) {
        e.preventDefault()
        ed.hide_child = !ed.hide_child
    } else if (e.key === 'Delete') {
        e.preventDefault()
        ed.analysis![0] = undefined as unknown as string
    }
}

// ---------------------------------------------------------------------------
// 聚焦追踪
// ---------------------------------------------------------------------------

function on_focus() {
    set_last_focus(node_path)
}
</script>

<template>
    <li>
        <div
            class="shown-item"
            :class="{ analyzed: has_analysis(node as unknown as TreeNode<unknown>) }"
            @mouseenter="on_enter"
            @mouseleave="on_leave"
        >
            <input
                type="checkbox"
                @mousedown.stop
                v-model="ed.hide_child"
            />
            <span
                class="expr-display"
                @mousedown.prevent="on_expr_click"
                v-html="notation.display(node.expr)"
            />
            <input
                ref="input_ref"
                type="text"
                v-model="analysis0"
                @keydown="on_keydown"
                @mousedown.stop
                @focus="on_focus"
            />
            <div v-if="tooltip" class="tooltip">
                <span v-html="notation.display(node.expr)" /> fundamental sequence:
                <div v-for="term in tooltipFS" :key="term" v-html="term" />
            </div>
        </div>
        <ul v-if="node.children.length > 0 && !ed.hide_child" class="nowrap">
            <NotationTreeItem
                v-for="child in node.children"
                :key="child.path ?? child.index"
                :node="child"
                :notation="notation"
                :tier="tier"
            />
        </ul>
    </li>
</template>
