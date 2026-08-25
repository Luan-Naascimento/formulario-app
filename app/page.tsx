"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  maskCPF,
  maskTelefone,
  maskCEP,
  isValidCPF,
  isValidTelefone,
  gerarProtocolo,
} from "@/lib/validators";

type FormState = {
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

const EMPTY: FormState = {
  nomeCompleto: "",
  cpf: "",
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

export default function FormularioPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [erros, setErros] = useState<Partial<Record<keyof FormState, string>>>({});
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [protocoloEmitido, setProtocoloEmitido] = useState<string | null>(null);

  const [temAcessoPainel, setTemAcessoPainel] = useState(false);

  useEffect(() => {
    const sessao = localStorage.getItem("sessao_visualizador");
    setTemAcessoPainel(!!sessao);
  }, []);

  const protocoloPreview = useMemo(() => gerarProtocolo(), []);

  function atualizar<K extends keyof FormState>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  async function buscarCEP(cepBruto: string) {
    const digits = cepBruto.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setBuscandoCEP(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          logradouro: data.logradouro || f.logradouro,
          bairro: data.bairro || f.bairro,
          cidade: data.localidade || f.cidade,
          uf: data.uf || f.uf,
        }));
      }
    } catch {
      // silencioso — usuário pode preencher manualmente
    } finally {
      setBuscandoCEP(false);
    }
  }

  function validar(): boolean {
    const novosErros: Partial<Record<keyof FormState, string>> = {};
    if (form.nomeCompleto.trim().split(" ").filter(Boolean).length < 2) {
      novosErros.nomeCompleto = "Informe nome e sobrenome.";
    }
    if (!isValidCPF(form.cpf)) {
      novosErros.cpf = "CPF inválido.";
    }
    if (!isValidTelefone(form.telefone)) {
      novosErros.telefone = "Telefone inválido.";
    }
    if (form.cep.replace(/\D/g, "").length !== 8) novosErros.cep = "CEP inválido.";
    if (!form.logradouro) novosErros.logradouro = "Obrigatório.";
    if (!form.numero) novosErros.numero = "Obrigatório.";
    if (!form.bairro) novosErros.bairro = "Obrigatório.";
    if (!form.cidade) novosErros.cidade = "Obrigatório.";
    if (form.uf.length !== 2) novosErros.uf = "UF inválida.";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/submissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeCompleto: form.nomeCompleto,
          cpf: form.cpf,
          telefone: form.telefone,
          protocolo: protocoloPreview,
          endereco: {
            cep: form.cep,
            logradouro: form.logradouro,
            numero: form.numero,
            complemento: form.complemento,
            bairro: form.bairro,
            cidade: form.cidade,
            uf: form.uf.toUpperCase(),
          },
        }),
      });
      if (res.ok) {
        setProtocoloEmitido(protocoloPreview);
        setForm(EMPTY);
      } else {
        const data = await res.json();
        alert(data.erro || "Não foi possível enviar o formulário.");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (protocoloEmitido) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-card border border-line px-8 py-10 text-center">
          <div className="stamp w-16 h-16 mx-auto mb-6 text-2xl">✓</div>
          <p className="field-label !text-center">Cadastro recebido</p>
          <h1 className="font-display text-3xl mb-2">Protocolo emitido</h1>
          <p className="font-mono text-lg text-teal mb-8">{protocoloEmitido}</p>
          <p className="text-sm text-muted mb-8">
            Guarde este número. Ele identifica o seu cadastro junto ao
            responsável pelo registro.
          </p>
          <button
            onClick={() => setProtocoloEmitido(null)}
            className="font-mono text-xs uppercase tracking-[0.14em] text-teal border-b border-teal pb-0.5"
          >
            Preencher outro cadastro
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_320px] gap-0 md:gap-10">
        {/* Cabeçalho */}
        <header className="md:col-span-2 mb-10 flex items-end justify-between border-b-2 border-ink pb-4">
          <div>
           
            <h1 className="font-display text-4xl md:text-5xl italic">
              Formulário de apoiadores
            </h1>
          </div>
          {temAcessoPainel && (
            <Link
              href="/visualizadores"
              className="md:hidden block text-center font-mono text-xs uppercase tracking-[0.14em] text-muted"
            >
              Painel de visualizadores →
            </Link>
          )}
        </header>

        {/* Formulário */}
        <form onSubmit={enviar} className="bg-card border border-line p-6 md:p-10 space-y-8">
          <fieldset className="space-y-6">
            <legend className="font-display italic text-lg text-teal mb-1">
              01 — Identificação
            </legend>

            <div>
              <label className="field-label" htmlFor="nomeCompleto">
                Nome completo
              </label>
              <input
                id="nomeCompleto"
                className="field-input"
                placeholder="Ex.: Maria da Silva Souza"
                value={form.nomeCompleto}
                onChange={(e) => atualizar("nomeCompleto", e.target.value)}
              />
              {erros.nomeCompleto && (
                <p className="field-error">{erros.nomeCompleto}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="field-label" htmlFor="cpf">
                  CPF
                </label>
                <input
                  id="cpf"
                  className="field-input font-mono"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={(e) => atualizar("cpf", maskCPF(e.target.value))}
                />
                {erros.cpf && <p className="field-error">{erros.cpf}</p>}
              </div>
              <div>
                <label className="field-label" htmlFor="telefone">
                  Telefone
                </label>
                <input
                  id="telefone"
                  className="field-input font-mono"
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                  value={form.telefone}
                  onChange={(e) =>
                    atualizar("telefone", maskTelefone(e.target.value))
                  }
                />
                {erros.telefone && (
                  <p className="field-error">{erros.telefone}</p>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-6">
            <legend className="font-display italic text-lg text-teal mb-1">
              02 — Endereço
            </legend>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="field-label" htmlFor="cep">
                  CEP {buscandoCEP && <span className="text-teal">buscando…</span>}
                </label>
                <input
                  id="cep"
                  className="field-input font-mono"
                  placeholder="00000-000"
                  inputMode="numeric"
                  value={form.cep}
                  onChange={(e) => {
                    const masked = maskCEP(e.target.value);
                    atualizar("cep", masked);
                    if (masked.replace(/\D/g, "").length === 8) buscarCEP(masked);
                  }}
                />
                {erros.cep && <p className="field-error">{erros.cep}</p>}
              </div>
              <div>
                <label className="field-label" htmlFor="uf">
                  UF
                </label>
                <input
                  id="uf"
                  className="field-input uppercase"
                  placeholder="PA"
                  maxLength={2}
                  value={form.uf}
                  onChange={(e) => atualizar("uf", e.target.value.toUpperCase())}
                />
                {erros.uf && <p className="field-error">{erros.uf}</p>}
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="logradouro">
                Logradouro
              </label>
              <input
                id="logradouro"
                className="field-input"
                placeholder="Rua, avenida, travessa…"
                value={form.logradouro}
                onChange={(e) => atualizar("logradouro", e.target.value)}
              />
              {erros.logradouro && (
                <p className="field-error">{erros.logradouro}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="field-label" htmlFor="numero">
                  Número
                </label>
                <input
                  id="numero"
                  className="field-input"
                  value={form.numero}
                  onChange={(e) => atualizar("numero", e.target.value)}
                />
                {erros.numero && <p className="field-error">{erros.numero}</p>}
              </div>
              <div>
                <label className="field-label" htmlFor="complemento">
                  Complemento
                </label>
                <input
                  id="complemento"
                  className="field-input"
                  placeholder="Opcional"
                  value={form.complemento}
                  onChange={(e) => atualizar("complemento", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="field-label" htmlFor="bairro">
                  Bairro
                </label>
                <input
                  id="bairro"
                  className="field-input"
                  value={form.bairro}
                  onChange={(e) => atualizar("bairro", e.target.value)}
                />
                {erros.bairro && <p className="field-error">{erros.bairro}</p>}
              </div>
              <div>
                <label className="field-label" htmlFor="cidade">
                  Cidade
                </label>
                <input
                  id="cidade"
                  className="field-input"
                  value={form.cidade}
                  onChange={(e) => atualizar("cidade", e.target.value)}
                />
                {erros.cidade && <p className="field-error">{erros.cidade}</p>}
              </div>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-ink text-canvas font-mono text-xs uppercase tracking-[0.16em] py-4 hover:bg-teal transition-colors disabled:opacity-50"
          >
            {enviando ? "Enviando…" : "Enviar cadastro"}
          </button>

          {temAcessoPainel && (
            <Link
              href="/visualizadores"
              className="hidden md:block font-mono text-xs uppercase tracking-[0.14em] text-muted hover:text-teal"
            >
              Painel de visualizadores →
            </Link>
          )}
        </form>

        {/* Canhoto / protocolo ao vivo */}
        <aside className="hidden md:block relative">
          <div className="sticky top-10 bg-ink text-canvas p-6 border border-ink">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold mb-6">
              Canhoto — via do requerente
            </p>
            <dl className="space-y-4 text-sm font-mono">
              <div>
                <dt className="text-canvas/50 text-[10px] uppercase">Protocolo</dt>
                <dd className="text-lg text-gold">{protocoloPreview}</dd>
              </div>
              <div>
                <dt className="text-canvas/50 text-[10px] uppercase">Nome</dt>
                <dd className="truncate">{form.nomeCompleto || "—"}</dd>
              </div>
              <div>
                <dt className="text-canvas/50 text-[10px] uppercase">CPF</dt>
                <dd>{form.cpf || "—"}</dd>
              </div>
              <div>
                <dt className="text-canvas/50 text-[10px] uppercase">Telefone</dt>
                <dd>{form.telefone || "—"}</dd>
              </div>
              <div>
                <dt className="text-canvas/50 text-[10px] uppercase">Endereço</dt>
                <dd className="leading-relaxed">
                  {form.logradouro || "—"}
                  {form.numero && `, ${form.numero}`}
                  {form.bairro && ` — ${form.bairro}`}
                  <br />
                  {form.cidade}
                  {form.uf && `/${form.uf}`}
                </dd>
              </div>
            </dl>
            <div className="perforation h-3 mt-8 opacity-40" />
            <p className="text-[10px] text-canvas/40 mt-3">
              Preenchido automaticamente conforme você digita.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
