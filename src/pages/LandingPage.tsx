import * as React from 'react'
import { Link } from 'react-router-dom'
import boneco from '@/assets/queroExtra-boneco.png'
import { motion, type Variants } from 'framer-motion'
import {
  ChevronDown,
  Briefcase,
  Building2,
  UserCheck,
  CheckCircle,
} from 'lucide-react'
import { Button, Avatar } from '@/components/ui'
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

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const profileStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const itemVariants: Variants = {
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
      <div className="text-[18px] sm:text-[32px] font-bold leading-none font-sans" style={{ color: 'var(--qe-yellow)' }}>
        {count.toLocaleString('pt-BR')}
        {suffix}
      </div>
      <div className="text-[10px] sm:text-[13px] font-normal mt-1 sm:mt-1.5 font-sans" style={{ color: 'var(--qe-white)' }}>
        {label}
      </div>
    </div>
  )
}

// ─── LandingPage ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { ref: heroRef, isInView: heroInView } = useScrollAnimation()
  const { ref: splitRef, isInView: splitInView } = useScrollAnimation()
  const { ref: statsRef, isInView: statsInView } = useScrollAnimation()
  const { ref: whatRef, isInView: whatInView } = useScrollAnimation()
  const { ref: testimonialsRef, isInView: testimonialsInView } = useScrollAnimation()
  const { ref: ctaRef, isInView: ctaInView } = useScrollAnimation()

  return (
    <div className="font-sans min-h-screen">
      <LandingHeader />

      <main className="pt-16">
        {/* ═══════════════════════════════════════ HERO */}
        <section
          className="relative min-h-[85vh] flex flex-col bg-qe-bg-page overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(circle, var(--qe-gray-200) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Content area */}
          <div className="relative flex-1 flex items-center px-6 sm:px-12 py-12">
          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy — sobre o produto, não sobre um perfil */}
            <motion.div
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ref={heroRef as any}
              variants={sectionVariants}
              initial="hidden"
              animate={heroInView ? 'visible' : 'hidden'}
              className="flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              {/* Tag pill */}
              <div className="flex justify-center lg:justify-start mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-qe-pill bg-qe-white border border-qe-gray-200 text-[11px] font-bold tracking-[0.8px] uppercase text-qe-gray-700 font-sans shadow-qe-sm">
                  🍽 FOOD SERVICE · BRASIL
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-bold text-qe-gray-900 leading-[1.05] tracking-[-2px] mb-6 font-sans" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
                A plataforma de
                <br />
                trabalho extra para
                <br />
                o{' '}
                <span className="text-qe-yellow">food service.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-[15px] md:text-[17px] text-qe-gray-500 leading-relaxed max-w-md font-sans mb-8">
                Conectamos profissionais autônomos a restaurantes, buffets e eventos na sua cidade. Rápido,
                seguro e com pagamento garantido.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/para-freelancers" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="sm:w-auto sm:min-w-[220px]">
                    Quero trabalhar →
                  </Button>
                </Link>
                <Link to="/para-empresas" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="sm:w-auto sm:min-w-[160px]">
                    Sou empresa
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: phone mockup — CSS only */}
            {/* TODO: substituir por carrossel de screenshots quando disponível */}
            <div className="flex justify-center lg:justify-end">
              {/* Wrapper responsivo: 70% no mobile, tamanho original no desktop */}
              <div className="relative w-[168px] h-[350px] lg:w-[240px] lg:h-[500px]">
              <div className="absolute inset-0 origin-top-left scale-[0.7] lg:scale-100">
              <div style={{ width: '240px', height: '500px', position: 'relative' }}>
                {/* Phone shell */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'var(--qe-gray-900)',
                    borderRadius: '40px',
                    padding: '10px',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.22), 0 8px 20px rgba(0,0,0,0.12)',
                  }}
                >
                  {/* Volume buttons — left side */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-3px',
                      top: '90px',
                      width: '3px',
                      height: '28px',
                      backgroundColor: 'var(--qe-gray-700)',
                      borderRadius: '2px 0 0 2px',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '-3px',
                      top: '130px',
                      width: '3px',
                      height: '28px',
                      backgroundColor: 'var(--qe-gray-700)',
                      borderRadius: '2px 0 0 2px',
                    }}
                  />
                  {/* Power button — right side */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '-3px',
                      top: '110px',
                      width: '3px',
                      height: '50px',
                      backgroundColor: 'var(--qe-gray-700)',
                      borderRadius: '0 2px 2px 0',
                    }}
                  />

                  {/* Screen */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'var(--qe-yellow-subtle)',
                      borderRadius: '32px',
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                    }}
                  >
                    {/* Notch */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '80px',
                        height: '24px',
                        backgroundColor: 'var(--qe-gray-900)',
                        borderRadius: '0 0 14px 14px',
                        zIndex: 10,
                      }}
                    />

                    {/* Logo */}
                    <img
                      src={boneco}
                      alt=""
                      aria-hidden="true"
                      style={{ width: '80px', height: 'auto', marginTop: '16px' }}
                    />
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        fontFamily: 'var(--qe-font)',
                        letterSpacing: '-0.3px',
                      }}
                    >
                      <span style={{ color: 'var(--qe-navy)' }}>Quero</span>
                      <span style={{ color: 'var(--qe-yellow)' }}>Extra</span>
                    </div>

                    {/* Em breve */}
                    <span
                      style={{
                        color: 'var(--qe-gray-400)',
                        fontSize: '11px',
                        fontFamily: 'var(--qe-font)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        lineHeight: '1.4',
                      }}
                    >
                      Em breve imagens do app
                    </span>
                  </div>
                </div>
              </div>
              </div>{/* end scale wrapper */}
              </div>{/* end size wrapper */}
            </div>
          </div>

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
            className="py-3 sm:py-12 px-4"
            style={{ backgroundColor: 'var(--qe-navy)' }}
          >
            <div className="max-w-4xl mx-auto flex flex-row justify-around items-center">
              <StatItem value={2400} suffix="+" label="Freelancers" isInView={statsInView} />
              <div className="w-px h-8 sm:h-10" style={{ backgroundColor: 'var(--qe-gray-700)' }} />
              <StatItem value={340} suffix="+" label="Empresas" isInView={statsInView} />
              <div className="w-px h-8 sm:h-10" style={{ backgroundColor: 'var(--qe-gray-700)' }} />
              <StatItem value={98} suffix="%" label="Taxa de conclusão" isInView={statsInView} />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════ SPLIT DE PERFIS */}
        {/* Sem padding entre hero e split — blocos fluem diretamente */}
        <section
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={splitRef as any}
        >
          <motion.div
            variants={profileStagger}
            initial="hidden"
            animate={splitInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-2"
          >
            {/* Bloco esquerdo — para profissionais */}
            <motion.div
              variants={fadeSlideUp}
              className="flex flex-col gap-6 p-10 md:p-14 lg:p-16"
              style={{ backgroundColor: 'var(--qe-navy)', minHeight: '280px' }}
            >
              <Briefcase size={28} style={{ color: 'var(--qe-yellow)' }} />
              <div className="flex flex-col gap-3">
                <span
                  className="text-[11px] font-bold tracking-[0.8px] uppercase font-sans"
                  style={{ color: 'var(--qe-yellow)' }}
                >
                  PARA PROFISSIONAIS
                </span>
                <h2 className="text-[30px] md:text-[36px] font-bold leading-[1.1] font-sans" style={{ color: 'var(--qe-white)' }}>
                  Ganhe renda extra
                  <br />
                  quando quiser.
                </h2>
                <p className="text-[15px] font-sans leading-relaxed" style={{ color: 'var(--qe-gray-400)' }}>
                  Candidate-se a vagas de garçom, bartender e muito mais na sua cidade.
                </p>
              </div>
              <Link to="/para-freelancers" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="sm:w-auto sm:min-w-[200px]">
                  Quero trabalhar →
                </Button>
              </Link>
            </motion.div>

            {/* Bloco direito — para empresas */}
            <motion.div
              variants={fadeSlideUp}
              className="flex flex-col gap-6 p-10 md:p-14 lg:p-16"
              style={{ backgroundColor: 'var(--qe-yellow)', minHeight: '280px' }}
            >
              <Building2 size={28} style={{ color: 'var(--qe-black)' }} />
              <div className="flex flex-col gap-3">
                <span
                  className="text-[11px] font-bold tracking-[0.8px] uppercase font-sans"
                  style={{ color: 'var(--qe-black)', opacity: 0.6 }}
                >
                  PARA EMPRESAS
                </span>
                <h2 className="text-[30px] md:text-[36px] font-bold text-qe-black leading-[1.1] font-sans">
                  Contrate em
                  <br />
                  minutos.
                </h2>
                <p className="text-[15px] font-sans leading-relaxed text-qe-black" style={{ opacity: 0.65 }}>
                  Publique vagas e encontre profissionais qualificados para seu estabelecimento.
                </p>
              </div>
              <Link to="/para-empresas" className="w-full sm:w-auto">
                <button
                  className="inline-flex items-center justify-center font-bold font-sans rounded-qe-pill px-8 min-h-[52px] w-full sm:w-auto sm:min-w-[220px] transition-colors text-[16px]"
                  style={{ backgroundColor: 'var(--qe-black)', color: 'var(--qe-white)' }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      'var(--qe-gray-900)'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      'var(--qe-black)'
                  }}
                >
                  Publicar vaga grátis
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════ O QUE É O QUEROEXTRA */}
        <section className="py-20 px-4 bg-qe-white">
          <motion.div
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={whatRef as any}
            variants={staggerContainer}
            initial="hidden"
            animate={whatInView ? 'visible' : 'hidden'}
            className="max-w-5xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-[28px] md:text-[36px] font-bold text-qe-gray-900 mb-3 font-sans">
                Uma plataforma, dois lados
              </h2>
              <p className="text-[16px] text-qe-gray-500 font-sans max-w-lg mx-auto">
                Desenvolvida para conectar quem precisa de trabalho a quem precisa de profissionais.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card: para profissionais */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-5 p-7 rounded-qe-lg border border-qe-gray-200"
                style={{ backgroundColor: 'var(--qe-gray-50)' }}
              >
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full"
                  style={{ backgroundColor: 'var(--qe-yellow-subtle)' }}
                >
                  <UserCheck size={32} style={{ color: 'var(--qe-yellow-text)' }} />
                </div>
                <h3 className="text-[20px] font-bold text-qe-gray-900 font-sans">Para profissionais</h3>
                <ul className="flex flex-col gap-3">
                  {[
                    'Vagas de food service na sua cidade',
                    'Cadastro gratuito em 2 minutos',
                    'Pagamento garantido pela plataforma',
                    'Trabalhe quando quiser, sem vínculo',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle
                        size={17}
                        className="flex-shrink-0 mt-0.5"
                        style={{ color: 'var(--qe-success)' }}
                      />
                      <span className="text-[14px] text-qe-gray-700 font-sans leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-1">
                  <Link to="/para-freelancers">
                    <Button variant="ghost" size="sm">
                      Saiba mais →
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Card: para empresas */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-5 p-7 rounded-qe-lg border border-qe-gray-200"
                style={{ backgroundColor: 'var(--qe-gray-50)' }}
              >
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full"
                  style={{ backgroundColor: 'var(--qe-yellow-subtle)' }}
                >
                  <Building2 size={32} style={{ color: 'var(--qe-yellow-text)' }} />
                </div>
                <h3 className="text-[20px] font-bold text-qe-gray-900 font-sans">Para empresas</h3>
                <ul className="flex flex-col gap-3">
                  {[
                    'Profissionais verificados e avaliados',
                    'Publique vagas em minutos',
                    'Contratação sem burocracia trabalhista',
                    'Pagamento seguro via plataforma',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle
                        size={17}
                        className="flex-shrink-0 mt-0.5"
                        style={{ color: 'var(--qe-success)' }}
                      />
                      <span className="text-[14px] text-qe-gray-700 font-sans leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-1">
                  <Link to="/para-empresas">
                    <Button variant="ghost" size="sm">
                      Saiba mais →
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════ DEPOIMENTOS */}
        <section className="py-20 px-4 bg-qe-bg-page">
          <motion.div
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={testimonialsRef as any}
            variants={staggerContainer}
            initial="hidden"
            animate={testimonialsInView ? 'visible' : 'hidden'}
            className="max-w-5xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-[28px] md:text-[36px] font-bold text-qe-gray-900 font-sans">
                O que dizem nossos usuários
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Depoimento — freelancer */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-5 p-7 bg-qe-white rounded-qe-lg border border-qe-gray-200 shadow-qe-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar name="João Silva" size="md" />
                  <div className="flex flex-col gap-1">
                    <p className="text-[15px] font-bold text-qe-gray-900 font-sans leading-none">
                      João Silva
                    </p>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-qe-pill text-[11px] font-bold uppercase tracking-[0.6px] font-sans w-fit"
                      style={{
                        backgroundColor: 'var(--qe-yellow-subtle)',
                        color: 'var(--qe-yellow-text)',
                      }}
                    >
                      Garçom · Food Service
                    </span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-[18px]" style={{ color: 'var(--qe-yellow)' }}>
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-[15px] text-qe-gray-600 leading-relaxed font-sans">
                  "Fiz meu primeiro extra em uma semana. O pagamento caiu no mesmo dia do checkout.
                  Recomendo demais."
                </p>
              </motion.div>

              {/* Depoimento — empresa */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-5 p-7 bg-qe-white rounded-qe-lg border border-qe-gray-200 shadow-qe-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar name="Restaurante Bella Vista" size="md" />
                  <div className="flex flex-col gap-1">
                    <p className="text-[15px] font-bold text-qe-gray-900 font-sans leading-none">
                      Restaurante Bella Vista
                    </p>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-qe-pill text-[11px] font-bold uppercase tracking-[0.6px] font-sans w-fit"
                      style={{
                        backgroundColor: 'var(--qe-yellow-subtle)',
                        color: 'var(--qe-yellow-text)',
                      }}
                    >
                      Empresa · Food Service
                    </span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-[18px]" style={{ color: 'var(--qe-yellow)' }}>
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-[15px] text-qe-gray-600 leading-relaxed font-sans">
                  "Precisei de um garçom para um evento de última hora. Em 2 horas tinha alguém
                  confirmado. Plataforma incrível."
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════ CTA FINAL */}
        <section className="px-4 bg-qe-navy" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
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
              <span
                className="inline-flex items-center px-4 py-1.5 rounded-qe-pill border text-[11px] font-bold tracking-[0.8px] uppercase font-sans"
                style={{ borderColor: 'var(--qe-gray-700)', color: 'var(--qe-yellow)' }}
              >
                COMECE AGORA
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-[30px] md:text-[44px] font-bold leading-[1.1] mb-4 font-sans" style={{ color: 'var(--qe-white)' }}>
              Faça parte do maior marketplace
              <br />
              de food service do{' '}
              <span style={{ color: 'var(--qe-yellow)' }}>Brasil.</span>
            </h2>

            {/* Subtitle */}
            <p className="text-[16px] mb-10 leading-relaxed font-sans" style={{ color: 'var(--qe-gray-400)' }}>
              Mais de 2.400 profissionais e 340 empresas
              <br className="hidden sm:block" />
              já estão na plataforma.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/para-freelancers" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="sm:w-auto sm:min-w-[220px]">
                  Quero trabalhar →
                </Button>
              </Link>
              <Link
                to="/para-empresas"
                className="inline-flex items-center justify-center gap-2 font-semibold font-sans rounded-qe-pill px-8 min-h-[52px] w-full sm:w-auto sm:min-w-[160px] transition-colors text-[17px]"
                style={{
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  color: 'var(--qe-white)',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    'rgba(255,255,255,0.1)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
                }}
              >
                Sou empresa
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
