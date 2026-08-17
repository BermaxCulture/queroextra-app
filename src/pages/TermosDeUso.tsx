import { LandingHeader } from '@/components/layout/LandingHeader'

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-qe-white flex flex-col font-sans">
      <LandingHeader />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-qe-gray-900 mb-6">Termos de Uso</h1>
          <p className="text-qe-gray-500 mb-4">Última atualização: Maio de 2026</p>
          
          <div className="space-y-6 text-qe-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">1. Aceitação dos Termos</h2>
              <p>Ao acessar e usar a plataforma Quero Extra, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">2. Descrição do Serviço</h2>
              <p>A Quero Extra atua como uma intermediadora entre profissionais (freelancers) e estabelecimentos (empresas) do ramo de food service, facilitando a conexão para oportunidades de trabalho temporário ou extra.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">3. Responsabilidades dos Usuários</h2>
              <p>Os usuários são responsáveis por manter a confidencialidade de suas credenciais de acesso e por todas as atividades que ocorrem sob sua conta. Profissionais devem garantir que possuem as qualificações informadas, e empresas devem prover um ambiente seguro e pagar os valores combinados.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">4. Limitação de Responsabilidade</h2>
              <p>A Quero Extra não se responsabiliza pelas ações, erros, omissões ou comportamento de usuários (sejam eles empresas ou freelancers) durante a execução dos serviços contratados por meio da plataforma.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">5. Modificações dos Termos</h2>
              <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas através da plataforma ou por e-mail.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
