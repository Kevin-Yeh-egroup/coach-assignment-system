"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Trash2, CheckCircle } from "lucide-react"

interface TestLog {
  id: number
  timestamp: string
  action: string
  type: "card" | "button" | "tab"
  status: "success" | "error"
}

export default function TestLogger() {
  const [logs, setLogs] = useState<TestLog[]>([])

  const addLog = (action: string, type: "card" | "button" | "tab", status: "success" | "error" = "success") => {
    const newLog: TestLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString("zh-TW"),
      action,
      type,
      status,
    }
    setLogs((prev) => [newLog, ...prev])
  }

  const clearLogs = () => {
    setLogs([])
  }

  // 將 addLog 函數暴露給全域，讓其他組件可以使用
  if (typeof window !== "undefined") {
    ;(window as any).testLogger = { addLog }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">功能測試記錄</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {logs.length} 項記錄
            </Badge>
            <Button size="sm" variant="outline" onClick={clearLogs}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-64">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">尚無測試記錄</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 p-2 rounded-md bg-gray-50 text-xs"
                  style={{
                    borderLeft: `3px solid ${
                      log.type === "card" ? "#E31E24" : log.type === "button" ? "#007BFF" : "#28A745"
                    }`,
                  }}
                >
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{log.action}</div>
                    <div className="text-gray-500 flex justify-between">
                      <span>{log.type === "card" ? "卡片" : log.type === "button" ? "按鈕" : "標籤"}</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
