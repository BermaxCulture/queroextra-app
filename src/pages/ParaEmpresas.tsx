import * as React from 'react'
import { Link } from 'react-router-dom'
import boneco from '@/assets/queroExtra-boneco.png'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  Building2,
  ClipboardList,
  UserCheck,
  CheckCircle,
  Zap,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { LandingHeader } from '@/components/layout/LandingHeader'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

// ─── Animation variants ─────────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

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

// ─── ParaEmpresas ─────────────────────────────────────────────────────────────

export default function ParaEmpresas() {
  const { ref: heroRef, isInView: heroInView } = useScrollAnimation()
  const { ref: statsRef, isInView: statsInView } = useScrollAnimation()
  const { ref: benefitsRef, isInView: benefitsInView } = useScrollAnimation()
  const { ref: howRef, isInView: howInView } = useScrollAnimation()
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
              Profissionais prontos
              <br />
              para trabalhar{' '}
              <span className="text-qe-yellow">hoje.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[15px] md:text-[17px] text-qe-gray-500 leading-relaxed mb-8 max-w-lg mx-auto font-sans">
              Publique uma vaga em minutos e encontre garçons,
              <br className="hidden sm:block" />
              bartenders e auxiliares qualificados na sua cidade.
              <br className="hidden sm:block" />
              Sem CLT, sem burocracia.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/cadastro" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="sm:w-auto sm:min-w-[240px]">
                  Publicar vaga grátis →
                </Button>
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 font-semibold font-sans rounded-qe-pill px-8 min-h-[52px] w-full sm:w-auto sm:min-w-[180px] border-[1.5px] border-qe-gray-200 text-qe-gray-700 hover:border-qe-gray-900 hover:text-qe-gray-900 transition-colors text-[17px] bg-qe-white"
              >
                Como funciona
              </a>
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
              <StatItem value={340} suffix="+" label="Empresas ativas" isInView={statsInView} />
              <div className="w-px h-8 sm:h-10 bg-qe-gray-700" />
              <StatItem value={2400} suffix="+" label="Profissionais" isInView={statsInView} />
              <div className="w-px h-8 sm:h-10 bg-qe-gray-700" />
              <div className="text-center">
                <div className="text-[18px] sm:text-[32px] font-bold leading-none font-sans" style={{ color: 'var(--qe-yellow)' }}>
                  4h
                </div>
                <div className="text-[10px] sm:text-[13px] font-normal mt-1 sm:mt-1.5 font-sans" style={{ color: 'var(--qe-white)' }}>
                  Tempo médio de preenchimento
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════ BENEFÍCIOS */}
        <section className="py-20 px-4 bg-qe-white">
          <motion.div
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={benefitsRef as any}
            variants={containerVariants}
            initial="hidden"
            animate={benefitsInView ? 'visible' : 'hidden'}
            className="max-w-5xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-[28px] md:text-[36px] font-bold text-qe-gray-900 mb-3 font-sans">
                Por que escolher o QueroExtra?
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: CheckCircle,
                  title: 'Profissionais verificados',
                  desc: 'Perfis com histórico, avaliações e experiência comprovada.',
                },
                {
                  icon: Zap,
                  title: 'Contratação em minutos',
                  desc: 'Publique a vaga, receba candidatos e escolha o melhor perfil.',
                },
                {
                  icon: Shield,
                  title: 'Pagamento seguro',
                  desc: 'Pague pela plataforma. O profissional recebe só após confirmar presença.',
                },
              ].map(benefit => (
                <motion.div key={benefit.title} variants={itemVariants}>
                  <div className="flex flex-col gap-4 p-7 bg-qe-white border border-qe-gray-200 rounded-qe-lg shadow-qe-sm h-full">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-qe-yellow-subtle flex-shrink-0">
                      <benefit.icon size={22} className="text-qe-yellow-text" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-bold text-qe-gray-900 mb-2 font-sans">
                        {benefit.title}
                      </h3>
                      <p className="text-[14px] text-qe-gray-500 leading-relaxed font-sans">
                        {benefit.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════ COMO FUNCIONA */}
        <section id="como-funciona" className="py-20 px-4 bg-qe-bg-page">
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
                Três passos para contratar sem burocracia
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
                    icon: Building2,
                    title: 'Cadastre sua empresa',
                    desc: 'Envie seus documentos e aguarde aprovação em até 24h.',
                  },
                  {
                    num: '02',
                    icon: ClipboardList,
                    title: 'Publique a vaga',
                    desc: 'Título, local, horário e valor. Sua vaga fica visível imediatamente.',
                  },
                  {
                    num: '03',
                    icon: UserCheck,
                    title: 'Escolha e contrate',
                    desc: 'Analise os perfis, aprove o candidato e combine pelo WhatsApp.',
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

        {/* ═══════════════════════════════════════ CTA FINAL */}
        <section className="py-20 px-4 bg-qe-navy">
          <motion.div
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={ctaRef as any}
            variants={sectionVariants}
            initial="hidden"
            animate={ctaInView ? 'visible' : 'hidden'}
            className="max-w-3xl mx-auto text-center"
          >
            {/* Headline */}
            <h2 className="text-[30px] md:text-[44px] font-bold text-qe-white leading-[1.1] mb-4 font-sans">
              Precisa de alguém
              <br />
              para <span className="text-qe-yellow">hoje?</span>
            </h2>

            {/* Subtitle */}
            <p className="text-[16px] text-qe-gray-400 mb-10 leading-relaxed font-sans">
              Publique uma vaga urgente e encontre
              <br className="hidden sm:block" />
              profissionais disponíveis agora.
            </p>

            {/* CTA */}
            <Link to="/cadastro" className="inline-block">
              <Button variant="primary" size="lg" className="sm:min-w-[260px] text-[17px]">
                Publicar vaga urgente ⚡
              </Button>
            </Link>
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
