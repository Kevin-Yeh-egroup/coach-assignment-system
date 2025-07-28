import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !username.trim()) {
      return NextResponse.json({ error: "帳號為必填" }, { status: 400 })
    }

    if (!password || !password.trim()) {
      return NextResponse.json({ error: "密碼為必填" }, { status: 400 })
    }

    // 檢查管理員帳號密碼
    if (username.trim() !== "admin" || password.trim() !== "123") {
      return NextResponse.json(
        {
          success: false,
          error: "帳號或密碼錯誤",
        },
        { status: 401 },
      )
    }

    // 暫時使用模擬資料
    const admin = {
      id: 1,
      username: "admin",
      name: "系統管理員",
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      admin: admin,
    })
  } catch (error) {
    console.error("管理員登入錯誤:", error)
    return NextResponse.json(
      {
        success: false,
        error: "登入失敗，請稍後再試",
      },
      { status: 500 },
    )
  }
}
