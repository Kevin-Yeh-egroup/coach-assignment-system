"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText, AlertCircle } from "lucide-react"
import { exportToCSV, exportToExcel, validateExportData, type ExportData } from "@/lib/export-utils"

interface ExportButtonProps {
  data: ExportData
  disabled?: boolean
}

export default function ExportButton({ data, disabled = false }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "csv" | "excel") => {
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
      console.log(`開始匯出 ${format} 格式:`, {
        headers: data.headers,
        rowCount: data.rows.length,
        filename: data.filename,
      })

      // 添加延遲以顯示載入狀態
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (format === "csv") {
        exportToCSV(data)
      } else {
        exportToExcel(data)
      }

      console.log(`${format} 匯出完成`)
    } catch (error) {
      console.error("匯出失敗:", error)
      alert("匯出失敗，請稍後再試")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting} className="flex items-center gap-2 bg-transparent">
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              匯出中...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              匯出資料
              {data.rows.length > 0 && <span className="text-xs">({data.rows.length}筆)</span>}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport("csv")} disabled={disabled || isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          匯出 CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")} disabled={disabled || isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          匯出 Excel
        </DropdownMenuItem>
        {data.rows.length === 0 && (
          <DropdownMenuItem disabled className="text-gray-500">
            <AlertCircle className="h-4 w-4 mr-2" />
            無資料可匯出
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
