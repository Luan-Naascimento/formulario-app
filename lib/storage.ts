import { supabaseAdmin } from "./supabaseClient";
import crypto from "crypto";

const PEPPER = "cadastro-requerente-v1";
export function hashSenha(senha: string): string {
  return crypto.createHash("sha256").update(`${PEPPER}:${senha}`).digest("hex");
}

export type Submissao = {
  id: string;
  protocolo: string;
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  criadoEm: string;
};

export type Visualizador = {
  id: string;
  nome: string;
  email: string;
  papel: "Administrador" | "Consulta";
  senhaHash: string;
  criadoEm: string;
};

export type VisualizadorPublico = Omit<Visualizador, "senhaHash">;

function semSenha(v: Visualizador): VisualizadorPublico {
  const { senhaHash, ...publico } = v;
  return publico;
}

function linhaParaSubmissao(row: any): Submissao {
  return {
    id: row.id,
    protocolo: row.protocolo,
    nomeCompleto: row.nome_completo,
    cpf: row.cpf,
    telefone: row.telefone,
    endereco: {
      cep: row.cep,
      logradouro: row.logradouro,
      numero: row.numero,
      complemento: row.complemento ?? undefined,
      bairro: row.bairro,
      cidade: row.cidade,
      uf: row.uf,
    },
    criadoEm: row.criado_em,
  };
}

function linhaParaVisualizador(row: any): Visualizador {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    papel: row.papel,
    senhaHash: row.senha_hash,
    criadoEm: row.criado_em,
  };
}

export async function listarSubmissoes(): Promise<Submissao[]> {
  const { data, error } = await supabaseAdmin
    .from("submissoes")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(linhaParaSubmissao);
}

export async function criarSubmissao(
  s: Omit<Submissao, "id" | "criadoEm">
): Promise<Submissao> {
  const { data, error } = await supabaseAdmin
    .from("submissoes")
    .insert({
      protocolo: s.protocolo,
      nome_completo: s.nomeCompleto,
      cpf: s.cpf,
      telefone: s.telefone,
      cep: s.endereco.cep,
      logradouro: s.endereco.logradouro,
      numero: s.endereco.numero,
      complemento: s.endereco.complemento || null,
      bairro: s.endereco.bairro,
      cidade: s.endereco.cidade,
      uf: s.endereco.uf,
    })
    .select()
    .single();
  if (error) throw error;
  return linhaParaSubmissao(data);
}

export async function listarVisualizadores(): Promise<VisualizadorPublico[]> {
  const { data, error } = await supabaseAdmin
    .from("visualizadores")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(linhaParaVisualizador).map(semSenha);
}

export async function buscarVisualizadorPorNome(
  nome: string
): Promise<Visualizador | undefined> {
  const { data, error } = await supabaseAdmin
    .from("visualizadores")
    .select("*")
    .ilike("nome", nome.trim())
    .maybeSingle();
  if (error) throw error;
  return data ? linhaParaVisualizador(data) : undefined;
}

export async function criarVisualizador(input: {
  nome: string;
  email: string;
  papel: "Administrador" | "Consulta";
  senha: string;
}): Promise<VisualizadorPublico> {
  const { data, error } = await supabaseAdmin
    .from("visualizadores")
    .insert({
      nome: input.nome,
      email: input.email,
      papel: input.papel,
      senha_hash: hashSenha(input.senha),
    })
    .select()
    .single();
  if (error) throw error;
  return semSenha(linhaParaVisualizador(data));
}

export async function removerVisualizador(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("visualizadores")
    .delete()
    .eq("id", id);
  if (error) throw error;
}