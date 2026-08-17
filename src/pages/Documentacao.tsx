import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  UserPlus,
  Search,
  QrCode,
  Wallet,
  ShieldCheck,
  Briefcase,
  Star,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { LandingHeader } from '@/components/layout/LandingHeader'
import boneco from '@/assets/queroExtra-boneco.png'

// ─── Passo a passo ──────────────────────────────────────────────────────────

interface Passo {
  icon: LucideIcon
  title: string
  description: string
}

const PASSOS_FREELANCER: Passo[] = [
  {
    icon: UserPlus,
    title: 'Cadastro e verificação',
    description:
      'Crie sua conta com CPF, celular e habilidades. Depois, complete o cadastro financeiro (endereço, dados e chave Pix) e envie seus documentos para verificação de identidade — necessário para poder receber pagamentos.',
  },
  {
    icon: Search,
    title: 'Encontre um Extra',
    description:
      'Busque vagas por categoria, cidade ou valor, veja os detalhes e se candidate com um toque. Você acompanha o status da candidatura em tempo real.',
  },
  {
    icon: QrCode,
    title: 'Check-in e check-out',
    description:
      'No dia do Extra, digite o código de 6 dígitos informado pela empresa para confirmar sua chegada, e outro ao final do turno para confirmar a saída.',
  },
  {
    icon: Wallet,
    title: 'Receba na sua conta',
    description:
      'Assim que o check-out é confirmado, o valor é liberado na sua Carteira e pode ser sacado via Pix a qualquer momento.',
  },
]

const PASSOS_EMPRESA: Passo[] = [
  {
    icon: UserPlus,
    title: 'Cadastro e aprovação',
    description:
      'Cadastre sua empresa e envie os documentos de verificação. Nossa equipe analisa e aprova o acesso para publicação de vagas.',
  },
  {
    icon: Briefcase,
    title: 'Publique uma vaga',
    description:
      'Descreva a função, o local, o valor e o horário do Extra. Vagas urgentes ganham destaque para os freelancers próximos.',
  },
  {
    icon: ShieldCheck,
    title: 'Aprove e pague com segurança',
    description:
      'Analise os candidatos e aprove o profissional escolhido. O pagamento é feito via Pix e fica retido pela plataforma até a confirmação do turno — o contato do freelancer só é liberado depois do pagamento confirmado.',
  },
  {
    icon: Star,
    title: 'Avalie o profissional',
    description:
      'Ao final do turno, avalie o freelancer. As avaliações ajudam toda a comunidade a contratar com mais confiança.',
  },
]

// ─── FAQ ─────────────────────────────────────────────────────────────────────

interface FaqItem {
  pergunta: string
  resposta: React.ReactNode
}

interface FaqGrupo {
  categoria: string
  itens: FaqItem[]
}

const FAQ_GRUPOS: FaqGrupo[] = [
  {
    categoria: 'Geral',
    itens: [
      {
        pergunta: 'O que é a Quero Extra?',
        resposta:
          'É uma plataforma que conecta profissionais autônomos do food service (garçons, bartenders, cozinha, recepção, limpeza, segurança e outros) a empresas que precisam de reforço pontual de equipe, cuidando de toda a jornada: divulgação da vaga, candidatura, pagamento via Pix e avaliação.',
      },
      {
        pergunta: 'Existe vínculo empregatício com a Quero Extra?',
        resposta:
          'Não. A Quero Extra atua como intermediadora tecnológica e processadora de pagamentos. O freelancer presta serviço de forma autônoma e eventual diretamente para a empresa contratante em cada Extra, sem subordinação, jornada fixa ou exclusividade impostas pela plataforma. Mais detalhes nos nossos Termos de Uso.',
      },
      {
        pergunta: 'A plataforma é segura?',
        resposta:
          'Sim. Todo freelancer passa por verificação de identidade antes de poder receber pagamentos, e todo pagamento é processado por uma instituição de pagamento autorizada pelo Banco Central, com o valor retido até a confirmação do turno.',
      },
    ],
  },
  {
    categoria: 'Para Freelancers',
    itens: [
      {
        pergunta: 'Preciso pagar algo para me cadastrar?',
        resposta: 'Não. O cadastro é gratuito. A taxa da plataforma é cobrada apenas da empresa contratante em cada Extra.',
      },
      {
        pergunta: 'Por que preciso enviar documentos e dados financeiros?',
        resposta:
          'Para poder receber pagamentos via Pix, a instituição de pagamento parceira exige uma verificação de identidade (KYC), como determina a regulamentação do setor financeiro. Sem essa verificação aprovada, não é possível se candidatar a vagas.',
      },
      {
        pergunta: 'Quando recebo o pagamento de um Extra?',
        resposta:
          'A empresa paga assim que aprova sua candidatura, mas o valor só é liberado para você depois que o check-out do turno é confirmado. A partir daí, pode ser sacado a qualquer momento para sua chave Pix.',
      },
      {
        pergunta: 'O que faço se algo der errado com o pagamento?',
        resposta:
          'Você pode abrir uma disputa direto na sua Carteira, selecionando a transação e descrevendo o problema. Nossa equipe analisa e resolve o caso.',
      },
    ],
  },
  {
    categoria: 'Para Empresas',
    itens: [
      {
        pergunta: 'Quanto custa contratar pela Quero Extra?',
        resposta: 'Você paga o valor do turno combinado mais uma taxa fixa de intermediação, exibida antes da confirmação do pagamento.',
      },
      {
        pergunta: 'Como funciona a segurança do pagamento?',
        resposta:
          'O valor fica retido pela plataforma desde a confirmação do Pix até o check-out do turno. Assim, você só libera o pagamento definitivamente depois que o serviço foi realizado.',
      },
      {
        pergunta: 'Quando recebo o contato do freelancer aprovado?',
        resposta: 'Assim que o pagamento é confirmado. Isso protege as duas partes contra combinações feitas fora da plataforma.',
      },
      {
        pergunta: 'Posso bloquear um freelancer específico?',
        resposta:
          'Sim. Você pode bloquear um prestador apenas para as suas próprias vagas a qualquer momento, sem que isso afete o acesso dele ao restante da plataforma.',
      },
    ],
  },
]

const FaqAccordion: React.FC<{ grupo: FaqGrupo }> = ({ grupo }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0)

  return (
    <div>
      <h3 className="text-[13px] font-bold text-qe-yellow uppercase tracking-[0.8px] mb-3">
        {grupo.categoria}
      </h3>
      <div className="border border-qe-gray-100 rounded-qe-md divide-y divide-qe-gray-100 overflow-hidden">
        {grupo.itens.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={item.pergunta}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-qe-gray-50 transition-colors"
              >
                <span className="text-[15px] font-semibold text-qe-gray-900">{item.pergunta}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-qe-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-[14px] text-qe-gray-600 leading-relaxed">
                  {item.resposta}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const PassoCard: React.FC<{ passo: Passo; index: number }> = ({ passo, index }) => {
  const Icon = passo.icon
  return (
    <div className="flex gap-4 bg-qe-white border border-qe-gray-100 rounded-qe-md p-5 shadow-qe-sm">
      <div className="shrink-0 w-11 h-11 rounded-full bg-qe-yellow/15 flex items-center justify-center">
        <Icon size={20} className="text-qe-black" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-qe-gray-400 uppercase tracking-wider mb-1">
          Passo {index + 1}
        </p>
        <h4 className="text-[16px] font-bold text-qe-gray-900 mb-1">{passo.title}</h4>
        <p className="text-[14px] text-qe-gray-600 leading-relaxed">{passo.description}</p>
      </div>
    </div>
  )
}

export default function Documentacao() {
  return (
    <div className="min-h-screen bg-qe-white flex flex-col font-sans">
      <LandingHeader />
      <main className="flex-grow pt-24 pb-16">
        {/* Hero */}
        <section className="px-4 sm:px-6 pb-12 text-center">
          <div className="max-w-2xl mx-auto">
            <img src={boneco} alt="" className="h-14 w-auto mx-auto mb-5" aria-hidden="true" />
            <h1 className="text-3xl sm:text-4xl font-bold text-qe-gray-900 mb-3">
              Central de Ajuda
            </h1>
            <p className="text-[16px] text-qe-gray-500 leading-relaxed">
              Entenda como a Quero Extra funciona, do cadastro ao pagamento, e tire suas
              dúvidas mais comuns.
            </p>
          </div>
        </section>

        {/* Como funciona — Freelancer */}
        <section className="px-4 sm:px-6 py-10 bg-qe-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-qe-gray-900 mb-1">Como funciona para Freelancers</h2>
            <p className="text-qe-gray-500 mb-6">Do cadastro ao dinheiro na sua conta.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PASSOS_FREELANCER.map((p, i) => (
                <PassoCard key={p.title} passo={p} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona — Empresa */}
        <section className="px-4 sm:px-6 py-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-qe-gray-900 mb-1">Como funciona para Empresas</h2>
            <p className="text-qe-gray-500 mb-6">Da publicação da vaga ao turno concluído.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PASSOS_EMPRESA.map((p, i) => (
                <PassoCard key={p.title} passo={p} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Pagamento e segurança */}
        <section className="px-4 sm:px-6 py-10 bg-qe-black text-qe-white">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start gap-6">
            <div className="shrink-0 w-12 h-12 rounded-full bg-qe-yellow flex items-center justify-center">
              <ShieldCheck size={24} className="text-qe-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Pagamento com segurança, do início ao fim</h2>
              <p className="text-white/70 leading-relaxed">
                Todo pagamento passa por uma instituição de pagamento autorizada pelo Banco
                Central e fica retido pela plataforma até o check-out do turno ser
                confirmado — só então o valor é liberado ao freelancer. Se algo sair do
                combinado, empresa e freelancer podem abrir uma disputa a qualquer momento,
                direto pelo aplicativo.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 sm:px-6 py-14">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-qe-gray-900 mb-2">
                Perguntas Frequentes
              </h2>
              <p className="text-qe-gray-500">As dúvidas mais comuns sobre a plataforma.</p>
            </div>
            <div className="space-y-8">
              {FAQ_GRUPOS.map((grupo) => (
                <FaqAccordion key={grupo.categoria} grupo={grupo} />
              ))}
            </div>
          </div>
        </section>

        {/* Não achou? */}
        <section className="px-4 sm:px-6 pb-4">
          <div className="max-w-3xl mx-auto bg-qe-gray-50 border border-qe-gray-100 rounded-qe-md p-8 text-center">
            <MessageCircle size={28} className="mx-auto mb-3 text-qe-gray-400" />
            <h3 className="text-[18px] font-bold text-qe-gray-900 mb-1">Não encontrou sua resposta?</h3>
            <p className="text-[14px] text-qe-gray-500 mb-5">
              Fale com nossa equipe de suporte, respondemos o mais rápido possível.
            </p>
            <a href="mailto:suporte@queroextra.app.br">
              <Button variant="primary" size="md">Falar com o suporte</Button>
            </a>
            <p className="text-[12px] text-qe-gray-400 mt-4">
              Ou consulte os{' '}
              <Link to="/termos" className="underline underline-offset-2 hover:text-qe-gray-700">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link to="/privacidade" className="underline underline-offset-2 hover:text-qe-gray-700">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
