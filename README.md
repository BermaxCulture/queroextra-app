# QueroExtra

O **QueroExtra** é um marketplace web (focado na experiência *mobile-first*) criado para conectar profissionais freelancers e empresas no segmento de **food service** (restaurantes, buffets, eventos). O aplicativo permite a contratação ágil de profissionais como garçons, bartenders, auxiliares de cozinha, entre outros, para turnos pontuais com pagamento por diária.

## 🚀 Tecnologias Utilizadas

A plataforma foi desenvolvida utilizando as ferramentas mais modernas do ecossistema web:

- **Frontend:** React 18 + Vite + TypeScript
- **Estilização:** Tailwind CSS + Variáveis CSS personalizadas (`--qe-*`)
- **Animações:** Framer Motion
- **Componentização & Variantes:** cva (Class Variance Authority)
- **Formulários & Validação:** React Hook Form + Zod
- **Backend as a Service (BaaS):** Supabase (PostgreSQL, Auth, Storage e Realtime)
- **E-mails Transacionais:** Resend
- **Ícones & Tipografia:** Lucide React + Fonte 'DM Sans' (Google Fonts)

## ⚙️ Como Funciona Atualmente?

O fluxo do aplicativo é dividido em perfis de usuários bem definidos:

### 1. Empresas
- Realizam o cadastro (em duas etapas) e aguardam a aprovação do Admin.
- Após aprovação, podem publicar até **3 vagas ativas** simultaneamente (ex: vagas para garçom de fim de semana).
- Geram códigos únicos (6 dígitos) para realizar o **Check-in** e o **Check-out** dos freelancers diretamente no estabelecimento.
- Avaliam os freelancers após o término do serviço.

### 2. Freelancers
- Criam o perfil preenchendo seus dados, habilidades e experiências.
- Navegam pelo feed de vagas (`/app/explorar`) e se candidatam aos trabalhos disponíveis.
- Inserem o código de **Check-in** fornecido pela empresa ao chegar no local, e o **Check-out** ao final do turno.
- Após a finalização, recebem o saldo em suas carteiras e também avaliam as empresas.

### 3. Painel Administrativo (CMS Admin)
- Gestão centralizada para aprovar ou rejeitar cadastros de empresas.
- Resolução de disputas e controle financeiro/vagas.

## 📁 Estrutura de Diretórios Principal

```bash
queroextra/
├── src/
│   ├── components/
│   │   ├── ui/          # Biblioteca de componentes base (Buttons, Inputs, Modals, etc.)
│   │   └── layout/      # Layouts específicos (Freelancer, Empresa, Admin)
│   ├── pages/           # Telas divididas por domínio (auth, app, empresa, admin)
│   ├── hooks/           # Hooks customizados (useAuth, useToast, etc)
│   ├── lib/             # Configurações de serviços externos (Supabase, Utilitários)
│   └── styles/          # Tokens e configurações globais de CSS
├── supabase/            # Migrations do banco de dados
├── docs/                # Documentações internas do projeto (Design System, CLAUDE.md)
└── ...arquivos de config (vite.config.ts, tailwind.config.ts)
```

## 🛠️ Como rodar o projeto localmente

Siga os passos abaixo para testar a aplicação em seu ambiente local:

### 1. Clone o repositório e instale as dependências
```bash
git clone <URL_DO_REPOSITORIO>
cd queroextra-app
npm install
```

### 2. Configuração das Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto, usando o `.env.example` como base, e adicione suas chaves do Supabase e do Resend:
```env
VITE_SUPABASE_URL="sua_url_do_supabase"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_publica_do_supabase"
RESEND_API_KEY="sua_chave_do_resend"
```

### 3. Rodando a Aplicação
Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse `http://localhost:5173` (ou a porta exibida no seu terminal) no navegador. 

**Dica de Desenvolvimento:** A aplicação é *mobile-first*, então recomendamos inspecionar os elementos com o modo de dispositivo móvel ativado (ex: tamanho iPhone 12/14) no seu navegador durante os testes para a melhor experiência.

---
**Status do Projeto:** MVP em andamento. Integrações complexas como pagamentos via Stripe Connect e leitura de QR codes ainda não estão implementadas nesta fase.
