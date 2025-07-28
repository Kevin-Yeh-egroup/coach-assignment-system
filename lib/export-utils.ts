export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
  filename: string
}

export function exportToCSV(data: ExportData) {
  // 處理CSV格式，確保每個欄位都正確分隔
  const escapeCSVField = (field: string | number): string => {
    const str = String(field)
    // 如果包含逗號、引號或換行符，需要用引號包圍並轉義內部引號
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvContent = [
    // 標題行
    data.headers
      .map(escapeCSVField)
      .join(","),
    // 資料行
    ...data.rows.map((row) => row.map(escapeCSVField).join(",")),
  ].join("\r\n") // 使用CRLF換行符，確保Excel兼容性

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  })

  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${data.filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToExcel(data: ExportData) {
  // 創建更標準的Excel格式
  const escapeExcelField = (field: string | number): string => {
    const str = String(field)
    // Excel使用Tab分隔，如果包含Tab需要用引號包圍
    if (str.includes("\t") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // 使用Tab分隔符創建TSV格式（Tab-Separated Values）
  const tsvContent = [
    // 標題行
    data.headers
      .map(escapeExcelField)
      .join("\t"),
    // 資料行
    ...data.rows.map((row) => row.map(escapeExcelField).join("\t")),
  ].join("\r\n") // 使用CRLF換行符，確保Excel兼容性

  const blob = new Blob(["\uFEFF" + tsvContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  })

  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${data.filename}.xls`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "無效日期"
    }
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("日期格式化錯誤:", error)
    return "格式錯誤"
  }
}

export function formatDateTimeForExport(dateString: string): string {
  try {
    // 格式化為 "2024-07-16 14:00" 格式
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "無效日期"
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error("匯出日期格式化錯誤:", error)
    return "格式錯誤"
  }
}

export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    available: "可用時段",
    assigned: "已派案",
    confirmed: "已確認",
    rejected: "已拒絕",
    pending: "等待確認",
    completed: "已完成",
    cancelled: "已取消",
    active: "啟用",
    inactive: "停用",
  }
  return statusMap[status] || status
}

// 新增資料驗證函數
export function validateExportData(data: ExportData): boolean {
  if (!data.headers || !Array.isArray(data.headers) || data.headers.length === 0) {
    console.error("匯出資料錯誤: 缺少標題")
    return false
  }

  if (!data.rows || !Array.isArray(data.rows)) {
    console.error("匯出資料錯誤: 缺少資料行")
    return false
  }

  if (!data.filename || typeof data.filename !== "string") {
    console.error("匯出資料錯誤: 缺少檔案名稱")
    return false
  }

  // 檢查每行資料的欄位數量是否與標題一致
  for (let i = 0; i < data.rows.length; i++) {
    if (data.rows[i].length !== data.headers.length) {
      console.warn(`第 ${i + 1} 行資料欄位數量不符: 期望 ${data.headers.length}，實際 ${data.rows[i].length}`)
    }
  }

  return true
}
