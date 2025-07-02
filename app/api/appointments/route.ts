import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Buscar agendamentos por telefone
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Telefone é obrigatório" },
        { status: 400 }
      );
    }

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        service:services(*),
        professional:professionals(*)
      `
      )
      .eq("client_phone", phone.trim())
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Criar novo agendamento
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      service_id,
      professional_id,
      client_name,
      client_phone,
      appointment_date,
      appointment_time,
    } = body;

    if (
      !service_id ||
      !professional_id ||
      !client_name ||
      !client_phone ||
      !appointment_date ||
      !appointment_time
    ) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se já existe agendamento no mesmo horário para o mesmo profissional
    const { data: existingAppointment, error: checkError } = await supabase
      .from("appointments")
      .select("id")
      .eq("professional_id", professional_id)
      .eq("appointment_date", appointment_date)
      .eq("appointment_time", appointment_time)
      .eq("status", "scheduled")
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingAppointment) {
      return NextResponse.json(
        { error: "Este horário já está ocupado" },
        { status: 400 }
      );
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        service_id,
        professional_id,
        client_name: client_name.trim(),
        client_phone: client_phone.trim(),
        appointment_date,
        appointment_time,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PATCH - Atualizar status do agendamento
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, status } = body;

    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: "ID do agendamento e status são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ appointment }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
