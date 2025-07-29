"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, UserPlus, Calendar, Clock, User, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { formatDateTimeForExport, type ExportData } from "@/lib/export-utils"
import ExportButton from "@/components/export-button"

interface TimeSlot {
  id: number
  coach_id: number
  coach_name: string
  start_time: string
  end_time: string
  status: "available" | "assigned" | "confirmed"
  specialties: string[]
}

interface Assignment {
  id: number
  time_slot_id: number
  coach_id: number
  coach_name: string
  client_name: string
  client_contact: string
  topic: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  start_time: string
  end_time: string
  notes?: string
}

interface Coach {
  id: number
  name: string
  status: string
}

export default function AssignmentOperations() {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]) // 儲存所有時段
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedCoach, setSelectedCoach] = useState<string>("all") // 新增教練篩選

  // 新派案表單狀態
  const [newAssignment, setNewAssignment] = useState({
    client_name: "",
    client_contact: "",
    topic: "",
    priority: "medium" as const,
    notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // 根據選擇的教練篩選時段
    if (selectedCoach === "all") {
      setAvailableSlots(allSlots)
    } else {
      setAvailableSlots(allSlots.filter((slot) => slot.coach_id.toString() === selectedCoach))
    }
  }, [selectedCoach, allSlots])

  const fetchData = async () => {
    try {
      // 從localStorage獲取教練資料
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

      // 從localStorage獲取時段資料
      const timeslots = JSON.parse(localStorage.getItem("timeslots") || "[]")

      // 轉換時段資料格式
      const mockSlots: TimeSlot[] = timeslots.map((slot: any) => {
        const coach = uniqueCoaches.find((c) => c.id === slot.coach_id || c.name === slot.coach_name)
        return {
          id: slot.id,
          coach_id: coach?.id || slot.coach_id || 1,
          coach_name: coach?.name || slot.coach_name || "未知教練",
          start_time: slot.start_time,
          end_time: slot.end_time,
          status: "available",
          specialties: slot.specialties || [],
        }
      })

      // 從localStorage獲取派案資料
      const assignments = JSON.parse(localStorage.getItem("assignments") || "[]")

      setAllSlots(mockSlots)
      setAvailableSlots(mockSlots)
      setAssignments(assignments)
    } catch (error) {
      console.error("載入資料失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssignment = async () => {
    if (!selectedSlot || !newAssignment.client_name || !newAssignment.topic) {
      alert("請填寫完整資訊")
      return
    }

    try {
      const assignment: Assignment = {
        id: Date.now(),
        time_slot_id: selectedSlot.id,
        coach_id: selectedSlot.coach_id,
        coach_name: selectedSlot.coach_name,
        client_name: newAssignment.client_name,
        client_contact: newAssignment.client_contact,
        topic: newAssignment.topic,
        status: "pending",
        priority: newAssignment.priority,
        created_at: new Date().toISOString(),
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        notes: newAssignment.notes,
      }

      const updatedAssignments = [...assignments, assignment]
      setAssignments(updatedAssignments)
      localStorage.setItem("assignments", JSON.stringify(updatedAssignments))

      // 從所有時段列表中移除
      const updatedAllSlots = allSlots.filter((slot) => slot.id !== selectedSlot.id)
      setAllSlots(updatedAllSlots)

      // 更新可用時段列表
      setAvailableSlots((prev) => prev.filter((slot) => slot.id !== selectedSlot.id))

      // 重置表單
      setNewAssignment({
        client_name: "",
        client_contact: "",
        topic: "",
        priority: "medium",
        notes: "",
      })
      setSelectedSlot(null)
      setShowCreateForm(false)

      alert("派案已建立！系統將通知教練。")
    } catch (error) {
      console.error("建立派案失敗:", error)
      alert("建立失敗，請稍後再試")
    }
  }

  const handleCancelAssignment = async (assignmentId: number) => {
    if (!confirm("確定要取消這個派案嗎？")) return

    try {
      const assignment = assignments.find((a) => a.id === assignmentId)
      if (assignment) {
        // 將時段重新加入可用列表
        const slot: TimeSlot = {
          id: assignment.time_slot_id,
          coach_id: assignment.coach_id,
          coach_name: assignment.coach_name,
          start_time: assignment.start_time,
          end_time: assignment.end_time,
          status: "available",
          specialties: [], // 實際應該從教練資料獲取
        }
        setAllSlots((prev) => [...prev, slot])
        setAvailableSlots((prev) => [...prev, slot])
      }

      const updatedAssignments = assignments.filter((a) => a.id !== assignmentId)
      setAssignments(updatedAssignments)
      localStorage.setItem("assignments", JSON.stringify(updatedAssignments))

      alert("派案已取消，時段已重新開放。")
    } catch (error) {
      console.error("取消派案失敗:", error)
      alert("取消失敗，請稍後再試")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "等待確認",
      confirmed: "已確認",
      completed: "已完成",
      cancelled: "已取消",
    }
    return labels[status as keyof typeof labels] || status
  }

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.coach_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.topic.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter
    const matchesPriority = priorityFilter === "all" || assignment.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

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
    return {
      headers: ["教練姓名", "申請人", "聯絡方式", "諮詢議題", "開始時間", "結束時間", "優先級"],
      rows: assignments.map((assignment) => [
        assignment.coach_name,
        assignment.client_name,
        assignment.client_contact || "",
        assignment.topic,
        formatDateTimeForExport(assignment.start_time),
        formatDateTimeForExport(assignment.end_time),
        assignment.priority,
      ]),
      filename: `派案資料_${new Date().toISOString().split("T")[0]}`,
    }
  }

  if (loading) {
    return <div>載入派案資料中...</div>
  }

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">可用時段</p>
                <p className="text-2xl font-bold text-green-600">{availableSlots.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">待確認派案</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {assignments.filter((a) => a.status === "pending").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已確認派案</p>
                <p className="text-2xl font-bold text-blue-600">
                  {assignments.filter((a) => a.status === "confirmed").length}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">緊急派案</p>
                <p className="text-2xl font-bold text-red-600">
                  {assignments.filter((a) => a.priority === "urgent").length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 可用時段和新增派案 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  可用時段
                </CardTitle>
                <CardDescription>選擇時段進行派案</CardDescription>
              </div>

              {/* 教練選擇器 */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                  <SelectTrigger className="w-40">
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
            </div>
          </CardHeader>
          <CardContent>
            {availableSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {selectedCoach === "all" ? "目前沒有可用時段" : "該教練目前沒有可用時段"}
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableSlots
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .map((slot) => (
                    <Card
                      key={slot.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedSlot?.id === slot.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <CardContent className="pt-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{slot.coach_name}</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(slot.start_time), "MM/dd (EEE) HH:mm", { locale: zhTW })} -{" "}
                              {format(new Date(slot.end_time), "HH:mm")}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {slot.specialties.map((specialty, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {selectedSlot?.id === slot.id && <Badge className="bg-blue-100 text-blue-800">已選擇</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              建立新派案
            </CardTitle>
            <CardDescription>為選定的時段建立派案</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedSlot ? (
              <div className="text-center py-8 text-gray-500">請先選擇一個可用時段</div>
            ) : (
              <>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium">{selectedSlot.coach_name}</div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(selectedSlot.start_time), "yyyy/MM/dd (EEE) HH:mm", { locale: zhTW })} -{" "}
                    {format(new Date(selectedSlot.end_time), "HH:mm")}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="client-name">申請人姓名 *</Label>
                    <Input
                      id="client-name"
                      value={newAssignment.client_name}
                      onChange={(e) => setNewAssignment((prev) => ({ ...prev, client_name: e.target.value }))}
                      placeholder="請輸入申請人姓名"
                    />
                  </div>

                  <div>
                    <Label htmlFor="client-contact">聯絡方式</Label>
                    <Input
                      id="client-contact"
                      value={newAssignment.client_contact}
                      onChange={(e) => setNewAssignment((prev) => ({ ...prev, client_contact: e.target.value }))}
                      placeholder="電話或Email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="topic">諮詢議題 *</Label>
                    <Textarea
                      id="topic"
                      value={newAssignment.topic}
                      onChange={(e) => setNewAssignment((prev) => ({ ...prev, topic: e.target.value }))}
                      placeholder="請詳細描述諮詢需求"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">優先級</Label>
                    <Select
                      value={newAssignment.priority}
                      onValueChange={(value) =>
                        setNewAssignment((prev) => ({ ...prev, priority: value as typeof newAssignment.priority }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低優先級</SelectItem>
                        <SelectItem value="medium">中優先級</SelectItem>
                        <SelectItem value="high">高優先級</SelectItem>
                        <SelectItem value="urgent">緊急</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">備註</Label>
                    <Textarea
                      id="notes"
                      value={newAssignment.notes}
                      onChange={(e) => setNewAssignment((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="其他需要說明的事項"
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleCreateAssignment}
                    className="w-full"
                    style={{ backgroundColor: "#E31E24", color: "white" }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    建立派案
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 派案管理 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>派案管理</CardTitle>
              <CardDescription>管理所有派案記錄</CardDescription>
            </div>
            <ExportButton data={getAssignmentExportData()} disabled={assignments.length === 0} />
          </div>
        </CardHeader>
        <CardContent>
          {/* 篩選和搜尋 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋申請人、教練或議題..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有狀態</SelectItem>
                <SelectItem value="pending">等待確認</SelectItem>
                <SelectItem value="confirmed">已確認</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有優先級</SelectItem>
                <SelectItem value="urgent">緊急</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 派案列表 */}
          <div className="space-y-4">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">沒有符合條件的派案記錄</div>
            ) : (
              filteredAssignments.map((assignment) => (
                <Card key={assignment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={getStatusColor(assignment.status)}>
                            {getStatusLabel(assignment.status)}
                          </Badge>
                          <Badge className={getPriorityColor(assignment.priority)}>
                            {getPriorityLabel(assignment.priority)}
                          </Badge>
                          <span className="text-sm text-gray-500">#{assignment.id}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="font-medium">{assignment.client_name}</div>
                            <div className="text-sm text-gray-600">{assignment.client_contact}</div>
                            <div className="text-sm text-gray-600">教練：{assignment.coach_name}</div>
                          </div>
                          <div>
                            <div className="text-sm">
                              {format(new Date(assignment.start_time), "yyyy/MM/dd (EEE) HH:mm", { locale: zhTW })} -{" "}
                              {format(new Date(assignment.end_time), "HH:mm")}
                            </div>
                            <div className="text-sm text-gray-500">
                              建立時間：{format(new Date(assignment.created_at), "MM/dd HH:mm")}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-2">
                          <strong>議題：</strong>
                          {assignment.topic}
                        </div>

                        {assignment.notes && (
                          <div className="text-sm text-gray-600">
                            <strong>備註：</strong>
                            {assignment.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {assignment.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            取消
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          詳情
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
