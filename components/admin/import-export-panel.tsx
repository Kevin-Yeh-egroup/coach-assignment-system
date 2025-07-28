"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, FileSpreadsheet, Users, Calendar, CheckCircle, AlertTriangle, Check, UserPlus } from "lucide-react"

interface DuplicateData {
  type: "coach" | "timeslot" | "assignment"
  existing: any
  importing: any
  key: string
}

interface MissingCoach {
  name: string
  timeslots: any[]
}

interface ConflictResolution {
  [key: string]: "keep" | "replace" | "skip"
}

export default function ImportExportPanel() {
  const [importType, setImportType] = useState("coaches")
  const [importing, setImporting] = useState(false)
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [showMissingCoachDialog, setShowMissingCoachDialog] = useState(false)
  const [duplicates, setDuplicates] = useState<DuplicateData[]>([])
  const [missingCoaches, setMissingCoaches] = useState<MissingCoach[]>([])
  const [selectedMissingCoaches, setSelectedMissingCoaches] = useState<string[]>([])
  const [conflictResolutions, setConflictResolutions] = useState<ConflictResolution>({})
  const [pendingImportData, setPendingImportData] = useState<any[]>([])

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        alert("檔案格式錯誤：至少需要標題行和一行資料")
        return
      }

      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())
      const rows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.replace(/"/g, "").trim()))

      console.log("匯入類型:", importType)
      console.log("標題:", headers)
      console.log("資料:", rows)

      // 檢查重複資料和缺失教練
      const { cleanData, duplicateData, missingCoachData } = await checkDuplicatesAndMissingCoaches(rows, importType)

      if (missingCoachData.length > 0 && importType === "timeslots") {
        setMissingCoaches(missingCoachData)
        setPendingImportData(rows)
        setShowMissingCoachDialog(true)
        setImporting(false)
        return
      }

      if (duplicateData.length > 0) {
        setDuplicates(duplicateData)
        setPendingImportData(rows)
        setShowConflictDialog(true)
        setImporting(false)
        return
      }

      // 沒有重複資料，直接匯入
      await performImport(rows, importType)
    } catch (error) {
      console.error("匯入失敗:", error)
      alert("匯入失敗，請檢查檔案格式")
    } finally {
      setImporting(false)
      event.target.value = ""
    }
  }

  const checkDuplicatesAndMissingCoaches = async (rows: string[][], type: string) => {
    const duplicateData: DuplicateData[] = []
    const missingCoachData: MissingCoach[] = []
    const cleanData: string[][] = []

    if (type === "coaches") {
      const existingCoaches = JSON.parse(localStorage.getItem("global_coaches") || "[]")

      rows.forEach((row, index) => {
        const importingName = row[0]?.trim()
        const importingEmail = row[6]?.trim()

        if (!importingName) return

        const duplicateByName = existingCoaches.find(
          (coach: any) => coach.name.toLowerCase() === importingName.toLowerCase(),
        )

        const duplicateByEmail = importingEmail
          ? existingCoaches.find(
              (coach: any) => coach.email && coach.email.toLowerCase() === importingEmail.toLowerCase(),
            )
          : null

        const duplicate = duplicateByName || duplicateByEmail

        if (duplicate) {
          duplicateData.push({
            type: "coach",
            existing: duplicate,
            importing: {
              name: importingName,
              bio: row[1] || "",
              specialties: [row[2], row[3], row[4]].filter((s) => s && s.trim()),
              status: row[5] === "active" ? "active" : "inactive",
              email: importingEmail || "",
              phone: row[7] || "",
            },
            key: `coach_${index}_${importingName}`,
          })
        } else {
          cleanData.push(row)
        }
      })
    } else if (type === "timeslots") {
      const existingCoaches = JSON.parse(localStorage.getItem("global_coaches") || "[]")
      const existingTimeslots = JSON.parse(localStorage.getItem("timeslots") || "[]")

      // 按教練名稱分組時段
      const timeslotsByCoach: { [key: string]: any[] } = {}

      rows.forEach((row, index) => {
        const coachName = row[0]?.trim()
        const startTime = row[1]?.trim()
        const endTime = row[2]?.trim()

        if (!coachName || !startTime || !endTime) return

        // 檢查教練是否存在
        const coachExists = existingCoaches.find((coach: any) => coach.name === coachName)

        if (!coachExists) {
          if (!timeslotsByCoach[coachName]) {
            timeslotsByCoach[coachName] = []
          }
          timeslotsByCoach[coachName].push({
            coach_name: coachName,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            status: row[3] || "available",
          })
        } else {
          // 檢查時段重複
          const duplicate = existingTimeslots.find(
            (slot: any) =>
              slot.coach_name === coachName &&
              slot.start_time === new Date(startTime).toISOString() &&
              slot.end_time === new Date(endTime).toISOString(),
          )

          if (duplicate) {
            duplicateData.push({
              type: "timeslot",
              existing: duplicate,
              importing: {
                coach_name: coachName,
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                status: row[3] || "available",
              },
              key: `timeslot_${index}_${coachName}_${startTime}`,
            })
          } else {
            cleanData.push(row)
          }
        }
      })

      // 轉換為缺失教練格式
      Object.entries(timeslotsByCoach).forEach(([coachName, timeslots]) => {
        missingCoachData.push({
          name: coachName,
          timeslots: timeslots,
        })
      })
    } else if (type === "assignments") {
      const existingAssignments = JSON.parse(localStorage.getItem("assignments") || "[]")

      rows.forEach((row, index) => {
        const coachName = row[0]?.trim()
        const clientName = row[1]?.trim()
        const startTime = row[4]?.trim()

        if (!coachName || !clientName || !startTime) return

        const duplicate = existingAssignments.find(
          (assignment: any) =>
            assignment.coach_name === coachName &&
            assignment.client_name === clientName &&
            assignment.start_time === new Date(startTime).toISOString(),
        )

        if (duplicate) {
          duplicateData.push({
            type: "assignment",
            existing: duplicate,
            importing: {
              coach_name: coachName,
              client_name: clientName,
              client_contact: row[2] || "",
              topic: row[3] || "",
              start_time: new Date(startTime).toISOString(),
              end_time: new Date(row[5]).toISOString(),
              priority: row[6] || "medium",
            },
            key: `assignment_${index}_${coachName}_${clientName}_${startTime}`,
          })
        } else {
          cleanData.push(row)
        }
      })
    }

    return { cleanData, duplicateData, missingCoachData }
  }

  const handleMissingCoachSelection = (coachName: string, checked: boolean) => {
    if (checked) {
      setSelectedMissingCoaches((prev) => [...prev, coachName])
    } else {
      setSelectedMissingCoaches((prev) => prev.filter((name) => name !== coachName))
    }
  }

  const handleCreateMissingCoaches = async () => {
    try {
      const existingCoaches = JSON.parse(localStorage.getItem("global_coaches") || "[]")
      const newCoaches = selectedMissingCoaches.map((coachName, index) => ({
        id: Date.now() + index,
        name: coachName,
        bio: "",
        specialties: [],
        status: "active",
        email: "",
        phone: "",
        created_at: new Date().toISOString(),
        total_assignments: 0,
      }))

      const updatedCoaches = [...existingCoaches, ...newCoaches]
      localStorage.setItem("global_coaches", JSON.stringify(updatedCoaches))

      // 為新教練創建個人資料
      newCoaches.forEach((coach) => {
        localStorage.setItem(
          `coach_${coach.id}_profile`,
          JSON.stringify({
            name: coach.name,
            bio: coach.bio,
            specialties: coach.specialties,
            email: coach.email,
            phone: coach.phone,
          }),
        )
        localStorage.setItem(`coach_${coach.id}_timeslots`, JSON.stringify([]))
      })

      // 匯入對應的時段
      const existingTimeslots = JSON.parse(localStorage.getItem("timeslots") || "[]")
      const newTimeslots: any[] = []

      missingCoaches.forEach((missingCoach) => {
        if (selectedMissingCoaches.includes(missingCoach.name)) {
          const coach = newCoaches.find((c) => c.name === missingCoach.name)
          if (coach) {
            missingCoach.timeslots.forEach((slot, index) => {
              newTimeslots.push({
                id: Date.now() + index + 1000,
                coach_id: coach.id,
                coach_name: coach.name,
                start_time: slot.start_time,
                end_time: slot.end_time,
                status: slot.status,
                specialties: [],
              })
            })
          }
        }
      })

      const updatedTimeslots = [...existingTimeslots, ...newTimeslots]
      localStorage.setItem("timeslots", JSON.stringify(updatedTimeslots))

      setShowMissingCoachDialog(false)
      setMissingCoaches([])
      setSelectedMissingCoaches([])
      setPendingImportData([])

      alert(`成功新增 ${newCoaches.length} 位教練和 ${newTimeslots.length} 個時段！`)
      window.location.reload()
    } catch (error) {
      console.error("新增教練失敗:", error)
      alert("新增教練失敗，請稍後再試")
    }
  }

  const performImport = async (rows: string[][], type: string) => {
    if (type === "coaches") {
      const existingCoaches = JSON.parse(localStorage.getItem("global_coaches") || "[]")
      const coaches = rows.map((row, index) => ({
        id: Date.now() + index,
        name: row[0] || "",
        bio: row[1] || "",
        specialties: [row[2], row[3], row[4]].filter((s) => s && s.trim()),
        status: row[5] === "active" ? "active" : "inactive",
        email: row[6] || "",
        phone: row[7] || "",
        created_at: new Date().toISOString(),
        total_assignments: 0,
      }))

      const updatedCoaches = [...existingCoaches, ...coaches]
      localStorage.setItem("global_coaches", JSON.stringify(updatedCoaches))
      alert(`成功匯入 ${coaches.length} 位教練！`)
    } else if (type === "timeslots") {
      const existingTimeslots = JSON.parse(localStorage.getItem("timeslots") || "[]")
      const existingCoaches = JSON.parse(localStorage.getItem("global_coaches") || "[]")

      const timeslots = rows.map((row, index) => {
        const coachName = row[0] || ""
        const coach = existingCoaches.find((c: any) => c.name === coachName)

        return {
          id: Date.now() + index,
          coach_id: coach?.id || 1,
          coach_name: coachName,
          start_time: new Date(row[1]).toISOString(),
          end_time: new Date(row[2]).toISOString(),
          status: row[3] || "available",
          specialties: [],
        }
      })

      // 不覆蓋現有資料，而是追加
      const updatedTimeslots = [...existingTimeslots, ...timeslots]
      localStorage.setItem("timeslots", JSON.stringify(updatedTimeslots))
      alert(`成功匯入 ${timeslots.length} 個時段！`)
    } else if (type === "assignments") {
      const existingAssignments = JSON.parse(localStorage.getItem("assignments") || "[]")
      const assignments = rows.map((row, index) => ({
        id: Date.now() + index,
        coach_name: row[0] || "",
        client_name: row[1] || "",
        client_contact: row[2] || "",
        topic: row[3] || "",
        start_time: new Date(row[4]).toISOString(),
        end_time: new Date(row[5]).toISOString(),
        priority: row[6] || "medium",
        status: "pending",
        created_at: new Date().toISOString(),
        coach_id: 1,
        time_slot_id: Date.now() + index,
      }))

      const updatedAssignments = [...existingAssignments, ...assignments]
      localStorage.setItem("assignments", JSON.stringify(updatedAssignments))
      alert(`成功匯入 ${assignments.length} 個派案！`)
    }

    window.location.reload()
  }

  const handleConflictResolution = (key: string, resolution: "keep" | "replace" | "skip") => {
    setConflictResolutions((prev) => ({
      ...prev,
      [key]: resolution,
    }))
  }

  const handleResolveConflicts = async () => {
    const processedData: string[][] = []
    const existingData = getExistingData(importType)

    duplicates.forEach((duplicate) => {
      const resolution = conflictResolutions[duplicate.key]

      if (resolution === "replace") {
        const index = existingData.findIndex((item: any) => compareItems(item, duplicate.existing, importType))
        if (index !== -1) {
          existingData[index] = convertImportingToStorageFormat(duplicate.importing, importType)
        }
      }
    })

    const nonDuplicateRows = pendingImportData.filter((row, index) => {
      const key = `${importType}_${index}_${row[0]}`
      return !duplicates.some((dup) => dup.key.includes(key))
    })

    if (nonDuplicateRows.length > 0) {
      await performImport(nonDuplicateRows, importType)
    }

    saveExistingData(importType, existingData)

    setShowConflictDialog(false)
    setDuplicates([])
    setConflictResolutions({})
    setPendingImportData([])

    const resolvedCount = Object.values(conflictResolutions).filter((r) => r === "replace").length
    const keptCount = Object.values(conflictResolutions).filter((r) => r === "keep").length
    const skippedCount = Object.values(conflictResolutions).filter((r) => r === "skip").length

    alert(
      `匯入完成！\n替換: ${resolvedCount} 項\n保留: ${keptCount} 項\n跳過: ${skippedCount} 項\n新增: ${nonDuplicateRows.length} 項`,
    )
  }

  const getExistingData = (type: string) => {
    switch (type) {
      case "coaches":
        return JSON.parse(localStorage.getItem("global_coaches") || "[]")
      case "timeslots":
        return JSON.parse(localStorage.getItem("timeslots") || "[]")
      case "assignments":
        return JSON.parse(localStorage.getItem("assignments") || "[]")
      default:
        return []
    }
  }

  const saveExistingData = (type: string, data: any[]) => {
    switch (type) {
      case "coaches":
        localStorage.setItem("global_coaches", JSON.stringify(data))
        break
      case "timeslots":
        localStorage.setItem("timeslots", JSON.stringify(data))
        break
      case "assignments":
        localStorage.setItem("assignments", JSON.stringify(data))
        break
    }
  }

  const compareItems = (existing: any, duplicate: any, type: string) => {
    switch (type) {
      case "coaches":
        return existing.name === duplicate.name || (existing.email && existing.email === duplicate.email)
      case "timeslots":
        return (
          existing.coach_name === duplicate.coach_name &&
          existing.start_time === duplicate.start_time &&
          existing.end_time === duplicate.end_time
        )
      case "assignments":
        return (
          existing.coach_name === duplicate.coach_name &&
          existing.client_name === duplicate.client_name &&
          existing.start_time === duplicate.start_time
        )
      default:
        return false
    }
  }

  const convertImportingToStorageFormat = (importing: any, type: string) => {
    switch (type) {
      case "coaches":
        return {
          id: Date.now(),
          name: importing.name,
          bio: importing.bio,
          specialties: importing.specialties,
          status: importing.status,
          email: importing.email,
          phone: importing.phone || "",
          created_at: new Date().toISOString(),
          total_assignments: 0,
        }
      case "timeslots":
        return {
          id: Date.now(),
          coach_name: importing.coach_name,
          start_time: importing.start_time,
          end_time: importing.end_time,
          status: importing.status,
          coach_id: 1,
          specialties: [],
        }
      case "assignments":
        return {
          id: Date.now(),
          coach_name: importing.coach_name,
          client_name: importing.client_name,
          client_contact: importing.client_contact,
          topic: importing.topic,
          start_time: importing.start_time,
          end_time: importing.end_time,
          priority: importing.priority,
          status: "pending",
          created_at: new Date().toISOString(),
          coach_id: 1,
          time_slot_id: Date.now(),
        }
      default:
        return importing
    }
  }

  const downloadTemplate = (type: string) => {
    const templates = {
      coaches: {
        headers: ["姓名", "簡歷", "專業領域1", "專業領域2", "專業領域3", "狀態", "電子郵件", "電話"],
        rows: [],
        filename: "教練資料匯入範本",
      },
      timeslots: {
        headers: ["教練姓名", "開始時間", "結束時間", "狀態"],
        rows: [],
        filename: "時段資料匯入範本",
      },
      assignments: {
        headers: ["教練姓名", "申請人", "聯絡方式", "諮詢議題", "開始時間", "結束時間", "優先級"],
        rows: [],
        filename: "派案資料匯入範本",
      },
    }

    const template = templates[type as keyof typeof templates]
    if (!template) return

    const csvContent = [
      template.headers.join(","),
      ...template.rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    })

    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${template.filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "coach":
        return "教練"
      case "timeslot":
        return "時段"
      case "assignment":
        return "派案"
      default:
        return type
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("zh-TW")
    } catch {
      return dateString
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          資料匯入匯出
        </CardTitle>
        <CardDescription>批量匯入教練、時段或派案資料，自動檢測重複資料和缺失教練</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 匯入區域 */}
        <div className="space-y-4">
          <h4 className="font-medium">資料匯入</h4>

          <div className="space-y-3">
            <div>
              <Label htmlFor="import-type">匯入類型</Label>
              <Select value={importType} onValueChange={setImportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coaches">教練資料</SelectItem>
                  <SelectItem value="timeslots">時段資料</SelectItem>
                  <SelectItem value="assignments">派案資料</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="import-file">選擇檔案</Label>
              <div className="mt-2">
                <Input
                  id="import-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileImport}
                  disabled={importing}
                  className="hidden"
                />
                <Button
                  onClick={() => document.getElementById("import-file")?.click()}
                  disabled={importing}
                  className="w-full h-12 text-base font-medium border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-800 transition-all duration-200 active:scale-95 active:bg-gray-100"
                  variant="outline"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      匯入中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      點擊選擇檔案或拖拽檔案到此處
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">支援 CSV、Excel 格式，系統會自動檢測重複資料和缺失教練</p>
            </div>
          </div>
        </div>

        {/* 範本下載區域 */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-4">下載匯入範本</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => downloadTemplate("coaches")}
              className="flex items-center gap-2 h-12 border-2 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 active:scale-95"
            >
              <Users className="h-4 w-4" />
              教練範本
            </Button>

            <Button
              variant="outline"
              onClick={() => downloadTemplate("timeslots")}
              className="flex items-center gap-2 h-12 border-2 hover:border-green-300 hover:bg-green-50 transition-all duration-200 active:scale-95"
            >
              <Calendar className="h-4 w-4" />
              時段範本
            </Button>

            <Button
              variant="outline"
              onClick={() => downloadTemplate("assignments")}
              className="flex items-center gap-2 h-12 border-2 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 active:scale-95"
            >
              <FileSpreadsheet className="h-4 w-4" />
              派案範本
            </Button>
          </div>
        </div>

        {/* 匯入說明 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            匯入說明
          </h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 請先下載對應的範本檔案</li>
            <li>• 按照範本格式填寫資料</li>
            <li>• 支援 CSV 和 Excel 格式</li>
            <li>• 系統會自動檢測重複資料並提供處理選項</li>
            <li>• 匯入時段時，若教練不存在會詢問是否新增</li>
            <li>• 匯入資料不會覆蓋現有資料，而是追加新增</li>
            <li>• 匯入後會自動重新載入頁面顯示新資料</li>
          </ul>
        </div>
      </CardContent>

      {/* 缺失教練處理對話框 */}
      <Dialog open={showMissingCoachDialog} onOpenChange={setShowMissingCoachDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-white text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black">
              <UserPlus className="h-5 w-5 text-blue-500" />
              發現缺失教練
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              系統檢測到 {missingCoaches.length} 位教練不存在，請選擇要新增的教練：
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedMissingCoaches(missingCoaches.map((c) => c.name))}
                className="bg-transparent"
              >
                全選
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedMissingCoaches([])}
                className="bg-transparent"
              >
                取消全選
              </Button>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-3">
                {missingCoaches.map((coach, index) => (
                  <Card key={coach.name} className="border-2 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedMissingCoaches.includes(coach.name)}
                          onCheckedChange={(checked) => handleMissingCoachSelection(coach.name, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-blue-100 text-blue-800">教練 #{index + 1}</Badge>
                            <h4 className="font-medium text-lg">{coach.name}</h4>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="mb-2">
                              <strong>相關時段數量：</strong> {coach.timeslots.length} 個
                            </div>
                            <div className="space-y-1">
                              <strong>時段預覽：</strong>
                              {coach.timeslots.slice(0, 3).map((slot, idx) => (
                                <div key={idx} className="ml-2 text-xs">
                                  • {formatDateTime(slot.start_time)} - {formatDateTime(slot.end_time)}
                                </div>
                              ))}
                              {coach.timeslots.length > 3 && (
                                <div className="ml-2 text-xs text-gray-500">
                                  ...還有 {coach.timeslots.length - 3} 個時段
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowMissingCoachDialog(false)} className="bg-transparent">
                取消匯入
              </Button>
              <Button
                onClick={handleCreateMissingCoaches}
                disabled={selectedMissingCoaches.length === 0}
                style={{ backgroundColor: "#E31E24", color: "white" }}
              >
                新增選中教練 ({selectedMissingCoaches.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 重複資料處理對話框 */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-white text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              發現重複資料
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              系統檢測到 {duplicates.length} 項重複資料，請選擇處理方式：
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newResolutions: ConflictResolution = {}
                  duplicates.forEach((dup) => {
                    newResolutions[dup.key] = "replace"
                  })
                  setConflictResolutions(newResolutions)
                }}
                className="bg-transparent"
              >
                全部替換
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newResolutions: ConflictResolution = {}
                  duplicates.forEach((dup) => {
                    newResolutions[dup.key] = "keep"
                  })
                  setConflictResolutions(newResolutions)
                }}
                className="bg-transparent"
              >
                全部保留
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newResolutions: ConflictResolution = {}
                  duplicates.forEach((dup) => {
                    newResolutions[dup.key] = "skip"
                  })
                  setConflictResolutions(newResolutions)
                }}
                className="bg-transparent"
              >
                全部跳過
              </Button>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-4">
                {duplicates.map((duplicate, index) => (
                  <Card key={duplicate.key} className="border-2 border-orange-200">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Badge className="bg-orange-100 text-orange-800 mb-2">
                            {getTypeLabel(duplicate.type)} #{index + 1}
                          </Badge>
                          <h4 className="font-medium">重複項目處理</h4>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={conflictResolutions[duplicate.key] === "keep" ? "default" : "outline"}
                            onClick={() => handleConflictResolution(duplicate.key, "keep")}
                            className={
                              conflictResolutions[duplicate.key] === "keep"
                                ? "bg-blue-500 text-white"
                                : "bg-transparent"
                            }
                          >
                            保留現有
                          </Button>
                          <Button
                            size="sm"
                            variant={conflictResolutions[duplicate.key] === "replace" ? "default" : "outline"}
                            onClick={() => handleConflictResolution(duplicate.key, "replace")}
                            className={
                              conflictResolutions[duplicate.key] === "replace"
                                ? "bg-green-500 text-white"
                                : "bg-transparent"
                            }
                          >
                            替換為新
                          </Button>
                          <Button
                            size="sm"
                            variant={conflictResolutions[duplicate.key] === "skip" ? "default" : "outline"}
                            onClick={() => handleConflictResolution(duplicate.key, "skip")}
                            className={
                              conflictResolutions[duplicate.key] === "skip"
                                ? "bg-gray-500 text-white"
                                : "bg-transparent"
                            }
                          >
                            跳過
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 現有資料 */}
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h5 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            現有資料
                          </h5>
                          <div className="text-sm space-y-1">
                            {duplicate.type === "coach" && (
                              <>
                                <div>
                                  <strong>姓名:</strong> {duplicate.existing.name}
                                </div>
                                <div>
                                  <strong>Email:</strong> {duplicate.existing.email || "無"}
                                </div>
                                <div>
                                  <strong>狀態:</strong> {duplicate.existing.status}
                                </div>
                                <div>
                                  <strong>建立時間:</strong> {formatDateTime(duplicate.existing.created_at)}
                                </div>
                              </>
                            )}
                            {duplicate.type === "timeslot" && (
                              <>
                                <div>
                                  <strong>教練:</strong> {duplicate.existing.coach_name}
                                </div>
                                <div>
                                  <strong>開始:</strong> {formatDateTime(duplicate.existing.start_time)}
                                </div>
                                <div>
                                  <strong>結束:</strong> {formatDateTime(duplicate.existing.end_time)}
                                </div>
                                <div>
                                  <strong>狀態:</strong> {duplicate.existing.status}
                                </div>
                              </>
                            )}
                            {duplicate.type === "assignment" && (
                              <>
                                <div>
                                  <strong>教練:</strong> {duplicate.existing.coach_name}
                                </div>
                                <div>
                                  <strong>申請人:</strong> {duplicate.existing.client_name}
                                </div>
                                <div>
                                  <strong>時間:</strong> {formatDateTime(duplicate.existing.start_time)}
                                </div>
                                <div>
                                  <strong>狀態:</strong> {duplicate.existing.status}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 匯入資料 */}
                        <div className="bg-green-50 p-3 rounded-lg">
                          <h5 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            匯入資料
                          </h5>
                          <div className="text-sm space-y-1">
                            {duplicate.type === "coach" && (
                              <>
                                <div>
                                  <strong>姓名:</strong> {duplicate.importing.name}
                                </div>
                                <div>
                                  <strong>Email:</strong> {duplicate.importing.email || "無"}
                                </div>
                                <div>
                                  <strong>狀態:</strong> {duplicate.importing.status}
                                </div>
                                <div>
                                  <strong>簡歷:</strong> {duplicate.importing.bio || "無"}
                                </div>
                              </>
                            )}
                            {duplicate.type === "timeslot" && (
                              <>
                                <div>
                                  <strong>教練:</strong> {duplicate.importing.coach_name}
                                </div>
                                <div>
                                  <strong>開始:</strong> {formatDateTime(duplicate.importing.start_time)}
                                </div>
                                <div>
                                  <strong>結束:</strong> {formatDateTime(duplicate.importing.end_time)}
                                </div>
                                <div>
                                  <strong>狀態:</strong> {duplicate.importing.status}
                                </div>
                              </>
                            )}
                            {duplicate.type === "assignment" && (
                              <>
                                <div>
                                  <strong>教練:</strong> {duplicate.importing.coach_name}
                                </div>
                                <div>
                                  <strong>申請人:</strong> {duplicate.importing.client_name}
                                </div>
                                <div>
                                  <strong>時間:</strong> {formatDateTime(duplicate.importing.start_time)}
                                </div>
                                <div>
                                  <strong>議題:</strong> {duplicate.importing.topic}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 選擇狀態指示 */}
                      {conflictResolutions[duplicate.key] && (
                        <div className="mt-3 p-2 rounded-lg text-sm font-medium text-center">
                          {conflictResolutions[duplicate.key] === "keep" && (
                            <div className="bg-blue-100 text-blue-800">將保留現有資料</div>
                          )}
                          {conflictResolutions[duplicate.key] === "replace" && (
                            <div className="bg-green-100 text-green-800">將替換為匯入資料</div>
                          )}
                          {conflictResolutions[duplicate.key] === "skip" && (
                            <div className="bg-gray-100 text-gray-800">將跳過此項目</div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowConflictDialog(false)} className="bg-transparent">
                取消匯入
              </Button>
              <Button
                onClick={handleResolveConflicts}
                disabled={Object.keys(conflictResolutions).length !== duplicates.length}
                style={{ backgroundColor: "#E31E24", color: "white" }}
              >
                確認處理 ({Object.keys(conflictResolutions).length}/{duplicates.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
