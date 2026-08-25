import { NextRequest, NextResponse } from "next/server";
import { buscarVisualizadorPorNome, hashSenha } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const { nome, senha } = await req.json();

  if (!nome || !senha) {
    return NextResponse.json(
      { erro: "Informe nome e senha." },
      { status: 400 }
    );
  }

  const visualizador = await buscarVisualizadorPorNome(nome);
  if (!visualizador || visualizador.senhaHash !== hashSenha(senha)) {
    return NextResponse.json(
      { erro: "Nome ou senha incorretos." },
      { status: 401 }
    );
  }

const { senhaHash, ...publico } = visualizador;
  return NextResponse.json(publico);
}

