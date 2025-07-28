"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Clock, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react"

interface DashboardStatsProps {
  onStatsLoad?: (stats: any) => void
}

export default function DashboardStats({ onStatsLoad }: DashboardStatsProps) {
  const [stats, setStats] = useState({
    totalCoaches: 0,
    activeCoaches: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    availableSlots: 0,
    systemAlerts: 0,
    todayAssignments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // 清空所有統計資料
      const emptyStats = {
        totalCoaches: 0,
        activeCoaches: 0,
        totalAssignments: 0,
        pendingAssignments: 0,
        completedAssignments: 0,
        availableSlots: 0,
        systemAlerts: 0,
        todayAssignments: 0,
      }

      setStats(emptyStats)
      onStatsLoad?.(emptyStats)
    } catch (error) {
      console.error("載入統計資料失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>載入統計資料中...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">總教練數</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCoaches}</div>
          <p className="text-xs text-muted-foreground">活躍: {stats.activeCoaches}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">總派案數</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAssignments}</div>
          <p className="text-xs text-muted-foreground">今日: {stats.todayAssignments}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">待處理派案</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.pendingAssignments}</div>
          <p className="text-xs text-muted-foreground">需要處理</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">可用時段</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.availableSlots}</div>
          <p className="text-xs text-muted-foreground">可預約</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">已完成派案</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.completedAssignments}</div>
          <p className="text-xs text-muted-foreground">本月完成</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">系統警告</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.systemAlerts}</div>
          <p className="text-xs text-muted-foreground">需要關注</p>
        </CardContent>
      </Card>
    </div>
  )
}
