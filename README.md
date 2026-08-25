# Formulário de Cadastro

Projeto em Next.js (App Router) com duas páginas:

- **`/`** — Formulário para o requerente preencher **nome completo, CPF,
  telefone e endereço** (com busca automática por CEP via ViaCEP). Ao lado do
  formulário fica um "canhoto" que mostra o número de protocolo e um resumo
  dos dados em tempo real.
- **`/visualizadores`** — Painel protegido por **nome + senha**. Nele você
  cadastra **quem pode ver os resultados** (nome, e-mail, senha e nível de
  acesso) e consulta o **livro de registro** com todos os cadastros já
  enviados pelo formulário.

### Primeiro acesso ao painel

Quando ainda não existe nenhum visualizador cadastrado, a tela de login
mostra automaticamente um formulário para criar o **primeiro administrador**
(nome, e-mail e senha). Depois disso, novos visualizadores só podem ser
adicionados por um administrador já logado, na própria tela do painel.
Perfis do tipo **Consulta** conseguem entrar e ver o livro de registro, mas
não cadastram nem removem visualizadores — só **Administrador** faz isso.

> ⚠️ A senha é guardada com hash (SHA-256 + um "pepper" fixo) e a sessão fica
> salva no `localStorage` do navegador — suficiente para uso interno/demo,
> mas não é uma solução de autenticação de produção. Para um ambiente real,
> troque por algo como NextAuth.js e cookies `httpOnly`.

Os dados são gravados em arquivos JSON dentro da pasta `data/` (via rotas de
API em `app/api`), então tudo funciona localmente sem precisar de banco de
dados — mas pode ser trocado por um banco real depois, bastando editar
`lib/storage.ts`.

## Como rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` para o formulário e
`http://localhost:3000/visualizadores` para o painel.

## Estrutura

```
app/
  page.tsx                     → formulário de cadastro
  visualizadores/page.tsx      → login + cadastro de visualizadores + resultados
  api/submissoes/route.ts      → GET/POST dos cadastros enviados
  api/visualizadores/route.ts  → GET/POST/DELETE de quem pode visualizar
  api/auth/route.ts            → POST de login (nome + senha)
lib/
  storage.ts                   → persistência em JSON (data/*.json) + hash de senha
  validators.ts                → validação e máscara de CPF/telefone/CEP
```
