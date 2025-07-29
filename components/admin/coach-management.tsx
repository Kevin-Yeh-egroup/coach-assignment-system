"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, User, Mail, Phone, Calendar, Search } from "lucide-react"
import ExportButton from "@/components/export-button"
import { formatDateTimeForExport, type ExportData } from "@/lib/export-utils"

interface Coach {
  id: number
  name: string
  email?: string
  phone?: string
  specialties: string[]
  bio?: string
  status: "active" | "inactive"
  created_at: string
  last_login?: string
  total_assignments?: number
}

export default function CoachManagement() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // 批量選擇相關狀態
  const [selectedCoaches, setSelectedCoaches] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // 表單狀態
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: [] as string[],
    bio: "",
    status: "active" as "active" | "inactive",
  })

  useEffect(() => {
    fetchCoaches()
  }, [])

  useEffect(() => {
    // 更新全選狀態
    const filteredCoaches = getFilteredCoaches()
    if (filteredCoaches.length > 0) {
      const allSelected = filteredCoaches.every((coach) => selectedCoaches.includes(coach.id))
      setSelectAll(allSelected)
    } else {
      setSelectAll(false)
    }
  }, [selectedCoaches, coaches, searchTerm, statusFilter])

  const fetchCoaches = async () => {
    try {
      const savedCoaches = localStorage.getItem("admin_coaches")
      if (savedCoaches) {
        setCoaches(JSON.parse(savedCoaches))
      } else {
        setCoaches([])
      }
    } catch (error) {
      console.error("載入教練資料失敗:", error)
      setCoaches([])
    } finally {
      setLoading(false)
    }
  }

  const saveCoaches = (updatedCoaches: Coach[]) => {
    localStorage.setItem("admin_coaches", JSON.stringify(updatedCoaches))
    setCoaches(updatedCoaches)
  }

  const getFilteredCoaches = () => {
    return coaches.filter((coach) => {
      const matchesSearch =
        coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (coach.email && coach.email.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === "all" || coach.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }

  // 批量選擇功能
  const handleSelectAll = () => {
    const filteredCoaches = getFilteredCoaches()
    if (selectAll) {
      // 取消全選
      setSelectedCoaches((prev) => prev.filter((id) => !filteredCoaches.some((coach) => coach.id === id)))
    } else {
      // 全選
      const newSelected = [...selectedCoaches]
      filteredCoaches.forEach((coach) => {
        if (!newSelected.includes(coach.id)) {
          newSelected.push(coach.id)
        }
      })
      setSelectedCoaches(newSelected)
    }
  }

  const handleSelectCoach = (coachId: number) => {
    setSelectedCoaches((prev) => (prev.includes(coachId) ? prev.filter((id) => id !== coachId) : [...prev, coachId]))
  }

  // 批量刪除功能
  const handleBatchDelete = () => {
    if (selectedCoaches.length === 0) {
      alert("請選擇要刪除的教練")
      return
    }

    const selectedNames = coaches
      .filter((coach) => selectedCoaches.includes(coach.id))
      .map((coach) => coach.name)
      .join("、")

    if (confirm(`確定要刪除以下 ${selectedCoaches.length} 位教練嗎？\n\n${selectedNames}\n\n此操作無法復原。`)) {
      const updatedCoaches = coaches.filter((coach) => !selectedCoaches.includes(coach.id))
      saveCoaches(updatedCoaches)

      setSelectedCoaches([])
      alert(`已刪除 ${selectedCoaches.length} 位教練！`)
    }
  }

  // 批量狀態變更
  const handleBatchStatusChange = (newStatus: "active" | "inactive") => {
    if (selectedCoaches.length === 0) {
      alert("請選擇要變更狀態的教練")
      return
    }

    const statusText = newStatus === "active" ? "啟用" : "停用"
    if (confirm(`確定要將選中的 ${selectedCoaches.length} 位教練設為${statusText}嗎？`)) {
      const updatedCoaches = coaches.map((coach) =>
        selectedCoaches.includes(coach.id) ? { ...coach, status: newStatus } : coach,
      )
      saveCoaches(updatedCoaches)
      setSelectedCoaches([])
      alert(`已${statusText} ${selectedCoaches.length} 位教練！`)
    }
  }

  const handleAddCoach = () => {
    if (!formData.name.trim()) {
      alert("請輸入教練姓名")
      return
    }

    const newCoach: Coach = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      specialties: formData.specialties,
      bio: formData.bio,
      status: formData.status,
      created_at: new Date().toISOString(),
      total_assignments: 0,
    }

    const updatedCoaches = [...coaches, newCoach]
    saveCoaches(updatedCoaches)

    setFormData({
      name: "",
      email: "",
      phone: "",
      specialties: [],
      bio: "",
      status: "active",
    })
    setIsAddDialogOpen(false)
    alert("教練新增成功！")
  }

  const handleEditCoach = () => {
    if (!editingCoach || !formData.name.trim()) {
      alert("請輸入教練姓名")
      return
    }

    const updatedCoaches = coaches.map((coach) =>
      coach.id === editingCoach.id
        ? {
            ...coach,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            specialties: formData.specialties,
            bio: formData.bio,
            status: formData.status,
          }
        : coach,
    )

    saveCoaches(updatedCoaches)
    setIsEditDialogOpen(false)
    setEditingCoach(null)
    alert("教練資料更新成功！")
  }

  const handleDeleteCoach = (coachId: number) => {
    if (confirm("確定要刪除這位教練嗎？此操作無法復原。")) {
      const updatedCoaches = coaches.filter((coach) => coach.id !== coachId)
      saveCoaches(updatedCoaches)
      alert("教練已刪除！")
    }
  }

  const openEditDialog = (coach: Coach) => {
    setEditingCoach(coach)
    setFormData({
      name: coach.name,
      email: coach.email || "",
      phone: coach.phone || "",
      specialties: coach.specialties || [],
      bio: coach.bio || "",
      status: coach.status,
    })
    setIsEditDialogOpen(true)
  }

  const toggleCoachStatus = (coachId: number) => {
    const updatedCoaches = coaches.map((coach) =>
      coach.id === coachId
        ? { ...coach, status: coach.status === "active" ? ("inactive" as const) : ("active" as const) }
        : coach,
    )
    saveCoaches(updatedCoaches)
  }

  const filteredCoaches = getFilteredCoaches()

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

  const getExportData = (): ExportData => {
    return {
      headers: ["姓名", "簡歷", "專業領域1", "專業領域2", "專業領域3", "狀態"],
      rows: filteredCoaches.map((coach) => [
        coach.name,
        coach.bio || "",
        coach.specialties[0] || "",
        coach.specialties[1] || "",
        coach.specialties[2] || "",
        coach.status === "active" ? "active" : "inactive",
      ]),
      filename: `教練管理清單_${new Date().toISOString().split("T")[0]}`,
    }
  }

  if (loading) {
    return <div>載入教練資料中...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>教練管理</CardTitle>
              <CardDescription>管理系統中的教練資料（僅供管理員參考）</CardDescription>
            </div>
            <div className="flex gap-2">
              <ExportButton data={getExportData()} disabled={filteredCoaches.length === 0} />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button style={{ backgroundColor: "#E31E24", color: "white" }}>
                    <Plus className="h-4 w-4 mr-2" />
                    新增教練
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white text-black border border-gray-200 shadow-lg">
                  <DialogHeader>
                    <DialogTitle className="text-black">新增教練</DialogTitle>
                    <DialogDescription className="text-gray-600">新增教練資料到管理系統</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-black">
                        姓名 *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="請輸入教練姓名"
                        className="bg-white text-black border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-black">
                        電子郵件
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="請輸入電子郵件"
                        className="bg-white text-black border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-black">
                        電話
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="請輸入電話號碼"
                        className="bg-white text-black border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio" className="text-black">
                        簡歷
                      </Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="請輸入教練簡歷"
                        rows={3}
                        className="bg-white text-black border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-black">
                        狀態
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger className="bg-white text-black border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black border-gray-300">
                          <SelectItem value="active">啟用</SelectItem>
                          <SelectItem value="inactive">停用</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        className="text-black border-gray-300"
                      >
                        取消
                      </Button>
                      <Button onClick={handleAddCoach} style={{ backgroundColor: "#E31E24", color: "white" }}>
                        新增
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋教練姓名或電子郵件..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="篩選狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="active">啟用</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 批量操作工具列 */}
          {filteredCoaches.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} className="w-5 h-5" />
                  <Label className="text-sm font-medium">
                    {selectAll ? "取消全選" : "全選"}
                    {selectedCoaches.length > 0 && ` (已選 ${selectedCoaches.length} 項)`}
                  </Label>
                </div>
              </div>

              {selectedCoaches.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBatchStatusChange("active")}
                    className="text-green-600 hover:text-green-700 bg-transparent"
                  >
                    批量啟用
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBatchStatusChange("inactive")}
                    className="text-orange-600 hover:text-orange-700 bg-transparent"
                  >
                    批量停用
                  </Button>
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
          )}

          <div className="space-y-4">
            {filteredCoaches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {coaches.length === 0 ? "目前沒有教練資料" : "沒有符合條件的教練"}
              </div>
            ) : (
              filteredCoaches.map((coach) => (
                <Card key={coach.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={selectedCoaches.includes(coach.id)}
                          onCheckedChange={() => handleSelectCoach(coach.id)}
                          className="mt-1 w-5 h-5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{coach.name}</h4>
                            <Badge
                              className={
                                coach.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }
                            >
                              {coach.status === "active" ? "啟用" : "停用"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div className="space-y-1">
                              {coach.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="h-4 w-4" />
                                  {coach.email}
                                </div>
                              )}
                              {coach.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="h-4 w-4" />
                                  {coach.phone}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                建立: {new Date(coach.created_at).toLocaleDateString("zh-TW")}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                派案數: {coach.total_assignments || 0}
                              </div>
                            </div>
                          </div>

                          {coach.specialties && coach.specialties.length > 0 && (
                            <div className="mb-3">
                              <div className="text-sm font-medium mb-1">專業領域:</div>
                              <div className="flex flex-wrap gap-1">
                                {coach.specialties.map((specialty, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {coach.bio && (
                            <div className="mb-3">
                              <div className="text-sm font-medium mb-1">簡歷:</div>
                              <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{coach.bio}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCoachStatus(coach.id)}
                          className={
                            coach.status === "active"
                              ? "text-orange-600 hover:text-orange-700"
                              : "text-green-600 hover:text-green-700"
                          }
                        >
                          {coach.status === "active" ? "停用" : "啟用"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(coach)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCoach(coach.id)}
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
        </CardContent>
      </Card>

      {/* 編輯對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white text-black border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-black">編輯教練</DialogTitle>
            <DialogDescription className="text-gray-600">修改教練資料</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-black">
                姓名 *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="請輸入教練姓名"
                className="bg-white text-black border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="text-black">
                電子郵件
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="請輸入電子郵件"
                className="bg-white text-black border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone" className="text-black">
                電話
              </Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="請輸入電話號碼"
                className="bg-white text-black border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="edit-bio" className="text-black">
                簡歷
              </Label>
              <Textarea
                id="edit-bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="請輸入教練簡歷"
                rows={3}
                className="bg-white text-black border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="edit-status" className="text-black">
                狀態
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-white text-black border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white text-black border-gray-300">
                  <SelectItem value="active">啟用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="text-black border-gray-300"
              >
                取消
              </Button>
              <Button onClick={handleEditCoach} style={{ backgroundColor: "#E31E24", color: "white" }}>
                儲存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
