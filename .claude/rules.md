# QueroExtra — Regras absolutas

## Design
- Fonte única permitida: `DM Sans` — proibido Inter, Roboto, Arial ou qualquer outra
- Nunca hardcodar hex — sempre usar variáveis `--qe-*` de `tokens.css`
- Nunca usar gradientes
- Nunca usar sombras pesadas
- Nunca `font-size` abaixo de `16px` em inputs (evita zoom iOS)
- Nunca área de toque menor que `44px`
- Nunca fundo colorido no item ativo do bottom nav — apenas ícone+label coloridos
- CSS base para `375px`; desktop via media queries (mobile-first obrigatório)

## Código
- Sempre importar componentes UI do barrel: `import { X } from '@/components/ui'`
- Verificar se o componente já existe em `src/components/ui/` antes de criar um novo
- `forwardRef` obrigatório em todo componente de input; incluir `.displayName`
- Usar `cva` para variantes de componentes — nunca lógica de classe inline
- Animações: usar `springTap`, `fadeSlideUp`, `cardHover` — não inventar valores
- **Loading state**: nunca usar `animate-spin` ou `animate-pulse` para listas ou conteúdo de página — usar `SkeletonCard` (listas de cards) ou `shimmer` (blocos inline). Spinner só em ações pontuais (botão, submit)
- Ordem de imports: React → libs externas → UI barrel → hooks → lib/utils → tipos
- Componentes: `PascalCase` · Hooks: `useCamelCase` · Utils: `camelCase` · Constantes: `UPPER_SNAKE_CASE`
- Props interface nomeada como `NomeProps` (ex: `ButtonProps`, `JobCardProps`)
- Formulários: React Hook Form + Zod — nunca validação manual de estado

## Componentes de Design System — obrigatoriedade

### Inputs e Selects
- **Nunca** usar `<input>`, `<select>` ou `<textarea>` nativos — sempre `<Input />` ou `<Select />` do barrel
- `<Input icon={...} />` para campos com ícone à esquerda — nunca posicionar ícone manualmente com `absolute`
- `<Select options={[{ label, value }]} placeholder="..." />` para dropdowns — nunca estilizar `<select>` nativo diretamente
- Formulários completos: React Hook Form + Zod; campos avulsos (busca, filtro): estado local com `<Input />` / `<Select />`

### Tabs / abas
- **Nunca** implementar abas com `<button>` e `border-b-2` manualmente — sempre `<Tabs tabs={...} activeTab={...} onChange={...} />`
- `TabItem[]` importado via `import type { TabItem } from '@/components/ui'`

### Navegação lateral
- **Nunca** criar `<nav>` ou `<header>` desktop customizados para layouts com sidebar — sempre `<Sidebar items={SidebarItem[]} />`
- `SidebarItem[]` importado via `import type { SidebarItem } from '@/components/ui'`

## Supabase
- Sempre habilitar RLS antes de expor qualquer tabela — nunca expor dados de outros perfis
- Verificar limite de vagas ativas antes de criar: `count >= 3` → bloquear com modal

## Negócio
- Valor mínimo de vaga: R$ 50,00 — validar com Zod no schema
- Limite: 3 vagas ativas simultâneas por empresa
- Empresa com `status != 'aprovado'` não acessa nenhuma rota `/empresa/*`
- Não permitir recandidatura após rejeição — constraint `UNIQUE(job_id, freelancer_id)` no banco
- Check-in: código 6 dígitos apenas — QR Code está fora do MVP
- Stripe Connect: **não implementar** até instrução explícita — nada de pagamentos no MVP
- Nenhuma feature fora do escopo da seção 12 do CONTEXT.md sem aprovação explícita

## Responsividade Desktop

- Breakpoint único de corte mobile → desktop: **`lg` (1024px)** — nunca usar `md:` para lógica de navegação ou layout estrutural
- Nunca mostrar `BottomNav` em desktop — sempre envolver com `lg:hidden`
- Nunca mostrar `Sidebar` em mobile — o componente já tem `hidden lg:flex` internamente, não adicionar por fora
- Padding inferior que compensa BottomNav: sempre `pb-24 lg:pb-8`, nunca `pb-24` fixo
- `TopBar` em páginas com header desktop próprio: envolver com `lg:hidden` e criar `<header className="hidden lg:flex ...">` ao lado

### Navegação
- `/extras/*` → `BottomNav` (mobile) + `Sidebar` (desktop) — gerenciados pelo `ExtrasHome.tsx`, não nas páginas filhas
- `/admin/*` → `Sidebar` (desktop) — gerenciado pelo `AdminLayout.tsx`, não nas páginas filhas

### Modal / BottomSheet / ResponsiveSheet — qual usar
- `BottomSheet` → primitivo **mobile only** (slide-up, drag) — usar apenas em features exclusivamente mobile
- `Modal` → primitivo **desktop only** (centered, fade+scale, Escape fecha) — usar apenas em features exclusivamente desktop
- `ResponsiveSheet` → **usar este** quando o mesmo gatilho existe em mobile e desktop — renderiza o primitivo correto via `matchMedia` internamente
- Nunca colocar lógica `if (isDesktop)` dentro de um primitivo UI — encapsular no wrapper (`ResponsiveSheet`) ou no chamador

## Git
- Branch: `dev/QUER-XX-descricao` (ex: `diogo/QUER-10-design-tokens`)
- Commits: `tipo(QUER-XX): descrição em minúsculas` (ex: `feat(QUER-11): cria context.md`)
- Nunca push direto em `main` ou `develop` — sempre via PR aprovado
