"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { usePhoneMask } from "@/hooks/use-phone-mask";
import { supabase } from "@/lib/supabase";

interface AppointmentData {
  serviceId: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
}

export default function ConfirmAppointmentPage() {
  const router = useRouter();
  const phoneInput = usePhoneMask();
  const [appointmentData, setAppointmentData] =
    useState<AppointmentData | null>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("appointmentData");
    if (!data) {
      router.push("/");
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setAppointmentData(parsedData);
    } catch (error) {
      console.error("Erro ao carregar dados do agendamento:", error);
      router.push("/");
    }
  }, [router]);

  const handleConfirm = async () => {
    if (!appointmentData || !clientName.trim() || !phoneInput.isValid()) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }

    setLoading(true);

    try {
      // Double-check availability before creating appointment
      const { data: existingAppointment, error: checkError } = await supabase
        .from("appointments")
        .select("id")
        .eq("professional_id", appointmentData.professionalId)
        .eq("appointment_date", appointmentData.date)
        .eq("appointment_time", appointmentData.time)
        .eq("status", "scheduled")
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingAppointment) {
        alert(
          "Este horário acabou de ser ocupado por outro cliente. Por favor, escolha outro horário."
        );
        router.back();
        return;
      }

      // Create the appointment
      const { data: newAppointment, error } = await supabase
        .from("appointments")
        .insert({
          service_id: appointmentData.serviceId,
          professional_id: appointmentData.professionalId,
          client_name: clientName.trim(),
          client_phone: phoneInput.getUnmaskedValue(),
          appointment_date: appointmentData.date,
          appointment_time: appointmentData.time,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;

      // Store phone and appointment ID for redirect
      sessionStorage.setItem("searchPhone", phoneInput.getUnmaskedValue());
      sessionStorage.setItem("newAppointmentId", newAppointment.id);

      // Clear appointment data
      sessionStorage.removeItem("appointmentData");

      // Redirect to my appointments with phone parameter
      router.push(
        `/meus-agendamentos?phone=${phoneInput.getUnmaskedValue()}&new=true`
      );
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      alert("Erro ao criar agendamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  };

  if (!appointmentData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Confirmar Agendamento
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Revise os detalhes e confirme seu agendamento
          </p>
        </div>

        {/* Appointment Details */}
        <Card className="bg-white dark:bg-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Detalhes do Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {appointmentData.serviceName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDuration(appointmentData.duration)} • R${" "}
                  {appointmentData.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {appointmentData.professionalName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Profissional
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(appointmentData.date)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Data</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {appointmentData.time}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Horário
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card className="bg-white dark:bg-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Seus Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label
                htmlFor="name"
                className="text-gray-700 dark:text-gray-300"
              >
                Nome Completo
              </Label>
              <Input
                id="name"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Digite seu nome completo"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label
                htmlFor="phone"
                className="text-gray-700 dark:text-gray-300"
              >
                Telefone/WhatsApp
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phoneInput.value}
                onChange={phoneInput.handleChange}
                placeholder="(11) 99999-9999"
                required
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            disabled={loading}
          >
            Voltar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !clientName.trim() || !phoneInput.isValid()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Confirmando...
              </div>
            ) : (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Agendamento
              </div>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
