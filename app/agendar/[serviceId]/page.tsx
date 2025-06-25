"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { supabase, type Service, type Professional } from "@/lib/supabase"

export default function SelectProfessionalPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.serviceId as string

  const [service, setService] = useState<Service | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (serviceId) {
      fetchData()
    }
  }, [serviceId])

  const fetchData = async () => {
    try {
      // Fetch service
      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single()

      if (serviceError) throw serviceError
      setService(serviceData)

      // Fetch professionals
      const { data: professionalsData, error: professionalsError } = await supabase
        .from("professionals")
        .select("*")
        .eq("active", true)
        .order("name")

      if (professionalsError) throw professionalsError
      setProfessionals(professionalsData || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProfessional = (professionalId: string) => {
    router.push(`/agendar/${serviceId}/${professionalId}`)
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

      <main className="max-w-4xl mx-auto px-4 py-8">
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Selecione o Profissional</h1>
            {service && (
              <p className="text-gray-600 dark:text-gray-400">
                Serviço: <span className="font-medium">{service.name}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((professional) => (
            <Card
              key={professional.id}
              className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleSelectProfessional(professional.id)}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{professional.name}</h3>
                {professional.specialties && professional.specialties.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{professional.specialties.join(", ")}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {professionals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Nenhum profissional disponível no momento.</p>
          </div>
        )}
      </main>
    </div>
  )
}
