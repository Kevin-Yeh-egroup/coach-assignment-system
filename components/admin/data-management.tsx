"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Clock, User, Trash2, Calendar, Plus, Edit, Save, X } from "lucide-react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"
import ExportButton from "@/components/export-button"
import type { ExportData } from "@/lib/export-utils"

interface TimeSlot {
  id: number
  start_time: string
  end_time: string
  status: string
  coachId: number
  coachName: string
}

interface Coach {
  id: number
  name: string
  status: string
}

interface EditingSlot {
  id: number
  start_time: string
  end_time: string
  coachId: number
  status: string
}

export default function DataManagement() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [selectedCoach, setSelectedCoach] = useState<string>("all")
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // 新增時段表單
  const [newSlot, setNewSlot] = useState({
    start_time: "",
    end_time: "",
    coachId: "",
    status: "available",
  })

  // 1. 批次選取模式 state
  const [batchMode, setBatchMode] = useState(false)
  const [batchSelectedSlots, setBatchSelectedSlots] = useState<number[]>([])

  const toggleBatchMode = () => {
    setBatchMode((prev) => !prev)
    setBatchSelectedSlots([])
  }

  const handleBatchSelectAll = () => {
    if (batchSelectedSlots.length === filteredSlots.length) {
      setBatchSelectedSlots([])
    } else {
      setBatchSelectedSlots(filteredSlots.map((slot) => slot.id))
    }
  }

  const handleBatchSelectSlot = (slotId: number) => {
    setBatchSelectedSlots((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    )
  }

  const handleBatchDeleteAll = () => {
    if (batchSelectedSlots.length === 0) {
      alert("請選擇要刪除的時段")
      return
    }
    const selectedTimes = filteredSlots
      .filter((slot) => batchSelectedSlots.includes(slot.id))
      .map(
        (slot) => `${slot.coachName} - ${format(new Date(slot.start_time), "MM/dd HH:mm")} - ${format(new Date(slot.end_time), "HH:mm")}`
      )
      .join("\n")
    if (!window.confirm(`此操作需管理員權限！\n\n確定要刪除以下 ${batchSelectedSlots.length} 個時段嗎？\n\n${selectedTimes}\n\n此操作無法復原。`)) {
      return
    }
    // 從全域時段資料中刪除
    const globalTimeslots = JSON.parse(localStorage.getItem("timeslots") || "[]")
    const updatedGlobalTimeslots = globalTimeslots.filter((slot: any) => !batchSelectedSlots.includes(slot.id))
    localStorage.setItem("timeslots", JSON.stringify(updatedGlobalTimeslots))
    // 從各教練的個人時段資料中刪除
    coaches.forEach((coach) => {
      const coachSlots = JSON.parse(localStorage.getItem(`coach_${coach.id}_timeslots`) || "[]")
      const updatedCoachSlots = coachSlots.filter((slot: any) => !batchSelectedSlots.includes(slot.id))
      localStorage.setItem(`coach_${coach.id}_timeslots`, JSON.stringify(updatedCoachSlots))
    })
    // 更新本地狀態
    const updatedSlots = timeSlots.filter((slot) => !batchSelectedSlots.includes(slot.id))
    setTimeSlots(updatedSlots)
    setBatchSelectedSlots([])
    alert(`已刪除 ${batchSelectedSlots.length} 個時段！`)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const filteredSlots = getFilteredTimeSlots()
    if (filteredSlots.length > 0) {
      const allSelected = filteredSlots.every((slot) => selectedSlots.includes(slot.id))
      setSelectAll(allSelected)
    } else {
      setSelectAll(false)
    }
  }, [selectedSlots, timeSlots, selectedCoach])

  const fetchData = async () => {
    try {
      // 獲取所有教練資料
      const globalCoaches = JSON.parse(localStorage.getItem("global_coaches") || "[]")

      const uniqueCoaches = globalCoaches.reduce((acc: Coach[], coach: any) => {
        const exists = acc.find((c) => c.id === coach.id || c.name === coach.name)
        if (!exists) {
          acc.push({
            id: coach.id,
            name: coach.name,
            status: coach.status || "active",
          })
        }
        return acc
      }, [])

      setCoaches(uniqueCoaches)

      // 獲取全域時段資料
      const globalTimeslots = JSON.parse(localStorage.getItem("timeslots") || "[]")

      // 獲取所有教練的個人時段資料
      const allTimeSlots: TimeSlot[] = []

      // 先加入全域時段資料
      globalTimeslots.forEach((slot: any) => {
        const coach = uniqueCoaches.find((c) => c.id === slot.coach_id || c.name === slot.coach_name)
        if (coach) {
          allTimeSlots.push({
            ...slot,
            coachId: coach.id,
            coachName: coach.name,
          })
        }
      })

      // 再加入各教練的個人時段資料
      for (const coach of uniqueCoaches) {
        const coachSlots = JSON.parse(localStorage.getItem(`coach_${coach.id}_timeslots`) || "[]")

        const slotsWithCoachInfo = coachSlots.map((slot: any) => ({
          ...slot,
          coachId: coach.id,
          coachName: coach.name,
        }))

        allTimeSlots.push(...slotsWithCoachInfo)
      }

      // 去重複時段（基於ID）
      const uniqueTimeSlots = allTimeSlots.reduce((acc: TimeSlot[], slot) => {
        const exists = acc.find((s) => s.id === slot.id)
        if (!exists) {
          acc.push(slot)
        }
        return acc
      }, [])

      setTimeSlots(uniqueTimeSlots)
    } catch (error) {
      console.error("載入資料失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredTimeSlots = () => {
    if (selectedCoach === "all") {
      return timeSlots
    }
    return timeSlots.filter((slot) => slot.coachId.toString() === selectedCoach)
  }

  const handleSelectAll = () => {
    const filteredSlots = getFilteredTimeSlots()
    if (selectAll) {
      setSelectedSlots((prev) => prev.filter((id) => !filteredSlots.some((slot) => slot.id === id)))
    } else {
      const newSelected = [...selectedSlots]
      filteredSlots.forEach((slot) => {
        if (!newSelected.includes(slot.id)) {
          newSelected.push(slot.id)
        }
      })
      setSelectedSlots(newSelected)
    }
  }

  const handleSelectSlot = (slotId: number) => {
    setSelectedSlots((prev) => (prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]))
  }

  const handleAddSlot = async () => {
    if (!newSlot.start_time || !newSlot.end_time || !newSlot.coachId) {
      alert("請填寫完整資訊")
      return
    }

    // 驗證時間邏輯
    const startTime = new Date(newSlot.start_time)
    const endTime = new Date(newSlot.end_time)

    if (startTime >= endTime) {
      alert("結束時間必須晚於開始時間")
      return
    }

    try {
      const coach = coaches.find((c) => c.id.toString() === newSlot.coachId)
      if (!coach) {
        alert("找不到指定的教練")
        return
      }

      const newTimeSlot: TimeSlot = {
        id: Date.now(),
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        status: newSlot.status,
        coachId: coach.id,
        coachName: coach.name,
      }

      // 更新全域時段資料
      const globalTimeslots = JSON.parse(localStorage.getItem("timeslots") || "[]")
      globalTimeslots.push(newTimeSlot)
      localStorage.setItem("timeslots", JSON.stringify(globalTimeslots))

      // 更新教練個人時段資料
      const coachSlots = JSON.parse(localStorage.getItem(`coach_${coach.id}_timeslots`) || "[]")
      coachSlots.push(newTimeSlot)
      localStorage.setItem(`coach_${coach.id}_timeslots`, JSON.stringify(coachSlots))

      // 更新本地狀態
      setTimeSlots((prev) => [...prev, newTimeSlot])

      // 重置表單
      setNewSlot({
        start_time: "",
        end_time: "",
        coachId: "",
        status: "available",
      })
      setShowAddDialog(false)

      alert("時段新增成功！")
    } catch (error) {
      console.error("新增時段失敗:", error)
      alert("新增失敗，請稍後再試")
    }
  }

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot({
      id: slot.id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      coachId: slot.coachId,
      status: slot.status,
    })
    setShowEditDialog(true)
  }

  const handleUpdateSlot = async () => {
    if (!editingSlot) return

    // 驗證時間邏輯
    const startTime = new Date(editingSlot.start_time)
    const endTime = new Date(editingSlot.end_time)

    if (startTime >= endTime) {
      alert("結束時間必須晚於開始時間")
      return
    }

    try {
      const coach = coaches.find((c) => c.id === editingSlot.coachId)
      if (!coach) {
        alert("找不到指定的教練")
        return
      }

      const updatedSlot: TimeSlot = {
        id: editingSlot.id,
        start_time: editingSlot.start_time,
        end_time: editingSlot.end_time,
        status: editingSlot.status,
        coachId: coach.id,
        coachName: coach.name,
      }

      // 更新全域時段資料
      const globalTimeslots = JSON.parse(localStorage.getItem("timeslots") || "[]")
      const updatedGlobalTimeslots = globalTimeslots.map((slot: any) =>
        slot.id === editingSlot.id ? updatedSlot : slot,
      )
      localStorage.setItem("timeslots", JSON.stringify(updatedGlobalTimeslots))

      // 更新所有教練的個人時段資料
      coaches.forEach((c) => {
        const coachSlots = JSON.parse(localStorage.getItem(`coach_${c.id}_timeslots`) || "[]")
        const updatedCoachSlots = coachSlots.map((slot: any) => (slot.id === editingSlot.id ? updatedSlot : slot))
        localStorage.setItem(`coach_${c.id}_timeslots`, JSON.stringify(updatedCoachSlots))
      })

      // 更新本地狀態
      setTimeSlots((prev) => prev.map((slot) => (slot.id === editingSlot.id ? updatedSlot : slot)))

      setEditingSlot(null)
      setShowEditDialog(false)

      alert("時段更新成功！")
    } catch (error) {
      console.error("更新時段失敗:", error)
      alert("更新失敗，請稍後再試")
    }
  }

  const handleDeleteSlot = async (slotId: number) => {
    const slot = timeSlots.find((s) => s.id === slotId)
    if (!slot) return

    if (!confirm(`確定要刪除 ${slot.coachName} 在 ${format(new Date(slot.start_time), "MM/dd HH:mm")} 的時段嗎？`)) {
      return
    }

    try {
      // 從全域時段資料中刪除
      const globalTimeslots = JSON.parse(localStorage.getItem("timeslots") || "[]")
      const updatedGlobalTimeslots = globalTimeslots.filter((s: any) => s.id !== slotId)
      localStorage.setItem("timeslots", JSON.stringify(updatedGlobalTimeslots))

      // 從各教練的個人時段資料中刪除
      coaches.forEach((coach) => {
        const coachSlots = JSON.parse(localStorage.getItem(`coach_${coach.id}_timeslots`) || "[]")
        const updatedCoachSlots = coachSlots.filter((s: any) => s.id !== slotId)
        localStorage.setItem(`coach_${coach.id}_timeslots`, JSON.stringify(updatedCoachSlots))
      })

      // 更新本地狀態
      setTimeSlots((prev) => prev.filter((s) => s.id !== slotId))

      alert("時段刪除成功！")
    } catch (error) {
      console.error("刪除時段失敗:", error)
      alert("刪除失敗，請稍後再試")
    }
  }

  const handleBatchDelete = () => {
    if (selectedSlots.length === 0) {
      alert("請選擇要刪除的時段")
      return
    }

    const selectedTimes = timeSlots
      .filter((slot) => selectedSlots.includes(slot.id))
      .map(
        (slot) =>
          `${slot.coachName} - ${format(new Date(slot.start_time), "MM/dd HH:mm")} - ${format(new Date(slot.end_time), "HH:mm")}`,
      )
      .join("\n")

    if (confirm(`確定要刪除以下 ${selectedSlots.length} 個時段嗎？\n\n${selectedTimes}\n\n此操作無法復原。`)) {
      // 從全域時段資料中刪除
      const globalTimeslots = JSON.parse(localStorage.getItem("timeslots") || "[]")
      const updatedGlobalTimeslots = globalTimeslots.filter((slot: any) => !selectedSlots.includes(slot.id))
      localStorage.setItem("timeslots", JSON.stringify(updatedGlobalTimeslots))

      // 從各教練的個人時段資料中刪除
      coaches.forEach((coach) => {
        const coachSlots = JSON.parse(localStorage.getItem(`coach_${coach.id}_timeslots`) || "[]")
        const updatedCoachSlots = coachSlots.filter((slot: any) => !selectedSlots.includes(slot.id))
        localStorage.setItem(`coach_${coach.id}_timeslots`, JSON.stringify(updatedCoachSlots))
      })

      // 更新本地狀態
      const updatedSlots = timeSlots.filter((slot) => !selectedSlots.includes(slot.id))
      setTimeSlots(updatedSlots)
      setSelectedSlots([])

      alert(`已刪除 ${selectedSlots.length} 個時段！`)
    }
  }

  const formatDateTimeForExport = (dateTime: string): string => {
    const date = new Date(dateTime)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, '0')
    
    return `${year}/${month}/${day} ${displayHours}:${displayMinutes}:00 ${ampm}`
  }

  const getAvailableTimeSlotsExportData = (): ExportData => {
    const filteredSlots = getFilteredTimeSlots()
    return {
      headers: ["教練姓名", "開始時間", "結束時間", "狀態"],
      rows: filteredSlots.map((slot) => [
        slot.coachName,
        formatDateTimeForExport(slot.start_time),
        formatDateTimeForExport(slot.end_time),
        STATUS_LABELS[slot.status as keyof typeof STATUS_LABELS] || slot.status,
      ]),
      filename: `可用時段資料_${new Date().toISOString().split("T")[0]}`,
    }
  }

  if (loading) {
    return <div>載入中...</div>
  }

  const filteredSlots = getFilteredTimeSlots()

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              時段總覽
            </CardTitle>
            <CardDescription>管理所有教練的時段資料</CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            {/* 教練選擇 */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="選擇教練" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有教練</SelectItem>
                  {coaches.map((coach) => (
                    <SelectItem key={`coach-${coach.id}`} value={coach.id.toString()}>
                      {coach.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 新增時段按鈕 */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button style={{ backgroundColor: "#E31E24", color: "white" }}>
                  <Plus className="h-4 w-4 mr-2" />
                  新增時段
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>新增時段</DialogTitle>
                  <DialogDescription>為教練新增可用時段</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="coach-select">選擇教練</Label>
                    <Select
                      value={newSlot.coachId}
                      onValueChange={(value) => setNewSlot((prev) => ({ ...prev, coachId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="請選擇教練" />
                      </SelectTrigger>
                      <SelectContent>
                        {coaches.map((coach) => (
                          <SelectItem key={coach.id} value={coach.id.toString()}>
                            {coach.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="start-time">開始時間</Label>
                    <Input
                      id="start-time"
                      type="datetime-local"
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot((prev) => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">結束時間</Label>
                    <Input
                      id="end-time"
                      type="datetime-local"
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot((prev) => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">狀態</Label>
                    <Select
                      value={newSlot.status}
                      onValueChange={(value) => setNewSlot((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">可用</SelectItem>
                        <SelectItem value="booked">已預約</SelectItem>
                        <SelectItem value="pending">待確認</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddSlot} style={{ backgroundColor: "#E31E24", color: "white" }}>
                    <Save className="h-4 w-4 mr-2" />
                    新增
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 匯出按鈕 */}
            <ExportButton data={getAvailableTimeSlotsExportData()} disabled={filteredSlots.length === 0} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* 在頁面頂部加批次選取模式開關 */}
        <div className="flex justify-end mb-2">
          <Button
            variant={batchMode ? "default" : "outline"}
            onClick={toggleBatchMode}
            className={batchMode ? "bg-red-600 text-white" : ""}
          >
            {batchMode ? "退出批次選取" : "批次選取模式"}
          </Button>
        </div>

        {/* 在 CardContent 最上方加批次刪除工具列（僅 batchMode 顯示） */}
        {batchMode && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center gap-4">
              <Button size="sm" variant="outline" onClick={handleBatchSelectAll}>
                {batchSelectedSlots.length === filteredSlots.length ? "取消全選" : "全選所有時段"}
              </Button>
              <span className="text-sm">已選 {batchSelectedSlots.length} 項</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchDeleteAll}
              className="text-red-600 hover:text-red-700 bg-transparent"
              disabled={batchSelectedSlots.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              批次刪除
            </Button>
          </div>
        )}

        {/* 批量操作工具列 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} className="w-5 h-5" />
              <Label className="text-sm font-medium">
                {selectAll ? "取消全選" : "全選"}
                {selectedSlots.length > 0 && ` (已選 ${selectedSlots.length} 項)`}
              </Label>
            </div>
          </div>

          {selectedSlots.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchDelete}
                className="text-red-600 hover:text-red-700 bg-transparent"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                批量刪除
              </Button>
            </div>
          )}
        </div>

        {/* 時段列表 */}
        {filteredSlots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {selectedCoach === "all" ? "沒有找到任何時段" : "該教練沒有時段資料"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSlots
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              .map((slot) => (
                <Card key={slot.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4 flex items-center gap-2">
                    {batchMode && (
                      <Checkbox
                        checked={batchSelectedSlots.includes(slot.id)}
                        onCheckedChange={() => handleBatchSelectSlot(slot.id)}
                        className="w-5 h-5"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={selectedSlots.includes(slot.id)}
                          onCheckedChange={() => handleSelectSlot(slot.id)}
                          className="mt-1 w-5 h-5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={STATUS_COLORS[slot.status as keyof typeof STATUS_COLORS]}>
                              {STATUS_LABELS[slot.status as keyof typeof STATUS_LABELS]}
                            </Badge>
                            <span className="font-medium">{slot.coachName}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(slot.start_time), "yyyy年MM月dd日 (EEEE)", { locale: zhTW })}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(slot.start_time), "HH:mm")} -{" "}
                              {format(new Date(slot.end_time), "HH:mm")}
                              <span className="ml-2 text-gray-500">
                                (
                                {Math.round(
                                  (new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) /
                                    (1000 * 60),
                                )}{" "}
                                分鐘)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 操作按鈕 */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSlot(slot)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* 統計資訊 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {filteredSlots.filter((slot) => slot.status === "available").length}
              </div>
              <div className="text-sm text-gray-600">可用時段</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">
                {filteredSlots.filter((slot) => slot.status === "booked").length}
              </div>
              <div className="text-sm text-gray-600">已預約</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">
                {filteredSlots.filter((slot) => slot.status === "pending").length}
              </div>
              <div className="text-sm text-gray-600">待確認</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-600">{filteredSlots.length}</div>
              <div className="text-sm text-gray-600">總時段數</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>

      {/* 編輯時段對話框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>編輯時段</DialogTitle>
            <DialogDescription>修改時段資訊</DialogDescription>
          </DialogHeader>
          {editingSlot && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-coach-select">選擇教練</Label>
                <Select
                  value={editingSlot.coachId.toString()}
                  onValueChange={(value) =>
                    setEditingSlot((prev) => (prev ? { ...prev, coachId: Number.parseInt(value) } : null))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.map((coach) => (
                      <SelectItem key={coach.id} value={coach.id.toString()}>
                        {coach.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-start-time">開始時間</Label>
                <Input
                  id="edit-start-time"
                  type="datetime-local"
                  value={editingSlot.start_time}
                  onChange={(e) => setEditingSlot((prev) => (prev ? { ...prev, start_time: e.target.value } : null))}
                />
              </div>
              <div>
                <Label htmlFor="edit-end-time">結束時間</Label>
                <Input
                  id="edit-end-time"
                  type="datetime-local"
                  value={editingSlot.end_time}
                  onChange={(e) => setEditingSlot((prev) => (prev ? { ...prev, end_time: e.target.value } : null))}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">狀態</Label>
                <Select
                  value={editingSlot.status}
                  onValueChange={(value) => setEditingSlot((prev) => (prev ? { ...prev, status: value } : null))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">可用</SelectItem>
                    <SelectItem value="booked">已預約</SelectItem>
                    <SelectItem value="pending">待確認</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
            <Button onClick={handleUpdateSlot} style={{ backgroundColor: "#E31E24", color: "white" }}>
              <Save className="h-4 w-4 mr-2" />
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
