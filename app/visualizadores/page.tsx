"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Submissao, VisualizadorPublico } from "@/lib/storage";
type SessaoVisualizador = VisualizadorPublico & { souMaster: boolean };

const SESSAO_KEY = "sessao_visualizador";

export default function VisualizadoresPage() {
    const [sessao, setSessao] = useState<SessaoVisualizador | null>(null);
  const [checandoSessao, setChecandoSessao] = useState(true);

  useEffect(() => {
    const salva = localStorage.getItem(SESSAO_KEY);
    if (salva) {
      try {
        setSessao(JSON.parse(salva));
      } catch {
        localStorage.removeItem(SESSAO_KEY);
      }
    }
    setChecandoSessao(false);
  }, []);

  function entrar(v: SessaoVisualizador) {
    localStorage.setItem(SESSAO_KEY, JSON.stringify(v));
    setSessao(v);
  }

  function sair() {
    localStorage.removeItem(SESSAO_KEY);
    setSessao(null);
  }

  if (checandoSessao) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
          Carregando…
        </p>
      </main>
    );
  }

   if (!sessao) {
    return <TelaAcesso aoEntrar={entrar} />;
  }

  return <Painel sessao={sessao} aoSair={sair} />;
}

/* ---------------------------------------------------------------- */
/* Tela de acesso: login (nome + senha) ou cadastro do 1º admin      */
/* ---------------------------------------------------------------- */

function TelaAcesso({
  aoEntrar,
}: {
  aoEntrar: (v: SessaoVisualizador) => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-sm w-full">
        <div className="mb-8 text-center">
          <p className="field-label !text-center">Painel de visualizadores</p>
          <h1 className="font-display text-3xl italic">Entrar no painel</h1>
        </div>

        <div className="bg-card border border-line p-8">
          <FormularioLogin aoEntrar={aoEntrar} />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="block font-mono text-xs uppercase tracking-[0.14em] text-muted hover:text-teal"
          >
            ← Voltar ao formulário
          </Link>
        </div>
      </div>
    </main>
  );
}

function FormularioLogin({
  aoEntrar,
}: {
  aoEntrar: (v: SessaoVisualizador) => void;
}) {
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEntrando(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível entrar.");
        return;
      }
      aoEntrar(data);
    } finally {
      setEntrando(false);
    }
  }

  return (
    <form onSubmit={submeter} className="space-y-5">
      <div>
        <label className="field-label" htmlFor="login-nome">
          Nome
        </label>
        <input
          id="login-nome"
          className="field-input"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoFocus
        />
      </div>
      <div>
        <label className="field-label" htmlFor="login-senha">
          Senha
        </label>
        <input
          id="login-senha"
          type="password"
          className="field-input"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>
      {erro && <p className="field-error">{erro}</p>}
      <button
        type="submit"
        disabled={entrando}
        className="w-full bg-ink text-canvas font-mono text-xs uppercase tracking-[0.16em] py-3.5 hover:bg-teal transition-colors disabled:opacity-50"
      >
        {entrando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

function FormularioPrimeiroAdmin({
  aoEntrar,
}: {
  aoEntrar: (v: SessaoVisualizador) => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/visualizadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, papel: "Administrador" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível criar o acesso.");
        return;
      }
      aoEntrar(data);
    } finally {
      setSalvando(false);
    }
  }

 
}

/* ---------------------------------------------------------------- */
/* Painel autenticado                                                */
/* ---------------------------------------------------------------- */

function Painel({
  sessao,
  aoSair,
}: {
  sessao: SessaoVisualizador;
  aoSair: () => void;
}) {
  const [visualizadores, setVisualizadores] = useState<SessaoVisualizador[]>(
    []
  );
  const [submissoes, setSubmissoes] = useState<Submissao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<"Administrador" | "Consulta">("Consulta");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const ehAdministrador = sessao.papel === "Administrador";

  async function carregar() {
    setCarregando(true);
    const [rv, rs] = await Promise.all([
      fetch("/api/visualizadores"),
      fetch("/api/submissoes"),
    ]);
    setVisualizadores(await rv.json());
    setSubmissoes(await rs.json());
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function cadastrarVisualizador(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/visualizadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          senha,
          papel,
          solicitanteEmail: sessao.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível cadastrar.");
        return;
      }
      setNome("");
      setEmail("");
      setSenha("");
      setPapel("Consulta");
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function removerVisualizador(id: string) {
    await fetch(`/api/visualizadores?id=${id}`, { method: "DELETE" });
    await carregar();
  }

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
          <div>
            <p className="field-label mb-2">
              Painel de acesso · {sessao.nome} ({sessao.papel})
            </p>
            <h1 className="font-display text-4xl md:text-5xl italic">
              Quem pode ver os cadastros
            </h1>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-[0.14em] text-muted hover:text-teal"
            >
              ← Voltar ao formulário
            </Link>
            <button
              onClick={aoSair}
              className="font-mono text-xs uppercase tracking-[0.14em] text-alert hover:underline"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-[340px_1fr] gap-10">
          {/* Cadastro de visualizador — apenas administradores */}
          {ehAdministrador ? (
            <section className="bg-card border border-line p-6 md:p-8 h-fit">
              <p className="font-display italic text-lg text-teal mb-6">
                Registrar visualizador
              </p>
              <form onSubmit={cadastrarVisualizador} className="space-y-5">
                <div>
                  <label className="field-label" htmlFor="nome">
                    Nome
                  </label>
                  <input
                    id="nome"
                    className="field-input"
                    placeholder="Nome de quem vai visualizar"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="email">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="field-input"
                    placeholder="nome@instituicao.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="senha">
                    Senha de acesso
                  </label>
                  <input
                    id="senha"
                    type="password"
                    className="field-input"
                    placeholder="Mínimo 4 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="papel">
                    Nível de acesso
                  </label>
                  {sessao.souMaster ? (
                    <select
                      id="papel"
                      className="field-input"
                      value={papel}
                      onChange={(e) =>
                        setPapel(e.target.value as "Administrador" | "Consulta")
                      }
                    >
                      <option value="Consulta">Consulta — apenas visualizar</option>
                      <option value="Administrador">Administrador — gerencia acessos</option>
                    </select>
                  ) : (
                    <input
                      className="field-input opacity-60"
                      value="Consulta — apenas visualizar"
                      disabled
                    />
                  )}
                </div>
                {erro && <p className="field-error">{erro}</p>}
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full bg-ink text-canvas font-mono text-xs uppercase tracking-[0.16em] py-3.5 hover:bg-teal transition-colors disabled:opacity-50"
                >
                  {salvando ? "Salvando…" : "Adicionar visualizador"}
                </button>
              </form>

              <div className="perforation h-3 my-7 opacity-60" />

              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted mb-4">
                {visualizadores.length} cadastrado
                {visualizadores.length !== 1 ? "s" : ""}
              </p>
              <ul className="space-y-3">
                {visualizadores.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-start justify-between gap-3 border-b border-line pb-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.nome}</p>
                      <p className="text-xs text-muted truncate">{v.email}</p>
                      <span className="inline-block mt-1 font-mono text-[10px] uppercase tracking-wide text-teal">
                        {v.papel}
                      </span>
                    </div>
                    {v.id !== sessao.id && (
                      <button
                        onClick={() => removerVisualizador(v.id)}
                        className="font-mono text-[10px] uppercase text-alert shrink-0 hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="bg-card border border-line p-6 md:p-8 h-fit">
              <p className="font-display italic text-lg text-teal mb-3">
                Acesso de consulta
              </p>
              <p className="text-sm text-muted">
                Seu perfil pode visualizar o livro de registro ao lado. Para
                cadastrar novos visualizadores, peça a um administrador.
              </p>
            </section>
          )}

          {/* Livro de registro dos resultados */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <p className="font-display italic text-lg text-teal">
                Livro de registro
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                {submissoes.length} registro{submissoes.length !== 1 ? "s" : ""}
              </p>
            </div>

            {carregando && (
              <p className="text-sm text-muted">Carregando registros…</p>
            )}

            {!carregando && submissoes.length === 0 && (
              <div className="bg-card border border-dashed border-line p-10 text-center text-sm text-muted">
                Nenhum cadastro foi enviado pelo formulário ainda.
              </div>
            )}

            <div className="space-y-3">
              {submissoes.map((s, i) => (
                <details
                  key={s.id}
                  className="group bg-card border border-line px-5 py-4"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-xs text-muted w-8 shrink-0">
                        {String(submissoes.length - i).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.nomeCompleto}</p>
                        <p className="text-xs text-muted">
                          {s.endereco.cidade}/{s.endereco.uf}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-gold shrink-0 ml-3">
                      {s.protocolo}
                    </span>
                  </summary>
                  <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-line font-mono text-sm">
                    <div>
                      <p className="text-[10px] uppercase text-muted">CPF</p>
                      <p>{s.cpf}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted">
                        Telefone
                      </p>
                      <p>{s.telefone}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] uppercase text-muted">
                        Endereço
                      </p>
                      <p>
                        {s.endereco.logradouro}, {s.endereco.numero}
                        {s.endereco.complemento && ` — ${s.endereco.complemento}`}
                        {" · "}
                        {s.endereco.bairro} · {s.endereco.cidade}/
                        {s.endereco.uf} · CEP {s.endereco.cep}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted">
                        Recebido em
                      </p>
                      <p>{new Date(s.criadoEm).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
