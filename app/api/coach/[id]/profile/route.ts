import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const coachId = Number.parseInt(params.id)

    // 模擬教練基本資料
    const coach = {
      id: coachId,
      name: "張美玲",
      resume: "社會工作碩士，專精兒童與青少年輔導，具有10年實務經驗",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 模擬專業領域
    const specialties = [
      {
        specialty_category: "service_target",
        specialty_value: "兒童與少年福利",
        custom_text: null,
      },
      {
        specialty_category: "service_method",
        specialty_value: "個案工作",
        custom_text: null,
      },
      {
        specialty_category: "service_method",
        specialty_value: "團體工作",
        custom_text: null,
      },
    ]

    return NextResponse.json({
      name: coach.name,
      resume: coach.resume || "",
      specialties: specialties.map((s) => ({
        category: s.specialty_category,
        value: s.specialty_value,
        customText: s.custom_text,
      })),
    })
  } catch (error) {
    console.error("取得個人資料錯誤:", error)
    return NextResponse.json({ error: "取得個人資料失敗" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const coachId = Number.parseInt(params.id)
    const { name, resume, specialties } = await request.json()

    // 模擬更新成功
    console.log("更新教練資料:", { coachId, name, resume, specialties })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("更新個人資料錯誤:", error)
    return NextResponse.json({ error: "更新個人資料失敗" }, { status: 500 })
  }
}
