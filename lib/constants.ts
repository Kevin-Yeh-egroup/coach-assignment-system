export const SPECIALTY_CATEGORIES = {
  service_target: {
    label: "服務對象類別",
    options: ["兒童與少年福利", "婦女與性別議題", "老人福利", "身心障礙福利", "特殊族群服務"],
  },
  service_field: {
    label: "服務場域類別",
    options: ["醫務社會工作", "學校社會工作", "司法社會工作", "精神健康與成癮防治", "社區工作"],
  },
  service_method: {
    label: "服務方法類別",
    options: ["個案工作", "團體工作", "家庭工作", "外展服務"],
  },
  special_skills: {
    label: "特殊專業技能",
    options: ["保護性服務", "經濟扶助與資源連結", "研究與政策倡議", "督導與教育訓練"],
  },
} as const

export const STATUS_LABELS = {
  available: "可用時段",
  assigned: "已派案",
  confirmed: "已確認",
  rejected: "已拒絕",
  pending: "等待確認",
} as const

export const STATUS_COLORS = {
  available: "status-available",
  assigned: "status-assigned",
  confirmed: "status-confirmed",
  rejected: "status-rejected",
  pending: "status-assigned",
} as const
