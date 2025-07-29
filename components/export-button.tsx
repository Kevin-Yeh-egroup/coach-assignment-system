"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, AlertCircle } from "lucide-react"
import { exportToCSV, validateExportData, type ExportData } from "@/lib/export-utils"

interface ExportButtonProps {
  data: ExportData
  disabled?: boolean
}

export default function ExportButton({ data, disabled = false }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (disabled || isExporting) return

    // 驗證資料
    if (!validateExportData(data)) {
      alert("匯出資料格式錯誤，請檢查資料")
      return
    }

    if (data.rows.length === 0) {
      alert("沒有資料可以匯出")
      return
    }

    setIsExporting(true)
    try {
      console.log("開始匯出 CSV 格式:", {
        headers: data.headers,
        rowCount: data.rows.length,
        filename: data.filename,
      })

      // 添加延遲以顯示載入狀態
      await new Promise((resolve) => setTimeout(resolve, 500))

      exportToCSV(data)

      console.log("CSV 匯出完成")
    } catch (error) {
      console.error("匯出失敗:", error)
      alert("匯出失敗，請稍後再試")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      disabled={disabled || isExporting}
      onClick={handleExport}
      className="flex items-center gap-2 bg-transparent"
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          匯出中...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          匯出CSV
          {data.rows.length > 0 && <span className="text-xs">({data.rows.length}筆)</span>}
        </>
      )}
    </Button>
  )
}
