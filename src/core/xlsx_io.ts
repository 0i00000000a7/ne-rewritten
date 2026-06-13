import Excel from 'exceljs'
import type { NotationDefinition } from '../utils'
import type { AnalysisEntry } from './analysis'

// ---------------------------------------------------------------------------
// 导出 AnalysisEntry[] → XLSX ArrayBuffer
// ---------------------------------------------------------------------------

export async function export_to_xlsx<T>(
    entries: AnalysisEntry<T>[],
    notation: NotationDefinition<T>,
): Promise<ArrayBuffer> {
    const workbook = new Excel.Workbook()
    const sheet = workbook.addWorksheet('analysis')

    for (const entry of entries) {
        const row = [notation.display(entry.expr), ...entry.analysis]
        sheet.addRow(row)
    }

    return (await workbook.xlsx.writeBuffer()) as ArrayBuffer
}

// ---------------------------------------------------------------------------
// 导入 XLSX ArrayBuffer → AnalysisEntry[]
// ---------------------------------------------------------------------------

export async function import_from_xlsx<T>(
    buffer: ArrayBuffer,
    notation: NotationDefinition<T>,
): Promise<AnalysisEntry<T>[]> {
    const workbook = new Excel.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]

    const entries: AnalysisEntry<T>[] = []

    sheet.eachRow((row) => {
        const values = row.values as (string | undefined)[]
        // exceljs 的 values 从索引 1 开始
        const exprStr = values[1]
        if (exprStr === undefined || exprStr === null || exprStr === '') return

        if (!notation.from_display) {
            throw new Error(`Notation ${notation.id} has no from_display`)
        }
        const expr = notation.from_display(exprStr)

        const analysis: string[] = []
        for (let i = 2; i < values.length; i++) {
            const v = values[i]
            analysis.push(v ?? '')
        }

        entries.push({ expr, analysis })
    })

    return entries
}

// ---------------------------------------------------------------------------
// 浏览器下载辅助
// ---------------------------------------------------------------------------

export function download_buffer(buffer: ArrayBuffer, filename: string): void {
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
