# Documentação QueroExtra — Aplicativo e Painel Administrativo

QueroExtra é um marketplace que conecta **freelancers do food service** (garçons, bartenders, auxiliares de cozinha, recepcionistas, seguranças, equipe de limpeza, entre outros) a **empresas do setor** que precisam de reforço pontual de equipe. A plataforma cuida de todo o ciclo: publicação da vaga, candidatura, aprovação, pagamento via PIX (com o dinheiro retido com segurança até a confirmação do trabalho), check-in/check-out do turno, avaliação mútua e saque do freelancer.

Este documento cobre as duas partes do produto:

1. **QueroExtra App** — o aplicativo/site usado por freelancers e empresas.
2. **Painel Administrativo** — o sistema interno usado pela equipe QueroExtra para aprovar empresas, acompanhar métricas e resolver disputas.

---

## 1. QueroExtra App

### 1.1 Páginas públicas

- **Página inicial**: apresentação geral da plataforma, com estatísticas e chamadas para os dois públicos (freelancers e empresas).
- **Página "Para Freelancers"**: explica o funcionamento para quem quer trabalhar como extra — cadastro, busca de vaga, recebimento via PIX.
- **Página "Para Empresas"**: explica o funcionamento para quem quer contratar — publicação de vaga, aprovação de candidatos e segurança do pagamento.
- **Termos de Uso** e **Política de Privacidade**: páginas informativas padrão.

### 1.2 Cadastro e login

**Cadastro do freelancer** — formulário único com nome completo, CPF, e-mail, celular (WhatsApp), seleção de habilidades (garçom, bartender, cozinha, copa, limpeza, churrasqueiro, recepcionista, caixa, auxiliar geral), senha (com regras de segurança visíveis em tempo real: mínimo 8 caracteres, maiúscula, minúscula, número e símbolo) e aceite dos Termos de Uso.

**Cadastro da empresa** — feito em duas etapas:
- **Etapa 1**: dados da empresa (logo opcional, nome ou razão social, CNPJ ou CPF — para autônomos/MEI —, e-mail, área de atuação, senha).
- **Etapa 2** (após confirmar o e-mail): envio de documentos de verificação (contrato social, identidade do responsável, certificado MEI, etc. — PDF, JPG ou PNG, até 10MB por arquivo). Ao concluir, o cadastro fica com status **"pendente"** até a aprovação da equipe QueroExtra no painel administrativo, e a empresa vê uma tela de "aguardando aprovação".

**Verificação de e-mail**: após o cadastro, tanto freelancer quanto empresa recebem um código de 6 dígitos por e-mail para confirmar a conta.

**Login**: e-mail e senha, com redirecionamento automático conforme o tipo de conta (freelancer, empresa ou administrador) e conforme o estágio do cadastro (ex.: empresa que ainda não enviou documentos é levada direto para essa etapa).

**Recuperação de senha**: fluxo em 3 passos — informar e-mail, digitar o código de 6 dígitos recebido, definir a nova senha. Por segurança, o usuário é desconectado ao final e precisa entrar novamente com a nova senha.

### 1.3 Verificação financeira do freelancer (obrigatória para receber pagamentos)

Antes de poder se candidatar a vagas, o freelancer passa por um cadastro financeiro em 3 etapas, necessário para que a plataforma consiga processar o pagamento PIX dele com segurança (exigência do parceiro de pagamentos, ValidaPay):

1. **Endereço** — com preenchimento automático a partir do CEP.
2. **Dados financeiros e chave PIX** — data de nascimento, nome da mãe, faixa de renda, ocupação, faixa patrimonial, declaração de Pessoa Politicamente Exposta (PEP) e a chave PIX onde o freelancer quer receber.
3. **Verificação de identidade (KYC)** — o freelancer recebe um link/QR Code para enviar fotos de documentos oficiais (RG/CNH). A análise final pode levar até 24 horas.

O status desse cadastro passa por: **não iniciado → em análise → aprovado** (pode se candidatar e receber pagamentos) **ou rejeitado** (pode reenviar os dados). O freelancer acompanha esse progresso por avisos e selos dentro do app, e recebe e-mails automáticos em cada mudança de status (ver seção 1.7).

### 1.4 Área do Freelancer ("Extras")

Navegação em 4 seções: **Explorar, Meus Extras, Carteira e Perfil**.

- **Explorar vagas**: lista de vagas abertas, com busca por texto, filtro por categoria/cidade/estado e ordenação (mais recentes, maior valor, mais próximas). Vagas urgentes recebem destaque visual.
- **Detalhes da vaga e candidatura**: descrição completa, valor, data/horário, requisitos, benefícios e um card com a nota média da empresa contratante. O botão de candidatura só fica disponível depois que o freelancer conclui e tem aprovada a verificação financeira (seção 1.3).
- **Minhas Extras**: acompanhamento das candidaturas por status — Pendentes, Confirmados, Em Andamento e Finalizados — com atualização automática em tempo real. É possível cancelar uma candidatura pendente. Aqui também aparecem avaliações pendentes de turnos já concluídos.
- **Check-in / Check-out**: no dia do turno, o freelancer digita um código de 6 dígitos fornecido presencialmente pela empresa para confirmar a chegada (check-in) e, ao final, outro código para confirmar a saída (check-out). É esse check-out que libera o pagamento retido para o freelancer.
- **Carteira**: mostra o saldo **Disponível para saque** e o saldo **A Liberar** (retido até a confirmação do check-out), histórico de recebimentos, e permite sacar via PIX (com atalho "Sacar Tudo") e cadastrar/alterar a chave PIX. Também é daqui que o freelancer pode abrir uma disputa/reportar um problema em um pagamento específico (ver seção 1.6).
- **Perfil**: foto (com recorte), bio, habilidades, nota média e histórico de avaliações recebidas. O mesmo layout é usado para visualizar o perfil público de outros freelancers e o perfil público de empresas contratantes.

### 1.5 Área da Empresa

- **Aguardando aprovação**: tela de bloqueio exibida enquanto o cadastro da empresa está em análise ou caso tenha sido rejeitado (com opção de contato com o suporte).
- **Dashboard**: KPIs (vagas ativas, total de candidatos, turnos concluídos, avaliação média), vagas em andamento com contagem de candidatos, avaliações pendentes, aprovação rápida de candidatos e atalho para publicar uma vaga urgente.
- **Publicar vaga**: título, categoria, local completo, valor do turno (mínimo R$ 50), data/horário de início e fim, descrição, benefícios, tags e opção de marcar como "urgente" (destaque no feed do freelancer). Cada empresa pode ter no máximo **3 vagas ativas simultaneamente**.
- **Minhas Vagas**: lista de todas as vagas publicadas, com abas por status (Todas, Ativas, Finalizadas, Canceladas).
- **Análise de candidatos e contratação**: o coração do fluxo de pagamento. A empresa avalia os candidatos (perfil, nota, habilidades, histórico) e pode aprovar ou recusar. Ao **aprovar um candidato**:
  1. A empresa vê o valor do turno + taxa da plataforma (R$ 10 fixos) e confirma.
  2. É gerada uma cobrança PIX (QR Code e código "copia e cola").
  3. Assim que o pagamento é identificado (em tempo real), a contratação é confirmada automaticamente e o telefone do freelancer é liberado para contato direto (ligação/WhatsApp) — só depois do pagamento confirmado, por segurança de ambas as partes.
  4. O valor fica retido pela plataforma até o check-out do turno ser confirmado, quando é automaticamente liberado para o freelancer sacar.
- **Carteira da empresa**: total pago em extras, turnos pagos, valores ainda pendentes de fechamento (retidos até o checkout), histórico exportável em CSV, e o mesmo canal de "Reportar problema" para abrir uma disputa.
- **Perfil da empresa**: dados cadastrais, e-mail de acesso, segmento de atuação, foto/logo, alteração de senha, prévia do perfil público e gestão de prestadores bloqueados.
- **Prestadores bloqueados**: a empresa pode bloquear um freelancer especificamente para as suas próprias vagas (bloqueio silencioso — o freelancer não é avisado, e continua com acesso normal ao restante da plataforma).
- **Check-In Hub**: gera o código de 6 dígitos que a empresa informa ao freelancer presencialmente para confirmar chegada e, depois, saída do turno. Ao concluir o check-out, o pagamento retido é automaticamente liberado para saque do freelancer.

### 1.6 Sistema de disputas

Se algo dá errado com um pagamento (turno não realizado, problema de qualidade, etc.), **tanto a empresa quanto o freelancer** podem abrir uma disputa a partir da própria Carteira, escolhendo a transação e descrevendo o problema. A partir daí:

- A transação fica marcada como "em disputa" e a equipe de suporte é notificada por e-mail.
- A disputa é analisada e resolvida pela equipe QueroExtra através do Painel Administrativo (seção 2.4), que pode decidir por **estornar** o pagamento à empresa, **liberar** o pagamento ao freelancer, ou **encerrar sem alteração** (por exemplo, quando o valor já foi sacado corretamente e não há o que reverter).
- Empresa e freelancer recebem um e-mail automático com a decisão e a justificativa registrada pela equipe.

### 1.7 Sistema de avaliações

Ao final de cada turno confirmado (checkout feito), o sistema cria automaticamente **duas avaliações pendentes**: a empresa avalia o freelancer e o freelancer avalia a empresa. Cada lado tem **7 dias** para enviar sua nota (1 a 5 estrelas) e um comentário opcional; passado esse prazo, a avaliação expira. As notas médias aparecem nos perfis de freelancers e empresas em toda a plataforma, e ajudam na decisão de contratação.

### 1.8 Notificações por e-mail

A plataforma envia e-mails automáticos (com identidade visual da marca) nos seguintes momentos:

| Situação | Quem recebe |
|---|---|
| Candidatura aprovada / pagamento confirmado | Freelancer |
| Candidatura não selecionada | Freelancer |
| Nova empresa aguardando aprovação | Equipe QueroExtra |
| Documentos de identidade prontos para envio (KYC) | Freelancer |
| Documentos recebidos, aguardando análise final | Freelancer |
| Documentos rejeitados em qualquer etapa da verificação | Freelancer |
| Conta financeira aprovada | Freelancer |
| Nova disputa aberta | Equipe de suporte |
| Disputa resolvida (com o motivo da decisão) | Empresa e freelancer envolvidos |
| Falha em um estorno PIX | Equipe de suporte (alerta prioritário) |
| Códigos de verificação de cadastro e redefinição de senha | Freelancer ou empresa |

---

## 2. Painel Administrativo

Sistema interno, de acesso restrito à equipe QueroExtra, usado para gerenciar a plataforma.

### 2.1 Acesso

Login por e-mail e senha. Só usuários com perfil de **administrador** conseguem entrar — qualquer outra conta é bloqueada nessa porta de entrada.

### 2.2 Dashboard

Visão geral da operação, com filtro de período (últimos 7 dias, últimos 30 dias ou semana atual):

- **KPIs**: usuários ativos, vagas publicadas (com destaque para as de hoje), volume total transacionado no período e novas contratações.
- **Gráfico** de evolução semanal comparando novos freelancers cadastrados x contratações confirmadas.
- **Atividade recente**: feed com os últimos cadastros, candidaturas e publicações de vaga da plataforma, em tempo praticamente real.

### 2.3 Gestão de Usuários

Lista de todos os usuários da plataforma (freelancers, empresas e administradores), com busca por nome/e-mail e filtros por tipo e status (Verificado, Pendente, Bloqueado). Ao clicar em um usuário, abre um painel de detalhes com:

- Dados cadastrais e, para empresas, documentos enviados (visualizáveis com link seguro e temporário).
- Estatísticas de atividade (vagas publicadas para empresa; candidaturas e extras realizados para freelancer).
- **Ações**: aprovar ou rejeitar empresa (com motivo obrigatório na rejeição — a empresa recebe um e-mail automático), suspender ou reativar qualquer conta, e marcar uma empresa como **"conta de teste"** (permite publicar vagas a partir de R$ 1, em vez do mínimo padrão de R$ 50, para testar pagamentos reais sem custo).

### 2.4 Finanças

Dividida em duas abas:

**Transações** — três indicadores (volume total transacionado, taxa arrecadada pela plataforma, total já liberado a freelancers) e uma tabela completa de todas as cobranças PIX geradas, com filtro por período e por status (Pendente, Retido, Liberado, Sacado, Estornado), mostrando vaga, empresa, freelancer, valor bruto, taxa, valor líquido e data.

**Disputas** — lista todas as disputas em aberto, mostrando quem abriu (empresa ou freelancer), o motivo relatado e a data. Para cada disputa, a equipe escolhe uma de três decisões:
- **Estornar pagamento** — devolve o valor à empresa. Como o estorno em si é feito manualmente na ValidaPay (fora do painel), o sistema exige uma confirmação explícita ("já processei o estorno manualmente") antes de registrar a decisão, evitando que alguém marque como resolvido sem o dinheiro de fato ter voltado.
- **Liberar pagamento** — confirma o pagamento ao freelancer, que passa a poder sacar normalmente.
- **Resolver sem alterar o pagamento** — encerra a disputa sem mexer no status da transação (ex.: quando o valor já foi sacado corretamente e não há nada a reverter).

Em todos os casos, é obrigatório registrar uma observação/justificativa, que é enviada por e-mail à empresa e ao freelancer envolvidos.

### 2.5 Configurações

- **Perfil do administrador**: edição de nome (e-mail não pode ser alterado).
- **Segurança**: solicitação de redefinição de senha por e-mail.
- **Plataforma**: painel informativo mostrando o status de integrações-chave (gateway de pagamento ValidaPay e envio de e-mails via Resend).

---

## 3. Como o dinheiro flui, em resumo

1. Empresa aprova um candidato → é gerada uma cobrança PIX (valor do turno + taxa da plataforma).
2. Empresa paga → o valor fica **retido** com segurança pela plataforma (dividido automaticamente entre a taxa da QueroExtra e o valor devido ao freelancer).
3. Freelancer realiza o turno, com check-in e check-out confirmados por código.
4. Check-out concluído → o valor é **liberado** para o freelancer.
5. Freelancer solicita o **saque** via PIX, na chave cadastrada.
6. Se algo der errado no meio do caminho, qualquer uma das partes pode abrir uma **disputa**, resolvida pela equipe QueroExtra.

### Glossário de status de uma transação

| Status | Significado |
|---|---|
| Pendente | Cobrança PIX gerada, aguardando pagamento da empresa |
| Retido | Empresa pagou; valor retido até a confirmação do turno |
| Liberado | Turno confirmado (checkout feito); freelancer já pode sacar |
| Sacado | Freelancer já sacou o valor |
| Estornado | Valor devolvido à empresa (geralmente após uma disputa) |

---

*Documento gerado a partir do estado atual do código em produção. Recomenda-se revisar antes de repassar ao cliente final.*
