import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// GET - Listar todos os admins (apenas super admin)
export async function GET(req: Request) {
  try {
    const { data: admins, error } = await supabase
      .from("admins")
      .select(
        `
        *,
        professional:professionals(name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ admins }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar admins:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Criar novo admin (apenas super admin)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role, professional_id } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    // Hash da senha
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Se for admin comum e não tiver professional_id, criar um profissional automaticamente
    let finalProfessionalId = professional_id;

    if (role === "admin" && !professional_id) {
      // Criar profissional automaticamente
      const { data: newProfessional, error: profError } = await supabase
        .from("professionals")
        .insert({
          name,
          email,
          active: true,
        })
        .select()
        .single();

      if (profError) {
        console.error("Erro ao criar profissional:", profError);
        return NextResponse.json(
          { error: "Erro ao criar profissional automaticamente" },
          { status: 500 }
        );
      }

      finalProfessionalId = newProfessional.id;
    }

    const { data: admin, error } = await supabase
      .from("admins")
      .insert({
        email,
        password_hash,
        name,
        role: role || "admin",
        professional_id: finalProfessionalId || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Email já está em uso" },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar admin:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Remover admin (apenas super admin)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("id");

    if (!adminId) {
      return NextResponse.json(
        { error: "ID do admin não fornecido" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("admins").delete().eq("id", adminId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao deletar admin:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PATCH - Atualiza agendamentos status ou deleta (super admin)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, action } = body;

    if (!appointmentId || !action) {
      return NextResponse.json(
        { error: "ID do agendamento e ação são obrigatórios" },
        { status: 400 }
      );
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao processar agendamento:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
