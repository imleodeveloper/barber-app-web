"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Calendar, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { supabase, type Service, type Professional } from "@/lib/supabase"

interface AppointmentData {
  serviceId: string
  professionalId: string
  date: string
  time: string
}

export default function ConfirmAppointmentPage() {
  const router = useRouter()
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const data = sessionStorage.getItem("appointmentData")
    if (data) {
      const parsedData = JSON.parse(data) as AppointmentData
      setAppointmentData(parsedData)
      fetchData(parsedData)
    } else {
      router.push("/")
    }
  }, [router])

  const fetchData = async (data: AppointmentData) => {
    try {
      // Fetch service
      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .select("*")
        .eq("id", data.serviceId)
        .single()

      if (serviceError) throw serviceError
      setService(serviceData)

      // Fetch professional
      const { data: professionalData, error: professionalError } = await supabase
        .from("professionals")
        .select("*")
        .eq("id", data.professionalId)
        .single()

      if (professionalError) throw professionalError
      setProfessional(professionalData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!appointmentData || !clientName.trim() || !clientPhone.trim()) {
      alert("Por favor, preencha todos os campos.")
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.from("appointments").insert({
        service_id: appointmentData.serviceId,
        professional_id: appointmentData.professionalId,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        appointment_date: appointmentData.date,
        appointment_time: appointmentData.time,
        status: "scheduled",
      })

      if (error) throw error

      // Clear session storage
      sessionStorage.removeItem("appointmentData")

      // Store phone for quick access to appointments
      sessionStorage.setItem("searchPhone", clientPhone.trim())
      // Store phone for quick access
      sessionStorage.setItem("lastAppointmentPhone", clientPhone.trim())

      // Redirect to success page
      router.push("/agendamento-confirmado")
    } catch (error) {
      console.error("Erro ao criar agendamento:", error)
      alert("Erro ao confirmar agendamento. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h:${remainingMinutes.toString().padStart(2, "0")}min` : `${hours}h:00min`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Confirmar Agendamento</h1>
            <p className="text-gray-600 dark:text-gray-400">Revise os dados e confirme seu agendamento</p>
          </div>
        </div>

        {/* Appointment Summary */}
        <Card className="bg-white dark:bg-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-white">Resumo do Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {service && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatDuration(service.duration_minutes)}</p>
                </div>
              </div>
            )}

            {professional && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{professional.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Profissional</p>
                </div>
              </div>
            )}

            {appointmentData && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(appointmentData.date)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">às {appointmentData.time}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Information Form */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-white">Seus Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  required
                  className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">
                  Telefone/WhatsApp
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                  className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 text-white">
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirmando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Agendamento
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
