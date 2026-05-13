# QueroExtra — Componentes UI

> Gerado em 2026-05-13. Fonte de verdade: `queroextra_design_system_v1.html`

---

## Button
**Caminho:** `src/components/ui/Button/Button.tsx`
**Import:** `import { Button } from '@/components/ui'`

Botão de ação principal do design system, com suporte a variantes visuais, tamanhos, estados de loading e ícones decorativos. Deve ser usado em toda ação primária ou secundária da interface.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Estilo visual do botão |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho do botão; `lg` ocupa largura total |
| `loading` | `boolean` | `false` | Exibe spinner e desabilita interação |
| `disabled` | `boolean` | `false` | Desabilita o botão visualmente e funcionalmente |
| `leadingIcon` | `React.ReactNode` | `—` | Ícone renderizado antes do texto (oculto durante loading) |
| `trailingIcon` | `React.ReactNode` | `—` | Ícone renderizado após o texto (oculto durante loading) |
| `children` | `React.ReactNode` | `—` | Conteúdo/rótulo do botão |
| `className` | `string` | `—` | Classes Tailwind adicionais |
| `...props` | `React.ButtonHTMLAttributes<HTMLButtonElement>` | `—` | Todos os atributos nativos de `<button>` |

### Uso
```tsx
<Button variant="primary" size="lg" onClick={handleApply}>
  Candidatar-se
</Button>

<Button variant="secondary" size="sm" leadingIcon={<Search size={16} />}>
  Buscar
</Button>

<Button variant="danger" loading={isDeleting}>
  Excluir conta
</Button>
```

### Regras de uso
- Use `primary` para a ação principal de uma tela — apenas um botão primário por viewport.
- Use `secondary` para ações alternativas ou de menor prioridade.
- Use `ghost` em toolbars e áreas onde o fundo do botão não deve chamar atenção.
- Use `danger` exclusivamente para ações destrutivas e irreversíveis.
- `size="lg"` é a escolha padrão para CTAs em tela cheia (ex.: rodapé de formulário).
- Sempre forneça `loading={true}` durante operações assíncronas para impedir duplo envio.

---

## Input
**Caminho:** `src/components/ui/Input/Input.tsx`
**Import:** `import { Input } from '@/components/ui'`

Campo de texto controlado com suporte a rótulo, ícone interno, texto auxiliar e estados de validação. Use para coleta de qualquer dado textual simples em formulários.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `label` | `string` | `—` | Rótulo exibido acima do campo |
| `helperText` | `string` | `—` | Texto auxiliar exibido abaixo do campo |
| `errorMessage` | `string` | `—` | Mensagem de erro; substitui `helperText` quando presente |
| `icon` | `React.ReactNode` | `—` | Ícone renderizado dentro do campo (lado esquerdo) |
| `variant` | `'default' \| 'select'` | `'default'` | `'select'` aplica estilo de campo de seleção (chevron à direita) |
| `inputState` | `'default' \| 'error' \| 'success'` | `'default'` | Estado visual de validação do campo |
| `...props` | `React.InputHTMLAttributes<HTMLInputElement>` | `—` | Todos os atributos nativos de `<input>` |

### Uso
```tsx
<Input
  label="E-mail"
  type="email"
  placeholder="seu@email.com"
  helperText="Usado para login e notificações"
/>

<Input
  label="CEP"
  inputState="error"
  errorMessage="CEP inválido"
  icon={<MapPin size={16} />}
/>

<Input
  label="Categoria"
  variant="select"
  readOnly
  value="Construção Civil"
  onClick={openCategorySheet}
/>
```

### Regras de uso
- Sempre forneça `label` para acessibilidade — campos sem rótulo visual devem ter `aria-label`.
- Use `inputState="error"` com `errorMessage` para validação inline; evite modais de erro para erros de campo.
- Use `inputState="success"` para confirmar dados verificados (ex.: CPF válido).
- `variant="select"` é para campos que abrem um BottomSheet ou picker — não para `<select>` nativo.

---

## InputOTP
**Caminho:** `src/components/ui/InputOTP/InputOTP.tsx`
**Import:** `import { InputOTP } from '@/components/ui'`

Campo de código OTP dividido em células individuais com navegação automática entre dígitos. Use exclusivamente em fluxos de verificação por código numérico (SMS, e-mail).

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `length` | `number` | `—` | Quantidade de dígitos do código OTP |
| `onComplete` | `(code: string) => void` | `—` | Callback disparado quando todos os dígitos são preenchidos |
| `onChange` | `(code: string) => void` | `—` | Callback disparado a cada alteração parcial do código |
| `disabled` | `boolean` | `—` | Desabilita todos os campos de entrada |
| `autoFocus` | `boolean` | `—` | Foca automaticamente o primeiro campo ao montar |

### Uso
```tsx
<InputOTP
  length={6}
  autoFocus
  onComplete={(code) => verifyCode(code)}
  onChange={(partial) => console.log(partial)}
/>
```

### Regras de uso
- Use `length={6}` para OTPs de SMS/e-mail padrão; `length={4}` para PINs.
- Forneça `onComplete` para disparar a verificação automaticamente ao digitar o último dígito.
- Ative `autoFocus` sempre que o InputOTP for o único elemento focável na tela.
- Desabilite com `disabled={true}` enquanto a requisição de verificação estiver em andamento.

---

## Chip
**Caminho:** `src/components/ui/Chip/Chip.tsx`
**Import:** `import { Chip } from '@/components/ui'`

Elemento de seleção compacto para filtros e competências, com estado selecionado e suporte a ícone. Use para escolhas múltiplas em listas horizontais de filtros ou tags de habilidade.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `label` | `string` | `—` | Texto exibido no chip |
| `selected` | `boolean` | `—` | Indica se o chip está no estado selecionado |
| `onClick` | `() => void` | `—` | Callback de clique/toggle |
| `icon` | `React.ReactNode` | `—` | Ícone exibido à esquerda do rótulo |
| `variant` | `'skill' \| 'filter'` | `—` | `'skill'` para competências do perfil; `'filter'` para filtros de busca |
| `disabled` | `boolean` | `—` | Desabilita interação e aplica opacidade reduzida |

### Uso
```tsx
<Chip
  variant="filter"
  label="Presencial"
  selected={modalidade === 'presencial'}
  onClick={() => setModalidade('presencial')}
/>

<Chip
  variant="skill"
  label="Garçom"
  selected={skills.includes('garcom')}
  onClick={() => toggleSkill('garcom')}
/>
```

### Regras de uso
- Use `variant="filter"` em barras de filtro horizontal (ex.: tipo de vaga, distância).
- Use `variant="skill"` na tela de perfil para competências selecionáveis.
- Chips devem sempre ter `onClick`; chips sem ação devem ser substituídos por Badge.
- Não use `disabled` para chips ainda não implementados — omita-os da lista.

---

## Badge
**Caminho:** `src/components/ui/Badge/Badge.tsx`
**Import:** `import { Badge } from '@/components/ui'`

Etiqueta de status ou categoria não interativa, com variante visual semântica. Use para comunicar estado de vagas, candidaturas ou classificações de forma rápida e visual.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `variant` | `'urgent' \| 'pending' \| 'confirmed' \| 'warning' \| 'info' \| 'category'` | `—` | Define a cor e o significado semântico do badge |
| `children` | `React.ReactNode` | `—` | Texto ou conteúdo interno do badge |
| `icon` | `React.ReactNode` | `—` | Ícone exibido à esquerda do conteúdo |

### Uso
```tsx
<Badge variant="urgent" icon={<Zap size={12} />}>Urgente</Badge>

<Badge variant="confirmed">Confirmado</Badge>

<Badge variant="category">Construção Civil</Badge>

<Badge variant="pending">Aguardando</Badge>
```

### Regras de uso
- Use `urgent` para vagas ou situações que exigem atenção imediata.
- Use `pending` para candidaturas aguardando resposta do empregador.
- Use `confirmed` para vagas ou candidaturas aprovadas/confirmadas.
- Use `warning` para alertas que precisam de ação, mas não são críticos.
- Use `info` para informações neutras ou contextuais.
- Use `category` para exibir a categoria ou segmento de uma vaga.
- Badge é sempre não interativo — para ações use Chip ou Button.

---

## Avatar
**Caminho:** `src/components/ui/Avatar/Avatar.tsx`
**Import:** `import { Avatar } from '@/components/ui'`

Exibe a foto de perfil de um usuário ou suas iniciais como fallback, com suporte a indicador de verificação. Use em cards de perfil, listas de candidatos e headers de usuário.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `src` | `string` | `—` | URL da imagem de perfil |
| `alt` | `string` | `—` | Texto alternativo para acessibilidade |
| `name` | `string` | `—` | Nome do usuário; usado para gerar as iniciais no fallback |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `—` | Tamanho do avatar |
| `verified` | `boolean` | `—` | Exibe o ícone de conta verificada sobre o avatar |

### Uso
```tsx
<Avatar
  src={user.photoUrl}
  alt={user.name}
  name={user.name}
  size="md"
  verified={user.isVerified}
/>

{/* Sem foto — exibe iniciais */}
<Avatar name="João Silva" size="lg" />
```

### Regras de uso
- Sempre forneça `name` para garantir o fallback de iniciais quando a imagem não carrega.
- Use `size="xs"` ou `size="sm"` em listas densas; `size="lg"` ou `size="xl"` em páginas de perfil.
- `verified` deve refletir o estado real de verificação vindo da API — não use como decoração.
- Forneça `alt` descritivo quando o avatar identificar uma pessoa específica.

---

## BottomNav
**Caminho:** `src/components/ui/BottomNav/BottomNav.tsx`
**Import:** `import { BottomNav } from '@/components/ui'`

Barra de navegação inferior fixa com abas contextuais para o perfil do usuário (freelancer ou empresa). É o mecanismo principal de navegação entre seções do app.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `variant` | `'freelancer' \| 'empresa'` | `—` | Define o conjunto de abas exibido conforme o tipo de usuário |
| `activeTab` | `string` | `—` | Valor (`value`) da aba atualmente ativa |
| `onChange` | `(value: string) => void` | `—` | Callback chamado ao trocar de aba |
| `notifications` | `Record<string, boolean>` | `—` | Mapa de `value` → `boolean` indicando abas com notificação pendente |

### Uso
```tsx
<BottomNav
  variant="freelancer"
  activeTab={currentTab}
  onChange={setCurrentTab}
  notifications={{ messages: true }}
/>

<BottomNav
  variant="empresa"
  activeTab={activeSection}
  onChange={navigateTo}
/>
```

### Regras de uso
- Renderize apenas um `BottomNav` por tela — ele deve estar sempre fixo na parte inferior do layout.
- `variant` deve ser derivado do papel do usuário autenticado; nunca deixe o usuário escolher a variante.
- Use `notifications` para indicar mensagens não lidas ou alertas — não para status de processos.
- `activeTab` deve ser controlado pelo estado de roteamento da aplicação.

---

## TopBar
**Caminho:** `src/components/ui/TopBar/TopBar.tsx`
**Import:** `import { TopBar } from '@/components/ui'`

Barra de topo da aplicação com suporte a duas variantes: `main` (tela inicial com busca, notificações e perfil) e `inner` (tela interna com botão de voltar e título). Use no topo de todas as telas.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `variant` | `'main' \| 'inner'` | `—` | `'main'` para telas raiz; `'inner'` para telas de detalhe/fluxo |
| `title` | `string` | `—` | Título exibido na variante `inner` |
| `onBack` | `() => void` | `—` | Callback do botão de voltar (variante `inner`) |
| `actions` | `React.ReactNode` | `—` | Área de ações personalizadas à direita da barra |
| `notificationCount` | `number` | `—` | Número de notificações não lidas exibido no ícone de sino |
| `onSearch` | `() => void` | `—` | Callback do botão de busca (variante `main`) |
| `onNotification` | `() => void` | `—` | Callback do botão de notificações (variante `main`) |
| `onProfile` | `() => void` | `—` | Callback do avatar/botão de perfil (variante `main`) |

### Uso
```tsx
{/* Tela principal */}
<TopBar
  variant="main"
  notificationCount={3}
  onSearch={() => navigate('/busca')}
  onNotification={() => navigate('/notificacoes')}
  onProfile={() => navigate('/perfil')}
/>

{/* Tela interna */}
<TopBar
  variant="inner"
  title="Detalhes da Vaga"
  onBack={() => router.back()}
/>
```

### Regras de uso
- Use `variant="main"` apenas nas telas raiz do BottomNav.
- Use `variant="inner"` em todas as telas de detalhe, formulários e fluxos secundários.
- `onBack` deve chamar a navegação de volta real — não apenas `history.back()` cego.
- Forneça `notificationCount` apenas quando houver dado real; `0` ou `undefined` oculta o badge.

---

## JobCard
**Caminho:** `src/components/ui/JobCard/JobCard.tsx`
**Import:** `import { JobCard } from '@/components/ui'`

Card de vaga de trabalho que consolida categoria, título, localização, horário, remuneração e tags em um layout padronizado, com CTA de candidatura. Use em listagens de vagas disponíveis.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `category` | `string` | `—` | Categoria da vaga (ex.: "Construção Civil") |
| `title` | `string` | `—` | Título/cargo da vaga |
| `location` | `string` | `—` | Localização textual da vaga |
| `distance` | `string` | `—` | Distância do usuário até o local (ex.: "2,3 km") |
| `date` | `string` | `—` | Data de realização do trabalho |
| `time` | `string` | `—` | Horário de início e/ou duração |
| `value` | `number` | `—` | Valor da remuneração |
| `unit` | `string` | `—` | Unidade do valor (ex.: `"/dia"`, `"/hora"`) |
| `isUrgent` | `boolean` | `—` | Exibe o badge "Urgente" no card |
| `tags` | `string[]` | `—` | Lista de tags/competências associadas à vaga |
| `onApply` | `() => void` | `—` | Callback do botão "Candidatar-se" |

### Uso
```tsx
<JobCard
  category="Eventos"
  title="Garçom para Evento Corporativo"
  location="Vila Madalena, São Paulo"
  distance="1,8 km"
  date="Sáb, 18 Mai"
  time="18h – 23h"
  value={180}
  unit="/evento"
  isUrgent
  tags={["Garçom", "Uniforme próprio"]}
  onApply={() => openApplicationSheet(job.id)}
/>
```

### Regras de uso
- Sempre forneça `onApply` nas listagens públicas; omita apenas em histórico ou vagas encerradas.
- `isUrgent` deve ser derivado de dado real da vaga — não use como destaque editorial.
- `distance` deve ser omitido quando a localização do usuário não estiver disponível.
- Use o SkeletonCard enquanto os dados de vagas estão sendo carregados.

---

## StatCard
**Caminho:** `src/components/ui/StatCard/StatCard.tsx`
**Import:** `import { StatCard } from '@/components/ui'`

Card compacto para exibição de uma métrica com rótulo, valor principal, subtexto opcional e ícone. Use em dashboards e telas de resumo de desempenho do usuário ou da empresa.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `label` | `string` | `—` | Rótulo descritivo da métrica |
| `value` | `string \| number` | `—` | Valor principal em destaque |
| `subtext` | `string` | `—` | Informação complementar abaixo do valor (ex.: variação, período) |
| `icon` | `React.ReactNode` | `—` | Ícone ilustrativo da métrica |

### Uso
```tsx
<StatCard
  label="Vagas Concluídas"
  value={42}
  subtext="+5 este mês"
  icon={<CheckCircle size={20} />}
/>

<StatCard
  label="Ganhos Totais"
  value="R$ 3.240"
  subtext="Últimos 30 dias"
/>
```

### Regras de uso
- Use em grade de 2 colunas para dashboards; use em coluna única para destaque isolado.
- `subtext` deve trazer contexto temporal ou comparativo — não repita o `label`.
- `icon` deve ser monocromático e consistente com o design system (Lucide React recomendado).

---

## Tabs
**Caminho:** `src/components/ui/Tabs/Tabs.tsx`
**Import:** `import { Tabs } from '@/components/ui'`

Barra de abas horizontal para alternância de conteúdo dentro de uma mesma tela. Use para segmentar visões de uma mesma seção (ex.: "Disponíveis" vs. "Candidatadas").

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `tabs` | `TabItem[]` | `—` | Array de abas; cada item tem `label: string` e `value: string` |
| `activeTab` | `string` | `—` | `value` da aba atualmente selecionada |
| `onChange` | `(value: string) => void` | `—` | Callback chamado ao selecionar uma aba |

### Uso
```tsx
const tabs = [
  { label: 'Disponíveis', value: 'available' },
  { label: 'Candidatadas', value: 'applied' },
  { label: 'Concluídas', value: 'done' },
]

<Tabs
  tabs={tabs}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

### Regras de uso
- Limite a 4 abas por componente; mais que isso prejudica a legibilidade em telas pequenas.
- `value` de cada `TabItem` deve ser estável e único dentro do array.
- `activeTab` deve ser controlado pelo estado da tela pai — não use estado interno.
- Não use Tabs para navegação entre telas; para isso use o BottomNav.

---

## Toast
**Caminho:** `src/components/ui/Toast/Toast.tsx`
**Import:** `import { Toast, ToastProvider, useToast } from '@/components/ui'`

Sistema de notificações temporárias (toasts) com auto-dismiss em 3 segundos, suporte a três variantes semânticas e botão de fechar manual. Composto pelo componente visual `Toast`, pelo provedor de contexto `ToastProvider` e pelo hook `useToast`.

### Props — `<Toast />`
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `variant` | `'success' \| 'error' \| 'info'` | `—` | Define a cor e o ícone do toast |
| `message` | `string` | `—` | Mensagem exibida no toast |
| `onClose` | `() => void` | `—` | Callback do botão de fechar; se omitido, o botão não é renderizado |

### Hook — `useToast`
O hook retorna o objeto `{ showToast }`:

| Método | Assinatura | Descrição |
|--------|-----------|-----------|
| `showToast` | `(message: string, variant?: 'success' \| 'error' \| 'info') => void` | Exibe um toast por 3 segundos; `variant` padrão é `'info'` |

### Uso
```tsx
// 1. Envolva o app com ToastProvider (uma vez, no layout raiz)
<ToastProvider>
  <App />
</ToastProvider>

// 2. Use o hook em qualquer componente filho
const { showToast } = useToast()

showToast('Candidatura enviada com sucesso!', 'success')
showToast('Erro ao carregar vagas. Tente novamente.', 'error')
showToast('Seu perfil foi atualizado.') // variant padrão: 'info'
```

### Regras de uso
- `ToastProvider` deve estar no layout raiz — nunca aninhado dentro de uma tela específica.
- Use `'success'` para confirmação de ações concluídas com êxito.
- Use `'error'` para falhas de rede ou erros de operação que o usuário precisa saber.
- Use `'info'` para informações neutras ou atualizações de estado.
- Não use Toast para erros de validação de formulário — use `Input` com `inputState="error"`.

---

## BottomSheet
**Caminho:** `src/components/ui/BottomSheet/BottomSheet.tsx`
**Import:** `import { BottomSheet } from '@/components/ui'`

Painel modal deslizante a partir da parte inferior da tela, com overlay, título opcional e controle de abertura/fechamento. Use para ações contextuais, filtros, pickers e confirmações sem sair do fluxo atual.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `open` | `boolean` | `—` | Controla se o painel está visível |
| `onClose` | `() => void` | `—` | Callback chamado ao fechar (toque no overlay ou gesto de fechar) |
| `children` | `React.ReactNode` | `—` | Conteúdo interno do painel |
| `title` | `string` | `—` | Título exibido no cabeçalho do painel |

### Uso
```tsx
<BottomSheet
  open={isFilterOpen}
  onClose={() => setFilterOpen(false)}
  title="Filtrar Vagas"
>
  <FilterForm onApply={applyFilters} />
</BottomSheet>

{/* Sem título — conteúdo livre */}
<BottomSheet open={isOpen} onClose={close}>
  <ConfirmDeleteContent onConfirm={handleDelete} onCancel={close} />
</BottomSheet>
```

### Regras de uso
- Sempre controle `open` via estado externo — nunca use estado interno para visibilidade.
- Forneça `onClose` que de fato atualiza o estado para `false`; omiti-lo torna o painel não fechável.
- Use `title` quando o painel tem um propósito claro e nomeável (filtros, seleção, edição).
- Evite aninhar dois BottomSheets simultaneamente; prefira navegar para uma tela dedicada.

---

## EmptyState
**Caminho:** `src/components/ui/EmptyState/EmptyState.tsx`
**Import:** `import { EmptyState } from '@/components/ui'`

Tela de estado vazio com ícone ilustrativo, título, descrição opcional e ação opcional. Use quando uma lista ou seção não possui dados para exibir, orientando o usuário sobre o próximo passo.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `icon` | `React.ReactNode` | `—` | Ícone ou ilustração centralizada acima do título |
| `title` | `string` | `—` | Título principal do estado vazio |
| `description` | `string` | `—` | Texto explicativo complementar ao título |
| `action` | `React.ReactNode` | `—` | Elemento de ação (geralmente um `<Button>`) para guiar o usuário |

### Uso
```tsx
<EmptyState
  icon={<Briefcase size={48} className="text-qe-gray-300" />}
  title="Nenhuma vaga encontrada"
  description="Tente ajustar os filtros ou volte mais tarde."
  action={
    <Button variant="secondary" onClick={clearFilters}>
      Limpar filtros
    </Button>
  }
/>

{/* Estado vazio sem ação */}
<EmptyState
  icon={<ClockIcon size={48} />}
  title="Nenhum histórico ainda"
  description="Suas vagas concluídas aparecerão aqui."
/>
```

### Regras de uso
- Sempre forneça `title` e `icon` — são os elementos mínimos para comunicar o estado.
- Use `description` para explicar por que está vazio ou o que o usuário pode fazer.
- Use `action` quando houver uma ação clara que resolve o estado (ex.: criar vaga, limpar filtro).
- Omita `action` quando o estado vazio é esperado e não requer ação imediata (ex.: histórico novo).

---

## SkeletonCard
**Caminho:** `src/components/ui/SkeletonCard/SkeletonCard.tsx`
**Import:** `import { SkeletonCard } from '@/components/ui'`

Placeholder animado com shimmer que replica o layout do JobCard durante o carregamento de dados. Use para preencher listas de vagas enquanto a requisição está em andamento, evitando layout shift.

### Props
| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| — | — | — | Este componente não aceita props |

### Uso
```tsx
{isLoading ? (
  <>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </>
) : (
  jobs.map((job) => <JobCard key={job.id} {...job} />)
)}
```

### Regras de uso
- Renderize entre 2 e 4 instâncias para simular um feed realista — nunca apenas uma.
- Use exclusivamente como substituto do JobCard; para outros skeletons, crie componentes dedicados.
- Substitua os SkeletonCards pelos JobCards reais assim que os dados estiverem disponíveis — não os sobreponha.
- O atributo `aria-busy="true"` já está embutido; não adicione atributos de acessibilidade manualmente.
