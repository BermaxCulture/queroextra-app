import { Link } from 'react-router-dom'
import { LandingHeader } from '@/components/layout/LandingHeader'

const SECOES = [
  { id: 'aceitacao', titulo: '1. Aceitação dos Termos' },
  { id: 'servico', titulo: '2. Descrição do Serviço e Papel da Quero Extra' },
  { id: 'cadastro', titulo: '3. Cadastro, Conta e Verificação de Identidade' },
  { id: 'vinculo', titulo: '4. Natureza da Relação Entre as Partes' },
  { id: 'obrigacoes-freelancer', titulo: '5. Obrigações do Freelancer' },
  { id: 'obrigacoes-empresa', titulo: '6. Obrigações da Empresa' },
  { id: 'pagamentos', titulo: '7. Pagamentos, Retenção e Repasse de Valores' },
  { id: 'cancelamento', titulo: '8. Cancelamento e Não Comparecimento' },
  { id: 'fraude', titulo: '9. Prevenção à Fraude e à Circunvenção da Plataforma' },
  { id: 'disputas', titulo: '10. Disputas' },
  { id: 'avaliacoes', titulo: '11. Avaliações e Conteúdo do Usuário' },
  { id: 'discriminacao', titulo: '12. Vedação à Discriminação' },
  { id: 'imagem', titulo: '13. Uso de Nome e Imagem no Perfil' },
  { id: 'contas', titulo: '14. Suspensão, Bloqueio e Encerramento de Conta' },
  { id: 'disponibilidade', titulo: '15. Disponibilidade e Falhas da Plataforma' },
  { id: 'propriedade', titulo: '16. Propriedade Intelectual e Confidencialidade' },
  { id: 'dados', titulo: '17. Proteção de Dados Pessoais' },
  { id: 'responsabilidade', titulo: '18. Limitação de Responsabilidade' },
  { id: 'alteracoes', titulo: '19. Alterações Destes Termos' },
  { id: 'lei', titulo: '20. Legislação Aplicável e Foro' },
  { id: 'contato', titulo: '21. Contato' },
]

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-qe-white flex flex-col font-sans">
      <LandingHeader />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-qe-gray-900 mb-2">Termos de Uso</h1>
          <p className="text-qe-gray-500 mb-4">Última atualização: 17 de agosto de 2026</p>
          <p className="text-qe-gray-600 mb-8 leading-relaxed">
            <strong>A leitura destes Termos é obrigatória.</strong> Ao criar uma conta ou
            utilizar a Plataforma, você declara ter lido, compreendido e aceito
            integralmente estes termos, não sendo admitido seu desconhecimento
            posteriormente. O uso continuado da Plataforma após a publicação de alterações
            relevantes constitui aceitação dos novos termos.
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
            <section id="aceitacao">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar a Plataforma, você concorda em cumprir e estar vinculado a
                estes Termos de Uso e à nossa{' '}
                <Link to="/privacidade" className="font-semibold text-qe-black underline underline-offset-2">
                  Política de Privacidade
                </Link>
                . Se você não concordar com qualquer parte destes termos, não deve criar uma
                conta nem utilizar os serviços da Quero Extra. A tolerância quanto ao
                eventual descumprimento de qualquer obrigação aqui prevista não significa
                renúncia ao direito de exigi-la posteriormente.
              </p>
            </section>

            <section id="servico">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">
                2. Descrição do Serviço e Papel da Quero Extra
              </h2>
              <p className="mb-3">
                A Quero Extra é uma plataforma tecnológica de intermediação que conecta
                profissionais autônomos do setor de food service ("Freelancers") a
                estabelecimentos e empresas contratantes ("Empresas") interessados em
                contratar mão de obra pontual, temporária ou eventual ("Extras").
              </p>
              <p className="mb-3">
                Os usuários reconhecem e concordam que a Quero Extra{' '}
                <strong>
                  não é uma agência de emprego, de colocação profissional ou de
                  terceirização de mão de obra
                </strong>
                , atuando exclusivamente como plataforma tecnológica que possibilita a
                colaboração entre quem oferece e quem demanda o serviço eventual. A
                atividade de prestação de serviços em si, bem como quaisquer perdas,
                prejuízos ou danos dela decorrentes, são de responsabilidade exclusiva de
                quem a executa e de quem a contrata.
              </p>
              <p className="mb-3">Nesse papel de intermediadora, a Quero Extra:</p>
              <ul className="list-disc pl-5 space-y-1.5 mb-3">
                <li>
                  não realiza processo seletivo dos Freelancers além da verificação
                  cadastral e de identidade descrita na Seção 3;
                </li>
                <li>
                  não exige disponibilidade nem periodicidade mínima de nenhum Freelancer
                  para uso da Plataforma;
                </li>
                <li>
                  não fiscaliza, dirige ou supervisiona a forma como o serviço é executado
                  pelo Freelancer no estabelecimento da Empresa; e
                </li>
                <li>
                  processa, por meio de instituição de pagamento parceira devidamente
                  autorizada a funcionar pelo Banco Central do Brasil, os pagamentos
                  referentes aos Extras contratados entre Empresas e Freelancers.
                </li>
              </ul>
              <p>
                A Quero Extra pode estabelecer critérios mínimos de qualidade (como o
                sistema de avaliações da Seção 11) e analisar reclamações entre usuários,
                sem que isso configure direção, controle ou fiscalização da execução do
                serviço.
              </p>
            </section>

            <section id="cadastro">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">
                3. Cadastro, Conta e Verificação de Identidade
              </h2>
              <p className="mb-3">
                Para utilizar a Plataforma, é necessário criar uma conta fornecendo
                informações verdadeiras, completas e atualizadas. O uso da Plataforma é
                restrito a maiores de 18 anos e civilmente capazes. Salvo autorização
                expressa da Quero Extra, cada CPF ou CNPJ pode manter apenas uma conta
                ativa.
              </p>
              <p className="mb-3">
                Empresas passam por um processo de análise cadastral, incluindo envio de
                documentos comprobatórios (ex.: contrato social, documento de identidade do
                responsável, certificado de MEI), sendo a aprovação da conta condição para
                publicação de vagas.
              </p>
              <p className="mb-3">
                Freelancers, para poderem se candidatar a vagas e receber pagamentos, devem
                concluir um cadastro financeiro adicional junto à instituição de pagamento
                parceira da Quero Extra, incluindo verificação de identidade (KYC —{' '}
                <em>Know Your Customer</em>), conforme exigido pela regulamentação aplicável
                a instituições de pagamento e pelas normas de prevenção à lavagem de
                dinheiro. A recusa em fornecer esses dados impede o recebimento de valores
                pela Plataforma.
              </p>
              <p className="mb-3">
                É de responsabilidade exclusiva do usuário a veracidade dos dados e
                documentos informados, não respondendo a Quero Extra por qualquer ato
                ilícito do usuário, incluindo fraude ou falsidade ideológica. Dados
                desatualizados podem impedir o acesso, o uso da Plataforma ou o recebimento
                de valores devidos, não sendo a Quero Extra responsável por erro ou ausência
                de pagamento decorrente de informação incorreta fornecida pelo próprio
                usuário.
              </p>
              <p>
                Login e senha são pessoais e intransferíveis, cabendo ao usuário zelar por
                sua confidencialidade e notificar a Quero Extra imediatamente em caso de
                suspeita de uso não autorizado de sua conta.
              </p>
            </section>

            <section id="vinculo">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">
                4. Natureza da Relação Entre as Partes — Ausência de Vínculo Empregatício
              </h2>
              <p className="mb-3">
                O Freelancer atua na Plataforma como <strong>profissional autônomo</strong>,
                prestando serviços eventuais e de curta duração diretamente à Empresa
                contratante de cada Extra, por sua livre conta e risco, sem qualquer relação
                de emprego, subordinação, exclusividade ou habitualidade em relação à Quero
                Extra.
              </p>
              <p className="mb-3">O Freelancer, ao utilizar a Plataforma, declara e reconhece que:</p>
              <ul className="list-disc pl-5 space-y-1.5 mb-3">
                <li>
                  tem total liberdade para aceitar ou recusar candidaturas a vagas, sem
                  qualquer determinação, escala fixa ou controle de jornada imposto pela
                  Quero Extra;
                </li>
                <li>
                  pode prestar serviços simultaneamente para outras empresas e, inclusive,
                  para outras plataformas concorrentes, não havendo qualquer exclusividade;
                </li>
                <li>
                  é responsável por sua própria situação fiscal e previdenciária (ex.:
                  inscrição como MEI ou contribuinte individual perante o INSS, quando
                  aplicável), bem como pelo recolhimento de tributos incidentes sobre os
                  valores recebidos;
                </li>
                <li>
                  não possui vínculo empregatício, societário ou de representação com a
                  Quero Extra, nem com as Empresas contratantes, em razão do uso da
                  Plataforma; e
                </li>
                <li>
                  a relação estabelecida em cada Extra é de natureza civil, eventual e
                  autônoma, limitada à execução do serviço especificado na vaga aceita.
                </li>
              </ul>
              <p className="mb-3">
                A Empresa, por sua vez, declara estar ciente de que a contratação de
                Freelancers via Quero Extra não configura relação de emprego, e se
                compromete a não exercer subordinação direta, controle de jornada ou
                exclusividade que caracterizem vínculo empregatício nos termos da
                legislação trabalhista, sendo a Empresa exclusivamente responsável por
                qualquer contingência decorrente do descumprimento desse compromisso.
              </p>
              <p>
                A Quero Extra reserva-se o direito de suspender contas que utilizem a
                Plataforma de forma incompatível com a natureza eventual e autônoma do
                serviço aqui descrita.
              </p>
            </section>

            <section id="obrigacoes-freelancer">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">5. Obrigações do Freelancer</h2>
              <p className="mb-3">Sem prejuízo de outras obrigações previstas nestes Termos, o Freelancer se compromete a:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  empenhar seus melhores esforços na execução do Extra aceito, respeitando
                  as normas de segurança e funcionamento do estabelecimento contratante;
                </li>
                <li>
                  garantir que possui as qualificações e habilidades informadas em seu
                  perfil;
                </li>
                <li>
                  comparecer ao Extra confirmado no horário combinado, realizando o
                  check-in e o check-out pelo aplicativo para validar a execução do serviço;
                </li>
                <li>zelar por pertences e equipamentos eventualmente disponibilizados pela Empresa;</li>
                <li>
                  providenciar, por conta própria, uniforme, alimentação e transporte, salvo
                  disposição diversa combinada diretamente com a Empresa;
                </li>
                <li>
                  não repassar a terceiros um Extra já aceito — caso não possa comparecer,
                  cancelar a candidatura pelo aplicativo com a maior antecedência possível;
                </li>
                <li>
                  responder pelos danos que causar à Empresa ou a terceiros, dolosa ou
                  culposamente, durante a execução do serviço; e
                </li>
                <li>
                  cumprir a legislação aplicável à sua atividade, incluindo obrigações
                  fiscais e previdenciárias.
                </li>
              </ul>
            </section>

            <section id="obrigacoes-empresa">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">6. Obrigações da Empresa</h2>
              <p className="mb-3">Sem prejuízo de outras obrigações previstas nestes Termos, a Empresa se compromete a:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>descrever cada vaga com precisão (função, valor, local, horário e requisitos);</li>
                <li>
                  pagar integralmente o valor combinado antes do início do Extra, conforme
                  fluxo descrito na Seção 7;
                </li>
                <li>
                  não exigir do Freelancer, sob nenhuma hipótese, o pagamento de qualquer
                  taxa, comissão ou valor para ter acesso a uma oportunidade de trabalho;
                </li>
                <li>
                  prover ambiente de trabalho seguro, adequado e livre de qualquer forma de
                  assédio ou discriminação;
                </li>
                <li>não publicar vagas com critérios discriminatórios (Seção 12); e</li>
                <li>responder pelos danos que causar ao Freelancer durante a execução do serviço.</li>
              </ul>
            </section>

            <section id="pagamentos">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">
                7. Pagamentos, Retenção e Repasse de Valores
              </h2>
              <p className="mb-3">
                Todos os pagamentos entre Empresa e Freelancer são processados
                exclusivamente pela Plataforma, via Pix, por meio de instituição de
                pagamento parceira. A Quero Extra não realiza gestão financeira própria dos
                valores transacionados: os recursos transitam por conta escritural mantida
                junto à instituição de pagamento até sua liberação, nos termos abaixo.
              </p>
              <ol className="list-decimal pl-5 space-y-2 mb-3">
                <li>
                  Ao aprovar um Freelancer para um Extra, a Empresa deve pagar, via Pix, o
                  valor do turno acordado acrescido da taxa de intermediação da Quero Extra
                  (exibida antes da confirmação do pagamento).
                </li>
                <li>
                  Confirmado o pagamento, o valor correspondente ao Freelancer fica{' '}
                  <strong>retido</strong> pela instituição de pagamento — ainda não
                  disponível para saque — até a confirmação da execução do serviço.
                </li>
                <li>
                  A execução é confirmada por meio dos códigos de check-in (início) e
                  check-out (término) do turno, gerados e inseridos pelas partes no
                  aplicativo no momento do Extra.
                </li>
                <li>
                  Confirmado o check-out, o valor devido ao Freelancer é{' '}
                  <strong>liberado</strong> automaticamente, podendo ser sacado para a chave
                  Pix de sua própria titularidade, previamente validada no cadastro
                  financeiro.
                </li>
              </ol>
              <p className="mb-3">
                A taxa de intermediação cobrada pela Quero Extra é informada ao usuário
                antes da confirmação de cada pagamento e pode ser alterada mediante aviso
                prévio na Plataforma. É vedado às partes efetuar, fora da Plataforma, o
                pagamento referente a um Extra nela originado, nos termos da Seção 9.
              </p>
              <p>
                Casos de divergência sobre a execução do serviço — não comparecimento,
                turno não realizado corretamente, entre outros — devem ser reportados pelo
                canal de disputas da Plataforma (Seção 10), e não são resolvidos
                automaticamente pelo fluxo padrão de liberação de pagamento.
              </p>
            </section>

            <section id="cancelamento">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">
                8. Cancelamento e Não Comparecimento
              </h2>
              <p className="mb-3">
                Candidaturas podem ser canceladas pelo Freelancer, e vagas podem ser
                canceladas pela Empresa, gratuitamente, enquanto nenhum pagamento tiver sido
                confirmado. Após a confirmação do pagamento, o cancelamento por qualquer das
                partes deve ser tratado pelo canal de disputas, que analisará a situação e
                decidirá pela liberação, estorno ou manutenção do valor conforme o caso.
              </p>
              <p>
                O não comparecimento injustificado de qualquer das partes a um Extra
                confirmado, bem como cancelamentos recorrentes em cima da hora, afetam a
                reputação (nota média) do usuário na Plataforma e podem ser considerados
                para fins de suspensão de conta, nos termos da Seção 14.
              </p>
            </section>

            <section id="fraude">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">
                9. Prevenção à Fraude e à Circunvenção da Plataforma
              </h2>
              <p className="mb-3">
                A Quero Extra não tolera condutas fraudulentas por parte de qualquer
                usuário, podendo suspender ou desativar contas, temporária ou
                definitivamente, sem necessidade de aviso prévio, além de reter valores
                relacionados a atividades suspeitas enquanto durar a análise do caso, e agir
                judicial ou extrajudicialmente contra os envolvidos.
              </p>
              <p>
                É vedado a Empresas e Freelancers que se conheceram por meio da Plataforma
                combinar a realização de um Extra nela originado, no todo ou em parte, fora
                da Plataforma, com o intuito de evitar o pagamento da taxa de intermediação
                devida à Quero Extra. O descumprimento desta cláusula pode acarretar a
                suspensão das contas envolvidas.
              </p>
            </section>

            <section id="disputas">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">10. Disputas</h2>
              <p className="mb-3">
                Empresa ou Freelancer podem abrir uma disputa relativa a um pagamento
                específico diretamente pelo aplicativo, descrevendo o problema ocorrido. A
                equipe de suporte da Quero Extra analisará o caso e poderá decidir por
                estornar o valor à Empresa, liberar o valor ao Freelancer, ou manter a
                situação sem alteração, conforme as evidências apresentadas por ambas as
                partes.
              </p>
              <p>
                A decisão da Quero Extra em uma disputa é tomada de boa-fé, com base nas
                informações disponíveis, e busca a solução mais razoável para o caso
                concreto, sem prejuízo do direito de qualquer das partes buscar as vias
                legais cabíveis.
              </p>
            </section>

            <section id="avaliacoes">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">
                11. Avaliações e Conteúdo do Usuário
              </h2>
              <p>
                Ao final de cada Extra, Empresa e Freelancer podem avaliar um ao outro. As
                avaliações devem refletir experiências reais e ser feitas de boa-fé,
                sendo vedado o uso de linguagem ofensiva, discriminatória ou difamatória. A
                Quero Extra pode remover avaliações que violem estas condições, mas não
                garante a exatidão do conteúdo gerado por usuários, não tendo ingerência ou
                responsabilidade sobre seu conteúdo.
              </p>
            </section>

            <section id="discriminacao">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">12. Vedação à Discriminação</h2>
              <p>
                É vedado a qualquer usuário publicar vagas, avaliar, aprovar ou recusar
                candidatos com base em critérios discriminatórios de raça, cor, etnia,
                origem, religião, sexo, orientação sexual, identidade de gênero, idade,
                deficiência ou convicção política. Contas que violem esta vedação estão
                sujeitas a suspensão imediata, sem prejuízo de outras medidas cabíveis.
              </p>
            </section>

            <section id="imagem">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">13. Uso de Nome e Imagem no Perfil</h2>
              <p className="mb-3">
                O nome e a foto de perfil do usuário são exibidos a outros usuários da
                Plataforma para fins de identificação e segurança nas contratações.
              </p>
              <p>
                A Quero Extra poderá utilizar nome, foto de perfil e depoimentos de usuários
                em materiais de divulgação da Plataforma (ex.: site, redes sociais) mediante
                autorização prévia e específica do usuário para essa finalidade, podendo tal
                autorização ser revogada a qualquer momento mediante contato com o suporte.
              </p>
            </section>

            <section id="contas">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">
                14. Suspensão, Bloqueio e Encerramento de Conta
              </h2>
              <p className="mb-3">A Quero Extra pode suspender, bloquear ou encerrar contas, temporária ou definitivamente, quando o usuário:</p>
              <ul className="list-disc pl-5 space-y-1.5 mb-3">
                <li>descumprir estes Termos ou a legislação aplicável;</li>
                <li>fornecer informações falsas no cadastro;</li>
                <li>apresentar indícios de fraude ou uso indevido da Plataforma;</li>
                <li>receber avaliações negativas recorrentes;</li>
                <li>
                  adotar comportamento agressivo, discriminatório ou antiético na execução
                  do serviço;
                </li>
                <li>burlar a Plataforma nos termos da Seção 9; ou</li>
                <li>em cumprimento a determinação judicial ou de autoridade competente.</li>
              </ul>
              <p>
                O usuário também pode encerrar sua própria conta a qualquer momento,
                mediante solicitação ao suporte, sem qualquer ônus, preservado o
                recebimento de valores já devidos por Extras realizados antes do
                encerramento, exceto em casos de fraude comprovada. Empresas ainda podem
                bloquear um Freelancer especificamente para suas próprias vagas, sem que
                isso afete o acesso do Freelancer ao restante da Plataforma.
              </p>
            </section>

            <section id="disponibilidade">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">
                15. Disponibilidade e Falhas da Plataforma
              </h2>
              <p>
                A Quero Extra não garante acesso contínuo e ininterrupto à Plataforma,
                podendo haver indisponibilidade temporária por motivos técnicos, manutenção
                programada ou caso fortuito/força maior. Não nos responsabilizamos por danos
                decorrentes de falhas de conexão à internet, do equipamento do usuário, ou
                de eventos fora do nosso controle razoável.
              </p>
            </section>

            <section id="propriedade">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">
                16. Propriedade Intelectual e Confidencialidade
              </h2>
              <p className="mb-3">
                A marca Quero Extra, o layout, o código-fonte e demais elementos da
                Plataforma são de propriedade da Quero Extra ou de seus licenciadores, sendo
                vedada a reprodução, cópia, engenharia reversa ou uso não autorizado.
              </p>
              <p>
                Informações técnicas, administrativas ou comerciais não públicas a que o
                usuário tenha acesso em razão do uso da Plataforma devem ser tratadas como
                confidenciais, sendo vedado seu uso para finalidade diversa da execução dos
                Extras contratados.
              </p>
            </section>

            <section id="dados">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">17. Proteção de Dados Pessoais</h2>
              <p>
                O tratamento de dados pessoais realizado pela Quero Extra é descrito em
                detalhes em nossa{' '}
                <Link to="/privacidade" className="font-semibold text-qe-black underline underline-offset-2">
                  Política de Privacidade
                </Link>
                , parte integrante destes Termos de Uso.
              </p>
            </section>

            <section id="responsabilidade">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">18. Limitação de Responsabilidade</h2>
              <p>
                A Quero Extra não se responsabiliza pelas ações, erros, omissões ou
                comportamento de usuários (Empresas ou Freelancers) durante a execução dos
                serviços contratados por meio da Plataforma, nem pela qualidade do serviço
                prestado, uma vez que não possui controle, gerência ou ingerência sobre a
                forma como o serviço é executado, cabendo à Quero Extra atuar como
                intermediadora tecnológica e facilitadora do pagamento, conforme descrito
                nestes Termos.
              </p>
            </section>

            <section id="alteracoes">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">19. Alterações Destes Termos</h2>
              <p>
                Podemos alterar estes Termos a qualquer momento para refletir mudanças na
                Plataforma ou na legislação aplicável. Alterações significativas serão
                comunicadas por e-mail ou aviso na Plataforma, com antecedência razoável
                sempre que possível, sendo o uso continuado da Plataforma após a
                comunicação considerado como aceitação dos novos termos.
              </p>
            </section>

            <section id="lei">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">20. Legislação Aplicável e Foro</h2>
              <p>
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica
                eleito o foro da comarca de [cidade/UF a definir] para dirimir quaisquer
                controvérsias decorrentes destes Termos, com renúncia a qualquer outro, por
                mais privilegiado que seja.
              </p>
            </section>

            <section id="contato">
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">21. Contato</h2>
              <p>
                Dúvidas, reclamações ou situações atípicas relacionadas a estes Termos podem
                ser enviadas para{' '}
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
