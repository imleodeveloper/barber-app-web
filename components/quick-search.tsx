"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export function QuickSearch() {
  const [phone, setPhone] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.trim()) {
      // Store phone in sessionStorage and redirect
      sessionStorage.setItem("searchPhone", phone.trim())
      router.push("/meus-agendamentos")
    }
  }

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-lg">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Busca Rápida</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Digite seu telefone para ver seus agendamentos</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
