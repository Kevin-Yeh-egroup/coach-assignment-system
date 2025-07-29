"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, User, Clock, Calendar, FileText, ArrowLeft } from "lucide-react"
import CoachProfile from "@/components/coach/coach-profile"
import TimeManagement from "@/components/coach/time-management"
import AssignmentManagement from "@/components/coach/assignment-management"
import AssignmentList from "@/components/coach/assignment-list"
import NotificationCenter from "@/components/notification/notification-center"
import QuickActionPanel from "@/components/quick-actions/quick-action-panel"
import GlobalSearch from "@/components/search/global-search"

export default function CoachDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.type !== "coach") {
        router.push("/")
        return
      }
      setUser(parsedUser)
    } catch (error) {
      console.error("解析用戶資料錯誤:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const handleCardClick = (section: string) => {
    setActiveTab(section)
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "add-timeslot":
        setActiveTab("time")
        break
      case "calendar":
        setActiveTab("time")
        break
      case "assignments":
        setActiveTab("assignments")
        break
      case "export":
        setActiveTab("history")
        // 可額外觸發匯出事件
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("exportData"))
        }, 100)
        break
      default:
        console.log("未知操作:", action)
    }
  }

  const handleSearchResult = (result: any) => {
    console.log("搜尋結果點擊:", result)
    // 根據結果類型跳轉到相應頁面
    switch (result.type) {
      case "assignment":
        setActiveTab("assignments")
        break
      case "timeslot":
        setActiveTab("time")
        break
      default:
        break
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">載入中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="text-xl font-semibold focus:outline-none hover:underline"
                style={{ color: "#2C2C2C", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                教練派案系統
              </button>
              <span className="ml-4" style={{ color: "#666666" }}>
                歡迎，{user.name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent hover:bg-gray-50"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "#666666",
                  color: "#666666",
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                返回
              </Button>
              <GlobalSearch userType="coach" onResultClick={handleSearchResult} />
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent hover:bg-red-50"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "#E31E24",
                  color: "#E31E24",
                }}
              >
                <LogOut className="h-4 w-4" />
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">總覽</TabsTrigger>
            <TabsTrigger value="profile">個人資料</TabsTrigger>
            <TabsTrigger value="time">時間管理</TabsTrigger>
            <TabsTrigger value="assignments">派案管理</TabsTrigger>
            <TabsTrigger value="history">歷史記錄</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* 快速操作面板 */}
            <QuickActionPanel userType="coach" onAction={handleQuickAction} />

            {/* 原有的功能卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleCardClick("profile")}
                style={{ borderLeft: "4px solid #E31E24" }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">個人資料</CardTitle>
                  <User className="h-4 w-4" style={{ color: "#E31E24" }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">管理</div>
                  <p className="text-xs" style={{ color: "#666666" }}>
                    更新您的基本資料和專業領域
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleCardClick("time")}
                style={{ borderLeft: "4px solid #007BFF" }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">時間管理</CardTitle>
                  <Clock className="h-4 w-4" style={{ color: "#007BFF" }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">排程</div>
                  <p className="text-xs" style={{ color: "#666666" }}>
                    登記和管理您的可用時間
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleCardClick("assignments")}
                style={{ borderLeft: "4px solid #28A745" }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">派案管理</CardTitle>
                  <Calendar className="h-4 w-4" style={{ color: "#28A745" }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">處理</div>
                  <p className="text-xs" style={{ color: "#666666" }}>
                    查看和回應派案請求
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleCardClick("history")}
                style={{ borderLeft: "4px solid #6C757D" }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">歷史記錄</CardTitle>
                  <FileText className="h-4 w-4" style={{ color: "#6C757D" }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">歷史</div>
                  <p className="text-xs" style={{ color: "#666666" }}>
                    查看所有派案記錄
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <CoachProfile coachId={user.id} />
          </TabsContent>

          <TabsContent value="time">
            <TimeManagement coachId={user.id} />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentManagement coachId={user.id} />
          </TabsContent>

          <TabsContent value="history">
            <AssignmentList coachId={user.id} />
          </TabsContent>
        </Tabs>

        {/* 通知中心 - 整合在主介面底部 */}
        <div className="mt-8">
          <NotificationCenter />
        </div>
      </main>
    </div>
  )
}
