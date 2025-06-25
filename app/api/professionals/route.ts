import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Listar todos os profissionais
export async function GET() {
  try {
    const { data: professionals, error } = await supabase
      .from("professionals")
      .select(
        `
        *,
        professional_services(
          service:services(*)
        )
      `
      )
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ professionals }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Criar novo profissional (apenas super admin)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, specialties, serviceIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // Criar profissional
    const { data: professional, error: profError } = await supabase
      .from("professionals")
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        specialties: specialties || [],
        active: true,
      })
      .select()
      .single();

    if (profError) {
      if (profError.code === "23505") {
        return NextResponse.json(
          { error: "Email já está em uso" },
          { status: 400 }
        );
      }
      throw profError;
    }

    // Associar serviços se fornecidos
    if (serviceIds && serviceIds.length > 0) {
      const serviceRelations = serviceIds.map((serviceId: string) => ({
        professional_id: professional.id,
        service_id: serviceId,
      }));

      const { error: serviceError } = await supabase
        .from("professional_services")
        .insert(serviceRelations);

      if (serviceError) {
        console.error("Erro ao associar serviços:", serviceError);
      }
    }

    return NextResponse.json({ professional }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar profissional:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT - Atualizar profissional (apenas super admin)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, phone, specialties, serviceIds } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID e nome são obrigatórios" },
        { status: 400 }
      );
    }

    // Atualizar profissional
    const { data: professional, error: profError } = await supabase
      .from("professionals")
      .update({
        name,
        email: email || null,
        phone: phone || null,
        specialties: specialties || [],
      })
      .eq("id", id)
      .select()
      .single();

    if (profError) throw profError;

    // Atualizar associações de serviços
    if (serviceIds !== undefined) {
      // Remover associações existentes
      await supabase
        .from("professional_services")
        .delete()
        .eq("professional_id", id);

      // Adicionar novas associações
      if (serviceIds.length > 0) {
        const serviceRelations = serviceIds.map((serviceId: string) => ({
          professional_id: id,
          service_id: serviceId,
        }));

        const { error: serviceError } = await supabase
          .from("professional_services")
          .insert(serviceRelations);

        if (serviceError) {
          console.error("Erro ao associar serviços:", serviceError);
        }
      }
    }

    return NextResponse.json({ professional }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar profissional:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Remover profissional (apenas super admin)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const professionalId = searchParams.get("id");

    if (!professionalId) {
      return NextResponse.json(
        { error: "ID do profissional não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se há agendamentos associados
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id")
      .eq("professional_id", professionalId)
      .limit(1);

    if (appointments && appointments.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir profissional com agendamentos" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("professionals")
      .delete()
      .eq("id", professionalId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao deletar profissional:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
