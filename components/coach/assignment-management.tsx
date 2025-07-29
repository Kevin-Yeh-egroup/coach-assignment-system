"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock, User, MessageSquare, Phone } from "lucide-react"
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"
import ExportButton from "@/components/export-button"
import { formatStatus, type ExportData } from "@/lib/export-utils"

interface Assignment {
  id: number
  time_slot_id: number
  client_name: string
  client_contact: string
  topic: string
  status: "pending" | "confirmed" | "rejected" | "completed"
  start_time: string
  end_time: string
  created_at: string
  notes?: string
  priority?: string
}

interface AssignmentManagementProps {
  coachId: number
}

export default function AssignmentManagement({ coachId }: AssignmentManagementProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [responseNotes, setResponseNotes] = useState("")

  useEffect(() => {
    fetchPendingAssignments()
  }, [coachId])

  const fetchPendingAssignments = async () => {
    try {
      // 清空範例資料，從空陣列開始
      const mockAssignments: Assignment[] = []
      setAssignments(mockAssignments)
    } catch (error) {
      console.error("載入派案失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (assignmentId: number) => {
    setProcessingId(assignmentId)
    try {
      // 模擬API調用
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === assignmentId ? { ...assignment, status: "confirmed" as const } : assignment,
        ),
      )

      alert("派案已確認！系統將通知申請人。")
    } catch (error) {
      console.error("確認派案失敗:", error)
      alert("確認失敗，請稍後再試")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (assignmentId: number) => {
    if (!responseNotes.trim()) {
      alert("請填寫拒絕原因")
      return
    }

    setProcessingId(assignmentId)
    try {
      // 模擬API調用
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === assignmentId
            ? { ...assignment, status: "rejected" as const, notes: responseNotes }
            : assignment,
        ),
      )

      setSelectedAssignment(null)
      setResponseNotes("")
      alert("派案已拒絕，系統將通知申請人並釋放時段。")
    } catch (error) {
      console.error("拒絕派案失敗:", error)
      alert("操作失敗，請稍後再試")
    } finally {
      setProcessingId(null)
    }
  }

  const handleComplete = async (assignmentId: number) => {
    setProcessingId(assignmentId)
    try {
      // 模擬API調用
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === assignmentId ? { ...assignment, status: "completed" as const } : assignment,
        ),
      )

      alert("諮詢已標記為完成！")
    } catch (error) {
      console.error("完成派案失敗:", error)
      alert("操作失敗，請稍後再試")
    } finally {
      setProcessingId(null)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    })
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

  const getAssignmentExportData = (): ExportData => {
    // 從localStorage獲取教練資料
    const coachData = JSON.parse(localStorage.getItem(`coach_${coachId}_profile`) || '{"name": "未知教練"}')

    return {
      headers: ["教練姓名", "申請人", "聯絡方式", "諮詢議題", "開始時間", "結束時間", "優先級"],
      rows: assignments.map((assignment) => [
        coachData.name,
        assignment.client_name,
        assignment.client_contact,
        assignment.topic,
        formatDateTimeForExport(assignment.start_time),
        formatDateTimeForExport(assignment.end_time),
        getPriorityLabel(assignment.priority),
      ]),
      filename: `${coachData.name}_派案管理_${new Date().toISOString().split("T")[0]}`,
    }
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      urgent: "緊急",
      high: "高",
      medium: "中",
      low: "低",
    }
    return labels[priority as keyof typeof labels] || priority
  }

  if (loading) {
    return <div>載入派案資料中...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>派案管理</CardTitle>
              <CardDescription>處理派案請求和管理諮詢安排</CardDescription>
            </div>
            <ExportButton data={getAssignmentExportData()} disabled={assignments.length === 0} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {assignments.filter((a) => a.status === "pending").length}
              </div>
              <div className="text-sm text-yellow-700">待處理</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {assignments.filter((a) => a.status === "confirmed").length}
              </div>
              <div className="text-sm text-green-700">已確認</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {assignments.filter((a) => a.status === "completed").length}
              </div>
              <div className="text-sm text-blue-700">已完成</div>
            </div>
          </div>

          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">目前沒有派案</div>
            ) : (
              assignments.map((assignment) => (
                <Card key={assignment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={STATUS_COLORS[assignment.status]}>{STATUS_LABELS[assignment.status]}</Badge>
                          <span className="text-sm text-gray-500">#{assignment.id}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{assignment.client_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{assignment.client_contact}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{formatDateTime(assignment.start_time)}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              時長:{" "}
                              {Math.round(
                                (new Date(assignment.end_time).getTime() - new Date(assignment.start_time).getTime()) /
                                  (1000 * 60),
                              )}{" "}
                              分鐘
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <div className="text-sm font-medium mb-1">諮詢議題：</div>
                              <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{assignment.topic}</div>
                            </div>
                          </div>
                        </div>

                        {assignment.notes && (
                          <div className="mb-3">
                            <div className="text-sm font-medium mb-1">備註：</div>
                            <div className="text-sm text-gray-700 bg-red-50 p-2 rounded border-l-2 border-red-200">
                              {assignment.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      {assignment.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAssignment(assignment)}
                            disabled={processingId === assignment.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            拒絕
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConfirm(assignment.id)}
                            disabled={processingId === assignment.id}
                            style={{ backgroundColor: "#28A745", color: "white" }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {processingId === assignment.id ? "處理中..." : "確認"}
                          </Button>
                        </>
                      )}

                      {assignment.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={() => handleComplete(assignment.id)}
                          disabled={processingId === assignment.id}
                          style={{ backgroundColor: "#007BFF", color: "white" }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {processingId === assignment.id ? "處理中..." : "標記完成"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 拒絕派案對話框 */}
      {selectedAssignment && (
        <Card className="border-2 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">拒絕派案</CardTitle>
            <CardDescription>請說明拒絕原因，系統將通知申請人</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">拒絕原因</Label>
              <Textarea
                id="reject-reason"
                placeholder="請詳細說明拒絕原因，例如：時間衝突、專業領域不符等"
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAssignment(null)
                  setResponseNotes("")
                }}
              >
                取消
              </Button>
              <Button
                onClick={() => handleReject(selectedAssignment.id)}
                disabled={processingId === selectedAssignment.id || !responseNotes.trim()}
                style={{ backgroundColor: "#DC3545", color: "white" }}
              >
                {processingId === selectedAssignment.id ? "處理中..." : "確認拒絕"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
