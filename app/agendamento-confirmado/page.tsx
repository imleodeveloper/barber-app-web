"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Calendar, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import Link from "next/link"

export default function AppointmentConfirmedPage() {
  const [clientPhone, setClientPhone] = useState("")

  useEffect(() => {
    // Get phone from sessionStorage if available
    const phone = sessionStorage.getItem("lastAppointmentPhone")
    if (phone) {
      setClientPhone(phone)
    }
  }, [])

  const handleViewAppointments = () => {
    if (clientPhone) {
      sessionStorage.setItem("searchPhone", clientPhone)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-white dark:bg-gray-800 text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Agendamento Confirmado!</h1>

            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
            </p>

            <div className="space-y-4">
              <Link href="/meus-agendamentos">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleViewAppointments}>
                  <Phone className="h-4 w-4 mr-2" />
                  Ver Meus Agendamentos
                </Button>
              </Link>

              <Link href="/">
                <Button variant="outline" className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                  <Calendar className="h-4 w-4 mr-2" />
                  Fazer Novo Agendamento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
