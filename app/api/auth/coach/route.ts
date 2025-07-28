import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "請輸入姓名" }, { status: 400 })
    }

    // 直接驗證教練姓名，不需要管理員預先新增
    const trimmedName = name.trim()

    // 模擬成功回應
    return NextResponse.json({
      success: true,
      coach: {
        id: Date.now(),
        name: trimmedName,
        created_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("教練登入錯誤:", error)
    return NextResponse.json({ error: "登入失敗" }, { status: 500 })
  }
}
