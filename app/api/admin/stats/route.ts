import { NextResponse } from "next/server"

// 清空統計資料
export async function GET() {
  try {
    const stats = {
      totalCoaches: 0,
      activeCoaches: 0,
      totalRegistrations: 0,
      activeUsers: 0,
      totalConsultations: 0,
      pendingConsultations: 0,
      completedConsultations: 0,
      monthlyStats: [
        { month: "3月", consultations: 0, registrations: 0 },
        { month: "4月", consultations: 0, registrations: 0 },
        { month: "5月", consultations: 0, registrations: 0 },
        { month: "6月", consultations: 0, registrations: 0 },
        { month: "7月", consultations: 0, registrations: 0 },
      ],
      recentActivity: [],
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("取得統計資料錯誤:", error)
    return NextResponse.json({ error: "取得統計資料失敗" }, { status: 500 })
  }
}
