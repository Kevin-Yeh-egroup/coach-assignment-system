import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const coachId = Number.parseInt(params.id)

    const assignments = [
      {
        id: 1,
        time_slot_id: 1,
        coach_id: coachId,
        client_name: "林小華",
        client_contact: "0912-345-678",
        topic: "青少年學習適應問題",
        status: "pending",
        actual_duration: null,
        need_followup: false,
        created_at: "2024-07-15T10:00:00Z",
        updated_at: "2024-07-15T10:00:00Z",
        start_time: "2024-07-16T09:00:00Z",
        end_time: "2024-07-16T10:00:00Z",
      },
      {
        id: 2,
        time_slot_id: 2,
        coach_id: coachId,
        client_name: "陳媽媽",
        client_contact: "0987-654-321",
        topic: "家庭親子關係改善",
        status: "confirmed",
        actual_duration: 90,
        need_followup: true,
        created_at: "2024-07-16T15:30:00Z",
        updated_at: "2024-07-16T15:30:00Z",
        start_time: "2024-07-17T14:00:00Z",
        end_time: "2024-07-17T15:30:00Z",
      },
    ]

    return NextResponse.json(assignments)
  } catch (error) {
    console.error("取得派案列表錯誤:", error)
    return NextResponse.json({ error: "取得派案列表失敗" }, { status: 500 })
  }
}
