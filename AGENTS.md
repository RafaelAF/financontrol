<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# AGENTS.md — Diretrizes para Agentes de IA & Desenvolvedores

Este documento contém as especificações, arquitetura, convenções e regras do projeto de **Sistema de Controle de Gastos e Rendimentos (SaaS/Web App)**.

---

## 1. Visão Geral do Projeto

Aplicação web responsiva (Mobile-First) para gestão financeira pessoal (gastos, receitas, saldo, gráficos e exportação de dados).

* **Stack Principal:**
  * **Framework:** Next.js (App Router, Server Components e Server Actions)
  * **Linguagem:** TypeScript
  * **Estilização:** Tailwind CSS + Lucide Icons (ou Radix / Shadcn UI)
  * **Autenticação:** Auth.js (NextAuth v5) ou Clerk (suporte exclusivo a Login Social: Google, GitHub, etc.)
  * **Banco de Dados:** PostgreSQL via Prisma ORM ou Supabase (Neon / Supabase)
  * **Estado / Fetching:** TanStack Query (React Query) para gerenciamento de estado no client quando necessário.

> **Nota:** O salvamento automático em Google Sheets via API foi temporariamente descartado nesta fase. O armazenamento será centralizado no banco de dados do projeto vinculado ao perfil do usuário autenticado.

---

## 2. Princípios de Design e UX

* **Mobile-First por Padrão:** Toda a interface deve ser desenvolvida primeiramente para telas pequenas (smartphones), expandindo progressivamente para tablets e desktops via breakpoints responsivos (`md:`, `lg:`).
* **Posicionamento Fluido:** NUNCA utilizar declarações rígidas de posicionamento que causem quebra de layout em telas mobile (ex: `position: static` forçado, larguras fixas em `px` em containers principais, ou `overflow-x` desnecessário).
* **Feedback Visual Instantâneo:** Utilizar componentes de carregamento (skeletons), estados nulos (empty states) e toasts informativos para criação/edição/remoção de transações.

---

## 3. Requisitos Funcionais

1. **Autenticação:**
   * Suporte **apenas a Login Social** (Google OAuth como provedor primário, expansível para GitHub).
   * Sem fluxo de registro por e-mail/senha.
   * Sessão persistente com rotas protegidas via Middleware do Next.js.

2. **Gestão de Transações:**
   * Adicionar, editar e excluir transações (Receitas e Despesas).
   * Campos obrigatórios: Descrição, Valor, Tipo (`income` / `expense`), Categoria, Data.
   * Campo opcional: Observações / Tags.

3. **Dashboard e Métricas:**
   * Resumo de Saldo Total, Total de Entradas e Total de Saídas.
   * Filtro por período (Mês/Ano atual, personalizável).
   * Gráfico visual de gastos por categoria e histórico temporal.

4. **Exportação & Utilitários:**
   * Exportação de dados das transações nos formatos CSV e JSON.
   * Filtros dinâmicos por categoria, tipo e busca por texto.

---

## 4. Estrutura Recomendada de Pastas (Next.js App Router)

```text
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/            # Tela de login social
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        # Shell responsivo (Header/Navigation)
│   │   │   ├── page.tsx          # Visão geral / Dashboard
│   │   │   └── transactions/     # Listagem completa e filtros
│   │   ├── api/                  # Endpoints de API (caso necessário)
│   │   ├── layout.tsx
│   │   └── page.tsx              # Landing page ou redirect
│   ├── components/
│   │   ├── ui/                   # Botões, Modais, Cards, Inputs
│   │   ├── dashboard/            # Gráficos, Cards de Saldo, Resumos
│   │   ├── transactions/         # Formulário de lançamento, Tabelas/Cards
│   │   └── layout/               # Header, Footer, Sidebar mobile
│   ├── lib/
│   │   ├── auth.ts               # Configuração do NextAuth/Clerk
│   │   ├── db.ts                 # Instância do Prisma / Supabase
│   │   └── utils.ts              # Formatação de moeda, datas, etc.
│   ├── server/
│   │   └── actions/              # Server Actions (CRUD de transações)
│   └── types/                    # Interfaces TypeScript
├── prisma/
│   └── schema.prisma             # Modelos de Dados (User, Account, Transaction, Category)
└── public/
