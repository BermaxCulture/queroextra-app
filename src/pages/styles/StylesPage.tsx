import * as React from 'react'
import {
  Button, Input, InputOTP, Chip, Badge, Avatar,
  BottomNav, TopBar, JobCard, StatCard, Tabs,
  Toast, useToast,
  BottomSheet, EmptyState, SkeletonCard,
} from '@/components/ui'
import { Search, Star, Briefcase, TrendingUp, DollarSign, Package } from 'lucide-react'
import { ZapGradient } from '@/components/ui/icons/ZapGradient'

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-12">
    <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-qe-gray-400 border-b border-qe-gray-200 pb-3 mb-5">
      {title}
    </h2>
    {children}
  </section>
)

const Row: React.FC<{ label?: string; children: React.ReactNode; wrap?: boolean }> = ({
  label, children, wrap = true,
}) => (
  <div className="mb-4">
    {label && <p className="text-[11px] font-semibold text-qe-gray-400 uppercase tracking-[0.5px] mb-2">{label}</p>}
    <div className={`flex ${wrap ? 'flex-wrap' : ''} gap-3 items-center`}>{children}</div>
  </div>
)

const ToastDemo: React.FC = () => {
  const { showToast } = useToast()
  return (
    <Row label="Disparar Toast">
      <Button variant="primary" size="sm" onClick={() => showToast('Extra confirmado!', 'success')}>Success</Button>
      <Button variant="secondary" size="sm" onClick={() => showToast('Erro ao candidatar.', 'error')}>Error</Button>
      <Button variant="ghost" size="sm" onClick={() => showToast('Novo extra disponível.', 'info')}>Info</Button>
    </Row>
  )
}

const StylesPage: React.FC = () => {
  const [bottomNavTab, setBottomNavTab] = React.useState('explorar')
  const [activeTab, setActiveTab] = React.useState('vagas')
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [skillSelected, setSkillSelected] = React.useState<string[]>(['Bartender'])
  const [filterSelected, setFilterSelected] = React.useState('hoje')

  const toggleSkill = (s: string) =>
    setSkillSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )

  return (
    <div className="bg-qe-bg-page min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-qe-navy text-white rounded-qe-lg px-6 py-8 mb-10">
          <div className="text-[32px] font-bold tracking-[-1px]">
            Quero<span className="text-qe-yellow">Extra</span>
          </div>
          <div className="text-[13px] text-white/50 uppercase tracking-[0.5px] font-medium mt-1">
            Component Preview · QUER-11
          </div>
        </div>

        {/* BUTTON */}
        <Section title="01 · Button">
          <Row label="Variants">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </Row>
          <Row label="Sizes">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
          </Row>
          <Row label="Large (full-width)" wrap={false}>
            <div className="w-full max-w-sm">
              <Button size="lg">QUERO EXTRA <ZapGradient size={16} /></Button>
            </div>
          </Row>
          <Row label="States">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button leadingIcon={<Search size={16} />}>Com ícone</Button>
          </Row>
        </Section>

        {/* INPUT */}
        <Section title="02 · Input">
          <div className="max-w-sm space-y-4">
            <Input label="Telefone" placeholder="(11) 99999-9999" />
            <Input label="Buscar vagas" placeholder="Garçom, Bartender..." icon={<Search size={18} />} />
            <Input label="E-mail" placeholder="seu@email.com" errorMessage="E-mail inválido" />
            <Input label="CPF" placeholder="000.000.000-00" inputState="success" helperText="CPF verificado" />
            <Input label="Desabilitado" placeholder="—" disabled />
          </div>
        </Section>

        {/* INPUT OTP */}
        <Section title="03 · InputOTP">
          <Row label="6 dígitos">
            <InputOTP onComplete={(c) => alert(`Código: ${c}`)} />
          </Row>
        </Section>

        {/* CHIP */}
        <Section title="04 · Chip">
          <Row label="Skill (seleção de habilidades)">
            {['Bartender', 'Garçom', 'Cozinheiro', 'Recepcionista', 'DJ'].map((s) => (
              <Chip
                key={s}
                label={s}
                variant="skill"
                selected={skillSelected.includes(s)}
                onClick={() => toggleSkill(s)}
              />
            ))}
          </Row>
          <Row label="Filter (filtros de listagem)">
            {['Hoje', 'Esta Semana', 'Urgente', 'Perto de mim'].map((f) => (
              <Chip
                key={f}
                label={f}
                variant="filter"
                selected={filterSelected === f.toLowerCase()}
                onClick={() => setFilterSelected(f.toLowerCase())}
              />
            ))}
          </Row>
        </Section>

        {/* BADGE */}
        <Section title="05 · Badge">
          <Row label="All variants">
            <Badge variant="urgent">Urgente</Badge>
            <Badge variant="pending">Pendente</Badge>
            <Badge variant="confirmed">Confirmado</Badge>
            <Badge variant="warning">Atenção</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="category">Garçom</Badge>
          </Row>
        </Section>

        {/* AVATAR */}
        <Section title="06 · Avatar">
          <Row label="Sizes (iniciais)">
            <Avatar name="João Silva" size="xs" />
            <Avatar name="João Silva" size="sm" />
            <Avatar name="João Silva" size="md" />
            <Avatar name="João Silva" size="lg" />
            <Avatar name="João Silva" size="xl" />
          </Row>
          <Row label="Com imagem + verified">
            <Avatar src="https://i.pravatar.cc/80?img=1" name="Maria" size="md" />
            <Avatar src="https://i.pravatar.cc/80?img=2" name="Carlos" size="lg" verified />
            <Avatar name="Ana Lima" size="xl" verified />
          </Row>
        </Section>

        {/* BOTTOM NAV */}
        <Section title="07 · BottomNav">
          <Row label="Freelancer">
            <div className="w-full max-w-sm border border-qe-gray-200 rounded-qe-md overflow-hidden">
              <BottomNav
                variant="freelancer"
                activeTab={bottomNavTab}
                onChange={setBottomNavTab}
                notifications={{ extras: true }}
              />
            </div>
          </Row>
        </Section>

        {/* TOP BAR */}
        <Section title="08 · TopBar">
          <Row label="Main" wrap={false}>
            <div className="w-full max-w-sm border border-qe-gray-200 rounded-qe-md overflow-hidden">
              <TopBar
                variant="main"
                onSearch={() => {}}
                onNotification={() => {}}
                notificationCount={3}
                onProfile={() => {}}
              />
            </div>
          </Row>
          <Row label="Inner" wrap={false}>
            <div className="w-full max-w-sm border border-qe-gray-200 rounded-qe-md overflow-hidden">
              <TopBar variant="inner" title="Detalhes da Vaga" onBack={() => {}} />
            </div>
          </Row>
        </Section>

        {/* JOB CARD */}
        <Section title="09 · JobCard">
          <div className="space-y-4 max-w-sm">
            <JobCard
              category="Garçom"
              title="Garçom para Evento Corporativo"
              location="Vila Madalena, SP"
              distance="1.2km"
              date="Hoje, 13 Mai"
              time="18h — 23h"
              value={150}
              tags={['Terno', 'Experiência']}
              onApply={() => {}}
            />
            <JobCard
              category="Bartender"
              title="Bartender Especialista — Coquetel"
              location="Itaim Bibi, SP"
              distance="3km"
              date="Amanhã, 14 Mai"
              time="19h — 00h"
              value={200}
              isUrgent
              tags={['Início Imediato']}
              onApply={() => {}}
            />
          </div>
        </Section>

        {/* STAT CARD */}
        <Section title="10 · StatCard">
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <StatCard label="Extras feitos" value="47" subtext="desde out/2021" icon={<Briefcase size={18} />} />
            <StatCard label="Avaliação" value="4.9★" subtext="128 avaliações" icon={<Star size={18} />} />
            <StatCard label="Ganhos totais" value="R$ 8.4k" subtext="último ano" icon={<DollarSign size={18} />} />
            <StatCard label="Em andamento" value="2" icon={<TrendingUp size={18} />} />
          </div>
        </Section>

        {/* TABS */}
        <Section title="11 · Tabs">
          <div className="max-w-sm">
            <Tabs
              tabs={[
                { label: 'Disponíveis', value: 'vagas' },
                { label: 'Candidaturas', value: 'candidaturas' },
                { label: 'Histórico', value: 'historico' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            <div className="py-4 text-[14px] text-qe-gray-500">
              Conteúdo da aba: <strong>{activeTab}</strong>
            </div>
          </div>
        </Section>

        {/* TOAST */}
        <Section title="12 · Toast">
          <ToastDemo />
          <Row label="Preview estático">
            <Toast variant="success" message="Extra confirmado com sucesso!" />
          </Row>
          <Row label="">
            <Toast variant="error" message="Erro ao candidatar-se." />
          </Row>
          <Row label="">
            <Toast variant="info" message="Novo extra disponível perto de você." />
          </Row>
        </Section>

        {/* BOTTOM SHEET */}
        <Section title="13 · BottomSheet">
          <Row label="Trigger">
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              Abrir Bottom Sheet
            </Button>
          </Row>
          <BottomSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title="Detalhes da Vaga"
          >
            <div className="p-6">
              <p className="text-[15px] text-qe-gray-700 leading-relaxed mb-4">
                Garçom para Evento Corporativo na Vila Madalena.
                Início imediato, valor R$ 150/turno.
              </p>
              <Button size="lg" className="w-full" onClick={() => setSheetOpen(false)}>QUERO EXTRA <ZapGradient size={16} /></Button>
            </div>
          </BottomSheet>
        </Section>

        {/* EMPTY STATE */}
        <Section title="14 · EmptyState">
          <div className="bg-qe-white rounded-qe-md border border-qe-gray-200 max-w-sm">
            <EmptyState
              icon={<Package size={48} />}
              title="Nenhuma vaga encontrada"
              description="Tente ajustar os filtros ou volte mais tarde para novas oportunidades."
              action={<Button variant="secondary" size="sm">Limpar filtros</Button>}
            />
          </div>
        </Section>

        {/* SKELETON */}
        <Section title="15 · SkeletonCard">
          <div className="max-w-sm">
            <SkeletonCard />
          </div>
        </Section>
      </div>
    </div>
  )
}

export default StylesPage
