"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus, Clock } from "lucide-react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"

interface QuickAddTimeModalProps {
  selectedDate: Date
  onSave: (timeSlot: any) => void
  onClose: () => void
  coachId: number
}

export default function QuickAddTimeModal({ selectedDate, onSave, onClose, coachId }: QuickAddTimeModalProps) {
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [duration, setDuration] = useState("60")
  const [saving, setSaving] = useState(false)

  const handleDurationChange = (minutes: string) => {
    setDuration(minutes)
    if (startTime) {
      const [hours, mins] = startTime.split(":").map(Number)
      const startDate = new Date()
      startDate.setHours(hours, mins, 0, 0)

      const endDate = new Date(startDate.getTime() + Number.parseInt(minutes) * 60000)
      setEndTime(format(endDate, "HH:mm"))
    }
  }

  const handleStartTimeChange = (time: string) => {
    setStartTime(time)
    if (duration) {
      const [hours, mins] = time.split(":").map(Number)
      const startDate = new Date()
      startDate.setHours(hours, mins, 0, 0)

      const endDate = new Date(startDate.getTime() + Number.parseInt(duration) * 60000)
      setEndTime(format(endDate, "HH:mm"))
    }
  }

  const handleSave = async () => {
    if (!startTime || !endTime) {
      alert("請填寫完整時間")
      return
    }

    const startDateTime = new Date(selectedDate)
    const endDateTime = new Date(selectedDate)

    const [startHour, startMin] = startTime.split(":").map(Number)
    const [endHour, endMin] = endTime.split(":").map(Number)

    startDateTime.setHours(startHour, startMin, 0, 0)
    endDateTime.setHours(endHour, endMin, 0, 0)

    if (endDateTime <= startDateTime) {
      alert("結束時間必須晚於開始時間")
      return
    }

    setSaving(true)
    try {
      const newSlot = {
        id: Date.now(),
        coach_id: coachId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: "available",
      }

      await onSave(newSlot)
      onClose()
    } catch (error) {
      console.error("新增時段失敗:", error)
      alert("新增失敗，請稍後再試")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto bg-white shadow-xl">
        <CardHeader className="pb-3 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5 text-gray-600" />
              快速新增時段
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* 選中日期顯示 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium mb-1">選中日期</div>
            <div className="font-semibold text-blue-800 text-base">
              {format(selectedDate, "yyyy年MM月dd日 (EEEE)", { locale: zhTW })}
            </div>
          </div>

          {/* 常用時長選擇 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">常用時長</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["30", "60", "90", "120"].map((mins) => (
                <Button
                  key={mins}
                  variant={duration === mins ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDurationChange(mins)}
                  className={`h-10 text-sm font-medium transition-all ${
                    duration === mins
                      ? "bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-sm"
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {mins}分
                </Button>
              ))}
            </div>
          </div>

          {/* 時間設定 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-start-time" className="text-sm font-medium text-gray-700">
                開始時間
              </Label>
              <Input
                id="quick-start-time"
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="h-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-end-time" className="text-sm font-medium text-gray-700">
                結束時間
              </Label>
              <Input
                id="quick-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>

          {/* 時長顯示 */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              時長：
              <span className="font-semibold text-gray-800 ml-1">
                {Math.round(
                  (new Date(`2000-01-01T${endTime}`).getTime() - new Date(`2000-01-01T${startTime}`).getTime()) / 60000,
                )}{" "}
                分鐘
              </span>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="order-2 sm:order-1 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="order-1 sm:order-2 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {saving ? "新增中..." : "新增時段"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
