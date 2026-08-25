import { NextRequest, NextResponse } from "next/server";
import {
  criarVisualizador,
  listarVisualizadores,
  removerVisualizador,
} from "@/lib/storage";

export async function GET() {
  const visualizadores = await listarVisualizadores();
  return NextResponse.json(visualizadores);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nome, email, papel, senha, solicitanteEmail } = body;

  if (!nome || nome.trim().length < 2) {
    return NextResponse.json({ erro: "Informe o nome." }, { status: 400 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
  }
  if (!senha || senha.length < 4) {
    return NextResponse.json(
      { erro: "A senha deve ter ao menos 4 caracteres." },
      { status: 400 }
    );
  }

  const papelFinal = papel === "Administrador" ? "Administrador" : "Consulta";

  if (papelFinal === "Administrador") {
    return NextResponse.json(
      {
        erro:
          "Contas de administrador só podem ser criadas diretamente no banco de dados.",
      },
      { status: 403 }
    );
  }

  const novo = await criarVisualizador({
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    papel: papelFinal,
    senha,
  });

  return NextResponse.json(novo, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ erro: "id é obrigatório." }, { status: 400 });
  }
  await removerVisualizador(id);
  return NextResponse.json({ ok: true });
}
