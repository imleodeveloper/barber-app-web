import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Listar serviços (filtrar por profissional se admin comum)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const professionalId = searchParams.get("professional_id");

    let query = supabase
      .from("services")
      .select(
        `
        *,
        professional_services(
          professional:professionals(id, name)
        )
      `
      )
      .order("name", { ascending: true });

    // Se especificado um profissional, filtrar serviços
    if (professionalId) {
      const { data: serviceIds } = await supabase
        .from("professional_services")
        .select("service_id")
        .eq("professional_id", professionalId);

      if (serviceIds && serviceIds.length > 0) {
        const ids = serviceIds.map((item) => item.service_id);
        query = query.in("id", ids);
      } else {
        // Se não há serviços associados, retornar array vazio
        return NextResponse.json({ services: [] }, { status: 200 });
      }
    }

    const { data: services, error } = await query;

    if (error) throw error;

    return NextResponse.json({ services }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Criar novo serviço (apenas super admin)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, duration_minutes, price, category, professionalIds } = body;

    if (!name || !duration_minutes) {
      return NextResponse.json(
        { error: "Nome e duração são obrigatórios" },
        { status: 400 }
      );
    }

    // Criar serviço
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .insert({
        name,
        duration_minutes: Number.parseInt(duration_minutes),
        price: price ? Number.parseFloat(price) : null,
        category: category || "beauty",
        active: true,
      })
      .select()
      .single();

    if (serviceError) throw serviceError;

    // Associar profissionais se fornecidos
    if (professionalIds && professionalIds.length > 0) {
      const professionalRelations = professionalIds.map(
        (professionalId: string) => ({
          professional_id: professionalId,
          service_id: service.id,
        })
      );

      const { error: profError } = await supabase
        .from("professional_services")
        .insert(professionalRelations);

      if (profError) {
        console.error("Erro ao associar profissionais:", profError);
      }
    }

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT - Atualizar serviço
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      duration_minutes,
      price,
      category,
      professionalIds,
      adminRole,
      adminProfessionalId,
    } = body;

    if (!id || !name || !duration_minutes) {
      return NextResponse.json(
        { error: "ID, nome e duração são obrigatórios" },
        { status: 400 }
      );
    }

    // Se for admin comum, verificar se pode editar este serviço
    if (adminRole === "admin" && adminProfessionalId) {
      const { data: canEdit } = await supabase
        .from("professional_services")
        .select("id")
        .eq("professional_id", adminProfessionalId)
        .eq("service_id", id)
        .single();

      if (!canEdit) {
        return NextResponse.json(
          { error: "Você não tem permissão para editar este serviço" },
          { status: 403 }
        );
      }
    }

    // Atualizar serviço
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .update({
        name,
        duration_minutes: Number.parseInt(duration_minutes),
        price: price ? Number.parseFloat(price) : null,
        category: category || "beauty",
      })
      .eq("id", id)
      .select()
      .single();

    if (serviceError) throw serviceError;

    // Apenas super admin pode alterar associações de profissionais
    if (adminRole === "super_admin" && professionalIds !== undefined) {
      // Remover associações existentes
      await supabase
        .from("professional_services")
        .delete()
        .eq("service_id", id);

      // Adicionar novas associações
      if (professionalIds.length > 0) {
        const professionalRelations = professionalIds.map(
          (professionalId: string) => ({
            professional_id: professionalId,
            service_id: id,
          })
        );

        const { error: profError } = await supabase
          .from("professional_services")
          .insert(professionalRelations);

        if (profError) {
          console.error("Erro ao associar profissionais:", profError);
        }
      }
    }

    return NextResponse.json({ service }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Remover serviço (apenas super admin)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("id");

    if (!serviceId) {
      return NextResponse.json(
        { error: "ID do serviço não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se há agendamentos associados
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id")
      .eq("service_id", serviceId)
      .limit(1);

    if (appointments && appointments.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir serviço com agendamentos" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao deletar serviço:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
