"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, AlertCircle, Plus, FileText, TrendingUp, CheckCircle } from "lucide-react"
import type { FC } from "react"

interface QuickActionPanelProps {
  onAction?: (action: string) => void
  userType?: string
}

const quickActions = [
  {
    title: "新增時段",
    icon: <Plus className="h-4 w-4" />,
    action: "add-timeslot",
    color: "bg-blue-500",
  },
  {
    title: "查看行程",
    icon: <Calendar className="h-4 w-4" />,
    action: "calendar",
    color: "bg-green-500",
  },
  {
    title: "派案管理",
    icon: <Users className="h-4 w-4" />,
    action: "assignments",
    color: "bg-purple-500",
  },
  {
    title: "匯出報表",
    icon: <FileText className="h-4 w-4" />,
    action: "export",
    color: "bg-orange-500",
  },
]

const QuickActionPanel: FC<QuickActionPanelProps> = ({ onAction, userType }) => {
  const [stats, setStats] = useState({
    pendingAssignments: 0,
    todaySchedule: 0,
    availableSlots: 0,
    totalCoaches: 0,
  })

  const [todaySummary, setTodaySummary] = useState({
    completedSessions: 0,
    cancelledSessions: 0,
    upcomingSessions: 0,
  })

  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    // 載入統計資料
    loadStats()
    loadTodaySummary()
    loadRecentActivities()
  }, [])

  const loadStats = () => {
    // 從 localStorage 載入實際資料
    const assignments = JSON.parse(localStorage.getItem("assignments") || "[]")
    const timeSlots = JSON.parse(localStorage.getItem("timeSlots") || "[]")
    const coaches = JSON.parse(localStorage.getItem("coaches") || "[]")

    const today = new Date().toDateString()

    setStats({
      pendingAssignments: assignments.filter((a: any) => a.status === "pending").length,
      todaySchedule: timeSlots.filter(
        (slot: any) => new Date(slot.start_time).toDateString() === today && slot.status === "assigned",
      ).length,
      availableSlots: timeSlots.filter((slot: any) => slot.status === "available").length,
      totalCoaches: coaches.filter((c: any) => c.status === "active").length,
    })
  }

  const loadTodaySummary = () => {
    // 載入今日摘要（目前為空）
    setTodaySummary({
      completedSessions: 0,
      cancelledSessions: 0,
      upcomingSessions: 0,
    })
  }

  const loadRecentActivities = () => {
    // 載入最近活動（目前為空）
    setRecentActivities([])
  }

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待處理派案</p>
                <p className="text-2xl font-bold text-red-600">{stats.pendingAssignments}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今日行程</p>
                <p className="text-2xl font-bold text-blue-600">{stats.todaySchedule}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">可用時段</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableSlots}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活躍教練</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalCoaches}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            快速操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                onClick={() => onAction?.(action.action)}
                className={`${action.color} hover:opacity-90 text-white h-16 flex flex-col items-center justify-center gap-1`}
              >
                {action.icon}
                <span className="text-xs">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 今日摘要 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            今日摘要
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySummary.completedSessions === 0 &&
          todaySummary.cancelledSessions === 0 &&
          todaySummary.upcomingSessions === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>今日暫無活動記錄</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{todaySummary.completedSessions}</p>
                <p className="text-sm text-gray-600">已完成</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{todaySummary.cancelledSessions}</p>
                <p className="text-sm text-gray-600">已取消</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{todaySummary.upcomingSessions}</p>
                <p className="text-sm text-gray-600">即將開始</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最近活動 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            最近活動
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暫無最近活動</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activity.color}`}></div>
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{activity.time}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default QuickActionPanel
