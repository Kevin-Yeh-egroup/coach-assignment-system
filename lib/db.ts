// 暫時不使用資料庫，使用模擬資料
export interface Coach {
  id: number
  name: string
  resume?: string
  created_at: string
  updated_at: string
}

export interface CoachSpecialty {
  id: number
  coach_id: number
  specialty_category: string
  specialty_value: string
  custom_text?: string
  created_at: string
}

export interface TimeSlot {
  id: number
  coach_id: number
  start_time: string
  end_time: string
  status: "available" | "assigned" | "confirmed" | "rejected"
  created_at: string
  updated_at: string
  coach_name?: string
}

export interface Assignment {
  id: number
  time_slot_id: number
  coach_id: number
  client_name: string
  client_contact?: string
  topic: string
  status: "pending" | "confirmed" | "rejected" | "completed"
  actual_duration?: number
  need_followup: boolean
  created_at: string
  updated_at: string
  coach_name?: string
  start_time?: string
  end_time?: string
}

// 模擬資料存儲
export const mockData = {
  coaches: [] as Coach[],
  specialties: [] as CoachSpecialty[],
  timeSlots: [] as TimeSlot[],
  assignments: [] as Assignment[],
}

// 模擬SQL函數
export const sql = {
  // 這是一個模擬函數，實際使用時會被資料庫查詢替換
  query: async (query: string, params?: any[]) => {
    console.log("模擬SQL查詢:", query, params)
    return []
  },
}
