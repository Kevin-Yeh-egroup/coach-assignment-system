"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, ArrowLeft } from "lucide-react"
import DashboardStats from "@/components/admin/dashboard-stats"
import CalendarView from "@/components/admin/calendar-view"
import CoachManagement from "@/components/admin/coach-management"
import AssignmentOperations from "@/components/admin/assignment-operations"
import ReportsAnalytics from "@/components/admin/reports-analytics"
import NotificationCenter from "@/components/notification/notification-center"
import SystemSettings from "@/components/admin/system-settings"
import QuickActionPanel from "@/components/quick-actions/quick-action-panel"
import GlobalSearch from "@/components/search/global-search"
import ImportExportPanel from "@/components/admin/import-export-panel"
import DataManagement from "@/components/admin/data-management"

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.type !== "admin") {
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

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "add-timeslot":
        setActiveTab("calendar")
        break
      case "calendar":
        setActiveTab("calendar")
        break
      case "assignments":
        setActiveTab("assignments")
        break
      case "export":
        setActiveTab("reports")
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
      case "coach":
        setActiveTab("coaches")
        break
      case "assignment":
        setActiveTab("assignments")
        break
      case "timeslot":
        setActiveTab("calendar")
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
            <div className="flex items-center">
              <h1 className="text-xl font-semibold" style={{ color: "#2C2C2C" }}>
                教練派案系統 - 管理員後台
              </h1>
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
              <GlobalSearch userType="admin" onResultClick={handleSearchResult} />
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
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard">後台總覽</TabsTrigger>
            <TabsTrigger value="calendar">時段總覽</TabsTrigger>
            <TabsTrigger value="coaches">教練管理</TabsTrigger>
            <TabsTrigger value="assignments">派案操作</TabsTrigger>
            <TabsTrigger value="reports">統計報表</TabsTrigger>
            <TabsTrigger value="import">資料匯入</TabsTrigger>
            <TabsTrigger value="data">資料管理</TabsTrigger>
            <TabsTrigger value="system">系統設定</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* 快速操作面板 */}
            <QuickActionPanel userType="admin" onAction={handleQuickAction} />

            {/* 原有的統計面板 */}
            <DashboardStats />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView />
          </TabsContent>

          <TabsContent value="coaches">
            <CoachManagement />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentOperations />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsAnalytics />
          </TabsContent>

          <TabsContent value="import">
            <ImportExportPanel />
          </TabsContent>

          <TabsContent value="data">
            <DataManagement />
          </TabsContent>

          <TabsContent value="system">
            <SystemSettings />
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
