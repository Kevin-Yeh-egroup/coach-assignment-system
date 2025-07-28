"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart } from "recharts"
import { Calendar, TrendingUp, Users, Clock } from "lucide-react"
import ExportButton from "@/components/export-button"
import type { ExportData } from "@/lib/export-utils"

export default function ReportsAnalytics() {
  const [timeRange, setTimeRange] = useState("month")
  const [reportType, setReportType] = useState("overview")
  const [loading, setLoading] = useState(true)

  // 清空所有報表資料
  const [reportData, setReportData] = useState({
    assignmentTrends: [],
    coachPerformance: [],
    statusDistribution: [],
    timeSlotUtilization: [],
    summary: {
      totalAssignments: 0,
      completionRate: 0,
      averageResponseTime: 0,
      topCoach: "無資料",
    },
  })

  useEffect(() => {
    fetchReportData()
  }, [timeRange, reportType])

  const fetchReportData = async () => {
    try {
      // 清空所有報表資料
      const emptyData = {
        assignmentTrends: [],
        coachPerformance: [],
        statusDistribution: [],
        timeSlotUtilization: [],
        summary: {
          totalAssignments: 0,
          completionRate: 0,
          averageResponseTime: 0,
          topCoach: "無資料",
        },
      }

      setReportData(emptyData)
    } catch (error) {
      console.error("載入報表資料失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const getExportData = (): ExportData => {
    const headers = ["項目", "數值", "說明"]
    const rows = [
      ["總派案數", reportData.summary.totalAssignments.toString(), "統計期間內的總派案數量"],
      ["完成率", `${reportData.summary.completionRate}%`, "已完成派案佔總派案的百分比"],
      ["平均回應時間", `${reportData.summary.averageResponseTime}小時`, "教練平均回應派案的時間"],
      ["表現最佳教練", reportData.summary.topCoach, "統計期間內表現最佳的教練"],
    ]

    return {
      headers,
      rows,
      filename: `系統報表_${timeRange}_${new Date().toISOString().split("T")[0]}`,
    }
  }

  const COLORS = ["#E31E24", "#007BFF", "#28A745", "#FFC107", "#6C757D"]

  if (loading) {
    return <div>載入報表資料中...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>報表與分析</CardTitle>
              <CardDescription>系統使用情況和效能分析</CardDescription>
            </div>
            <ExportButton data={getExportData()} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="選擇時間範圍" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">本週</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="quarter">本季</SelectItem>
                <SelectItem value="year">本年</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="選擇報表類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">總覽</SelectItem>
                <SelectItem value="coach">教練表現</SelectItem>
                <SelectItem value="assignment">派案分析</SelectItem>
                <SelectItem value="time">時間分析</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 摘要統計 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">總派案數</p>
                    <p className="text-2xl font-bold">{reportData.summary.totalAssignments}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">完成率</p>
                    <p className="text-2xl font-bold text-green-600">{reportData.summary.completionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">平均回應時間</p>
                    <p className="text-2xl font-bold text-orange-600">{reportData.summary.averageResponseTime}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">表現最佳</p>
                    <p className="text-lg font-bold text-purple-600">{reportData.summary.topCoach}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 圖表區域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 派案趨勢圖 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">派案趨勢</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart className="h-16 w-16 mx-auto mb-2 text-gray-300" />
                    <p>暫無資料</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 狀態分布圖 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">派案狀態分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 mx-auto mb-2 text-gray-300" />
                    <p>暫無資料</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 教練表現 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">教練表現排行</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-gray-500 py-8">
                    <Users className="h-16 w-16 mx-auto mb-2 text-gray-300" />
                    <p>暫無教練資料</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 時段利用率 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">時段利用率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Clock className="h-16 w-16 mx-auto mb-2 text-gray-300" />
                    <p>暫無時段資料</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
