"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Grid3X3,
  List,
  Clock,
  CalendarDays,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Save,
  X,
} from "lucide-react"
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
  addDays,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
} from "date-fns"
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

type ViewMode = "day" | "week" | "month" | "year" | "agenda"

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedCoach, setSelectedCoach] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)

  // 新增/編輯時段相關狀態
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null)

  // 新增時段表單
  const [newSlot, setNewSlot] = useState({
    start_time: "",
    end_time: "",
    coachId: "",
    status: "available",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // 獲取所有教練資料
      const globalCoaches = JSON.parse(localStorage.getItem("global_coaches") || "[]")

      // 去重複並確保每個教練只出現一次
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

  const navigateDate = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      switch (viewMode) {
        case "day":
          return direction === "prev" ? addDays(prev, -1) : addDays(prev, 1)
        case "week":
          return direction === "prev" ? addDays(prev, -7) : addDays(prev, 7)
        case "month":
          return direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
        case "year":
          return direction === "prev" ? addMonths(prev, -12) : addMonths(prev, 12)
        default:
          return prev
      }
    })
  }

  const getFilteredTimeSlots = () => {
    if (selectedCoach === "all") {
      return timeSlots
    }
    return timeSlots.filter((slot) => slot.coachId.toString() === selectedCoach)
  }

  const getDaySlots = (date: Date) => {
    const filteredSlots = getFilteredTimeSlots()
    return filteredSlots.filter((slot) => isSameDay(new Date(slot.start_time), date))
  }

  const getDateTitle = () => {
    switch (viewMode) {
      case "day":
        return format(currentDate, "yyyy年MM月dd日 (EEEE)", { locale: zhTW })
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
        return `${format(weekStart, "MM/dd", { locale: zhTW })} - ${format(weekEnd, "MM/dd", { locale: zhTW })}`
      case "month":
        return format(currentDate, "yyyy年 MM月", { locale: zhTW })
      case "year":
        return format(currentDate, "yyyy年", { locale: zhTW })
      case "agenda":
        return "時間表檢視"
      default:
        return ""
    }
  }

  // 新增時段處理
  const handleAddSlot = (date?: Date) => {
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd")
      setNewSlot({
        start_time: `${dateStr}T09:00`,
        end_time: `${dateStr}T10:00`,
        coachId: "",
        status: "available",
      })
      setSelectedDate(date)
    }
    setShowAddDialog(true)
  }

  const handleSaveNewSlot = async () => {
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
      setSelectedDate(null)

      alert("時段新增成功！")
    } catch (error) {
      console.error("新增時段失敗:", error)
      alert("新增失敗，請稍後再試")
    }
  }

  // 編輯時段處理
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

  // 刪除時段處理
  const handleDeleteSlot = async (slot: TimeSlot) => {
    if (!confirm(`確定要刪除 ${slot.coachName} 在 ${format(new Date(slot.start_time), "MM/dd HH:mm")} 的時段嗎？`)) {
      return
    }

    try {
      // 從全域時段資料中刪除
      const globalTimeslots = JSON.parse(localStorage.getItem("timeslots") || "[]")
      const updatedGlobalTimeslots = globalTimeslots.filter((s: any) => s.id !== slot.id)
      localStorage.setItem("timeslots", JSON.stringify(updatedGlobalTimeslots))

      // 從各教練的個人時段資料中刪除
      coaches.forEach((coach) => {
        const coachSlots = JSON.parse(localStorage.getItem(`coach_${coach.id}_timeslots`) || "[]")
        const updatedCoachSlots = coachSlots.filter((s: any) => s.id !== slot.id)
        localStorage.setItem(`coach_${coach.id}_timeslots`, JSON.stringify(updatedCoachSlots))
      })

      // 更新本地狀態
      setTimeSlots((prev) => prev.filter((s) => s.id !== slot.id))

      alert("時段刪除成功！")
    } catch (error) {
      console.error("刪除時段失敗:", error)
      alert("刪除失敗，請稍後再試")
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

  const getCalendarExportData = (): ExportData => {
    const filteredSlots = getFilteredTimeSlots()
    return {
      headers: ["教練姓名", "開始時間", "結束時間", "狀態"],
      rows: filteredSlots.map((slot) => [
        slot.coachName,
        formatDateTimeForExport(slot.start_time),
        formatDateTimeForExport(slot.end_time),
        STATUS_LABELS[slot.status as keyof typeof STATUS_LABELS] || slot.status,
      ]),
      filename: `時段總覽_${format(currentDate, "yyyy-MM", { locale: zhTW })}_${new Date().toISOString().split("T")[0]}`,
    }
  }

  // 渲染時段卡片（帶操作按鈕）
  const renderSlotCard = (slot: TimeSlot, isCompact = false) => {
    return (
      <div
        key={slot.id}
        className={`relative group text-xs p-1 rounded border ${
          STATUS_COLORS[slot.status as keyof typeof STATUS_COLORS]
        } hover:shadow-md transition-shadow`}
      >
        <div className="truncate font-medium">{slot.coachName}</div>
        <div className="truncate">
          {format(new Date(slot.start_time), "HH:mm")} - {format(new Date(slot.end_time), "HH:mm")}
        </div>
        {!isCompact && (
          <Badge
            className={`text-xs mt-1 ${STATUS_COLORS[slot.status as keyof typeof STATUS_COLORS]}`}
            variant="outline"
          >
            {STATUS_LABELS[slot.status as keyof typeof STATUS_LABELS]}
          </Badge>
        )}

        {/* 操作按鈕 - 滑鼠懸停時顯示 */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 bg-white/80 hover:bg-white">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditSlot(slot)}>
                <Edit className="h-4 w-4 mr-2" />
                編輯
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteSlot(slot)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                刪除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const daySlots = getDaySlots(currentDate).sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    )

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center py-4 px-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold">{format(currentDate, "yyyy年MM月dd日 (EEEE)", { locale: zhTW })}</h3>
          <Button
            size="sm"
            onClick={() => handleAddSlot(currentDate)}
            style={{ backgroundColor: "#E31E24", color: "white" }}
          >
            <Plus className="h-4 w-4 mr-2" />
            新增時段
          </Button>
        </div>

        {daySlots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">這一天沒有安排時段</div>
        ) : (
          <div className="space-y-3">
            {daySlots.map((slot) => (
              <Card key={slot.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {format(new Date(slot.start_time), "HH:mm")} - {format(new Date(slot.end_time), "HH:mm")}
                        </span>
                        <Badge className={STATUS_COLORS[slot.status as keyof typeof STATUS_COLORS]}>
                          {STATUS_LABELS[slot.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">{slot.coachName}</div>
                    </div>
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
                        onClick={() => handleDeleteSlot(slot)}
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
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {["日", "一", "二", "三", "四", "五", "六"].map((day, index) => (
            <div key={day} className="text-center font-medium text-gray-500 py-2 border-b">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const daySlots = getDaySlots(day)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toISOString()}
                className={`min-h-32 p-2 border rounded-lg relative group ${
                  isToday ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">{format(day, "d")}</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddSlot(day)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {daySlots.slice(0, 3).map((slot) => renderSlotCard(slot, true))}
                  {daySlots.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">+{daySlots.length - 3}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div key={day} className="text-center font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const daySlots = getDaySlots(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)

            return (
              <div
                key={day.toISOString()}
                className={`min-h-32 p-2 border rounded-lg relative group ${
                  isToday ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">{format(day, "d")}</div>
                  {isCurrentMonth && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddSlot(day)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  {daySlots.slice(0, 4).map((slot) => renderSlotCard(slot, true))}
                  {daySlots.length > 4 && (
                    <div className="text-xs text-gray-500 text-center">+{daySlots.length - 4} 更多</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate)
    const yearEnd = endOfYear(currentDate)
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })

    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {months.map((month) => {
          const monthSlots = getFilteredTimeSlots().filter((slot) => isSameMonth(new Date(slot.start_time), month))

          return (
            <Card key={month.toISOString()} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="text-center mb-3">
                  <h4 className="font-medium">{format(month, "MM月", { locale: zhTW })}</h4>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">總時段: {monthSlots.length}</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="text-green-600">
                      可用: {monthSlots.filter((s) => s.status === "available").length}
                    </div>
                    <div className="text-red-600">已預約: {monthSlots.filter((s) => s.status === "booked").length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  const renderAgendaView = () => {
    const filteredSlots = getFilteredTimeSlots()
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 50) // 限制顯示數量

    return (
      <div className="space-y-3">
        {filteredSlots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">沒有找到時段資料</div>
        ) : (
          filteredSlots.map((slot) => (
            <Card key={slot.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
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
                        {format(new Date(slot.start_time), "HH:mm")} - {format(new Date(slot.end_time), "HH:mm")}
                      </div>
                    </div>
                  </div>
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
                      onClick={() => handleDeleteSlot(slot)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    )
  }

  const renderCurrentView = () => {
    switch (viewMode) {
      case "day":
        return renderDayView()
      case "week":
        return renderWeekView()
      case "month":
        return renderMonthView()
      case "year":
        return renderYearView()
      case "agenda":
        return renderAgendaView()
      default:
        return renderMonthView()
    }
  }

  if (loading) {
    return <div>載入中...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                時段總覽
              </CardTitle>
              <CardDescription>查看所有教練的時段安排</CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              {/* 檢視模式選擇 */}
              <div className="flex items-center gap-2">
                <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />日
                      </div>
                    </SelectItem>
                    <SelectItem value="week">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" />週
                      </div>
                    </SelectItem>
                    <SelectItem value="month">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />月
                      </div>
                    </SelectItem>
                    <SelectItem value="year">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />年
                      </div>
                    </SelectItem>
                    <SelectItem value="agenda">
                      <div className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        時間表
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              {/* 匯出按鈕 */}
              <ExportButton data={getCalendarExportData()} disabled={timeSlots.length === 0} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* 導航控制 */}
            {viewMode !== "agenda" && (
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => navigateDate("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">{getDateTitle()}</h2>
                <Button variant="outline" onClick={() => navigateDate("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* 主要內容區域 */}
            {renderCurrentView()}

            {/* 統計資訊 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-600">
                    {getFilteredTimeSlots().filter((slot) => slot.status === "available").length}
                  </div>
                  <div className="text-sm text-gray-600">可用時段</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-red-600">
                    {getFilteredTimeSlots().filter((slot) => slot.status === "booked").length}
                  </div>
                  <div className="text-sm text-gray-600">已預約</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {getFilteredTimeSlots().filter((slot) => slot.status === "pending").length}
                  </div>
                  <div className="text-sm text-gray-600">待確認</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-gray-600">{getFilteredTimeSlots().length}</div>
                  <div className="text-sm text-gray-600">總時段數</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 新增時段對話框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增時段</DialogTitle>
            <DialogDescription>
              {selectedDate ? `為 ${format(selectedDate, "yyyy年MM月dd日", { locale: zhTW })} 新增時段` : "新增時段"}
            </DialogDescription>
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
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
            <Button onClick={handleSaveNewSlot} style={{ backgroundColor: "#E31E24", color: "white" }}>
              <Save className="h-4 w-4 mr-2" />
              新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  )
}
