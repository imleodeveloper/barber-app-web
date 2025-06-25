import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 400 }
      );
    }
    const { data: admin, error } = await supabase
      .from("admins")
      .select(
        `
        *, 
        professional:professionals(*)
        `
      )
      .eq("email", email)
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    // Retornar informações do admin incluindo role e professional_id
    return NextResponse.json(
      {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          professional_id: admin.professional_id,
          professional: admin.professional,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro na API de login:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
