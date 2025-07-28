"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Plus, Edit, Trash2, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns"
import { zhTW } from "date-fns/locale"
import RecurringTimeForm from "@/components/time/recurring-time-form"
import QuickAddTimeModal from "@/components/time/quick-add-time-modal"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"
import ExportButton from "@/components/export-button"
import type { ExportData } from "@/lib/export-utils"

interface TimeManagementProps {
  coachId: number
}

interface TimeSlot {
  id: number
  start_time: string
  end_time: string
  status: string
}

export default function TimeManagement({ coachId }: TimeManagementProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null)
  const [addMode, setAddMode] = useState<"single" | "recurring">("single")
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null)

  // 批量選擇相關狀態
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    fetchTimeSlots()
    verifyDateMapping()
  }, [coachId])

  useEffect(() => {
    // 更新全選狀態
    const daySlots = selectedCalendarDate ? getDaySlots(selectedCalendarDate) : timeSlots
    if (daySlots.length > 0) {
      const allSelected = daySlots.every((slot) => selectedSlots.includes(slot.id))
      setSelectAll(allSelected)
    } else {
      setSelectAll(false)
    }
  }, [selectedSlots, timeSlots, selectedCalendarDate])

  // 驗證日期對應關係的函數
  const verifyDateMapping = () => {
    console.log("=== 日期對應驗證 ===")

    // 測試 2025年7月1日應該是週二
    const testDate = new Date(2025, 6, 1) // 月份從0開始，所以6代表7月
    const dayOfWeek = getDay(testDate)
    const weekdayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"]

    console.log(`2025年7月1日:`)
    console.log(`  Date對象: ${testDate.toString()}`)
    console.log(`  getDay()結果: ${dayOfWeek}`)
    console.log(`  對應星期: ${weekdayNames[dayOfWeek]}`)
    console.log(`  預期: 週二 (2)`)
    console.log(`  驗證結果: ${dayOfWeek === 2 ? "✅ 正確" : "❌ 錯誤"}`)

    // 測試當前月份的一些日期
    const currentMonth = new Date()
    console.log(`\n當前月份 ${format(currentMonth, "yyyy年MM月")} 的前幾天:`)
    for (let i = 1; i <= 7; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
      const day = getDay(date)
      console.log(`  ${i}日: ${weekdayNames[day]} (${day})`)
    }
  }

  const fetchTimeSlots = async () => {
    try {
      const storedSlots = localStorage.getItem(`coach_${coachId}_timeslots`)
      if (storedSlots) {
        const allSlots = JSON.parse(storedSlots)
        const filteredSlots = allSlots.filter((slot: TimeSlot) => slot.id > 5)
        setTimeSlots(filteredSlots)
        localStorage.setItem(`coach_${coachId}_timeslots`, JSON.stringify(filteredSlots))
      } else {
        setTimeSlots([])
        localStorage.setItem(`coach_${coachId}_timeslots`, JSON.stringify([]))
      }
    } catch (error) {
      console.error("載入時間段失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveTimeSlots = (slots: TimeSlot[]) => {
    localStorage.setItem(`coach_${coachId}_timeslots`, JSON.stringify(slots))
  }

  // 批量選擇功能
  const handleSelectAll = () => {
    const daySlots = selectedCalendarDate ? getDaySlots(selectedCalendarDate) : timeSlots
    if (selectAll) {
      // 取消全選
      setSelectedSlots((prev) => prev.filter((id) => !daySlots.some((slot) => slot.id === id)))
    } else {
      // 全選
      const newSelected = [...selectedSlots]
      daySlots.forEach((slot) => {
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

  // 批量刪除功能
  const handleBatchDelete = () => {
    if (selectedSlots.length === 0) {
      alert("請選擇要刪除的時段")
      return
    }

    const selectedTimes = timeSlots
      .filter((slot) => selectedSlots.includes(slot.id))
      .map(
        (slot) => `${format(new Date(slot.start_time), "MM/dd HH:mm")} - ${format(new Date(slot.end_time), "HH:mm")}`,
      )
      .join("\n")

    if (confirm(`確定要刪除以下 ${selectedSlots.length} 個時段嗎？\n\n${selectedTimes}\n\n此操作無法復原。`)) {
      const updatedSlots = timeSlots.filter((slot) => !selectedSlots.includes(slot.id))
      setTimeSlots(updatedSlots)
      saveTimeSlots(updatedSlots)
      setSelectedSlots([])
      alert(`已刪除 ${selectedSlots.length} 個時段！`)
    }
  }

  const handleCalendarDateClick = (date: Date) => {
    setSelectedCalendarDate(date)
    setQuickAddDate(date)
    setShowQuickAddModal(true)
  }

  const handleQuickAddSave = async (newSlot: any) => {
    const updatedSlots = [...timeSlots, newSlot]
    setTimeSlots(updatedSlots)
    saveTimeSlots(updatedSlots)
    alert("時段已新增！")
  }

  const handleAddButtonClick = () => {
    setAddMode("single")
    setShowAddForm(true)
    setShowRecurringForm(false)
  }

  const handleAddModeChange = (mode: "single" | "recurring") => {
    setAddMode(mode)
    if (mode === "recurring") {
      setShowAddForm(false)
      setShowRecurringForm(true)
    } else {
      setShowRecurringForm(false)
      setShowAddForm(true)
    }
  }

  const handleBackToSingle = () => {
    setShowRecurringForm(false)
    setShowAddForm(true)
    setAddMode("single")
  }

  const handleAddSingle = async () => {
    if (!selectedDate) {
      alert("請選擇日期")
      return
    }

    const startDateTime = new Date(selectedDate)
    const endDateTime = new Date(selectedDate)

    const [startHour, startMin] = startTime.split(":").map(Number)
    const [endHour, endMin] = endTime.split(":").map(Number)

    startDateTime.setHours(startHour, startMin, 0, 0)
    endDateTime.setHours(endHour, endMin, 0, 0)

    const newSlot = {
      id: Date.now(),
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: "available",
    }

    const updatedSlots = [...timeSlots, newSlot]
    setTimeSlots(updatedSlots)
    saveTimeSlots(updatedSlots)

    setShowAddForm(false)
    setSelectedDate(undefined)
    setStartTime("09:00")
    setEndTime("10:00")
    alert("時間段已新增")
  }

  const handleAddRecurring = (slots: any[]) => {
    const newSlots = slots.map((slot, index) => ({
      id: Date.now() + index,
      start_time: slot.start_time,
      end_time: slot.end_time,
      status: "available",
    }))

    const updatedSlots = [...timeSlots, ...newSlots]
    setTimeSlots(updatedSlots)
    saveTimeSlots(updatedSlots)

    setShowRecurringForm(false)
    alert(`已新增 ${newSlots.length} 個重複時段`)
  }

  const handleEdit = (slot: TimeSlot) => {
    setEditingSlot(slot)
    const startDate = new Date(slot.start_time)
    const endDate = new Date(slot.end_time)

    setSelectedDate(startDate)
    setStartTime(format(startDate, "HH:mm"))
    setEndTime(format(endDate, "HH:mm"))
    setAddMode("single")
    setShowAddForm(true)
    setShowRecurringForm(false)
  }

  const handleUpdate = async () => {
    if (!editingSlot || !selectedDate) return

    const startDateTime = new Date(selectedDate)
    const endDateTime = new Date(selectedDate)

    const [startHour, startMin] = startTime.split(":").map(Number)
    const [endHour, endMin] = endTime.split(":").map(Number)

    startDateTime.setHours(startHour, startMin, 0, 0)
    endDateTime.setHours(endHour, endMin, 0, 0)

    const updatedSlots = timeSlots.map((slot) =>
      slot.id === editingSlot.id
        ? {
            ...slot,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
          }
        : slot,
    )

    setTimeSlots(updatedSlots)
    saveTimeSlots(updatedSlots)

    setEditingSlot(null)
    setShowAddForm(false)
    alert("時間段已更新")
  }

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除這個時間段嗎？")) {
      const updatedSlots = timeSlots.filter((slot) => slot.id !== id)
      setTimeSlots(updatedSlots)
      saveTimeSlots(updatedSlots)
      alert("時間段已刪除")
    }
  }

  const formatDateTimeForExport = (dateTime: string) => {
    const date = new Date(dateTime)
    return format(date, "yyyy-MM-dd HH:mm")
  }

  const getTimeSlotExportData = (): ExportData => {
    // 優先使用登入時的姓名
    const userData = JSON.parse(localStorage.getItem("user") || '{"name": "未知教練"}')
    const coachProfile = JSON.parse(localStorage.getItem(`coach_${coachId}_profile`) || "{}")

    const coachName = userData.name || coachProfile.name || "未知教練"

    return {
      headers: ["教練姓名", "開始時間", "結束時間", "狀態", "時段ID"],
      rows: timeSlots.map((slot) => [
        coachName,
        formatDateTimeForExport(slot.start_time),
        formatDateTimeForExport(slot.end_time),
        slot.status,
        slot.id.toString(),
      ]),
      filename: `${coachName}_時段資料_${new Date().toISOString().split("T")[0]}`,
    }
  }

  // 修正行事曆顯示邏輯
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // 獲取包含完整週的日期範圍
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 週日開始
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  // 獲取行事曆顯示的所有日期
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getDaySlots = (date: Date) => {
    return timeSlots.filter((slot) => isSameDay(new Date(slot.start_time), date))
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => (direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)))
  }

  if (loading) {
    return <div>載入中...</div>
  }

  if (showRecurringForm) {
    return (
      <RecurringTimeForm
        coachId={coachId}
        onSave={handleAddRecurring}
        onCancel={() => setShowRecurringForm(false)}
        onBackToSingle={handleBackToSingle}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>時間管理</CardTitle>
              <CardDescription>管理您的可用時間安排，點擊行事曆日期可快速新增時段</CardDescription>
            </div>
            <div className="flex gap-2">
              {/* 移除 Popover 結構，直接渲染按鈕 */}
              <ExportButton data={getTimeSlotExportData()} disabled={timeSlots.length === 0} />
              <Button
                style={{ backgroundColor: "#E31E24", color: "white" }}
                onClick={handleAddButtonClick}
              >
                <Plus className="h-4 w-4 mr-2" />
                新增時段
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="mb-6 bg-white">
              <CardHeader className="bg-white">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{editingSlot ? "編輯時間段" : "新增時間段"}</CardTitle>
                  {!editingSlot && (
                    <Select
                      value={addMode}
                      onValueChange={(value) => handleAddModeChange(value as "single" | "recurring")}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white shadow-lg z-50">
                        <SelectItem value="single">單次時段</SelectItem>
                        <SelectItem value="recurring">重複時段</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 bg-white">
                <div className="space-y-2">
                  <Label>日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "yyyy年MM月dd日", { locale: zhTW }) : "選擇日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white shadow-lg z-50">
                      <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">開始時間</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-time">結束時間</Label>
                    <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingSlot(null)
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={editingSlot ? handleUpdate : handleAddSingle}
                    style={{ backgroundColor: "#E31E24", color: "white" }}
                  >
                    {editingSlot ? "更新" : "新增"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 修正後的行事曆檢視 */}
          <div className="space-y-4">
            {/* 月份導航 */}
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">{format(currentDate, "yyyy年 MM月", { locale: zhTW })}</h2>
              <Button variant="outline" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 星期標題 */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["日", "一", "二", "三", "四", "五", "六"].map((day, index) => (
                <div key={day} className="text-center font-medium text-gray-500 py-2">
                  {day}
                  <div className="text-xs text-gray-400">({index})</div>
                </div>
              ))}
            </div>

            {/* 修正後的日期格子 */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const daySlots = getDaySlots(day)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedCalendarDate && isSameDay(day, selectedCalendarDate)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const dayOfWeek = getDay(day)
                const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"]

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 p-2 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-[#E31E24] ${
                      isToday ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                    } ${isSelected ? "ring-2 ring-blue-500" : ""} ${!isCurrentMonth ? "opacity-40" : ""}`}
                    onClick={() => handleCalendarDateClick(day)}
                    title={`${format(day, "yyyy年MM月dd日 EEEE", { locale: zhTW })} - 點擊新增時段`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className={`text-sm font-medium ${!isCurrentMonth ? "text-gray-400" : ""}`}>
                        {format(day, "d")}
                      </div>
                      <div className="text-xs text-gray-400">{weekdayNames[dayOfWeek]}</div>
                    </div>

                    <div className="space-y-1">
                      {daySlots.slice(0, 3).map((slot) => (
                        <div
                          key={slot.id}
                          className={`text-xs p-1 rounded border ${STATUS_COLORS[slot.status as keyof typeof STATUS_COLORS]}`}
                          title={`${format(new Date(slot.start_time), "HH:mm")} - ${format(new Date(slot.end_time), "HH:mm")}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCalendarDate(day)
                          }}
                        >
                          <div className="truncate">{format(new Date(slot.start_time), "HH:mm")}</div>
                        </div>
                      ))}
                      {daySlots.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">+{daySlots.length - 3} 更多</div>
                      )}
                      {daySlots.length === 0 && (
                        <div className="text-xs text-gray-400 text-center">
                          點擊新增
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 日期驗證資訊 */}
            <div className="bg-gray-50 p-3 rounded-lg text-xs">
              <div className="font-medium mb-1">行事曆驗證：</div>
              <div>當前月份第一天：{format(monthStart, "yyyy-MM-dd EEEE", { locale: zhTW })}</div>
              <div>2025年7月1日驗證：{format(new Date(2025, 6, 1), "yyyy-MM-dd EEEE", { locale: zhTW })}</div>
            </div>
          </div>

          {/* 選中日期的詳細資訊 */}
          {selectedCalendarDate && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {format(selectedCalendarDate, "yyyy年MM月dd日 (EEEE)", { locale: zhTW })} 時段詳情
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getDaySlots(selectedCalendarDate).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">這一天沒有安排時段</div>
                    <Button
                      onClick={() => handleCalendarDateClick(selectedCalendarDate)}
                      style={{ backgroundColor: "#E31E24", color: "white" }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      新增時段
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
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

                    {getDaySlots(selectedCalendarDate)
                      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                      .map((slot) => (
                        <Card key={slot.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3 flex-1">
                                <Checkbox
                                  checked={selectedSlots.includes(slot.id)}
                                  onCheckedChange={() => handleSelectSlot(slot.id)}
                                  className="mt-1 w-5 h-5"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">
                                      {format(new Date(slot.start_time), "HH:mm")} -{" "}
                                      {format(new Date(slot.end_time), "HH:mm")}
                                    </span>
                                    <Badge className={STATUS_COLORS[slot.status as keyof typeof STATUS_COLORS]}>
                                      {STATUS_LABELS[slot.status as keyof typeof STATUS_LABELS]}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(slot)}
                                  disabled={slot.status !== "available"}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(slot.id)}
                                  disabled={slot.status !== "available"}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* 快速新增時段模態框 */}
      {showQuickAddModal && quickAddDate && (
        <QuickAddTimeModal
          selectedDate={quickAddDate}
          onSave={handleQuickAddSave}
          onClose={() => {
            setShowQuickAddModal(false)
            setQuickAddDate(null)
          }}
          coachId={coachId}
        />
      )}
    </div>
  )
}
