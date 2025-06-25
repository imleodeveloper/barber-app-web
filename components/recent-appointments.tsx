"use client"

import { useEffect, useState } from "react"
import { Clock, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase, type Appointment } from "@/lib/supabase"
import Link from "next/link"

export function RecentAppointments() {
  const [recentPhone, setRecentPhone] = useState("")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const phone = sessionStorage.getItem("lastAppointmentPhone")
    if (phone) {
      setRecentPhone(phone)
      fetchRecentAppointments(phone)
    }
  }, [])

  const fetchRecentAppointments = async (phone: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(*),
          professional:professionals(*)
        `)
        .eq("client_phone", phone)
        .eq("status", "scheduled")
        .gte("appointment_date", new Date().toISOString().split("T")[0])
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })
        .limit(2)

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error("Erro ao carregar agendamentos recentes:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  if (!recentPhone || appointments.length === 0) {
    return null
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
          <Clock className="h-5 w-5 mr-2 text-green-600" />
          Seus Próximos Agendamentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{appointment.service?.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(appointment.appointment_date)} às {appointment.appointment_time}
                </p>
              </div>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          ))}
        </div>

        <Link href="/meus-agendamentos">
          <Button
            variant="outline"
            className="w-full mt-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            onClick={() => sessionStorage.setItem("searchPhone", recentPhone)}
          >
            Ver Todos os Agendamentos
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
