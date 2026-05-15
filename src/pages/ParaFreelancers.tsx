import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import boneco from '@/assets/queroExtra-boneco.png'
import { motion, type Variants } from 'framer-motion'
import {
  ChevronDown,
  UserPlus,
  Search,
  Wallet,
  UtensilsCrossed,
  Wine,
  ChefHat,
  Users,
  Shield,
  Sparkles,
  CheckCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Button, Chip, JobCard } from '@/components/ui'
import { LandingHeader } from '@/components/layout/LandingHeader'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

// ─── Animation variants ─────────────────────────────────────────────────────

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ─── Static data ─────────────────────────────────────────────────────────────

const vagasMockadas = [
  {
    id: '1',
    category: 'GARÇOM',
    title: 'Bar do Zeca',
    location: 'Umarizal, Belém',
    distance: '2.5 km',
    date: 'Hoje',
    time: '18:00 — 02:00',
    value: 120,
    isUrgent: false,
  },
  {
    id: '2',
    category: 'BARTENDER',
    title: 'Clube Náutico',
    location: 'Marco, Belém',
    distance: '4.1 km',
    date: 'Amanhã',
    time: '20:00 — 04:00',
    value: 200,
    isUrgent: true,
  },
  {
    id: '3',
    category: 'AUX. COZINHA',
    title: 'Restaurante Sabor',
    location: 'Batista Campos, Belém',
    distance: '3.8 km',
    date: 'Sáb, 18 Mai',
    time: '10:00 — 18:00',
    value: 150,
    isUrgent: false,
  },
  {
    id: '4',
    category: 'HOSTESS',
    title: 'Bistrô Francês',
    location: 'Reduto, Belém',
    distance: '5.2 km',
    date: 'Sex, 17 Mai',
    time: '19:00 — 00:00',
    value: 130,
    isUrgent: false,
  },
  {
    id: '5',
    category: 'SEGURANÇA',
    title: 'Espaço Eventos PA',
    location: 'Entroncamento, Belém',
    distance: '6.0 km',
    date: 'Dom, 19 Mai',
    time: '14:00 — 22:00',
    value: 180,
    isUrgent: true,
  },
  {
    id: '6',
    category: 'GARÇOM',
    title: 'Buffet Requinte',
    location: 'Nazaré, Belém',
    distance: '1.8 km',
    date: 'Hoje',
    time: '12:00 — 20:00',
    value: 110,
    isUrgent: false,
  },
]

const categorias: { icon: LucideIcon; label: string }[] = [
  { icon: UtensilsCrossed, label: 'Garçom' },
  { icon: Wine, label: 'Bartender' },
  { icon: ChefHat, label: 'Aux. Cozinha' },
  { icon: Users, label: 'Hostess' },
  { icon: Shield, label: 'Segurança' },
  { icon: Sparkles, label: 'Limpeza' },
]

const heroChips = ['Garçom', 'Bartender', 'Aux. Cozinha', 'Hostess', 'Segurança', 'Limpeza']

// ─── StatItem ────────────────────────────────────────────────────────────────

interface StatItemProps {
  value: number
  suffix: string
  label: string
  isInView: boolean
}

function StatItem({ value, suffix, label, isInView }: StatItemProps) {
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!isInView) return
    const duration = 1400
    const steps = 60
    const increment = value / steps
    let frame = 0
    const timer = setInterval(() => {
      frame++
      const next = Math.min(value, Math.round(increment * frame))
      setCount(next)
      if (next >= value) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [isInView, value])

  return (
    <div className="text-center">
      <div className="text-[18px] sm:text-[32px] font-bold leading-none text-qe-yellow font-sans">
        {count.toLocaleString('pt-BR')}
        {suffix}
      </div>
      <div className="text-[10px] sm:text-[13px] text-qe-white font-normal mt-1 sm:mt-1.5 font-sans">{label}</div>
    </div>
  )
}

// ─── ParaFreelancers ─────────────────────────────────────────────────────────

export default function ParaFreelancers() {
  const navigate = useNavigate()

  const { ref: heroRef, isInView: heroInView } = useScrollAnimation()
  const { ref: statsRef, isInView: statsInView } = useScrollAnimation()
  const { ref: howRef, isInView: howInView } = useScrollAnimation()
  const { ref: vagasRef, isInView: vagasInView } = useScrollAnimation()
  const { ref: catRef, isInView: catInView } = useScrollAnimation()
  const { ref: ctaRef, isInView: ctaInView } = useScrollAnimation()

  return (
    <div className="font-sans min-h-screen">
      <LandingHeader />

      <main className="pt-16">
        {/* ═══════════════════════════════════════ HERO */}
        <section
          className="relative min-h-[88vh] flex flex-col bg-qe-bg-page overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(circle, var(--qe-gray-200) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Content area */}
          <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-16">
          <motion.div
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={heroRef as any}
            variants={sectionVariants}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            className="max-w-3xl mx-auto text-center w-full"
          >
            {/* Tag pill */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-qe-pill bg-qe-white border border-qe-gray-200 text-[11px] font-bold tracking-[0.8px] uppercase text-qe-gray-700 font-sans shadow-qe-sm">
                🍽 FOOD SERVICE · BRASIL
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-bold text-qe-gray-900 leading-[1.05] tracking-[-2px] mb-6 font-sans" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
              Trabalho extra,
              <br />
              quando você{' '}
              <span className="text-qe-yellow">quiser.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[15px] md:text-[17px] text-qe-gray-500 leading-relaxed mb-8 max-w-lg mx-auto font-sans">
              Candidate-se a vagas em restaurantes, buffets e eventos na sua cidade.
              <br className="hidden sm:block" />
              Sem burocracia, pagamento garantido.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link to="/cadastro" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="sm:w-auto sm:min-w-[200px]">
                  Quero trabalhar →
                </Button>
              </Link>
              <Link to="/para-empresas" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="sm:w-auto sm:min-w-[160px]">
                  Sou empresa
                </Button>
              </Link>
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {heroChips.map(cat => (
                <Chip key={cat} label={cat} variant="filter" selected={false} />
              ))}
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={24} className="text-qe-gray-400" />
          </motion.div>
          </div>{/* end content wrapper */}

          {/* Stats bar — rodapé do hero */}
          <div
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={statsRef as any}
            className="bg-qe-navy py-3 sm:py-12 px-4"
          >
            <div className="max-w-4xl mx-auto flex flex-row justify-around items-center">
              <StatItem value={2400} suffix="+" label="Freelancers" isInView={statsInView} />
              <div className="w-px h-8 sm:h-10 bg-qe-gray-700" />
              <StatItem value={340} suffix="+" label="Empresas" isInView={statsInView} />
              <div className="w-px h-8 sm:h-10 bg-qe-gray-700" />
              <StatItem value={98} suffix="%" label="Taxa de conclusão" isInView={statsInView} />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════ COMO FUNCIONA */}
        <section id="como-funciona" className="py-20 px-4 bg-qe-white">
          <motion.div
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={howRef as any}
            variants={containerVariants}
            initial="hidden"
            animate={howInView ? 'visible' : 'hidden'}
            className="max-w-5xl mx-auto"
          >
            {/* Section header */}
            <motion.div variants={itemVariants} className="text-center mb-14">
              <h2 className="text-[28px] md:text-[36px] font-bold text-qe-gray-900 mb-3 font-sans">
                Como funciona
              </h2>
              <p className="text-[16px] text-qe-gray-500 font-sans">
                Três passos simples para começar a trabalhar
              </p>
            </motion.div>

            {/* Steps */}
            <div className="relative">
              {/* Connector line — desktop only */}
              <div className="hidden md:block absolute top-[46px] left-[calc(16.66%+48px)] right-[calc(16.66%+48px)] h-px bg-qe-gray-200 z-0" />

              <div className="relative z-10 flex flex-col md:flex-row gap-10 md:gap-0">
                {[
                  {
                    num: '01',
                    icon: UserPlus,
                    title: 'Cadastro gratuito',
                    desc: 'Crie sua conta em 2 minutos. Rápido, fácil e 100% gratuito.',
                  },
                  {
                    num: '02',
                    icon: Search,
                    title: 'Encontre vagas',
                    desc: 'Navegue pelas vagas disponíveis na sua região e candidate-se com um clique.',
                  },
                  {
                    num: '03',
                    icon: Wallet,
                    title: 'Trabalhe e receba',
                    desc: 'Realize o serviço e receba seu pagamento de forma segura e garantida.',
                  },
                ].map(step => (
                  <motion.div
                    key={step.num}
                    variants={itemVariants}
                    className="flex-1 md:px-8 flex flex-col items-center text-center"
                  >
                    <div className="text-[48px] font-bold text-qe-yellow leading-none mb-3 font-sans">
                      {step.num}
                    </div>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-qe-yellow-subtle mb-4">
                      <step.icon size={22} className="text-qe-yellow-text" />
                    </div>
                    <h3 className="text-[17px] font-bold text-qe-gray-900 mb-2 font-sans">
                      {step.title}
                    </h3>
                    <p className="text-[14px] text-qe-gray-500 leading-relaxed font-sans max-w-[240px] mx-auto">
                      {step.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════ VAGAS EM DESTAQUE */}
        <section className="py-20 px-4 bg-qe-bg-page">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-[26px] md:text-[32px] font-bold text-qe-gray-900 font-sans">
                Extras disponíveis agora
              </h2>
              <span
                className="text-[14px] font-semibold text-qe-gray-400 cursor-not-allowed select-none font-sans"
                aria-disabled
              >
                Ver todos →
              </span>
            </div>

            {/* Cards grid */}
            <motion.div
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ref={vagasRef as any}
              variants={containerVariants}
              initial="hidden"
              animate={vagasInView ? 'visible' : 'hidden'}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {vagasMockadas.map(vaga => (
                <motion.div key={vaga.id} variants={itemVariants}>
                  <JobCard {...vaga} onApply={() => navigate('/cadastro')} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════ CATEGORIAS */}
        <section className="py-20 px-4 bg-qe-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-[26px] md:text-[32px] font-bold text-qe-gray-900 font-sans">
                Áreas de atuação
              </h2>
            </div>

            <motion.div
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ref={catRef as any}
              variants={containerVariants}
              initial="hidden"
              animate={catInView ? 'visible' : 'hidden'}
              className="grid grid-cols-3 md:grid-cols-6 gap-4"
            >
              {categorias.map(cat => (
                <motion.div key={cat.label} variants={itemVariants}>
                  <div className="group flex flex-col items-center gap-3 p-5 bg-qe-white rounded-qe-md border border-qe-gray-200 hover:border-qe-yellow transition-all duration-150 cursor-pointer">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-qe-yellow-subtle group-hover:bg-qe-yellow transition-colors duration-150">
                      <cat.icon
                        size={24}
                        className="text-qe-yellow-text group-hover:text-qe-black transition-colors duration-150"
                      />
                    </div>
                    <span className="text-[13px] font-bold text-qe-gray-900 text-center font-sans leading-tight">
                      {cat.label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════ CTA EMPRESA */}
        <section className="py-20 px-4 bg-qe-navy">
          <motion.div
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={ctaRef as any}
            variants={sectionVariants}
            initial="hidden"
            animate={ctaInView ? 'visible' : 'hidden'}
            className="max-w-3xl mx-auto text-center"
          >
            {/* Tag pill */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center px-4 py-1.5 rounded-qe-pill border border-qe-gray-700 text-[11px] font-bold tracking-[0.8px] uppercase text-qe-yellow font-sans">
                PARA EMPRESAS
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-[30px] md:text-[40px] font-bold text-qe-white leading-[1.1] mb-4 font-sans">
              Precisa de profissionais
              <br />
              para seu <span className="text-qe-yellow">evento?</span>
            </h2>

            {/* Subtitle */}
            <p className="text-[16px] text-qe-gray-400 mb-10 leading-relaxed font-sans">
              Publique sua vaga em minutos e encontre
              <br className="hidden sm:block" />
              profissionais qualificados na sua cidade.
            </p>

            {/* Benefits */}
            <div className="flex flex-col sm:flex-row justify-center gap-5 sm:gap-10 mb-10">
              {[
                { icon: CheckCircle, text: 'Profissionais verificados' },
                { icon: Zap, text: 'Contratação em minutos' },
                { icon: Shield, text: 'Pagamento seguro garantido' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center justify-center gap-2 text-qe-white">
                  <Icon size={18} className="text-qe-yellow flex-shrink-0" />
                  <span className="text-[14px] font-medium font-sans">{text}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/cadastro" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="sm:w-auto sm:min-w-[220px]">
                  Publicar vaga grátis
                </Button>
              </Link>
              <Link
                to="/para-empresas"
                className="inline-flex items-center justify-center gap-2 font-semibold font-sans rounded-qe-pill px-8 min-h-[52px] w-full sm:w-auto sm:min-w-[160px] border-[1.5px] border-white/30 text-qe-white hover:bg-white/10 transition-colors text-[17px]"
              >
                Saiba mais
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ═══════════════════════════════════════ FOOTER */}
      <footer className="bg-qe-gray-900 border-t border-qe-gray-700 py-14 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={boneco} alt="" className="h-10 w-auto brightness-0 invert" aria-hidden="true" />
              <span className="text-[20px] font-bold font-sans leading-none tracking-[-0.3px]">
                <span className="text-qe-white">Quero</span>
                <span className="text-qe-yellow">Extra</span>
              </span>
            </div>
            <p className="text-[13px] text-qe-gray-400 mb-4 leading-relaxed font-sans">
              O marketplace de food service do Brasil.
            </p>
            <p className="text-[12px] text-qe-gray-500 font-sans">© 2026 QueroExtra</p>
          </div>

          {/* Col 2: Plataforma */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.8px] text-qe-yellow mb-4 font-sans">
              Plataforma
            </h4>
            <ul className="flex flex-col gap-2.5">
              {['Sobre Nós', 'Como Funciona', 'Privacidade'].map(link => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-[14px] text-qe-gray-400 hover:text-qe-white transition-colors font-sans"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Suporte */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.8px] text-qe-yellow mb-4 font-sans">
              Suporte
            </h4>
            <ul className="flex flex-col gap-2.5">
              {['Central de Ajuda', 'Termos de Uso', 'Fale Conosco'].map(link => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-[14px] text-qe-gray-400 hover:text-qe-white transition-colors font-sans"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Para Empresas */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.8px] text-qe-yellow mb-4 font-sans">
              Para Empresas
            </h4>
            <ul className="flex flex-col gap-2.5">
              {['Publicar vaga', 'Como contratar', 'Planos'].map(link => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-[14px] text-qe-gray-400 hover:text-qe-white transition-colors font-sans"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
