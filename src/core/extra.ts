/** TreeNode.extraData 的 UI 层类型定义 */
export interface TreeNodeExtra {
    analysis?: string[]
    hide_child?: boolean
    /** 节点挂载后自动聚焦其输入框 */
    focus_on_mounted?: boolean
}
