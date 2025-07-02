"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  X,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { supabase, type Appointment } from "@/lib/supabase";
import { usePhoneMask } from "@/hooks/use-phone-mask";
import Link from "next/link";

export default function MyAppointmentsPage() {
  const phoneInput = usePhoneMask();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [newAppointmentId, setNewAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a phone number from quick search
    const searchPhone = sessionStorage.getItem("searchPhone");
    const appointmentId = sessionStorage.getItem("newAppointmentId");

    if (searchPhone) {
      phoneInput.setValue(searchPhone);
      sessionStorage.removeItem("searchPhone");

      if (appointmentId) {
        setNewAppointmentId(appointmentId);
        sessionStorage.removeItem("newAppointmentId");
      }

      // Auto-search
      handleAutoSearch(searchPhone);
    }
  }, []);

  const handleAutoSearch = async (phoneNumber: string) => {
    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
        *,
        service:services(*),
        professional:professionals(*)
      `
        )
        .eq("client_phone", phoneNumber)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneInput.rawValue) {
      alert("Por favor, digite seu telefone.");
      return;
    }

    if (phoneInput.rawValue.length < 10) {
      alert("Por favor, digite um telefone válido.");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          service:services(*),
          professional:professionals(*)
        `
        )
        .eq("client_phone", phoneInput.rawValue)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      alert("Erro ao buscar agendamentos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt
        )
      );

      alert("Agendamento cancelado com sucesso!");
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      alert("Erro ao cancelar agendamento. Tente novamente.");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
      ? `${hours}h:${remainingMinutes.toString().padStart(2, "0")}min`
      : `${hours}h:00min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Agendado";
      case "cancelled":
        return "Cancelado";
      case "completed":
        return "Concluído";
      default:
        return status;
    }
  };

  const isNewAppointment = (appointmentId: string) => {
    return newAppointmentId === appointmentId;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Meus Agendamentos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Digite seu telefone para ver seus agendamentos
          </p>
        </div>

        {/* Search Form */}
        <Card className="bg-white dark:bg-gray-800 mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
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
                  onChange={phoneInput.onChange}
                  placeholder="(11) 99999-9999"
                  required
                  className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Buscando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Appointments List */}
        {searched && (
          <div>
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className={`bg-white dark:bg-gray-800 ${
                      isNewAppointment(appointment.id)
                        ? "ring-2 ring-green-500 ring-opacity-50"
                        : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {appointment.service?.name}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              {getStatusText(appointment.status)}
                            </span>
                            {isNewAppointment(appointment.id) && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Novo
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {appointment.professional?.name}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {formatDate(appointment.appointment_date)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {appointment.appointment_time}
                              {appointment.service?.duration_minutes && (
                                <span className="ml-2">
                                  (
                                  {formatDuration(
                                    appointment.service.duration_minutes
                                  )}
                                  )
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              {appointment.client_name}
                            </div>
                          </div>
                        </div>

                        {appointment.status === "scheduled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCancelAppointment(appointment.id)
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Nenhum agendamento encontrado para este telefone.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                    Que tal fazer seu primeiro agendamento?
                  </p>
                  <Link href="/">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Calendar className="h-4 w-4 mr-2" />
                      Fazer Novo Agendamento
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
