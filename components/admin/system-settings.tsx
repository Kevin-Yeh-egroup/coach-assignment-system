"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Settings, Save, RefreshCw, Database, Bell, Shield, Clock } from "lucide-react"

interface SystemSettings {
  general: {
    systemName: string
    systemDescription: string
    maintenanceMode: boolean
    registrationEnabled: boolean
    maxCoachesPerSlot: number
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    pushEnabled: boolean
    reminderHours: number
    urgentNotificationDelay: number
  }
  scheduling: {
    minBookingHours: number
    maxBookingDays: number
    allowWeekendBooking: boolean
    workingHoursStart: string
    workingHoursEnd: string
  }
  security: {
    sessionTimeout: number
    passwordMinLength: number
    requireTwoFactor: boolean
    loginAttemptLimit: number
  }
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      systemName: "教練派案系統",
      systemDescription: "專業的社工教練派案管理平台",
      maintenanceMode: false,
      registrationEnabled: true,
      maxCoachesPerSlot: 1,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      reminderHours: 24,
      urgentNotificationDelay: 5,
    },
    scheduling: {
      minBookingHours: 2,
      maxBookingDays: 30,
      allowWeekendBooking: true,
      workingHoursStart: "09:00",
      workingHoursEnd: "18:00",
    },
    security: {
      sessionTimeout: 120,
      passwordMinLength: 8,
      requireTwoFactor: false,
      loginAttemptLimit: 5,
    },
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // 模擬API調用
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // 使用預設設定
    } catch (error) {
      console.error("載入設定失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 模擬API調用
      await new Promise((resolve) => setTimeout(resolve, 1500))
      alert("設定已儲存！")
    } catch (error) {
      console.error("儲存設定失敗:", error)
      alert("儲存失敗，請稍後再試")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm("確定要重置所有設定嗎？此操作無法復原。")) return

    try {
      // 重置為預設值
      await fetchSettings()
      alert("設定已重置為預設值")
    } catch (error) {
      console.error("重置設定失敗:", error)
      alert("重置失敗，請稍後再試")
    }
  }

  const updateGeneralSettings = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [key]: value },
    }))
  }

  const updateNotificationSettings = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }))
  }

  const updateSchedulingSettings = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      scheduling: { ...prev.scheduling, [key]: value },
    }))
  }

  const updateSecuritySettings = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [key]: value },
    }))
  }

  if (loading) {
    return <div>載入系統設定中...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                系統設定
              </CardTitle>
              <CardDescription>管理系統的各項設定和參數</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重置
              </Button>
              <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: "#E31E24", color: "white" }}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "儲存中..." : "儲存設定"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 設定分類標籤 */}
      <div className="flex gap-2 border-b">
        {[
          { key: "general", label: "一般設定", icon: Settings },
          { key: "notifications", label: "通知設定", icon: Bell },
          { key: "scheduling", label: "排程設定", icon: Clock },
          { key: "security", label: "安全設定", icon: Shield },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* 一般設定 */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>基本資訊</CardTitle>
              <CardDescription>系統的基本設定和資訊</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="system-name">系統名稱</Label>
                <Input
                  id="system-name"
                  value={settings.general.systemName}
                  onChange={(e) => updateGeneralSettings("systemName", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="system-description">系統描述</Label>
                <Textarea
                  id="system-description"
                  value={settings.general.systemDescription}
                  onChange={(e) => updateGeneralSettings("systemDescription", e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="max-coaches">每個時段最大教練數</Label>
                <Select
                  value={settings.general.maxCoachesPerSlot.toString()}
                  onValueChange={(value) => updateGeneralSettings("maxCoachesPerSlot", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 位教練</SelectItem>
                    <SelectItem value="2">2 位教練</SelectItem>
                    <SelectItem value="3">3 位教練</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>系統狀態</CardTitle>
              <CardDescription>控制系統的運行狀態</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance-mode">維護模式</Label>
                  <p className="text-sm text-gray-600">啟用後用戶無法使用系統</p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) => updateGeneralSettings("maintenanceMode", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="registration-enabled">開放註冊</Label>
                  <p className="text-sm text-gray-600">允許新用戶註冊</p>
                </div>
                <Switch
                  id="registration-enabled"
                  checked={settings.general.registrationEnabled}
                  onCheckedChange={(checked) => updateGeneralSettings("registrationEnabled", checked)}
                />
              </div>

              {settings.general.maintenanceMode && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">維護中</Badge>
                    <span className="text-sm text-yellow-700">系統目前處於維護模式</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 通知設定 */}
      {activeTab === "notifications" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>通知方式</CardTitle>
              <CardDescription>設定系統通知的發送方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-enabled">電子郵件通知</Label>
                  <p className="text-sm text-gray-600">透過Email發送通知</p>
                </div>
                <Switch
                  id="email-enabled"
                  checked={settings.notifications.emailEnabled}
                  onCheckedChange={(checked) => updateNotificationSettings("emailEnabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-enabled">簡訊通知</Label>
                  <p className="text-sm text-gray-600">透過SMS發送通知</p>
                </div>
                <Switch
                  id="sms-enabled"
                  checked={settings.notifications.smsEnabled}
                  onCheckedChange={(checked) => updateNotificationSettings("smsEnabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-enabled">推播通知</Label>
                  <p className="text-sm text-gray-600">透過瀏覽器推播通知</p>
                </div>
                <Switch
                  id="push-enabled"
                  checked={settings.notifications.pushEnabled}
                  onCheckedChange={(checked) => updateNotificationSettings("pushEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>通知時機</CardTitle>
              <CardDescription>設定通知的發送時機</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reminder-hours">提醒時間（小時前）</Label>
                <Select
                  value={settings.notifications.reminderHours.toString()}
                  onValueChange={(value) => updateNotificationSettings("reminderHours", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 小時前</SelectItem>
                    <SelectItem value="2">2 小時前</SelectItem>
                    <SelectItem value="6">6 小時前</SelectItem>
                    <SelectItem value="12">12 小時前</SelectItem>
                    <SelectItem value="24">24 小時前</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urgent-delay">緊急通知延遲（分鐘）</Label>
                <Select
                  value={settings.notifications.urgentNotificationDelay.toString()}
                  onValueChange={(value) =>
                    updateNotificationSettings("urgentNotificationDelay", Number.parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">立即發送</SelectItem>
                    <SelectItem value="5">5 分鐘後</SelectItem>
                    <SelectItem value="10">10 分鐘後</SelectItem>
                    <SelectItem value="15">15 分鐘後</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 排程設定 */}
      {activeTab === "scheduling" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>預約限制</CardTitle>
              <CardDescription>設定預約的時間限制</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="min-booking-hours">最少提前預約時間（小時）</Label>
                <Select
                  value={settings.scheduling.minBookingHours.toString()}
                  onValueChange={(value) => updateSchedulingSettings("minBookingHours", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 小時</SelectItem>
                    <SelectItem value="2">2 小時</SelectItem>
                    <SelectItem value="6">6 小時</SelectItem>
                    <SelectItem value="12">12 小時</SelectItem>
                    <SelectItem value="24">24 小時</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max-booking-days">最多提前預約天數</Label>
                <Select
                  value={settings.scheduling.maxBookingDays.toString()}
                  onValueChange={(value) => updateSchedulingSettings("maxBookingDays", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 天</SelectItem>
                    <SelectItem value="14">14 天</SelectItem>
                    <SelectItem value="30">30 天</SelectItem>
                    <SelectItem value="60">60 天</SelectItem>
                    <SelectItem value="90">90 天</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekend-booking">允許週末預約</Label>
                  <p className="text-sm text-gray-600">是否開放週六日預約</p>
                </div>
                <Switch
                  id="weekend-booking"
                  checked={settings.scheduling.allowWeekendBooking}
                  onCheckedChange={(checked) => updateSchedulingSettings("allowWeekendBooking", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>工作時間</CardTitle>
              <CardDescription>設定系統的工作時間範圍</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="working-hours-start">工作開始時間</Label>
                <Input
                  id="working-hours-start"
                  type="time"
                  value={settings.scheduling.workingHoursStart}
                  onChange={(e) => updateSchedulingSettings("workingHoursStart", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="working-hours-end">工作結束時間</Label>
                <Input
                  id="working-hours-end"
                  type="time"
                  value={settings.scheduling.workingHoursEnd}
                  onChange={(e) => updateSchedulingSettings("workingHoursEnd", e.target.value)}
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  工作時間：{settings.scheduling.workingHoursStart} - {settings.scheduling.workingHoursEnd}
                </p>
                <p className="text-xs text-blue-600 mt-1">只有在工作時間內才能建立時段</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 安全設定 */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>登入安全</CardTitle>
              <CardDescription>設定登入相關的安全參數</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="session-timeout">會話逾時時間（分鐘）</Label>
                <Select
                  value={settings.security.sessionTimeout.toString()}
                  onValueChange={(value) => updateSecuritySettings("sessionTimeout", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 分鐘</SelectItem>
                    <SelectItem value="60">1 小時</SelectItem>
                    <SelectItem value="120">2 小時</SelectItem>
                    <SelectItem value="240">4 小時</SelectItem>
                    <SelectItem value="480">8 小時</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="login-attempt-limit">登入嘗試次數限制</Label>
                <Select
                  value={settings.security.loginAttemptLimit.toString()}
                  onValueChange={(value) => updateSecuritySettings("loginAttemptLimit", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 次</SelectItem>
                    <SelectItem value="5">5 次</SelectItem>
                    <SelectItem value="10">10 次</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">雙因子驗證</Label>
                  <p className="text-sm text-gray-600">要求管理員使用雙因子驗證</p>
                </div>
                <Switch
                  id="two-factor"
                  checked={settings.security.requireTwoFactor}
                  onCheckedChange={(checked) => updateSecuritySettings("requireTwoFactor", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>密碼政策</CardTitle>
              <CardDescription>設定密碼的安全要求</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password-min-length">密碼最小長度</Label>
                <Select
                  value={settings.security.passwordMinLength.toString()}
                  onValueChange={(value) => updateSecuritySettings("passwordMinLength", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 字元</SelectItem>
                    <SelectItem value="8">8 字元</SelectItem>
                    <SelectItem value="10">10 字元</SelectItem>
                    <SelectItem value="12">12 字元</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">目前密碼政策</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 最少 {settings.security.passwordMinLength} 個字元</li>
                  <li>• 建議包含大小寫字母</li>
                  <li>• 建議包含數字和特殊字元</li>
                  {settings.security.requireTwoFactor && <li>• 需要雙因子驗證</li>}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 系統狀態 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            系統狀態
          </CardTitle>
          <CardDescription>查看系統的運行狀態和健康度</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm font-medium">資料庫</div>
              <div className="text-xs text-green-600">正常運行</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm font-medium">API服務</div>
              <div className="text-xs text-green-600">正常運行</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm font-medium">通知服務</div>
              <div className="text-xs text-yellow-600">部分延遲</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm font-medium">檔案系統</div>
              <div className="text-xs text-green-600">正常運行</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
