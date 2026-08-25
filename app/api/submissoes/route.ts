import { NextRequest, NextResponse } from "next/server";
import { criarSubmissao, listarSubmissoes } from "@/lib/storage";
import { isValidCPF, isValidTelefone } from "@/lib/validators";

export async function GET() {
  const submissoes = await listarSubmissoes();
  return NextResponse.json(submissoes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nomeCompleto, cpf, telefone, endereco, protocolo } = body;

  if (!nomeCompleto || nomeCompleto.trim().length < 3) {
    return NextResponse.json(
      { erro: "Informe o nome completo." },
      { status: 400 }
    );
  }
  if (!isValidCPF(cpf || "")) {
    return NextResponse.json({ erro: "CPF inválido." }, { status: 400 });
  }
  if (!isValidTelefone(telefone || "")) {
    return NextResponse.json({ erro: "Telefone inválido." }, { status: 400 });
  }
  if (
    !endereco ||
    !endereco.cep ||
    !endereco.logradouro ||
    !endereco.numero ||
    !endereco.bairro ||
    !endereco.cidade ||
    !endereco.uf
  ) {
    return NextResponse.json(
      { erro: "Preencha todos os campos obrigatórios do endereço." },
      { status: 400 }
    );
  }

  const nova = await criarSubmissao({
    nomeCompleto: nomeCompleto.trim(),
    cpf,
    telefone,
    endereco,
    protocolo,
  });

  return NextResponse.json(nova, { status: 201 });
}
