"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, User, FileText, Clock } from "lucide-react"

interface SearchResult {
  id: string
  type: "coach" | "assignment" | "timeslot" | "client"
  title: string
  subtitle: string
  description: string
  timestamp?: string
  status?: string
}

interface GlobalSearchProps {
  userType: "coach" | "admin"
  onResultClick: (result: SearchResult) => void
}

export default function GlobalSearch({ userType, onResultClick }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (searchTerm.length >= 2) {
      performSearch(searchTerm)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [searchTerm])

  const performSearch = async (term: string) => {
    setLoading(true)
    try {
      // 模擬搜尋API
      await new Promise((resolve) => setTimeout(resolve, 300))

      const mockResults: SearchResult[] = [
        {
          id: "coach-1",
          type: "coach",
          title: "張美玲",
          subtitle: "社工師",
          description: "專精兒童與青少年輔導，具有10年實務經驗",
          status: "active",
        },
        {
          id: "assignment-1",
          type: "assignment",
          title: "林小華 - 青少年學習適應問題",
          subtitle: "派案 #001",
          description: "教練：張美玲 | 狀態：等待確認",
          timestamp: "2024-01-15T09:00:00Z",
          status: "pending",
        },
        {
          id: "timeslot-1",
          type: "timeslot",
          title: "2024/01/15 09:00-10:00",
          subtitle: "時段",
          description: "教練：張美玲 | 狀態：可用",
          timestamp: "2024-01-15T09:00:00Z",
          status: "available",
        },
        {
          id: "client-1",
          type: "client",
          title: "陳媽媽",
          subtitle: "申請人",
          description: "家庭親子關係改善諮詢",
          timestamp: "2024-01-14T15:30:00Z",
        },
      ]

      // 根據搜尋詞過濾結果
      const filteredResults = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(term.toLowerCase()) ||
          result.description.toLowerCase().includes(term.toLowerCase()),
      )

      setResults(filteredResults)
      setShowResults(true)
    } catch (error) {
      console.error("搜尋失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case "coach":
        return <User className="h-4 w-4" />
      case "assignment":
        return <FileText className="h-4 w-4" />
      case "timeslot":
        return <Clock className="h-4 w-4" />
      case "client":
        return <User className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "available":
        return "bg-blue-100 text-blue-800"
      case "assigned":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status?: string) => {
    const labels = {
      active: "活躍",
      pending: "等待中",
      available: "可用",
      assigned: "已派案",
    }
    return status ? labels[status as keyof typeof labels] || status : ""
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="搜尋教練、派案、時段..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pl-10"
        />
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-gray-500">搜尋中...</div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-gray-500">沒有找到相關結果</div>
            ) : (
              <ScrollArea className="max-h-64">
                <div className="py-2">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        onResultClick(result)
                        setShowResults(false)
                        setSearchTerm("")
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 text-gray-400">{getResultIcon(result.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{result.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {result.subtitle}
                            </Badge>
                            {result.status && (
                              <Badge className={`text-xs ${getStatusColor(result.status)}`}>
                                {getStatusLabel(result.status)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">{result.description}</p>
                          {result.timestamp && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(result.timestamp).toLocaleString("zh-TW")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
