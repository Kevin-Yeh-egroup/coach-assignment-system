"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Clock, Repeat, ArrowLeft } from "lucide-react"

interface RecurringTimeFormProps {
  coachId: number
  onSave: (timeSlots: any[]) => void
  onCancel: () => void
  onBackToSingle: () => void
}

export default function RecurringTimeForm({ coachId, onSave, onCancel, onBackToSingle }: RecurringTimeFormProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  // 星期對應 - 直接使用 JavaScript getDay() 的值
  const weekDays = [
    { value: 1, label: "週一" }, // JavaScript getDay() = 1
    { value: 2, label: "週二" }, // JavaScript getDay() = 2
    { value: 3, label: "週三" }, // JavaScript getDay() = 3
    { value: 4, label: "週四" }, // JavaScript getDay() = 4
    { value: 5, label: "週五" }, // JavaScript getDay() = 5
    { value: 6, label: "週六" }, // JavaScript getDay() = 6
    { value: 0, label: "週日" }, // JavaScript getDay() = 0
  ]

  const handleDayToggle = (dayValue: number) => {
    setSelectedDays((prev) => (prev.includes(dayValue) ? prev.filter((d) => d !== dayValue) : [...prev, dayValue]))
  }

  const generateTimeSlots = () => {
    if (!startDate || !endDate || !startTime || !endTime || selectedDays.length === 0) {
      alert("請填寫所有必要欄位")
      return
    }

    const slots = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    // 確保結束日期不早於開始日期
    if (end < start) {
      alert("結束日期不能早於開始日期")
      return
    }

    console.log("=== 重複時段產生驗證 ===")
    console.log("開始日期:", startDate)
    console.log("結束日期:", endDate)
    console.log("選中的星期值:", selectedDays)
    console.log(
      "選中的星期名稱:",
      selectedDays
        .map((day) => {
          const weekday = weekDays.find((wd) => wd.value === day)
          return weekday ? weekday.label : `未知(${day})`
        })
        .join(", "),
    )

    // 預期的日期列表
    const expectedDates = []

    // 遍歷日期範圍，找出所有符合條件的日期
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date) // 創建新的日期對象避免引用問題
      const dayOfWeek = currentDate.getDay() // 0=週日, 1=週一, ..., 6=週六

      console.log(`檢查日期: ${currentDate.toLocaleDateString("zh-TW")} (${currentDate.toDateString()})`)
      console.log(`  JavaScript getDay(): ${dayOfWeek}`)
      console.log(`  對應星期: ${getWeekdayName(dayOfWeek)}`)
      console.log(`  是否在選中列表: ${selectedDays.includes(dayOfWeek)}`)

      // 檢查這一天是否是選中的星期
      if (selectedDays.includes(dayOfWeek)) {
        expectedDates.push({
          date: currentDate.toLocaleDateString("zh-TW"),
          weekday: getWeekdayName(dayOfWeek),
          jsDay: dayOfWeek,
        })

        const slotDate = new Date(currentDate)
        const [startHour, startMinute] = startTime.split(":").map(Number)
        const [endHour, endMinute] = endTime.split(":").map(Number)

        const startDateTime = new Date(slotDate)
        startDateTime.setHours(startHour, startMinute, 0, 0)

        const endDateTime = new Date(slotDate)
        endDateTime.setHours(endHour, endMinute, 0, 0)

        console.log(`  ✓ 新增時段: ${startDateTime.toISOString()}`)
        console.log(`    日期: ${startDateTime.toLocaleDateString("zh-TW")}`)
        console.log(`    星期: ${getWeekdayName(startDateTime.getDay())}`)
        console.log(
          `    時間: ${startDateTime.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })} - ${endDateTime.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}`,
        )

        slots.push({
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: "available",
        })
      } else {
        console.log(`  ✗ 跳過 (不是選中的星期)`)
      }
    }

    console.log("\n=== 產生結果摘要 ===")
    console.log("預期的日期列表:", expectedDates)
    console.log("總共產生時段數:", slots.length)
    console.log("產生的時段摘要:")
    slots.forEach((slot, index) => {
      const slotDate = new Date(slot.start_time)
      console.log(
        `  ${index + 1}. ${slotDate.toLocaleDateString("zh-TW")} (${getWeekdayName(slotDate.getDay())}) ${slotDate.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })} - ${new Date(slot.end_time).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}`,
      )
    })

    if (slots.length === 0) {
      alert("在指定的日期範圍內沒有符合條件的日期")
      return
    }

    // 驗證：確保所有產生的時段都是正確的星期
    const verification = slots.every((slot) => {
      const slotDate = new Date(slot.start_time)
      const slotDayOfWeek = slotDate.getDay()
      return selectedDays.includes(slotDayOfWeek)
    })

    console.log("驗證結果:", verification ? "✓ 所有時段都是正確的星期" : "✗ 發現錯誤的星期")

    if (!verification) {
      alert("錯誤：產生的時段包含不正確的星期，請檢查程式碼")
      return
    }

    onSave(slots)
  }

  // 輔助函數：獲取星期名稱
  const getWeekdayName = (dayOfWeek: number): string => {
    const names = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"]
    return names[dayOfWeek] || `未知(${dayOfWeek})`
  }

  const getPreviewCount = () => {
    if (!startDate || !endDate || selectedDays.length === 0) return 0

    let count = 0
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay()
      if (selectedDays.includes(dayOfWeek)) {
        count++
      }
    }

    return count
  }

  const getSelectedDaysText = () => {
    return selectedDays
      .sort()
      .map((day) => weekDays.find((wd) => wd.value === day)?.label)
      .filter(Boolean)
      .join("、")
  }

  // 獲取預覽日期列表（用於顯示具體會產生哪些日期）
  const getPreviewDates = () => {
    if (!startDate || !endDate || selectedDays.length === 0) return []

    const dates = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date)
      const dayOfWeek = currentDate.getDay()
      if (selectedDays.includes(dayOfWeek)) {
        dates.push({
          date: currentDate.toLocaleDateString("zh-TW"),
          weekday: getWeekdayName(dayOfWeek),
        })
      }
    }

    return dates.slice(0, 10) // 只顯示前10個日期
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            批量新增重複時段
          </CardTitle>
          <Button variant="outline" onClick={onBackToSingle} className="flex items-center gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            返回單次新增
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 日期範圍 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              開始日期
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              結束日期
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>
        </div>

        {/* 時間範圍 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              開始時間
            </Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              結束時間
            </Label>
            <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
        </div>

        {/* 重複星期選擇 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">重複星期</Label>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const isSelected = selectedDays.includes(day.value)
              return (
                <div
                  key={day.value}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-[#E31E24] bg-red-50 text-[#E31E24] font-semibold shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleDayToggle(day.value)}
                >
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleDayToggle(day.value)}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`day-${day.value}`}
                    className={`text-sm font-medium cursor-pointer ${isSelected ? "text-[#E31E24]" : "text-gray-700"}`}
                  >
                    {day.label}
                  </Label>
                </div>
              )
            })}
          </div>
          {selectedDays.length > 0 && (
            <div className="text-sm text-[#E31E24] font-medium">已選擇：{getSelectedDaysText()}</div>
          )}
        </div>

        {/* 預覽資訊 - 增強版 */}
        {startDate && endDate && selectedDays.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">預覽資訊</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>日期範圍：</strong>
                {startDate} 至 {endDate}
              </p>
              <p>
                <strong>重複星期：</strong>
                {getSelectedDaysText()}
              </p>
              <p>
                <strong>時間：</strong>
                {startTime} - {endTime}
              </p>
              <p>
                <strong>預計產生：</strong>
                {getPreviewCount()} 個時段
              </p>

              {/* 顯示具體的日期列表 */}
              {getPreviewDates().length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-blue-900 mb-1">將會產生的日期：</p>
                  <div className="max-h-32 overflow-y-auto">
                    {getPreviewDates().map((dateInfo, index) => (
                      <div key={index} className="text-xs bg-white px-2 py-1 rounded mb-1">
                        {dateInfo.date} ({dateInfo.weekday})
                      </div>
                    ))}
                    {getPreviewCount() > 10 && (
                      <div className="text-xs text-blue-600">...還有 {getPreviewCount() - 10} 個日期</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex gap-3 pt-4">
          <Button onClick={generateTimeSlots} className="flex-1" style={{ backgroundColor: "#E31E24", color: "white" }}>
            產生時段
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1 bg-transparent">
            取消
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
