# QueroExtra — Diferenciais Competitivos

> Documento de posicionamento de produto baseado nas funcionalidades implementadas no código-fonte (MVP atual).

---

## O que é o QueroExtra?

O **QueroExtra** é o único marketplace brasileiro focado **exclusivamente em profissionais da gastronomia e eventos** que precisam de diárias avulsas. Conecta garçons, bartenders, auxiliares de cozinha, recepcionistas, seguranças e outros profissionais com restaurantes, buffets e organizadores de eventos que precisam cobrir turnos com agilidade.

---

## 1. Foco Vertical — Gastronomia, Não Genérico

Plataformas como GetNinjas, Workana ou 99Freelas atendem qualquer profissão. O QueroExtra foi construído de raiz para o **setor de food service**:

- Categorias de vaga específicas do setor: Garçom/Garçonete, Bartender, Auxiliar de Cozinha, Hostess, Recepcionista, Segurança, Limpeza
- Habilidades dos freelancers mapeadas para as demandas reais do setor (Eventos, Cozinha, Limpeza, Carga e Descarga, etc.)
- Terminologia, UX e fluxo pensados para quem opera em escala de turno, não de projeto

**Resultado:** Candidatos mais qualificados, empresas mais satisfeitas — sem ruído de outras categorias.

---

## 2. Confirmação de Presença com Código de 6 Dígitos

Nenhum outro marketplace de diárias oferece um sistema nativo de **check-in/check-out** dentro do próprio app:

- A empresa gera um código de 6 dígitos (válido por 1 hora) no início e no final do turno
- O freelancer insere o código via interface dedicada (InputOTP com auto-avanço entre dígitos)
- O sistema registra os dois momentos com timestamp, criando um histórico imutável de presença
- Elimina disputas do tipo "o profissional não apareceu" ou "a empresa diz que saiu antes"

**Resultado:** Responsabilidade comprovável dos dois lados, sem depender de palavra contra palavra.

---

## 3. Avaliação Mútua Obrigatória

O QueroExtra implementa um sistema de **reviews bilaterais** após cada diária concluída:

- Empresa avalia o freelancer (1–5 estrelas + comentário opcional)
- Freelancer avalia a empresa (1–5 estrelas + comentário opcional)
- Janela de 7 dias para submissão — expira automaticamente
- Médias públicas exibidas nos perfis de ambos os lados
- Nota média da empresa aparece diretamente no card da vaga

**Resultado:** Mercado autorregulado. Empresas de má reputação perdem candidatos. Freelancers ruins não são contratados de novo. Sem moderação manual de avaliações.

---

## 4. Compliance Regulatório com ValidaPay (KYC Nativo)

Diferente de plataformas que ignoram regulação financeira, o QueroExtra tem **KYC embutido no onboarding** do freelancer:

- Coleta dados pessoais, financeiros e endereço completo via formulário multi-step
- Auto-preenchimento de endereço via API do ViaCEP (só digita o CEP)
- Captura faixa de renda, ocupação, patrimônio e flag de pessoa politicamente exposta
- Submissão automática para validação no ValidaPay
- Freelancer só pode se candidatar a vagas após aprovação no ValidaPay

**Resultado:** Base preparada para liquidação automática via PIX sem risco regulatório — algo que plataformas amadoras ignoram e pagam caro depois.

---

## 5. Chave PIX Configurada no Onboarding

O freelancer informa sua chave PIX (CPF, telefone, e-mail ou chave aleatória) já no processo de cadastro, antes mesmo de se candidatar à primeira vaga. O sistema armazena o tipo e o valor de forma estruturada.

**Resultado:** Pagamento pode ser processado sem atrito quando a integração automática entrar em produção — zero rework para o usuário.

---

## 6. Mobile-First de Verdade

A maioria das plataformas "responsivas" é desktop com CSS encolhido. O QueroExtra foi desenhado ao contrário:

- Bottom navigation em mobile, sidebar em desktop — troca automática pelo breakpoint `lg` (1024px)
- Botões e áreas de toque com mínimo de 44px (padrão Apple Human Interface Guidelines)
- Sheets na versão mobile viram modais em desktop via `ResponsiveSheet`
- Animações com Framer Motion otimizadas para gestos e scroll em tela pequena
- Design system com tokens próprios (cores, tipografia DM Sans, espaçamentos) — consistência em todos os dispositivos

**Resultado:** Freelancer que chega ao local de trabalho e precisa confirmar presença consegue fazer tudo pelo celular em segundos, sem pinch/zoom.

---

## 7. Atualizações em Tempo Real para o Freelancer

Via Supabase Realtime, o freelancer vê mudanças no status das candidaturas **instantaneamente**, sem precisar recarregar a página:

- Candidatura aprovada pela empresa → notificação imediata na aba "Meus Extras"
- Status de turno atualizado sem polling

**Resultado:** Melhor experiência do que apps que exigem F5 ou push notification configurada manualmente.

---

## 8. Validação de Empresas pelo Admin Antes de Publicar

Empresas não publicam vagas imediatamente após o cadastro. O fluxo é:

1. Empresa se cadastra e envia documentação
2. Admin revisa documentos (imagens e PDFs com links temporários por segurança)
3. Aprova ou rejeita com justificativa
4. Só após aprovação a empresa acessa o painel e cria vagas

**Resultado:** Zero empresas fantasma ou golpistas na plataforma. Freelancers se candidatam com segurança.

---

## 9. Limite de 3 Vagas Ativas por Empresa

Empresas que publicam dezenas de vagas e somem (abandonment) são o maior problema de qualidade em marketplaces. O QueroExtra impõe um **limite de 3 vagas ativas simultaneamente** por empresa, validado em tempo real no momento de criação.

**Resultado:** Empresas gerenciam vagas com seriedade. Taxa de resposta alta. Freelancers não perdem tempo com vagas abandonadas.

---

## 10. Valor Mínimo de R$ 50 por Diária

O sistema bloqueia criação de vagas com valor abaixo de R$ 50, protegendo a dignidade salarial dos profissionais.

**Resultado:** A plataforma sinaliza que não é um canal para exploração de mão de obra barata — posicionamento que atrai profissionais qualificados.

---

## 11. Privacidade do Contato: Telefone Liberado Apenas Após Aprovação

O número de celular do freelancer é **invisível para a empresa até o momento da aprovação da candidatura**. Isso evita que empresas usem a plataforma apenas para coletar contatos e fechar negócio por fora.

**Resultado:** Transações permanecem dentro do ecossistema. Receita da plataforma protegida.

---

## 12. Segmentação por Área de Negócio das Empresas

Empresas se classificam por segmento no cadastro (Restaurante, Buffet, Eventos, etc.). Isso permite, no futuro, filtros avançados para os freelancers e relatórios segmentados para o admin.

---

## 13. Stack Moderno, Escalável e de Baixo Custo Operacional

| Camada | Tecnologia | Vantagem |
|--------|-----------|----------|
| Frontend | React 18 + Vite + TypeScript | Tipagem estrita, build rápido |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) | BaaS escalável, sem servidor pra gerenciar |
| Forms | React Hook Form + Zod | Validação segura no cliente e compartilhável com a API |
| Animações | Framer Motion | UX premium sem custo de engenharia |
| Deploy | Vercel | CI/CD automático, zero downtime |
| Email | Resend | Entregabilidade alta, custo baixo |

**Resultado:** Time pequeno consegue manter e evoluir o produto sem operação complexa.

---

## Resumo dos Diferenciais

| Diferencial | QueroExtra | Plataformas Genéricas |
|-------------|-----------|----------------------|
| Foco em food service | ✅ Exclusivo | ❌ Genérico |
| Check-in/out nativo | ✅ Código 6 dígitos | ❌ Não existe |
| Avaliação mútua | ✅ Bilateral | ⚠️ Unilateral ou ausente |
| KYC/ValidaPay embutido | ✅ No onboarding | ❌ Ignorado |
| PIX no cadastro | ✅ Estruturado | ❌ Imposto manual |
| Mobile-first de verdade | ✅ Bottom nav + 44px | ⚠️ Responsivo adaptado |
| Realtime de candidaturas | ✅ WebSocket nativo | ❌ Polling ou refresh manual |
| Validação de empresas | ✅ Admin gate | ❌ Auto-aprovação |
| Limite de vagas ativas | ✅ 3 por empresa | ❌ Ilimitado |
| Privacidade de contato | ✅ Pós-aprovação | ❌ Exposto ou variável |
| Valor mínimo garantido | ✅ R$ 50/diária | ❌ Sem proteção |

---

*Gerado a partir do código-fonte do MVP — junho/2026*
