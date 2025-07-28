"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { SPECIALTY_CATEGORIES } from "@/lib/constants"
import { Save, Check } from "lucide-react"

interface CoachProfileProps {
  coachId: number
}

export default function CoachProfile({ coachId }: CoachProfileProps) {
  const [profile, setProfile] = useState({
    name: "",
    resume: "",
    specialties: [] as Array<{
      category: string
      value: string
      customText?: string
    }>,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [coachId])

  const fetchProfile = async () => {
    try {
      // 從localStorage獲取登入用戶資料
      const userData = localStorage.getItem("user")
      let loginUserName = ""
      if (userData) {
        const parsedUser = JSON.parse(userData)
        loginUserName = parsedUser.name || ""
      }

      // 獲取儲存的個人資料
      const storedProfile = localStorage.getItem(`coach_${coachId}_profile`)
      if (storedProfile) {
        const data = JSON.parse(storedProfile)
        setProfile({
          name: loginUserName || data.name, // 優先使用登入時的姓名
          resume: data.resume || "",
          specialties: data.specialties || [],
        })
      } else {
        // 如果沒有儲存的資料，直接使用登入時的姓名
        const defaultProfile = {
          name: loginUserName,
          resume: "",
          specialties: [],
        }
        setProfile(defaultProfile)
        // 自動儲存預設資料，包含登入時的姓名
        localStorage.setItem(`coach_${coachId}_profile`, JSON.stringify(defaultProfile))

        // 同步更新全域教練資料
        updateGlobalCoachData(defaultProfile)
      }
    } catch (error) {
      console.error("載入個人資料失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateGlobalCoachData = (profileData: any) => {
    try {
      const globalCoaches = JSON.parse(localStorage.getItem("global_coaches") || "[]")
      const updatedCoaches = globalCoaches.map((coach: any) =>
        coach.id === coachId
          ? {
              ...coach,
              name: profileData.name,
              resume: profileData.resume,
              specialties: profileData.specialties.map((s: any) => s.value),
            }
          : coach,
      )

      // 如果教練不存在於全域列表中，則新增
      if (!globalCoaches.find((coach: any) => coach.id === coachId)) {
        updatedCoaches.push({
          id: coachId,
          name: profileData.name,
          resume: profileData.resume,
          specialties: profileData.specialties.map((s: any) => s.value),
          status: "active",
          totalAssignments: 0,
          completedAssignments: 0,
          rating: 0,
          joinDate: new Date().toISOString().split("T")[0],
          lastActive: new Date().toISOString(),
        })
      }

      localStorage.setItem("global_coaches", JSON.stringify(updatedCoaches))
    } catch (error) {
      console.error("更新全域教練資料失敗:", error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 確保使用登入時的姓名
      const userData = localStorage.getItem("user")
      let loginUserName = ""
      if (userData) {
        const parsedUser = JSON.parse(userData)
        loginUserName = parsedUser.name || ""
      }

      const updatedProfile = {
        ...profile,
        name: loginUserName || profile.name, // 確保使用登入時的姓名
      }

      localStorage.setItem(`coach_${coachId}_profile`, JSON.stringify(updatedProfile))

      // 同步更新全域教練資料
      updateGlobalCoachData(updatedProfile)

      setProfile(updatedProfile)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("儲存失敗:", error)
      alert("儲存失敗")
    } finally {
      setSaving(false)
    }
  }

  const handleSpecialtyChange = (category: string, value: string, checked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      specialties: checked
        ? [...prev.specialties, { category, value }]
        : prev.specialties.filter((s) => !(s.category === category && s.value === value)),
    }))
  }

  const handleCustomTextChange = (category: string, value: string, customText: string) => {
    setProfile((prev) => ({
      ...prev,
      specialties: prev.specialties.map((s) =>
        s.category === category && s.value === value ? { ...s, customText } : s,
      ),
    }))
  }

  if (loading) {
    return <div>載入中...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本資料</CardTitle>
          <CardDescription>管理您的個人基本資訊</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="請輸入姓名"
              disabled={true} // 姓名由登入資訊決定，不允許修改
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">姓名由登入資訊決定，如需修改請聯繫管理員</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume">簡歷</Label>
            <Textarea
              id="resume"
              value={profile.resume}
              onChange={(e) => setProfile((prev) => ({ ...prev, resume: e.target.value }))}
              placeholder="請輸入您的專業背景與經歷，例如：社會工作碩士，專精兒童與青少年輔導，具有10年實務經驗"
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>專業領域</CardTitle>
          <CardDescription>選擇您的專業領域（可複選）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(SPECIALTY_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey} className="space-y-4">
              <h4 className="font-medium text-[#2C2C2C] text-lg border-b border-gray-200 pb-2">{category.label}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.options.map((option) => {
                  const isChecked = profile.specialties.some((s) => s.category === categoryKey && s.value === option)
                  const specialty = profile.specialties.find((s) => s.category === categoryKey && s.value === option)

                  return (
                    <div key={option} className="space-y-3">
                      <div
                        className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                          isChecked ? "border-[#E31E24] bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <Checkbox
                          id={`${categoryKey}-${option}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleSpecialtyChange(categoryKey, option, checked as boolean)}
                          className="w-5 h-5 data-[state=checked]:bg-[#E31E24] data-[state=checked]:border-[#E31E24] data-[state=checked]:text-white border-2"
                        />
                        <Label
                          htmlFor={`${categoryKey}-${option}`}
                          className={`text-sm cursor-pointer font-medium flex-1 ${
                            isChecked ? "text-[#E31E24]" : "text-gray-700"
                          }`}
                        >
                          {option}
                        </Label>
                        {isChecked && <div className="w-2 h-2 bg-[#E31E24] rounded-full"></div>}
                      </div>

                      {option === "特殊族群服務" && isChecked && (
                        <div className="ml-8">
                          <Input
                            placeholder="請說明特殊族群類型"
                            value={specialty?.customText || ""}
                            onChange={(e) => handleCustomTextChange(categoryKey, option, e.target.value)}
                            className="border-[#E31E24] focus:border-[#E31E24] focus:ring-[#E31E24]"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2"
          style={{
            backgroundColor: saved ? "#28A745" : "#E31E24",
            color: "white",
          }}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              已儲存
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {saving ? "儲存中..." : "儲存"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
