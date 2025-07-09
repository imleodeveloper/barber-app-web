"use client";

import { useEffect, useState } from "react";
import { Clock, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { supabase, type Service } from "@/lib/supabase";
import Link from "next/link";
import { QuickSearch } from "@/components/quick-search";
import { RecentAppointments } from "@/components/recent-appointments";
import { Footer } from "@/components/footer";

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
    // Auto-complete past appointments when page loads
    autoCompletePastAppointments();
  }, []);

  const autoCompletePastAppointments = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("status", "scheduled")
        .lt("appointment_date", today);

      if (error) {
        console.error("Erro ao finalizar agendamentos passados:", error);
      }
    } catch (error) {
      console.error("Erro ao finalizar agendamentos passados:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h:${remainingMinutes.toString().padStart(2, "0")}min`
      : `${hours}h:00min`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Carregando serviços...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 mb-8 rounded-lg ">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Agende Seu Horário</h1>
          <p className="text-xl mb-6 opacity-90">
            Escolha o serviço desejado e reserve seu horário de forma rápida e
            fácil
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/meus-agendamentos">
              <Button
                variant="outline"
                className="bg-white text-blue-600 hover:bg-gray-100 border-white dark:hover:bg-gray-400 dark:hover:text-black"
              >
                <Phone className="h-4 w-4 mr-2" />
                Ver Meus Agendamentos
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="mb-8 max-w-4xl mx-auto">
        <QuickSearch />
      </div>

      {/* Recent Appointments */}
      <div className="mb-8 max-w-4xl mx-auto">
        <RecentAppointments />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Nossos Serviços
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Escolha o serviço desejado e agende seu horário
          </p>
        </div>

        <div className="grid gap-4 md:gap-6">
          {services.map((service) => (
            <Card
              key={service.id}
              className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {service.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDuration(service.duration_minutes)}
                      </div>
                      {service.price && (
                        <div className="font-medium text-green-600 dark:text-green-400">
                          {formatPrice(service.price)}
                        </div>
                      )}
                    </div>
                  </div>

                  <Link href={`/agendar/${service.id}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Reservar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum serviço disponível no momento.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
