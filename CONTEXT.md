# QueroExtra — CLAUDE.md
> Contexto persistente para Claude Code. Leia este arquivo inteiro antes de qualquer tarefa.
> Última atualização: Maio 2026 · Bermax

---

## 1. O que é o QueroExtra

Marketplace web (mobile-first) para contratação de freelancers no segmento de **food service**.
Conecta **empresas** (restaurantes, buffets, eventos) a **freelancers** (garçons, bartenders, auxiliares de cozinha, hostess, seguranças) para turnos pontuais pagos por diária.

**Referência de UX:** iFood e Uber — navegação fluida, mobile-first, cards, chips, bottom navigation por perfil, feedback em tempo real.

---

## 2. Stack técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Estilização | Tailwind CSS + variáveis CSS `--qe-*` |
| Animações | Framer Motion |
| Variantes | cva (Class Variance Authority) |
| Formulários | React Hook Form + Zod |
| Backend/BaaS | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Deploy | Vercel |
| E-mail | Resend |
| Pagamentos | Stripe Connect — **FORA DO ESCOPO DO MVP** |
| Fonte | DM Sans (Google Fonts) |
| Ícones | Lucide React |

---

## 3. Estrutura de pastas

```
queroextra/
├── docs/
│   ├── CLAUDE.md              ← este arquivo
│   ├── design-system.html     ← fonte visual de verdade
│   └── COMPONENTS.md          ← documentação dos componentes UI
├── src/
│   ├── components/
│   │   ├── ui/                ← biblioteca de componentes base
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── InputOTP/
│   │   │   ├── Chip/
│   │   │   ├── Badge/
│   │   │   ├── Avatar/
│   │   │   ├── BottomNav/
│   │   │   ├── TopBar/
│   │   │   ├── JobCard/
│   │   │   ├── StatCard/
│   │   │   ├── Tabs/
│   │   │   ├── Toast/
│   │   │   ├── BottomSheet/
│   │   │   ├── EmptyState/
│   │   │   ├── SkeletonCard/
│   │   │   └── index.ts       ← barrel export — sempre importar daqui
│   │   └── layout/
│   │       ├── FreelancerLayout.tsx
│   │       ├── EmpresaLayout.tsx
│   │       └── AdminLayout.tsx
│   ├── pages/
│   │   ├── auth/
│   │   ├── app/               ← rotas freelancer /app/*
│   │   ├── empresa/           ← rotas empresa /empresa/*
│   │   ├── admin/             ← rotas admin /admin/*
│   │   └── dev/               ← ComponentPreview.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useToast.ts
│   │   └── useBottomSheet.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   └── styles/
│       ├── tokens.css
│       └── global.css
├── supabase/
│   └── migrations/
├── .env.example
├── tailwind.config.ts
└── vite.config.ts
```

---

## 4. Variáveis de ambiente

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
RESEND_API_KEY=
# Stripe — NÃO implementar no MVP
# VITE_STRIPE_PUBLIC_KEY=
# STRIPE_SECRET_KEY=
```

---

## 5. Design System — Regras obrigatórias

### Fonte
```css
font-family: 'DM Sans', sans-serif; /* ÚNICA fonte permitida */
```
PROIBIDO: Inter, Roboto, Arial ou qualquer outra fonte.

### Tokens de cor — nunca hardcodar hex, sempre usar variáveis

```css
--qe-yellow: #F5C000;
--qe-yellow-hover: #E0AF00;
--qe-yellow-pressed: #C99D00;
--qe-yellow-subtle: #FFF8E1;
--qe-yellow-text: #7A5F00;
--qe-black: #111111;
--qe-gray-900: #1A1A1A;   /* texto principal */
--qe-gray-700: #444444;
--qe-gray-500: #6B6B6B;   /* texto secundário */
--qe-gray-400: #999999;
--qe-gray-200: #E5E5E5;   /* bordas */
--qe-gray-100: #F4F4F4;
--qe-gray-50: #FAFAFA;
--qe-white: #FFFFFF;
--qe-bg-page: #F7F7F7;
--qe-success: #1A9E5C;
--qe-success-bg: #E6F7EE;
--qe-error: #D93025;
--qe-error-bg: #FDECEA;
--qe-warning: #E07B00;
--qe-warning-bg: #FFF3E0;
--qe-navy: #1A2332;        /* exclusivo CMS Admin */
```

### Proibições absolutas
- NUNCA usar gradientes
- NUNCA hardcodar cores — sempre tokens --qe-*
- NUNCA font-size abaixo de 16px em inputs (zoom iOS)
- NUNCA área de toque menor que 44px
- NUNCA fundo colorido no item ativo do bottom nav
- NUNCA sombras pesadas

### Mobile-first obrigatório
CSS base para 375px, adaptar para desktop com media queries.

---

## 6. Componentes UI

Sempre importar do barrel:
```tsx
import { Button, Input, JobCard, Badge } from '@/components/ui'
```

| Componente | Variantes | Uso |
|-----------|-----------|-----|
| Button | primary, secondary, ghost, danger · sm/md/lg | CTAs |
| Input | default, error, success | Formulários |
| InputOTP | 6 dígitos, avanço automático | Check-in/out |
| Chip | skill (amarelo=selecionado), filter (preto=ativo) | Filtros |
| Badge | urgent, pending, confirmed, warning, info, category | Status |
| Avatar | xs/sm/md/lg/xl · verified | Foto de perfil |
| BottomNav | freelancer, empresa | Nav mobile |
| TopBar | main, inner | Header |
| JobCard | padrão, urgente (borda vermelha) | Card de vaga |
| StatCard | — | KPIs |
| Tabs | — | Abas underline amarelo |
| Toast | success, error, info | Feedbacks |
| BottomSheet | — | Modal mobile |
| EmptyState | — | Estado vazio |
| SkeletonCard | — | Loading |

---

## 7. Rotas

```
/                    → Landing Page (pública)
/login               → Login
/cadastro/freelancer → Cadastro freelancer
/cadastro/empresa    → Cadastro empresa (2 etapas)

/app                 → Dashboard freelancer
/app/explorar        → Buscar vagas
/app/extras          → Meus extras
/app/carteira        → Carteira
/app/perfil          → Perfil
/app/checkin         → Check-in/out

/empresa             → Dashboard empresa (status=aprovado)
/empresa/gestao      → Gestão de vagas
/empresa/nova-vaga   → Criar vaga
/empresa/candidatos  → Analisar candidatos
/empresa/checkin     → Check-In Hub
/empresa/perfil      → Perfil público

/admin               → CMS Admin
/admin/usuarios      → Gestão de usuários
/admin/vagas         → Gestão de vagas
/admin/financas      → Finanças e disputas

/dev                 → ComponentPreview (apenas dev)
```

Empresas com status != 'aprovado' não acessam /empresa/*.

---

## 8. Supabase — Schema

### Cliente
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)
```

### Tabelas principais
```
profiles       → id, tipo, nome, email, celular, avatar_url, status
companies      → id, profile_id, cnpj_cpf, area, documento_url[], status
freelancers    → id, profile_id, cpf, habilidades[], stripe_account_id
jobs           → id, company_id, titulo, local, valor(>=50), data_inicio, data_fim, categoria, tags[], urgente, status
applications   → id, job_id, freelancer_id, status · UNIQUE(job_id, freelancer_id)
checkins       → id, job_id, application_id, codigo, tipo(checkin|checkout), confirmado_em
reviews        → id, job_id, avaliador_id, avaliado_id, nota(1-5), comentario, expires_at
wallets        → id, freelancer_id, saldo
transactions   → id, job_id, valor_bruto, taxa_plataforma, valor_liquido, status(retido|liberado|estornado), stripe_payment_intent
```

### Padrão de query com join
```typescript
const { data: jobs } = await supabase
  .from('jobs')
  .select('*, companies(id, profiles(nome, avatar_url))')
  .eq('status', 'aberta')
  .order('created_at', { ascending: false })
```

### Verificar limite de vagas antes de criar
```typescript
const { count } = await supabase
  .from('jobs')
  .select('*', { count: 'exact', head: true })
  .eq('company_id', companyId)
  .eq('status', 'aberta')

if (count >= 3) {
  // Exibir modal: "Limite de 3 vagas ativas atingido"
  return
}
```

---

## 9. Regras de negócio críticas

### Empresa
- Cadastro em 2 etapas → status inicial: 'pendente'
- NÃO pode publicar vagas enquanto status != 'aprovado'
- Admin aprova/rejeita manualmente no CMS
- E-mail automático via Resend ao aprovar ou rejeitar

### Vagas
- Valor mínimo: R$ 50,00 (validar com Zod)
- Limite: 3 vagas ativas simultâneas por empresa
- Visíveis imediatamente após publicação

### Candidatura
- Não permitir recandidatura após rejeição
- Constraint UNIQUE(job_id, freelancer_id) no banco
- Empresa notificada por e-mail + in-app

### Aprovação de candidato (MVP sem Stripe)
1. Empresa aprova → applications.status = 'aprovado'
2. Exibir modal "Pagamento será integrado em breve. Confirmar?"
3. Após confirmação → liberar profiles.celular do freelancer

### Check-in
1. Empresa gera código 6 dígitos → salvo em checkins (tipo: 'checkin')
2. Empresa informa presencialmente ao freelancer
3. Freelancer insere no app → checkins.confirmado_em = now()

### Check-out
1. Empresa gera novo código (tipo: 'checkout')
2. Freelancer insere → checkout confirmado
3. transactions.status = 'liberado' → saldo na carteira
4. Modal de avaliação para ambos imediatamente
5. Janela de avaliação: 7 dias (reviews.expires_at = now() + 7 days)

### Avaliações
- Mútuas: empresa avalia freelancer E freelancer avalia empresa
- Nota 1–5 + comentário opcional
- Pendência visível no dashboard por 7 dias
- Após 7 dias: expira sem nota

### Disputas (manual no MVP)
- Freelancer não compareceu → empresa abre disputa no app
- Empresa não gerou código → freelancer aciona suporte
- Admin decide: estorno ou liberação no CMS

---

## 10. Convenções de código

```
Componentes:      PascalCase       → JobCard, BottomNav
Props interfaces: NomeProps        → JobCardProps
Hooks:            useCamelCase     → useAuth, useToast
Utilitários:      camelCase        → formatCurrency
Constantes:       UPPER_SNAKE_CASE → MAX_VAGAS_ATIVAS = 3
```

### Ordem de imports
```typescript
// 1. React
import { useState, useEffect } from 'react'
// 2. Bibliotecas externas
import { motion } from 'framer-motion'
// 3. Componentes UI (sempre do barrel)
import { Button, Input } from '@/components/ui'
// 4. Hooks
import { useAuth } from '@/hooks/useAuth'
// 5. Lib e utils
import { supabase } from '@/lib/supabase'
// 6. Tipos
import type { Job } from '@/types'
```

### forwardRef obrigatório em inputs
```typescript
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} />
      {error && <span>{error}</span>}
    </div>
  )
)
Input.displayName = 'Input'
```

### Framer Motion — padrões do QueroExtra
```typescript
export const springTap = { type: 'spring', stiffness: 400, damping: 25 }
export const fadeSlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: { duration: 0.2, ease: 'easeOut' }
}
export const cardHover = {
  whileHover: { y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
  transition: { duration: 0.15 }
}
```

---

## 11. GitFlow

```
main     → produção, protegida, só PR aprovado
develop  → integração, push direto bloqueado

Branches: dev/QUER-XX-descricao
Exemplos: diogo/QUER-10-design-tokens
          yslan/QUER-16-tela-login

Commits:  feat(QUER-10): design system tokens
          fix(QUER-16): corrige redirect pós-login
          chore: atualiza dependências
```

---

## 12. Fora do escopo do MVP

NÃO implementar até instrução explícita:
- Stripe Connect (pagamentos, saque, onboarding)
- QR Code para check-in (apenas código 6 dígitos)
- Planos pagos para empresas
- Mensagens in-app entre empresa e freelancer
- Destaque pago de vagas
- Automação de disputas
- App nativo iOS/Android
- i18n (apenas PT-BR)
- Notificações push

---

## 13. E-mails transacionais (Resend)

| Evento | Destinatário |
|--------|-------------|
| Cadastro empresa | Empresa — confirmação de documentos enviados |
| Aprovação | Empresa — conta aprovada |
| Rejeição | Empresa — conta rejeitada + motivo |
| Nova candidatura | Empresa — freelancer X se candidatou |
| Candidatura aprovada | Freelancer — selecionado para vaga Y |
| Candidatura rejeitada | Freelancer — não selecionado para vaga Y |

---

## 14. Acessibilidade — obrigatório

- aria-label em botões ícone-only
- role="checkbox" + aria-pressed em chips
- aria-disabled em estados desabilitados
- aria-live="polite" em toasts e validações
- aria-hidden="true" em ícones decorativos
- font-size mínimo 16px em inputs
- área de toque mínima 44px

---

## 15. Referências

```
Design System:  docs/design-system.html
Componentes:    docs/COMPONENTS.md
Preview:        /dev
Jira:           https://diiogoh04.atlassian.net/jira/software/projects/QUER/boards/234
GitHub:         https://github.com/BermaxCulture/quero-extra
Vercel:         https://queroextra-app.vercel.app
```

---

> Antes de criar qualquer componente: verificar se já existe em src/components/ui/.
> Antes de qualquer query Supabase: verificar se RLS está habilitado.
> Antes de qualquer regra de negócio: consultar seção 9 deste arquivo.
> Em caso de dúvida visual: abrir docs/design-system.html.