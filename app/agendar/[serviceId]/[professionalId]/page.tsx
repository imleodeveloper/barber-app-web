"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { supabase, type Service, type Professional } from "@/lib/supabase";

export default function SelectDateTimePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const professionalId = params.professionalId as string;

  const [service, setService] = useState<Service | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceId && professionalId) {
      fetchData();
    }
  }, [serviceId, professionalId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimes();
    }
  }, [selectedDate, professionalId]);

  const fetchData = async () => {
    try {
      // Fetch service
      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();

      if (serviceError) throw serviceError;
      setService(serviceData);

      // Fetch professional
      const { data: professionalData, error: professionalError } =
        await supabase
          .from("professionals")
          .select("*")
          .eq("id", professionalId)
          .single();

      if (professionalError) throw professionalError;
      setProfessional(professionalData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTimes = async () => {
    try {
      // Fetch existing appointments for the selected date and professional
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("appointment_time")
        .eq("professional_id", professionalId)
        .eq("appointment_date", selectedDate)
        .eq("status", "scheduled");

      if (error) throw error;

      // Generate all possible times (9:00 to 18:00, every 30 minutes)
      const allTimes = [];
      for (let hour = 9; hour < 18; hour++) {
        allTimes.push(`${hour.toString().padStart(2, "0")}:00`);
        allTimes.push(`${hour.toString().padStart(2, "0")}:30`);
      }

      // Get booked times
      const bookedTimesList =
        appointments?.map((apt) => apt.appointment_time) || [];
      setBookedTimes(bookedTimesList);

      // Filter out booked times for available times
      const available = allTimes.filter(
        (time) => !bookedTimesList.includes(time)
      );

      // Filter out past times if selected date is today
      const today = new Date();
      const isToday = selectedDate === formatDate(today);

      if (isToday) {
        const currentTime = today.getHours() * 60 + today.getMinutes();
        const filteredTimes = available.filter((time) => {
          const [hours, minutes] = time.split(":").map(Number);
          const timeInMinutes = hours * 60 + minutes;
          return timeInMinutes > currentTime + 30; // Add 30 minutes buffer
        });
        setAvailableTimes(filteredTimes);
      } else {
        setAvailableTimes(available);
      }
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
    }
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getCurrentMonth = () => {
    if (!selectedDate) return "";
    const date = new Date(selectedDate);
    return date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  const getAllTimes = () => {
    const allTimes = [];
    for (let hour = 9; hour < 18; hour++) {
      allTimes.push(`${hour.toString().padStart(2, "0")}:00`);
      allTimes.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return allTimes;
  };

  const isTimeAvailable = (time: string) => {
    return availableTimes.includes(time);
  };

  const isTimeBooked = (time: string) => {
    return bookedTimes.includes(time);
  };

  const isTimePast = (time: string) => {
    if (!selectedDate) return false;

    const today = new Date();
    const isToday = selectedDate === formatDate(today);

    if (!isToday) return false;

    const currentTime = today.getHours() * 60 + today.getMinutes();
    const [hours, minutes] = time.split(":").map(Number);
    const timeInMinutes = hours * 60 + minutes;

    return timeInMinutes <= currentTime + 30;
  };

  const handleTimeSelect = async (time: string) => {
    if (!isTimeAvailable(time)) return;

    // Double-check availability before proceeding
    try {
      const { data: existingAppointment, error } = await supabase
        .from("appointments")
        .select("id")
        .eq("professional_id", professionalId)
        .eq("appointment_date", selectedDate)
        .eq("appointment_time", time)
        .eq("status", "scheduled")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (existingAppointment) {
        alert(
          "Este horário acabou de ser ocupado por outro cliente. Por favor, escolha outro horário."
        );
        // Refresh available times
        fetchAvailableTimes();
        return;
      }

      const appointmentData = {
        serviceId,
        professionalId,
        date: selectedDate,
        time,
        serviceName: service?.name || "",
        professionalName: professional?.name || "",
        duration: service?.duration_minutes || 0,
        price: service?.price || 0,
      };

      // Store in sessionStorage for the confirmation page
      sessionStorage.setItem(
        "appointmentData",
        JSON.stringify(appointmentData)
      );
      router.push("/confirmar-agendamento");
    } catch (error) {
      console.error("Erro ao verificar disponibilidade:", error);
      alert("Erro ao verificar disponibilidade. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Carregando...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const dates = generateDates();
  const allTimes = getAllTimes();

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Horários Disponíveis - {getCurrentMonth()}
            </h1>
            {service && professional && (
              <div className="text-gray-600 dark:text-gray-400">
                <p>
                  Serviço: <span className="font-medium">{service.name}</span>
                </p>
                <p>
                  Profissional:{" "}
                  <span className="font-medium">{professional.name}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Date Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Selecione a Data
          </h2>

          <div className="overflow-x-auto">
            <div className="flex space-x-3 pb-4">
              {dates.map((date) => {
                const dateStr = formatDate(date);
                const isSelected = selectedDate === dateStr;
                const isToday = formatDate(new Date()) === dateStr;

                return (
                  <Button
                    key={dateStr}
                    variant={isSelected ? "default" : "outline"}
                    className={`min-w-[80px] flex-shrink-0 ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    } ${isToday ? "ring-2 ring-blue-300" : ""}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <div className="text-center">
                      <div className="text-xs opacity-75">
                        {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                      </div>
                      <div className="font-semibold">{date.getDate()}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Horários - {getCurrentMonth()}
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {allTimes.map((time) => {
                const available = isTimeAvailable(time);
                const booked = isTimeBooked(time);
                const past = isTimePast(time);
                const disabled = !available || booked || past;

                return (
                  <Button
                    key={time}
                    variant="outline"
                    disabled={disabled}
                    className={`${
                      available && !booked && !past
                        ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900 border-gray-300 dark:border-gray-600"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-200 dark:border-gray-600"
                    }`}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                );
              })}
            </div>

            {availableTimes.length === 0 && (
              <Card className="bg-white dark:bg-gray-800 mt-4">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Não há horários disponíveis para esta data.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
