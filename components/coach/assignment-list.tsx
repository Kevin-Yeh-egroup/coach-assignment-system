"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ExportData } from "@/lib/export-utils"
import ExportButton from "@/components/export-button"
import type { Assignment } from "@/lib/db"

interface AssignmentListProps {
  coachId: number
}

export default function AssignmentList({ coachId }: AssignmentListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchAssignments()
  }, [coachId])

  useEffect(() => {
    filterAssignments()
  }, [assignments, statusFilter, searchTerm])

  const fetchAssignments = async () => {
    try {
      // 清空派案列表，只顯示空狀態
      setAssignments([])
    } catch (error) {
      console.error("載入派案列表失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAssignments = () => {
    let filtered = assignments

    if (statusFilter !== "all") {
      filtered = filtered.filter((assignment) => assignment.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (assignment) =>
          assignment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.topic.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // 按時間排序（最新的在前）
    filtered.sort((a, b) => new Date(b.start_time || "").getTime() - new Date(a.start_time || "").getTime())

    setFilteredAssignments(filtered)
  }

  const getExportData = (): ExportData => {
    // 從localStorage獲取教練資料
    const coachData = JSON.parse(localStorage.getItem(`coach_${coachId}_profile`) || '{"name": "未知教練"}')

    return {
      headers: ["教練姓名", "申請人", "聯絡方式", "諮詢議題", "開始時間", "結束時間", "優先級"],
      rows: [], // 空資料
      filename: `${coachData.name}_派案資料_${new Date().toISOString().split("T")[0]}`,
    }
  }

  if (loading) {
    return <div>載入中...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>已派案列表</CardTitle>
              <CardDescription>查看您的所有派案記錄</CardDescription>
            </div>
            <ExportButton data={getExportData()} disabled={true} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">搜尋</Label>
              <Input
                id="search"
                placeholder="搜尋申請人或議題..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="status-filter">狀態篩選</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="pending">等待確認</SelectItem>
                  <SelectItem value="confirmed">已確認</SelectItem>
                  <SelectItem value="rejected">已拒絕</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center py-8 text-[#666666]">目前沒有派案記錄</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
