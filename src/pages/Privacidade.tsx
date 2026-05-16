import { LandingHeader } from '@/components/layout/LandingHeader'

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-qe-white flex flex-col font-sans">
      <LandingHeader />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-qe-gray-900 mb-6">Políticas de Privacidade</h1>
          <p className="text-qe-gray-500 mb-4">Última atualização: Maio de 2026</p>
          
          <div className="space-y-6 text-qe-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">1. Coleta de Informações</h2>
              <p>Coletamos informações que você nos fornece diretamente, como nome, e-mail, telefone, qualificações profissionais e informações da empresa, necessárias para a prestação do nosso serviço de intermediação.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">2. Uso das Informações</h2>
              <p>Utilizamos suas informações para criar e gerenciar sua conta, processar conexões entre freelancers e empresas, enviar comunicações sobre o serviço e melhorar continuamente a experiência na plataforma Quero Extra.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">3. Compartilhamento de Dados</h2>
              <p>Para o funcionamento da plataforma, dados básicos do perfil do freelancer podem ser compartilhados com empresas interessadas, e dados da empresa são visíveis para freelancers. Não vendemos seus dados pessoais para terceiros.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">4. Segurança dos Dados</h2>
              <p>Adotamos medidas de segurança técnicas e organizacionais para proteger suas informações pessoais contra acesso não autorizado, perda ou alteração. No entanto, nenhuma transmissão de dados pela internet é 100% segura.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-qe-gray-900 mb-3">5. Seus Direitos</h2>
              <p>Você tem o direito de solicitar acesso, correção, ou exclusão de seus dados pessoais armazenados em nossa plataforma a qualquer momento, entrando em contato através de nossos canais de suporte.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
