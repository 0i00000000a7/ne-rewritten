# NE — 序数记号展开器 (Ordinal Notation Expander)

一个用于探索和可视化序数记号的交互式 Web 应用。支持多种序数记号的展开（fundamental sequence）、比较、分析与图形化展示。

## 功能

- **记号展开**：对极限序数计算其 fundamental sequence
- **等价记号**：在记号之间切换等价表示，支持独立解析
- **图形视图**：Canvas 渲染的表达式结构图，支持视口滚动
- **分析标注**：对每个表达式附加分析文本，支持导入/导出
- **设置持久化**：字体、显示模式、视图状态等自动保存到 localStorage
- **快捷键**：`Ctrl+Enter` 展开，`Ctrl+方向键` 图表滚动，`Ctrl+S/L` 导出/导入
- **数据导出/导入**：Excel (.xlsx) 格式，包含等价记号支持

## 支持的记号

| 记号 | 说明 |
|------|------|
| ω | 基础 ω |
| BMS (BM4) | Bashicu 矩阵系统 4 行 |
| TBM | 超限 Bashicu 矩阵 |
| BHM | Bashicu 超矩阵 |
| BSM | Bashicu 骤变矩阵 |
| Y sequence | Y 序列 |
| ω-Y (4种岩浆) | ω-Y 强/中/弱/原本岩浆 |
| ω-MN | ω 山脉记号 |
| T-ω-MN | T-ω 山脉记号 |
| Aw2MN2 | Aw2MN2 记号 |
| DEN / DEN2 / DEN3 | DEN 家族 |
| TON (9种变体) | Taranovsky 的序数记号（含反射配置） |
| aSAN (4种变体) | Aarex 的超强数组记号 |
| LMN / LON | 提升 M-记号 / 提升 Ω-记号 |
| UPMS | 一元对合矩阵系统 |

## 开发

```bash
npm install
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```

## 部署

推送到 `master` 分支会自动触发 GitHub Actions 构建并部署到 GitHub Pages。
在仓库 Settings → Pages 中选择 **Deploy from branch: gh-pages**。
