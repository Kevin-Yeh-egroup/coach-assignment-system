"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [coachName, setCoachName] = useState("")
  const [adminUsername, setAdminUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleCoachLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coachName.trim()) {
      setError("請輸入姓名")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("嘗試教練登入:", coachName)

      // 呼叫API進行登入
      const response = await fetch("/api/auth/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: coachName.trim() }),
      })

      console.log("API回應狀態:", response.status)

      // 檢查回應是否為JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("非JSON回應:", text)
        setError("伺服器錯誤，請稍後再試")
        return
      }

      const data = await response.json()
      console.log("API回應資料:", data)

      if (response.ok && data.success) {
        // 使用API回應的教練資料
        const userData = {
          type: "coach",
          id: data.coach.id,
          name: data.coach.name,
        }

        localStorage.setItem("user", JSON.stringify(userData))
        console.log("儲存用戶資料:", userData)
        console.log("跳轉到教練頁面")
        router.push("/coach")
      } else {
        setError(data.error || "登入失敗")
      }
    } catch (error) {
      console.error("登入錯誤:", error)
      setError("網路錯誤或伺服器無回應，請稍後再試")
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminUsername.trim()) {
      setError("請輸入管理員帳號")
      return
    }
    if (!adminPassword.trim()) {
      setError("請輸入管理員密碼")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("嘗試管理員登入:", adminUsername)

      const response = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword,
        }),
      })

      console.log("回應狀態:", response.status)

      // 檢查回應是否為JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("非JSON回應:", text)
        setError("伺服器錯誤，請稍後再試")
        return
      }

      const data = await response.json()
      console.log("登入回應:", data)

      if (response.ok && data.success) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            type: "admin",
            id: data.admin.id,
            name: data.admin.name,
          }),
        )
        console.log("跳轉到管理員頁面")
        router.push("/admin")
      } else {
        setError(data.error || "登入失敗")
      }
    } catch (error) {
      console.error("登入錯誤:", error)
      setError("網路錯誤或伺服器無回應，請稍後再試")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold" style={{ color: "#2C2C2C" }}>
            教練派案系統
          </CardTitle>
          <CardDescription style={{ color: "#666666" }}>請選擇您的身份登入系統</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" style={{ borderColor: "#E31E24", backgroundColor: "#FEF2F2" }}>
              <AlertDescription style={{ color: "#E31E24" }}>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="coach" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="coach">教練登入</TabsTrigger>
              <TabsTrigger value="admin">管理員登入</TabsTrigger>
            </TabsList>

            <TabsContent value="coach" className="space-y-4">
              <form onSubmit={handleCoachLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coach-name">教練姓名</Label>
                  <Input
                    id="coach-name"
                    type="text"
                    placeholder="請輸入您的姓名（例如：葉先博）"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? "#ccc" : "#E31E24",
                    color: "white",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    fontWeight: "500",
                  }}
                >
                  {loading ? "登入中..." : "教練登入"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">管理員帳號</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    placeholder="請輸入管理員帳號"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">管理員密碼</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="請輸入管理員密碼"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? "#ccc" : "#E31E24",
                    color: "white",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    fontWeight: "500",
                  }}
                >
                  {loading ? "登入中..." : "管理員登入"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm" style={{ color: "#666666" }}>
            <p>測試說明：</p>
            <p>教練：直接輸入姓名即可登入</p>
            <p>管理員：admin / 123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
