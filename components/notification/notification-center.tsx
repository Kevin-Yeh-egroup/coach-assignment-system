"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  BellOff,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Trash2,
  BookMarkedIcon as MarkAsRead,
} from "lucide-react"

interface Notification {
  id: string
  type: "info" | "warning" | "success" | "error"
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: "low" | "medium" | "high"
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all")

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = () => {
    // 從 localStorage 載入通知（目前為空）
    const savedNotifications = localStorage.getItem("notifications")
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    } else {
      setNotifications([])
    }
  }

  const saveNotifications = (newNotifications: Notification[]) => {
    localStorage.setItem("notifications", JSON.stringify(newNotifications))
    setNotifications(newNotifications)
  }

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    saveNotifications(updated)
  }

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    saveNotifications(updated)
  }

  const deleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id)
    saveNotifications(updated)
  }

  const clearAllNotifications = () => {
    saveNotifications([])
  }

  const getFilteredNotifications = () => {
    switch (filter) {
      case "unread":
        return notifications.filter((n) => !n.read)
      case "high":
        return notifications.filter((n) => n.priority === "high")
      default:
        return notifications
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 border-red-200"
      case "medium":
        return "bg-yellow-100 border-yellow-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知中心
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {notifications.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 bg-transparent"
                >
                  <MarkAsRead className="h-4 w-4" />
                  全部已讀
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                  清空全部
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellOff className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">目前沒有通知</h3>
            <p className="text-gray-500">當有新的派案、時段變更或系統更新時，通知會顯示在這裡</p>
          </div>
        ) : (
          <>
            {/* 篩選按鈕 */}
            <div className="flex gap-2 mb-4">
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                全部 ({notifications.length})
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unread")}
              >
                未讀 ({unreadCount})
              </Button>
              <Button variant={filter === "high" ? "default" : "outline"} size="sm" onClick={() => setFilter("high")}>
                重要 ({notifications.filter((n) => n.priority === "high").length})
              </Button>
            </div>

            {/* 通知列表 */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {getFilteredNotifications().map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${getPriorityColor(notification.priority)} ${
                      !notification.read ? "border-l-4 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${!notification.read ? "font-semibold" : ""}`}>
                              {notification.title}
                            </h4>
                            <Badge
                              variant={notification.priority === "high" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {notification.priority === "high"
                                ? "重要"
                                : notification.priority === "medium"
                                  ? "一般"
                                  : "低"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 w-8 p-0"
                          >
                            <MarkAsRead className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  )
}
