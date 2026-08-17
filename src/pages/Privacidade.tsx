import { LandingHeader } from '@/components/layout/LandingHeader'

const SECOES = [
  { id: 'introducao', titulo: '1. Introdução e Controlador dos Dados' },
  { id: 'dados-coletados', titulo: '2. Dados Pessoais Coletados' },
  { id: 'finalidade', titulo: '3. Finalidade do Tratamento' },
  { id: 'base-legal', titulo: '4. Base Legal (LGPD)' },
  { id: 'compartilhamento', titulo: '5. Compartilhamento de Dados' },
  { id: 'seguranca', titulo: '6. Armazenamento e Segurança' },
  { id: 'retencao', titulo: '7. Retenção e Eliminação' },
  { id: 'direitos', titulo: '8. Seus Direitos como Titular' },
  { id: 'cookies', titulo: '9. Cookies e Tecnologias Similares' },
  { id: 'criancas', titulo: '10. Uso por Menores de Idade' },
  { id: 'alteracoes', titulo: '11. Alterações Desta Política' },
  { id: 'contato', titulo: '12. Contato e Encarregado (DPO)' },
]

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-qe-white flex flex-col font-sans">
      <LandingHeader />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-qe-gray-900 mb-2">Política de Privacidade</h1>
          <p className="text-qe-gray-500 mb-4">Última atualização: 17 de agosto de 2026</p>
          <p className="text-qe-gray-600 mb-8 leading-relaxed">
            Esta Política de Privacidade descreve como a Quero Extra coleta, usa,
            compartilha e protege os dados pessoais de Freelancers e Empresas que utilizam
            nossa Plataforma, em conformidade com a Lei Geral de Proteção de Dados Pessoais
            (Lei nº 13.709/2018 — "LGPD").
          </p>

          {/* Índice */}
          <nav className="bg-qe-gray-50 border border-qe-gray-100 rounded-qe-sm p-5 mb-10">
            <p className="text-[11px] font-bold text-qe-gray-500 uppercase tracking-wider mb-3">
              Índice
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {SECOES.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-[14px] text-qe-gray-600 hover:text-qe-black hover:underline underline-offset-2"
                  >
                    {s.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-10 text-qe-gray-700 leading-relaxed">
            <section id="introducao">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">
                1. Introdução e Controlador dos Dados
              </h2>
              <p>
                A controladora dos dados pessoais tratados por meio da Plataforma é [razão
                social e CNPJ da empresa responsável] ("Quero Extra"). Esta política se
                aplica a todos os usuários da Plataforma — Freelancers, Empresas e
                visitantes do site.
              </p>
            </section>

            <section id="dados-coletados">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">2. Dados Pessoais Coletados</h2>
              <p className="mb-3">Coletamos as seguintes categorias de dados:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Dados cadastrais</strong>: nome, e-mail, celular, senha (armazenada
                  de forma criptografada), foto de perfil e, no caso de Empresas, CNPJ ou
                  CPF e área de atuação.
                </li>
                <li>
                  <strong>Dados de endereço</strong>: CEP, logradouro, bairro, cidade e
                  estado, utilizados no cadastro financeiro do Freelancer.
                </li>
                <li>
                  <strong>Dados financeiros e de verificação de identidade (KYC)</strong>:
                  CPF, data de nascimento, nome da mãe, faixa de renda, ocupação, faixa
                  patrimonial, declaração de Pessoa Politicamente Exposta (PEP), chave Pix e
                  documentos de identificação oficiais (ex.: RG, CNH), exigidos para que o
                  Freelancer possa receber pagamentos, conforme regulamentação aplicável a
                  instituições de pagamento e normas de prevenção à lavagem de dinheiro.
                </li>
                <li>
                  <strong>Documentos de verificação de Empresas</strong>: contrato social,
                  documento de identidade do responsável, certificado de MEI ou equivalentes,
                  usados para aprovação do cadastro empresarial.
                </li>
                <li>
                  <strong>Dados de uso da Plataforma</strong>: histórico de vagas,
                  candidaturas, check-ins/check-outs, avaliações, transações e comunicações
                  com o suporte.
                </li>
              </ul>
            </section>

            <section id="finalidade">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">3. Finalidade do Tratamento</h2>
              <p className="mb-3">Utilizamos os dados coletados para:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>criar, autenticar e gerenciar contas de usuário;</li>
                <li>
                  viabilizar a conexão entre Freelancers e Empresas e a publicação/busca de
                  vagas;
                </li>
                <li>
                  processar pagamentos via Pix, incluindo a verificação de identidade exigida
                  pela instituição de pagamento parceira e o cumprimento de obrigações legais
                  e regulatórias de prevenção a fraude e lavagem de dinheiro;
                </li>
                <li>
                  enviar comunicações operacionais (confirmação de pagamento, status de
                  candidatura, avisos de disputa, códigos de verificação) e, quando
                  autorizado, comunicações de marketing;
                </li>
                <li>garantir a segurança da Plataforma e prevenir fraudes; e</li>
                <li>cumprir obrigações legais e regulatórias aplicáveis.</li>
              </ul>
            </section>

            <section id="base-legal">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">4. Base Legal (LGPD)</h2>
              <p className="mb-3">O tratamento de dados pessoais pela Quero Extra se fundamenta, conforme o caso, em:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>execução de contrato</strong> (art. 7º, V), para viabilizar o uso
                  da Plataforma e a prestação dos serviços de intermediação;
                </li>
                <li>
                  <strong>cumprimento de obrigação legal ou regulatória</strong> (art. 7º,
                  II), especialmente quanto aos dados de verificação de identidade (KYC)
                  exigidos da instituição de pagamento parceira;
                </li>
                <li>
                  <strong>legítimo interesse</strong> (art. 7º, IX), para prevenção a fraudes
                  e segurança da Plataforma; e
                </li>
                <li>
                  <strong>consentimento</strong> (art. 7º, I), quando aplicável, para envio
                  de comunicações de marketing.
                </li>
              </ul>
            </section>

            <section id="compartilhamento">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">5. Compartilhamento de Dados</h2>
              <p className="mb-3">
                Para o funcionamento da Plataforma, dados básicos de perfil do Freelancer
                (nome, habilidades, nota média, telefone — este último apenas após a
                confirmação do pagamento de um Extra) são compartilhados com a Empresa
                contratante, e dados básicos da Empresa (nome, nota média) são visíveis aos
                Freelancers. Não vendemos dados pessoais a terceiros.
              </p>
              <p className="mb-3">Compartilhamos dados pessoais com os seguintes operadores, estritamente para viabilizar o funcionamento da Plataforma:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Instituição de pagamento parceira (ValidaPay, sobre infraestrutura
                  Celcoin)</strong>, autorizada a funcionar pelo Banco Central do Brasil, para
                  processamento de pagamentos via Pix, verificação de identidade (KYC) e
                  cumprimento de obrigações regulatórias do setor de pagamentos;
                </li>
                <li>
                  <strong>Provedor de infraestrutura e banco de dados (Supabase)</strong>,
                  para armazenamento seguro dos dados da Plataforma;
                </li>
                <li>
                  <strong>Provedor de envio de e-mails (Resend)</strong>, para envio de
                  comunicações transacionais (confirmações, códigos de verificação, avisos);
                </li>
                <li>
                  autoridades públicas, quando exigido por lei, ordem judicial ou
                  requisição regulatória.
                </li>
              </ul>
            </section>

            <section id="seguranca">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">6. Armazenamento e Segurança</h2>
              <p>
                Adotamos medidas técnicas e organizacionais para proteger os dados pessoais
                contra acesso não autorizado, perda, alteração ou vazamento, incluindo
                criptografia de senhas, controle de acesso por perfil de usuário e uso de
                links de acesso temporário e assinado para visualização de documentos
                sensíveis. Nenhum sistema é totalmente livre de risco, e nos comprometemos a
                notificar os titulares e a Autoridade Nacional de Proteção de Dados (ANPD)
                em caso de incidente de segurança relevante, nos termos da LGPD.
              </p>
            </section>

            <section id="retencao">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">7. Retenção e Eliminação</h2>
              <p>
                Mantemos os dados pessoais pelo tempo necessário ao cumprimento das
                finalidades descritas nesta Política, incluindo o cumprimento de obrigações
                legais, regulatórias (ex.: guarda de registros financeiros exigida da
                instituição de pagamento) e para o exercício regular de direitos em eventuais
                disputas. Após esse período, os dados são eliminados ou anonimizados, salvo
                quando sua conservação for exigida por lei.
              </p>
            </section>

            <section id="direitos">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">8. Seus Direitos como Titular</h2>
              <p className="mb-3">Nos termos do art. 18 da LGPD, você pode solicitar, a qualquer momento:</p>
              <ul className="list-disc pl-5 space-y-1.5 mb-3">
                <li>confirmação da existência de tratamento e acesso aos seus dados;</li>
                <li>correção de dados incompletos, inexatos ou desatualizados;</li>
                <li>anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
                <li>portabilidade dos dados a outro fornecedor de serviço;</li>
                <li>eliminação dos dados tratados com base no seu consentimento;</li>
                <li>informação sobre entidades com as quais compartilhamos seus dados; e</li>
                <li>revogação do consentimento, quando aplicável.</li>
              </ul>
              <p>
                Solicitações podem ser feitas pelo canal indicado na Seção 12. Algumas
                informações — em especial dados de verificação de identidade e histórico
                financeiro — podem ser mantidas mesmo após a solicitação de eliminação,
                quando sua guarda for exigida por obrigação legal ou regulatória aplicável à
                instituição de pagamento.
              </p>
            </section>

            <section id="cookies">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">9. Cookies e Tecnologias Similares</h2>
              <p>
                Utilizamos cookies e tecnologias similares essenciais ao funcionamento da
                Plataforma, como manutenção de sessão de login. Não utilizamos cookies de
                rastreamento publicitário de terceiros.
              </p>
            </section>

            <section id="criancas">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">10. Uso por Menores de Idade</h2>
              <p>
                A Plataforma é destinada a maiores de 18 anos. Não coletamos
                intencionalmente dados de menores de idade.
              </p>
            </section>

            <section id="alteracoes">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">11. Alterações Desta Política</h2>
              <p>
                Podemos atualizar esta Política periodicamente para refletir mudanças em
                nossas práticas ou na legislação aplicável. Alterações relevantes serão
                comunicadas por e-mail ou aviso na Plataforma.
              </p>
            </section>

            <section id="contato">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">12. Contato e Encarregado (DPO)</h2>
              <p>
                Para exercer seus direitos ou tirar dúvidas sobre o tratamento de seus dados
                pessoais, entre em contato com nosso encarregado de proteção de dados (DPO)
                pelo e-mail{' '}
                <a
                  href="mailto:suporte@queroextra.app.br"
                  className="font-semibold text-qe-black underline underline-offset-2"
                >
                  suporte@queroextra.app.br
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
