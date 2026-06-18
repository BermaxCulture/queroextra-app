# ValidaPay API — Documentação de Rotas e Integrações

> Documento gerado automaticamente a partir da coleção Postman oficial da ValidaPay.
> Destinado a desenvolvedores, integradores e ferramentas de IA que precisam consultar as rotas da API.

---

## Visão Geral

A **ValidaPay** é uma plataforma de pagamentos brasileira que oferece:

- **PIX** — cobranças instantâneas com QR Code estático e dinâmico
- **Boleto bancário** — emissão de boletos com vencimento, juros e desconto
- **Cartão de crédito** — armazenamento seguro dos dados do cartão e cobrança sem redirecionar o cliente para outra página
- **Assinaturas** — cobrança recorrente com suporte a mudança de plano e ajuste proporcional de valor
- **Checkouts** — páginas de pagamento prontas hospedadas pela ValidaPay
- **Split de pagamentos** — divisão automática de receita entre subcontas
- **Subcontas** — cadastro e gestão de contas filhas dentro de um marketplace
- **Cupons** — descontos aplicáveis a cobranças e assinaturas
- **Carteira** — saldo, extrato, recebimentos agendados
- **Saques** — transferência via PIX, listagem e validação de chave
- **Reembolsos** — estorno total ou parcial de cobranças
- **Clientes** — cadastro e gestão de dados dos compradores
- **Webhooks** — notificações em tempo real com gerenciamento de eventos

---

## Autenticação

A autenticação usa o fluxo de credenciais de cliente (chamadas de servidor para servidor, sem usuário logado). Todas as rotas protegidas exigem o header:

```
Authorization: Bearer {{token}}
```

### Gerar Token

```
POST {{base_url}}/auth/token
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "grant_type": "client_credentials",
  "client_id": "{{client_id}}",
  "client_secret": "{{client_secret}}",
  "scope": "{{scope}}"
}
```

**Escopos disponíveis:**

```
pix.cob/read          pix.cob/write
wallet/read           wallet/write
products/read         products/write
proposals/read        proposals/write
subscriptions/read    subscriptions/write
checkouts/read        checkouts/write
customers/read        customers/write
subaccounts/read      coupons/read
coupons/write
```

**Respostas:**

<details>
<summary><code>200</code> — Token gerado</summary>

```json
{
  "access_token": "eyJ...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

</details>

<details>
<summary><code>401</code> — Credenciais inválidas</summary>

```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```

</details>

> **Variáveis de ambiente esperadas:** `{{base_url}}`, `{{client_id}}`, `{{client_secret}}`, `{{scope}}`, `{{token}}`

---

## Formato de Erros

Todos os erros seguem o padrão:

```json
{
  "error": {
    "message": "Descrição legível do erro",
    "code": "ERROR_CODE_ENUM",
    "details": null,
    "timestamp": "2026-06-10T10:00:00.000Z"
  }
}
```

| Código HTTP | Significado |
|-------------|-------------|
| `400` | Dados inválidos na requisição |
| `401` | Token ausente, expirado ou inválido |
| `403` | Sem permissão / escopo insuficiente |
| `404` | Recurso não encontrado |
| `409` | Conflito de estado (ex.: cobrança já paga) |
| `500` | Erro interno do servidor |

---

## Contas e Subcontas

Gerencia contas filhas dentro de um marketplace ValidaPay. O fluxo é: (1) criar proposta de cadastro, (2) acompanhar o andamento pelo `formId`, (3) listar subcontas aprovadas. Documentos com 11 dígitos (CPF) criam conta de pessoa física; com 14 dígitos (CNPJ) criam conta de pessoa jurídica.

### Criar Proposta PF

```
POST {{base_url}}/v1/proposals
```

**Escopo necessário:** `proposals/write`

> ⚠️ **Atenção:** Não é possível criar uma subconta com o mesmo e-mail e telefone da conta principal.
> ⚠️ **Atenção:** Dados de renda/faturamento no campo `financialDetails` são obrigatórios.

**Body (JSON):**

```json
{
  "documentNumber": "12345678901",
  "fullName": "João da Silva",
  "phoneNumber": "+5511999998888",
  "email": "joao@email.com",
  "motherName": "Maria da Silva",
  "birthDate": "1990-01-15",
  "isPoliticallyExposedPerson": false,
  "socialName": null,
  "address": {
    "postalCode": "01310100",
    "street": "Av. Paulista",
    "number": "1000",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "addressComplement": "Apto 52"
  },
  "financialDetails": {
    "declaredIncome": "1DINP02",
    "occupation": "ONP07",
    "netWorth": "NWNP02"
  },
  "webhookUrl": "https://api.seusite.com.br/webhook"
}
```

**Respostas:**

<details>
<summary><code>200</code> — FINISHED</summary>

```json
{
  "status": "FINISHED",
  "formId": "form_xxx",
  "sendStatus": "SENT",
  "proposalId": "prop_xxx"
}
```

</details>

<details>
<summary><code>200</code> — UNFINISHED</summary>

```json
{
  "status": "UNFINISHED",
  "formId": "form_xxx",
  "pendingFields": ["financialDetails.declaredIncome"]
}
```

</details>

<details>
<summary><code>400</code> — Documento inválido</summary>

```json
{
  "code": "INVALID_DOCUMENT",
  "message": "CPF inválido"
}
```

</details>


### Criar Proposta PJ

```
POST {{base_url}}/v1/proposals
```

**Escopo necessário:** `proposals/write`

**Body (JSON):**

```json
{
  "documentNumber": "12345678000195",
  "businessName": "Empresa LTDA",
  "tradingName": "Empresa",
  "businessEmail": "contato@empresa.com",
  "contactNumber": "+5511999998888",
  "companyType": "PJ",
  "businessAddress": {
    "postalCode": "01310100",
    "street": "Av. Paulista",
    "number": "1000",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "addressComplement": null
  },
  "financialCompanyDetails": {
    "declaredCompanyRevenue": "DCRB02"
  },
  "owner": [
    {
      "ownerType": "SOCIO",
      "documentNumber": "72352781027",
      "fullName": "Cesar Lattes",
      "phoneNumber": "+5511912345128",
      "email": "socio@empresa.com",
      "motherName": "Marie Curie",
      "birthDate": "02-02-1990",
      "isPoliticallyExposedPerson": false,
      "address": {
        "postalCode": "06455030",
        "street": "Alameda Xingu",
        "number": "50",
        "neighborhood": "Alphaville Industrial",
        "city": "Barueri",
        "state": "SP"
      },
      "financialOwnerDetails": {
        "ownerDeclaredIncome": "ODIB02",
        "ownerDeclaredRevenue": "ODRB02"
      }
    }
  ],
  "webhookUrl": "https://api.seusite.com.br/webhook"
}
```

**Respostas:**

<details>
<summary><code>200</code> — FINISHED</summary>

```json
{
  "status": "FINISHED",
  "formId": "form_xxx",
  "sendStatus": "SENT",
  "proposalId": "prop_xxx"
}
```

</details>


### Buscar Proposta

```
GET {{base_url}}/v1/proposals/:id
```

**Escopo necessário:** `proposals/read`

Quando a conta for aprovada, um evento será enviado para a URL de webhook informada no cadastro. O evento tem o seguinte formato:

```json
{
  "event": "account_approved",
  "status": "CONFIRMED",
  "account": {
    "account": "123456",
    "branch": "0001",
    "documentNumber": "123456789",
    "ispb": "13935893",
    "name": "Werner Heisenberg"
  },
  "onboardingId": "fc0e6dab-8210-4f2d-8fce-2e94990b63ef",
  "documentNumber": "1234567889",
  "formId": "7b83fcb4-fe9c-4ad3-8d3a-621fe9c9ffc1",
  "createdAt": "2025-06-02T17:46:10.1120909"
}
```

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | `formId` retornado ao criar a proposta |

**Respostas:**

<details>
<summary><code>200</code> — Proposta encontrada</summary>

```json
{
  "formId": "form_xxx",
  "proposalStatus": "FINISHED",
  "pendingFields": [],
  "metaData": {}
}
```

</details>

<details>
<summary><code>404</code> — Não encontrada</summary>

```json
{
  "code": "FORM_NOT_FOUND",
  "message": "Formulário não encontrado"
}
```

</details>


### Listar Subcontas

```
GET {{base_url}}/v1/accounts/subaccounts
```

**Escopo necessário:** `subaccounts/read`

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "masterAccountId": "SANDBOX_0438f4c8-0031-7051-16d4-5a23704756b6",
  "subAccounts": [
    {
      "documentNumber": "96707067001",
      "createdAt": "2026-02-23T22:29:52.537Z",
      "accountNumber": "4960589",
      "status": "CONFIRMED",
      "onboardingId": "b9790268-a770-4aec-8fe5-d891f17e8007",
      "name": "Friedrich Nietzsche",
      "dailyWithdrawalLimit": 3000,
      "balance": 0
    }
  ],
  "page": 1,
  "perPage": 15,
  "hasMore": false
}
```

</details>

---

## Carteira

Consulta saldo, extrato de transações e agenda de recebimentos futuros. A navegação entre páginas é feita usando o campo `lastKey` retornado em cada resposta.

### Consultar Saldo

```
GET {{base_url}}/v1/wallet/balance?accountId=
```

**Escopo necessário:** `wallet/read`

> ⚠️ Para consultar o saldo de várias subcontas, envie `accountId` com os números separados por vírgula.

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `accountId` | não | ID(s) da subconta. Omitir para conta própria. Separar por vírgula para múltiplas |

**Respostas:**

<details>
<summary><code>200</code> — Conta própria</summary>

```json
{
  "availableBalance": 150.0,
  "pendingBalance": 30.0,
  "totalBalance": 180.0
}
```

</details>

<details>
<summary><code>200</code> — Multi-conta (consulta de várias subcontas de servidor para servidor)</summary>

```json
{
  "masterAccountId": "429131313",
  "balances": [
    {
      "accountNumber": "459013888",
      "name": "VALIDAPAY PAGAMENTOS TECNOLOGIA E SERVICOS",
      "balance": 54.81
    },
    {
      "accountNumber": "460851986",
      "name": "VALIDA PIX",
      "balance": 196.82
    }
  ]
}
```

</details>

<details>
<summary><code>404</code> — Subconta não encontrada</summary>

```json
{
  "error": {
    "message": "Subconta 459013666 nao encontrada",
    "code": "SUBACCOUNT_NOT_FOUND",
    "details": null,
    "timestamp": "2026-03-17T03:46:49.777Z"
  }
}
```

</details>


### Listar Transações

```
GET {{base_url}}/v1/wallet/transactions
```

**Escopo necessário:** `wallet/read`

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `limit` | não | Itens por página (padrão: 15, máx: 100) |
| `lastKey` | não | Código de posição retornado pela última consulta, para carregar a próxima página |
| `startDate` | não | Data início no formato `2026-07-01T00:00:00Z` |
| `endDate` | não | Data fim no formato `2026-07-01T00:00:00Z` |
| `type` | não | `CREDIT` ou `DEBIT` |
| `category` | não | `PAYMENT` \| `PIX_IN` \| `PIX_OUT` \| `WITHDRAWAL` \| `REFUND` \| `FEE` \| `TRANSFER` \| `BOLETO_IN` \| `CARD_IN` |
| `accountId` | não | ID da subconta (para chamadas feitas de servidor para servidor) |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "items": [
    {
      "transactionId": "txn_1773694940975_r10b6fyzm",
      "type": "CREDIT",
      "category": "PIX_IN",
      "amount": 2.56,
      "balanceAfter": 901.6,
      "title": "PIX recebido de Malga",
      "paymentMethod": "PIX",
      "chargeId": null,
      "subscriptionId": null,
      "endToEndId": "E13935893202603162102IfDcitXf0zO",
      "counterparty": {
        "name": "Malga",
        "bank": "13935893",
        "taxId": "37134852000458",
        "account": "410900056"
      },
      "referenceId": "E139389320260316202IfDyytXf0zO",
      "description": "PIX recebido direto",
      "createdAt": "2026-03-16T21:02:20.975Z"
    }
  ],
  "nextPageToken": "eyJTSyI6..."
}
```

</details>


### Anotar Transação

```
PATCH {{base_url}}/v1/wallet/transactions/:transactionId
```

**Escopo necessário:** `wallet/write`

Grava uma observação interna na transação para fins de controle e conciliação.

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:transactionId` | ID da transação |

**Body (JSON):**

```json
{
  "note": "Pagamento referente ao pedido #001"
}
```

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "transactionId": "txn_xxx",
  "note": "Pagamento referente ao pedido #001",
  "message": "Observação salva com sucesso"
}
```

</details>

<details>
<summary><code>404</code> — Não encontrada</summary>

```json
{
  "code": "TRANSACTION_NOT_FOUND"
}
```

</details>


### Listar Recebimentos

```
GET {{base_url}}/v1/wallet/receivables
```

**Escopo necessário:** `wallet/read`

Retorna os valores a receber (pagamentos ainda em liquidação) com a data prevista de disponibilização.

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "items": [
    {
      "amount": 100.0,
      "expectedDate": "2026-07-01",
      "status": "PENDING"
    }
  ]
}
```

</details>


### Consultar Agenda do Dia

```
GET {{base_url}}/v1/wallet/receivables-calendar/:day
```

**Escopo necessário:** `wallet/read`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:day` | Data no formato `YYYY-MM-DD` |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "date": "2026-07-01",
  "totalAmount": 450.0,
  "items": [
    {
      "chargeId": "cha_xxx",
      "amount": 100.0,
      "paymentMethod": "PIX"
    }
  ]
}
```

</details>

---

## Saques

Transfere o saldo da carteira ValidaPay para uma chave PIX. O saldo disponível deve ser suficiente para cobrir o valor do saque mais as taxas cobradas pela operação.

> ⚠️ **Atenção:** Só é possível fazer saques para contas de mesma titularidade.

### Solicitar Saque

```
POST {{base_url}}/v1/wallet/withdraw
```

**Escopo necessário:** `wallet/write`

**Body (JSON):**

```json
{
  "amount": 500.0,
  "pixKey": "joao@email.com",
  "pixKeyType": "EMAIL",
  "documentNumber": "12345678901",
  "accountId": null
}
```

> **Enums:** pixKeyType: `CPF` | `CNPJ` | `EMAIL` | `PHONE` | `EVP`

**Respostas:**

<details>
<summary><code>201</code> — Sucesso</summary>

```json
{
  "withdrawalId": "wth_xxx",
  "amount": 500.0,
  "status": "PROCESSING",
  "pixKey": "joao@email.com",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

</details>

<details>
<summary><code>400</code> — Saldo insuficiente</summary>

```json
{
  "code": "INSUFFICIENT_BALANCE"
}
```

</details>

<details>
<summary><code>400</code> — Bloqueio por titularidade</summary>

```json
{
  "error": {
    "message": "A chave PIX nao pertence ao titular da conta",
    "code": "OWNERSHIP_MISMATCH",
    "details": null,
    "timestamp": "2026-03-17T04:01:57.811Z"
  }
}
```

</details>


### Listar Saques

```
GET {{base_url}}/v1/wallet/withdrawals
```

**Escopo necessário:** `wallet/read`

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `limit` | não | Itens por página (padrão: 15) |
| `lastKey` | não | Código de posição retornado pela última consulta, para carregar a próxima página |
| `startDate` | não | Data início no formato `2026-07-01T00:00:00Z` |
| `endDate` | não | Data fim no formato `2026-07-01T00:00:00Z` |
| `accountId` | não | ID da subconta (para chamadas feitas de servidor para servidor) |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "items": [
    {
      "withdrawalId": "wth_xxx",
      "amount": 500.0,
      "status": "COMPLETED",
      "pixKey": "joao@email.com",
      "pixKeyType": "EMAIL",
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 15,
    "hasMore": false
  }
}
```

</details>


### Transferir via PIX

```
POST {{base_url}}/v1/wallet/pix-transfer
```

**Escopo necessário:** `wallet/write`

Realiza uma transferência PIX a partir do saldo da carteira para qualquer conta bancária, sem exigir conta cadastrada previamente.

**Body (JSON):**

```json
{
  "amount": 150.0,
  "pixKey": "11999998888",
  "pixKeyType": "PHONE",
  "description": "Pagamento de serviço",
  "accountId": null
}
```

**Respostas:**

<details>
<summary><code>201</code> — Sucesso</summary>

```json
{
  "transferId": "trf_xxx",
  "amount": 150.0,
  "status": "PROCESSING",
  "pixKey": "11999998888",
  "endToEndId": "E...",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

</details>

<details>
<summary><code>400</code> — Saldo insuficiente</summary>

```json
{
  "code": "INSUFFICIENT_BALANCE"
}
```

</details>


### Validar Chave PIX

```
POST {{base_url}}/v1/wallet/dict
```

**Escopo necessário:** `wallet/read`

Consulta os dados do titular cadastrado para uma chave PIX antes de realizar uma transferência.

**Body (JSON):**

```json
{
  "pixKey": "joao@email.com",
  "pixKeyType": "EMAIL"
}
```

**Respostas:**

<details>
<summary><code>200</code> — Chave válida</summary>

```json
{
  "pixKey": "joao@email.com",
  "pixKeyType": "EMAIL",
  "owner": {
    "name": "João da Silva",
    "taxId": "***.456.789-**",
    "type": "NATURAL_PERSON"
  },
  "account": {
    "ispb": "12345678",
    "bankName": "Banco X",
    "branch": "0001",
    "accountNumber": "123456-7",
    "accountType": "CACC"
  }
}
```

</details>

<details>
<summary><code>404</code> — Chave não encontrada</summary>

```json
{
  "code": "PIX_KEY_NOT_FOUND"
}
```

</details>

---

## Reembolsos

Estorno total ou parcial de cobranças já pagas. O campo `reason` categoriza o motivo do estorno para fins de exigências regulatórias.

### Solicitar Reembolso

```
POST {{base_url}}/v1/wallet/refunds
```

**Escopo necessário:** `wallet/write`

> ⚠️ **Códigos de motivo obrigatórios:** `BANK_ERROR` | `FRAUD` | `CUSTOMER_REQUEST` | `PIX_CHANGE_ERROR`

Para PIX, informe o `endToEndId`. Para cartão, informe o `chargeId`.

**Body (JSON):**

```json
{
  "endToEndId": "E00000000202401150000000000000001",
  "amount": 100.0,
  "reason": "CUSTOMER_REQUEST",
  "chargeId": "cha_xxx",
  "accountId": null
}
```

**Respostas:**

<details>
<summary><code>201</code> — Sucesso</summary>

```json
{
  "refundId": "ref_1774437918293_jm2hen5y7",
  "status": "PROCESSING",
  "amount": 100.0,
  "reason": "CUSTOMER_REQUEST",
  "endToEndId": "E003603052026032511186a4f4cdf139",
  "returnIdentification": "D13935893202603251125zbRSLI3lqPH",
  "chargeId": "cha_1774437468463_4hj927ips",
  "createdAt": "2026-03-25T11:25:18.293Z"
}
```

</details>

<details>
<summary><code>400</code> — Valor excede o disponível</summary>

```json
{
  "error": {
    "message": "Valor do estorno excede o valor disponível para devolução",
    "code": "REFUND_AMOUNT_EXCEEDED",
    "details": null,
    "timestamp": "2026-06-10T10:00:00.000Z"
  }
}
```

</details>

<details>
<summary><code>401</code> — Não autorizado</summary>

```json
{
  "error": {
    "message": "Subconta nao pertence a esta conta",
    "code": "OWNERSHIP_MISMATCH",
    "details": null,
    "timestamp": "2026-03-25T11:28:25.397Z"
  }
}
```

</details>


### Consultar Reembolso

```
GET {{base_url}}/v1/wallet/refunds
```

**Escopo necessário:** `wallet/read`

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `limit` | não | Itens por página (padrão: 15) |
| `lastKey` | não | Código de posição retornado pela última consulta, para carregar a próxima página |
| `startDate` | não | Data início no formato `2026-07-01T00:00:00Z` |
| `endDate` | não | Data fim no formato `2026-07-01T00:00:00Z` |
| `accountId` | não | ID da subconta (para chamadas feitas de servidor para servidor) |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "items": [
    {
      "refundId": "ref_xxx",
      "status": "COMPLETED",
      "amount": 100.0,
      "reason": "CUSTOMER_REQUEST",
      "chargeId": "cha_xxx",
      "endToEndId": "E...",
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 15,
    "hasMore": false
  }
}
```

</details>

---

## Webhooks

Gerenciamento das URLs que recebem notificações automáticas quando eventos importantes acontecem na conta, como pagamentos, cancelamentos e renovações de assinatura.

**Eventos disponíveis:** `charge.created`, `charge.paid`, `charge.canceled`, `charge.archived`, `charge.refunded`, `payment.success`, `payment.failed`, `subscription.created`, `subscription.activated`, `subscription.canceled`, `subscription.renewed`, `subscription.past_due`

### Criar Webhook

```
POST {{base_url}}/v1/users/webhooks
```

**Body (JSON):**

```json
{
  "url": "https://meusite.com/webhook",
  "events": [
    "charge.created",
    "payment.success",
    "payment.failed",
    "subscription.created",
    "subscription.activated",
    "subscription.canceled",
    "subscription.renewed"
  ],
  "authToken": "meu-token-secreto"
}
```

**Respostas:**

<details>
<summary><code>201</code> — Criado</summary>

```json
{
  "webhookId": "wh_xxx",
  "url": "https://meusite.com/webhook",
  "events": ["payment.success"],
  "status": "active",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

</details>

<details>
<summary><code>400</code> — URL inválida</summary>

```json
{
  "code": "VALIDATION_ERROR",
  "message": "URL inválida"
}
```

</details>


### Listar Webhooks

```
GET {{base_url}}/v1/users/webhooks
```

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
[
  {
    "webhookId": "wh_xxx",
    "url": "https://meusite.com/webhook",
    "events": [],
    "status": "active"
  }
]
```

</details>


### Buscar Webhook

```
GET {{base_url}}/v1/users/webhooks/:id
```

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do webhook |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "webhookId": "wh_xxx",
  "url": "https://meusite.com/webhook",
  "events": [],
  "status": "active"
}
```

</details>

<details>
<summary><code>404</code> — Não encontrado</summary>

```json
{
  "code": "WEBHOOK_NOT_FOUND"
}
```

</details>


### Atualizar Webhook

```
PUT {{base_url}}/v1/users/webhooks/:id
```

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do webhook |

**Body (JSON):**

```json
{
  "url": "https://meusite.com/novo-webhook",
  "events": ["payment.success", "payment.failed"],
  "status": "active",
  "authToken": "novo-token"
}
```

**Respostas:**

<details>
<summary><code>200</code> — Atualizado</summary>

```json
{
  "webhookId": "wh_xxx",
  "url": "https://meusite.com/novo-webhook",
  "status": "active"
}
```

</details>


### Remover Webhook

```
DELETE {{base_url}}/v1/users/webhooks/:id
```

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do webhook |

**Respostas:**

<details>
<summary><code>200</code> — Removido</summary>

```json
{
  "message": "Deletado com sucesso"
}
```

</details>


### Testar Webhook

```
POST {{base_url}}/v1/users/webhooks/test
```

Envia um evento de teste para a URL configurada, permitindo verificar se as notificações estão sendo recebidas corretamente.

**Body (JSON):**

```json
{
  "webhookId": "wh_xxx",
  "entity": "payment.success"
}
```

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "success": true,
  "url": "https://meusite.com/webhook",
  "event": "payment.success",
  "payload": {},
  "response": {
    "statusCode": 200
  }
}
```

</details>

<details>
<summary><code>400</code> — Falha</summary>

```json
{
  "success": false,
  "error": "Connection refused"
}
```

</details>


### Listar Eventos

```
GET {{base_url}}/v1/users/webhooks/events
```

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `limit` | não | Itens por página (padrão: 50) |
| `nextPageToken` | não | Código de posição retornado pela última consulta, para carregar a próxima página |
| `type` | não | Filtro por tipo de evento |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "items": [
    {
      "eventId": "evt_xxx",
      "webhookId": "wh_xxx",
      "type": "payment.success",
      "status": "success",
      "attempt": 1,
      "responseStatusCode": 200,
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "count": 10,
  "total": 100,
  "hasMore": true,
  "nextPageToken": "eyJ..."
}
```

</details>


### Reprocessar Evento

```
POST {{base_url}}/v1/users/webhooks/events/:id/retry
```

Reenvia a notificação de um evento que não foi entregue ou precisa ser reprocessado.

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do evento |

**Respostas:**

<details>
<summary><code>200</code> — Reenviado</summary>

```json
{
  "message": "Webhook reenviado com sucesso",
  "webhookEventId": "evt_xxx",
  "attempt": 2,
  "status": "success"
}
```

</details>

<details>
<summary><code>404</code> — Evento não encontrado</summary>

```json
{
  "code": "WEBHOOK_EVENT_NOT_FOUND"
}
```

</details>

---

## Produtos e Preços

Um **Produto** representa um serviço ou plano (ex.: "Plano Pro"). Cada produto tem um ou mais **Preços** (`prices`), que definem o valor e a recorrência. Os preços são usados para criar assinaturas e checkouts.

**Tipos de recorrência:** `ONE_TIME` | `WEEKLY` | `MONTHLY` | `QUARTERLY` | `SEMIANNUAL` | `YEARLY`

### Criar Produto

```
POST {{base_url}}/v1/products
```

**Escopo necessário:** `products/write`

**Body (JSON):**

```json
{
  "name": "Plano Pro",
  "description": "Acesso completo à plataforma",
  "statementDescriptor": "VALIDAPAY TESTE",
  "metadata": {
    "externalId": "plan_abc123"
  },
  "prices": [
    {
      "title": "Mensal",
      "recurrenceType": "MONTHLY",
      "description": "Cobrança mensal",
      "amount": 99.9,
      "trialDays": 7
    },
    {
      "title": "Avulso",
      "recurrenceType": "ONE_TIME",
      "description": "Compra única",
      "amount": 199.9
    }
  ]
}
```

**Respostas:**

<details>
<summary><code>200</code> — Produto criado</summary>

```json
{
  "productId": "prod_1772275462312_lsopu8ntr",
  "name": "Plano Pro",
  "description": "Acesso completo à plataforma",
  "type": "RECURRING",
  "billingPeriod": "MONTHLY",
  "currency": "BRL",
  "status": "active",
  "emitirNf": false,
  "metadata": {
    "externalId": "plan_abc123"
  },
  "statementDescriptor": "VALIDAPAY TESTE",
  "createdAt": "2026-02-28T10:44:22.312Z",
  "updatedAt": "2026-02-28T10:44:22.312Z",
  "prices": [
    {
      "priceId": "price_1772275462439_ztt2gcewl",
      "productId": "prod_1772275462312_lsopu8ntr",
      "title": "Mensal",
      "description": "Cobrança mensal",
      "amount": 99.9,
      "recurrenceType": "MONTHLY",
      "recurrenceInterval": 1,
      "trialDays": 7,
      "isActive": true,
      "discounts": [],
      "statementDescriptor": "Mensal"
    }
  ]
}
```

</details>


### Listar Produtos

```
GET {{base_url}}/v1/products
```

**Escopo necessário:** `products/read`

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `limit` | não | Itens por página (padrão: 50) |
| `lastKey` | não | Código de posição retornado pela última consulta, para carregar a próxima página |
| `status` | não | Filtro por status (`active`, `archived`) |
| `search` | não | Busca por nome |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
[
  {
    "productId": "prod_1772275462312_lsopu8ntr",
    "name": "Plano Pro",
    "status": "active",
    "currency": "BRL",
    "type": "RECURRING",
    "createdAt": "2026-02-28T10:44:22.312Z",
    "prices": [
      {
        "priceId": "price_1772275462439_ztt2gcewl",
        "title": "Mensal",
        "amount": 99.9,
        "recurrenceType": "MONTHLY",
        "isActive": true
      }
    ]
  }
]
```

</details>


### Buscar Produto

```
GET {{base_url}}/v1/products/:id
```

**Escopo necessário:** `products/read`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do produto |

**Respostas:**

<details>
<summary><code>200</code> — Produto encontrado</summary>

```json
{
  "productId": "prod_1772275462312_lsopu8ntr",
  "name": "Plano Pro",
  "description": "Acesso completo à plataforma",
  "type": "RECURRING",
  "status": "active",
  "currency": "BRL",
  "statementDescriptor": "VALIDAPAY",
  "metadata": {
    "externalId": "plan_abc123"
  },
  "createdAt": "2026-02-28T10:44:22.312Z",
  "updatedAt": "2026-02-28T10:44:22.312Z",
  "prices": [
    {
      "priceId": "price_1772275462439_ztt2gcewl",
      "productId": "prod_1772275462312_lsopu8ntr",
      "title": "Mensal",
      "description": "Cobrança mensal",
      "amount": 99.9,
      "recurrenceType": "MONTHLY",
      "recurrenceInterval": 1,
      "trialDays": 7,
      "isActive": true,
      "discounts": []
    }
  ]
}
```

</details>

<details>
<summary><code>404</code> — Produto não encontrado</summary>

```json
{
  "error": {
    "message": "Produto prod_xxxx não encontrado",
    "code": "PRODUCT_NOT_FOUND",
    "details": null,
    "timestamp": "2026-06-10T10:00:00.000Z"
  }
}
```

</details>


### Atualizar Produto

```
PUT {{base_url}}/v1/products/:id
```

**Escopo necessário:** `products/write`

Para preços, inclua `priceId` para atualizar um existente ou omita para criar um novo.

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do produto |

**Body (JSON):**

```json
{
  "name": "Plano Pro Atualizado",
  "description": "Acesso completo à plataforma",
  "statementDescriptor": "VALIDAPAY TESTE",
  "status": "active",
  "prices": [
    {
      "priceId": "price_xxxx",
      "title": "Mensal",
      "recurrenceType": "MONTHLY",
      "amount": 149.9,
      "trialDays": 7
    }
  ]
}
```

**Respostas:**

<details>
<summary><code>200</code> — Produto atualizado</summary>

```json
{
  "productId": "prod_1772275462312_lsopu8ntr",
  "name": "Plano Pro Atualizado",
  "status": "active",
  "updatedAt": "2026-06-10T10:00:00.000Z"
}
```

</details>


### Remover Produto

```
DELETE {{base_url}}/v1/products/:id
```

**Escopo necessário:** `products/write`

Não é possível remover produtos com assinaturas ativas.

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do produto |

**Respostas:**

<details>
<summary><code>200</code> — Removido</summary>

```json
{
  "message": "Produto deletado com sucesso",
  "productId": "prod_1772275462312_lsopu8ntr"
}
```

</details>

<details>
<summary><code>400</code> — Assinaturas ativas</summary>

```json
{
  "error": {
    "message": "Não é possível deletar um produto com assinaturas ativas",
    "code": "PRODUCT_HAS_ACTIVE_SUBSCRIPTIONS",
    "details": null,
    "timestamp": "2026-06-10T10:00:00.000Z"
  }
}
```

</details>


### Arquivar Produto

```
POST {{base_url}}/v1/products/:id/archive
```

**Escopo necessário:** `products/write`

Produtos arquivados não ficam disponíveis para novas cobranças, mas as assinaturas existentes continuam funcionando.

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do produto |

**Respostas:**

<details>
<summary><code>200</code> — Arquivado</summary>

```json
{
  "productId": "prod_1772275462312_lsopu8ntr",
  "status": "archived",
  "archivedAt": "2026-06-10T10:00:00.000Z"
}
```

</details>

---

## Clientes

Cadastro e gestão centralizada dos dados dos compradores.

### Criar Cliente

```
POST {{base_url}}/v1/customers
```

**Escopo necessário:** `customers/write`

**Body (JSON):**

```json
{
  "name": "João da Silva",
  "phone": "+5511999998888",
  "email": "joao@email.com",
  "document": "12345678901",
  "upsert": false
}
```

> `upsert: true` atualiza o cadastro se o documento já existir; caso contrário, cria um novo cliente.

**Respostas:**

<details>
<summary><code>201</code> — Criado</summary>

```json
{
  "customer": {
    "customerId": "cus_xxx",
    "name": "João da Silva",
    "document": "12345678901",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

</details>

<details>
<summary><code>400</code> — Já existe</summary>

```json
{
  "code": "CUSTOMER_ALREADY_EXISTS"
}
```

</details>


### Listar Clientes

```
GET {{base_url}}/v1/customers
```

**Escopo necessário:** `customers/read`

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `limit` | não | Itens por página (padrão: 15) |
| `lastKey` | não | Código de posição retornado pela última consulta, para carregar a próxima página |
| `startDate` | não | Data de criação início no formato `2026-07-01T00:00:00Z` |
| `endDate` | não | Data de criação fim no formato `2026-07-01T00:00:00Z` |
| `document` | não | CPF ou CNPJ do cliente (texto exato, sem busca parcial) |
| `search` | não | Busca por nome ou e-mail |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "items": [
    {
      "customerId": "cus_xxx",
      "name": "João da Silva",
      "document": "12345678901",
      "email": "joao@email.com"
    }
  ],
  "pagination": {
    "total": 5,
    "hasMore": false
  }
}
```

</details>


### Buscar Cliente

```
GET {{base_url}}/v1/customers/:id
```

**Escopo necessário:** `customers/read`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do cliente |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "customerId": "cus_xxx",
  "name": "João da Silva",
  "addresses": [],
  "subscriptions": [],
  "ltv": 0
}
```

</details>

<details>
<summary><code>404</code> — Não encontrado</summary>

```json
{
  "code": "CUSTOMER_NOT_FOUND"
}
```

</details>


### Atualizar Cliente

```
PUT {{base_url}}/v1/customers/:id
```

**Escopo necessário:** `customers/write`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do cliente |

**Body (JSON):**

```json
{
  "name": "João Silva Atualizado",
  "email": "novo@email.com",
  "phone": "+5511988887777"
}
```

**Respostas:**

<details>
<summary><code>200</code> — Atualizado</summary>

```json
{
  "customer": {
    "customerId": "cus_xxx",
    "name": "João Silva Atualizado"
  }
}
```

</details>


### Remover Cliente

```
DELETE {{base_url}}/v1/customers/:id
```

**Escopo necessário:** `customers/write`

Não é possível remover clientes com cobranças ou assinaturas ativas.

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do cliente |

**Respostas:**

<details>
<summary><code>200</code> — Removido</summary>

```json
{
  "message": "Cliente deletado com sucesso"
}
```

</details>

<details>
<summary><code>400</code> — Possui assinaturas</summary>

```json
{
  "code": "CUSTOMER_HAS_SUBSCRIPTIONS"
}
```

</details>

---

## Cupons de Desconto

Cupons de desconto aplicáveis em checkouts e assinaturas. Aceitam desconto percentual (`PERCENTAGE`) ou valor fixo (`FIXED`). É possível configurar quantidade máxima de usos, número máximo de ciclos em que o desconto se aplica, valor mínimo de compra e período de validade.

### Criar Cupom

```
POST {{base_url}}/v1/coupons
```

**Escopo necessário:** `coupons/write`

**Body (JSON):**

```json
{
  "code": "PROMO10",
  "name": "Promoção 10%",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "maxRedemptions": 100,
  "maxCycles": 3,
  "minAmount": 50.0,
  "validFrom": "2026-01-01T00:00:00.000Z",
  "validUntil": "2026-12-31T23:59:59.000Z",
  "appliesTo": "RECURRING",
  "firstTimeOnly": false
}
```

**Respostas:**

<details>
<summary><code>201</code> — Cupom criado</summary>

```json
{
  "couponId": "cpn_1772275462312_abcdef",
  "code": "PROMO10",
  "name": "Promoção 10%",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "status": "ACTIVE",
  "maxRedemptions": 100,
  "maxCycles": 3,
  "minAmount": 50.0,
  "appliesTo": "RECURRING",
  "firstTimeOnly": false,
  "validFrom": "2026-01-01T00:00:00.000Z",
  "validUntil": "2026-12-31T23:59:59.000Z",
  "createdAt": "2026-06-10T10:00:00.000Z"
}
```

</details>


### Listar Cupons

```
GET {{base_url}}/v1/coupons
```

**Escopo necessário:** `coupons/read`

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `limit` | não | Itens por página (padrão: 15) |
| `lastKey` | não | Código de posição retornado pela última consulta, para carregar a próxima página |
| `status` | não | `ACTIVE`, `PAUSED` ou `INACTIVE` |
| `search` | não | Busca por código ou nome |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "data": [
    {
      "couponId": "cpn_xxx",
      "code": "PROMO10",
      "discountType": "PERCENTAGE",
      "discountValue": 10,
      "status": "ACTIVE",
      "maxRedemptions": 100,
      "redemptionsCount": 5
    }
  ],
  "hasMore": false,
  "lastKey": null
}
```

</details>


### Buscar Cupom

```
GET {{base_url}}/v1/coupons/:couponId
```

**Escopo necessário:** `coupons/read`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:couponId` | ID do cupom |

**Respostas:**

<details>
<summary><code>200</code> — Cupom encontrado</summary>

```json
{
  "couponId": "cpn_xxx",
  "code": "PROMO10",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "status": "ACTIVE",
  "redemptionsCount": 5,
  "createdAt": "2026-06-10T10:00:00.000Z"
}
```

</details>

<details>
<summary><code>404</code> — Cupom não encontrado</summary>

```json
{
  "error": {
    "message": "Cupom cpn_xxx não encontrado",
    "code": "COUPON_NOT_FOUND",
    "details": null,
    "timestamp": "2026-06-10T10:00:00.000Z"
  }
}
```

</details>


### Atualizar Cupom

```
PUT {{base_url}}/v1/coupons/:couponId
```

**Escopo necessário:** `coupons/write`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:couponId` | ID do cupom |

**Body (JSON):**

```json
{
  "name": "Promoção 10% - Atualizado",
  "maxRedemptions": 200,
  "validUntil": "2027-12-31T23:59:59.000Z"
}
```

**Respostas:**

<details>
<summary><code>200</code> — Atualizado</summary>

```json
{
  "couponId": "cpn_xxx",
  "code": "PROMO10",
  "name": "Promoção 10% - Atualizado",
  "status": "ACTIVE",
  "updatedAt": "2026-06-10T10:00:00.000Z"
}
```

</details>


### Atualizar Cupom Parcialmente

```
PATCH {{base_url}}/v1/coupons/:couponId
```

**Escopo necessário:** `coupons/write`

Atualiza apenas o status do cupom. Use `PAUSED` para suspender temporariamente, `INACTIVE` para desativar definitivamente.

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:couponId` | ID do cupom |

**Body (JSON):**

```json
{
  "status": "PAUSED"
}
```

**Respostas:**

<details>
<summary><code>200</code> — Status atualizado</summary>

```json
{
  "couponId": "cpn_xxx",
  "code": "PROMO10",
  "status": "PAUSED",
  "updatedAt": "2026-06-10T10:00:00.000Z"
}
```

</details>

<details>
<summary><code>400</code> — Status inválido</summary>

```json
{
  "error": {
    "message": "Cupom com status INACTIVE não pode ser reativado",
    "code": "COUPON_INACTIVE_CANNOT_REACTIVATE",
    "details": null,
    "timestamp": "2026-06-10T10:00:00.000Z"
  }
}
```

</details>


### Remover Cupom

```
DELETE {{base_url}}/v1/coupons/:couponId
```

**Escopo necessário:** `coupons/write`

Cupons já utilizados em assinaturas não podem ser removidos.

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:couponId` | ID do cupom |

**Respostas:**

<details>
<summary><code>200</code> — Removido</summary>

```json
{
  "message": "Cupom deletado com sucesso",
  "couponId": "cpn_xxx"
}
```

</details>


### Validar Cupom

```
POST {{base_url}}/v1/coupons/:couponId/validate
```

Verifica se um cupom pode ser usado e retorna o valor do desconto calculado. Esta rota pode ser chamada sem token de acesso, ideal para exibir o desconto ao cliente antes de confirmar o pagamento.

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:couponId` | ID do cupom |

**Body (JSON):**

```json
{
  "code": "PROMO10",
  "amount": 100.0,
  "productIds": ["prod_xxxx"],
  "chargeType": "RECURRING",
  "customerDocument": "12345678920"
}
```

**Respostas:**

<details>
<summary><code>200</code> — Cupom válido</summary>

```json
{
  "valid": true,
  "couponId": "cpn_xxx",
  "code": "PROMO10",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "discountAmount": 10.0,
  "finalAmount": 90.0
}
```

</details>

<details>
<summary><code>400</code> — Cupom inválido ou expirado</summary>

```json
{
  "error": {
    "message": "Cupom PROMO10 expirado ou não é válido para este produto",
    "code": "COUPON_INVALID",
    "details": null,
    "timestamp": "2026-06-10T10:00:00.000Z"
  }
}
```

</details>

---

## Cobranças

Cobranças avulsas via PIX, boleto ou cartão de crédito. Suportam divisão automática do valor entre subcontas (split) e agendamento de débito automático via PIX.

**Ciclo de status:** `PENDING` → `PAID` → (`CANCELED` | `ARCHIVED` | `REFUNDED` | `PARTIALLY_REFUNDED`)

### Criar Cobrança PIX

```
POST {{base_url}}/v1/charges
```

**Escopo necessário:** `pix.cob/write`

**Body (JSON):**

```json
{
  "paymentMethod": "pix",
  "amount": 100.0,
  "title": "Cobrança PIX",
  "description": "Referente ao pedido #001",
  "expiration": 3600,
  "customer": {
    "documentNumber": "12345678901",
    "name": "João da Silva",
    "email": "joao@email.com",
    "phone": "+5511999998888"
  },
  "split": [
    {
      "type": "percentage",
      "accountNumber": "123456",
      "amount": 10
    }
  ],
  "metadata": {
    "orderId": "ORD-001"
  },
  "webhookUrl": "https://api.seusite.com.br/webhook"
}
```

> **Split types:** `fixed` (valor fixo em R$) | `percentage` (percentual do valor bruto)

**Respostas:**

<details>
<summary><code>200</code> — PIX gerado</summary>

```json
{
  "chargeId": "cha_xxx",
  "emv": "00020126580014...",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "metadata": {}
}
```

</details>

<details>
<summary><code>400</code> — Split excede valor líquido</summary>

```json
{
  "code": "SPLIT_EXCEEDS_NET_AMOUNT"
}
```

</details>


### Criar Cobrança Boleto

```
POST {{base_url}}/v1/charges
```

**Escopo necessário:** `pix.cob/write`

**Body (JSON):**

```json
{
  "paymentMethod": "boleto",
  "amount": 250.0,
  "title": "Fatura de Serviços",
  "description": "Referente ao mês de julho",
  "dueDate": "2026-07-30",
  "expirationAfterDueDate": 30,
  "customer": {
    "name": "João da Silva",
    "documentNumber": "12345678901",
    "email": "joao@email.com",
    "phone": "+5511999998888",
    "address": {
      "street": "Av. Paulista",
      "number": "1000",
      "complement": "Apto 52",
      "neighborhood": "Bela Vista",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310100",
      "country": "BR"
    }
  },
  "boletoInstructions": {
    "fine": 2,
    "interest": 1,
    "discount": {
      "amount": 5,
      "modality": "fixed",
      "limitDate": "2026-07-29"
    }
  },
  "metadata": {
    "orderId": "ORD-002"
  }
}
```

> Se `dueDate` for omitido, o vencimento será em 30 dias. O campo `boletoInstructions.discount.modality` aceita: `fixed` (valor fixo) ou `percent` (percentual)

**Respostas:**

<details>
<summary><code>200</code> — Boleto gerado</summary>

```json
{
  "chargeId": "cha_xxx",
  "digitableLine": "03399.09097 74000.759406 18000.011230 3 97560000025000",
  "barCode": "03393975600000250009090974000759401800001123",
  "dueDate": "2026-07-30",
  "pdfUrl": "/v1/charges/cha_xxx/boleto.pdf"
}
```

</details>


### Criar Cobrança Cartão

```
POST {{base_url}}/v1/charges
```

**Escopo necessário:** `checkouts/write`

**Body (JSON):**

```json
{
  "paymentMethod": "creditcard",
  "amount": 399.9,
  "title": "Compra avulsa",
  "description": "Produto Premium",
  "customer": {
    "name": "João da Silva",
    "documentNumber": "12345678901",
    "email": "joao@email.com",
    "phone": "+5511999998888"
  },
  "card": {
    "number": "4111111111111111",
    "cvv": "123",
    "name": "JOAO DA SILVA",
    "expiration": "12/2027"
  },
  "installments": 3,
  "passFeesToCustomer": false,
  "freeInstallments": 1,
  "metadata": {
    "orderId": "ORD-003"
  }
}
```

**Respostas:**

<details>
<summary><code>200</code> — Aprovado</summary>

```json
{
  "chargeId": "cha_xxx",
  "status": "PAID",
  "amount": 399.9,
  "paymentType": "CREDIT_CARD",
  "installments": 3
}
```

</details>

<details>
<summary><code>400</code> — Falha ao processar os dados do cartão</summary>

```json
{
  "code": "CARD_TOKENIZATION_FAILED"
}
```

</details>


### Criar Cobrança PIX Automático

```
POST {{base_url}}/v1/charges
```

**Escopo necessário:** `pix.cob/write`

**Body (JSON):**

```json
{
  "paymentMethod": "pix",
  "name": "João da Silva",
  "documentNumber": "12345678901",
  "amount": 150.0,
  "interval": {
    "start": "2026-07-01",
    "frequencyType": "MONTHLY"
  },
  "account": {
    "accountNumber": "123456",
    "documentNumber": "98765432100",
    "name": "Empresa Destino LTDA"
  },
  "metadata": {
    "orderId": "ORD-PIX-AUTO-001"
  }
}
```

**Respostas:**

<details>
<summary><code>200</code> — Criado</summary>

```json
{
  "chargeId": "cha_xxx",
  "status": "PENDING"
}
```

</details>


### Listar Cobranças

```
GET {{base_url}}/v1/charges
```

**Escopo necessário:** `pix.cob/read`

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `limit` | não | Itens por página (padrão: 15) |
| `lastKey` | não | Código de posição retornado pela última consulta, para carregar a próxima página |
| `startDate` | não | Data início no formato `2026-07-01T00:00:00Z` |
| `endDate` | não | Data fim no formato `2026-07-01T00:00:00Z` |
| `status` | não | Filtro por status |
| `search` | não | Busca por nome ou e-mail |
| `document` | não | CPF ou CNPJ do cliente |
| `paymentMethod` | não | `pix` \| `boleto` \| `creditcard` |
| `priceId` | não | Filtro por preço |
| `productId` | não | Filtro por produto |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "items": [
    {
      "chargeId": "cha_xxx",
      "status": "PAID",
      "amount": 100.0,
      "paymentType": "PIX",
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 20,
    "hasMore": true,
    "lastKey": "eyJ..."
  }
}
```

</details>


### Buscar Cobrança

```
GET {{base_url}}/v1/charges/:chargeId
```

**Escopo necessário:** `pix.cob/read`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:chargeId` | ID da cobrança |

**Respostas:**

<details>
<summary><code>200</code> — PAID</summary>

```json
{
  "chargeId": "cha_1771453171013_fp6iocaxb",
  "status": "PAID",
  "amount": 100.0,
  "paymentType": "PIX",
  "emv": "00020101021226910014br.gov.bcb.pix...",
  "paidAt": "2026-02-18T22:22:50.031Z",
  "createdAt": "2026-02-18T22:19:31.013Z"
}
```

</details>

<details>
<summary><code>200</code> — PENDING</summary>

```json
{
  "chargeId": "cha_1771453171013_fp6iocaxb",
  "status": "PENDING",
  "amount": 10.0,
  "paymentType": "PIX",
  "emv": "00020101021226910014br.gov.bcb.pix...",
  "createdAt": "2026-06-10T10:00:00.000Z"
}
```

</details>

<details>
<summary><code>200</code> — CANCELED</summary>

```json
{
  "chargeId": "cha_1771453171013_fp6iocaxb",
  "status": "CANCELED",
  "amount": 10.0,
  "canceledAt": "2026-06-10T10:05:00.000Z",
  "createdAt": "2026-06-10T10:00:00.000Z"
}
```

</details>

<details>
<summary><code>404</code> — Não encontrada</summary>

```json
{
  "error": {
    "message": "Cobrança cha_xxx não encontrada",
    "code": "CHARGE_NOT_FOUND",
    "details": null,
    "timestamp": "2026-06-10T10:00:00.000Z"
  }
}
```

</details>


### Cancelar Cobrança

```
DELETE {{base_url}}/v1/charges/:chargeId
```

**Escopo necessário:** `pix.cob/write`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:chargeId` | ID da cobrança |

**Respostas:**

<details>
<summary><code>200</code> — Cancelada</summary>

```json
{
  "message": "Cobrança cancelada com sucesso",
  "chargeId": "cha_1779239661689_g1ugeix0e"
}
```

</details>

<details>
<summary><code>400</code> — Não cancelável</summary>

```json
{
  "error": {
    "message": "Não é possível cancelar uma cobrança com status PAID",
    "code": "CHARGE_ALREADY_PAID",
    "details": null,
    "timestamp": "2026-06-10T10:00:00.000Z"
  }
}
```

</details>


### Arquivar Cobrança

```
POST {{base_url}}/v1/charges/:chargeId/archive
```

**Escopo necessário:** `pix.cob/write`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:chargeId` | ID da cobrança |

**Respostas:**

<details>
<summary><code>200</code> — Arquivada</summary>

```json
{
  "chargeId": "cha_1779238435235_iaw4pcprl",
  "status": "ARCHIVED",
  "archivedAt": "2026-05-23T13:06:09.693Z"
}
```

</details>


### Baixar Boleto

```
GET {{base_url}}/v1/charges/:chargeId/boleto.pdf
```

**Escopo necessário:** `pix.cob/read`

Retorna o arquivo PDF do boleto para envio ou exibição ao cliente.

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:chargeId` | ID da cobrança |

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `download` | não | Se `true`, força download do arquivo |

**Respostas:**

- `200` — Arquivo PDF (Content-Type: `application/pdf`)
- `400` — `CHARGE_NOT_BOLETO` — Cobrança não é boleto
- `404` — `BOLETO_PDF_NOT_AVAILABLE` — PDF ainda não disponível

---

## Checkouts

Dois modelos: **Checkout** (link de pagamento permanente, reutilizável, com aparência personalizada) e **Sessão de Checkout** (link temporário para uso único). Ambos aceitam PIX, boleto e cartão.

### Criar Checkout

```
POST {{base_url}}/v1/checkouts
```

**Escopo necessário:** `checkouts/write`

Cria uma página de pagamento configurável com produtos, métodos aceitos, cupons e aparência personalizada.

**Body (JSON):**

```json
{
  "priceId": "price_xxx",
  "allowedPaymentMethods": ["pix", "creditcard", "boleto"],
  "successUrl": "https://meusite.com/obrigado",
  "cancelUrl": "https://meusite.com/cancelado",
  "redirectAfterPaymentUrl": "https://meusite.com/redirect",
  "successMessage": "Obrigado pela compra!",
  "maxInstallments": 12,
  "freeInstallments": 1,
  "passFeesToCustomer": false,
  "checkoutName": "Oferta Black Friday",
  "primaryColor": "#7C3AED",
  "secondaryColor": "#EDE9FE",
  "fontColor": "#1F2937",
  "showProductImage": true,
  "metadata": {}
}
```

**Respostas:**

<details>
<summary><code>200</code> — Checkout criado</summary>

```json
{
  "id": "pl_xxx",
  "url": "https://app.validapay.com.br/pagamento/pl_xxx",
  "priceId": "price_xxx"
}
```

</details>


### Listar Checkouts

```
GET {{base_url}}/v1/checkouts
```

**Escopo necessário:** `checkouts/read`

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `limit` | não | Itens por página (padrão: 15) |
| `lastKey` | não | Código de posição retornado pela última consulta, para carregar a próxima página |
| `status` | não | Filtro por status |
| `search` | não | Busca por nome |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "items": [
    {
      "id": "pl_xxx",
      "url": "https://app.validapay.com.br/pagamento/pl_xxx",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "total": 5,
    "hasMore": false
  }
}
```

</details>


### Buscar Checkout

```
GET {{base_url}}/v1/checkouts/:id
```

**Escopo necessário:** `checkouts/read`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do checkout |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "id": "pl_xxx",
  "status": "ACTIVE",
  "priceId": "price_xxx",
  "allowedPaymentMethods": ["pix", "creditcard"]
}
```

</details>

<details>
<summary><code>404</code> — Não encontrado</summary>

```json
{
  "code": "CHECKOUT_NOT_FOUND"
}
```

</details>


### Atualizar Checkout

```
PUT {{base_url}}/v1/checkouts/:id
```

**Escopo necessário:** `checkouts/write`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID do checkout |

**Body (JSON):**

```json
{
  "priceId": "price_yyy",
  "maxInstallments": 6,
  "primaryColor": "#FF0000",
  "showProductImage": false
}
```

**Respostas:**

<details>
<summary><code>200</code> — Atualizado</summary>

```json
{
  "id": "pl_xxx",
  "priceId": "price_yyy"
}
```

</details>


### Checkout Transparente

```
POST {{base_url}}/v1/checkouts/pay
```

**Escopo necessário:** `checkouts/write`

Processa o pagamento diretamente via API, sem redirecionar o cliente para outra página. Ideal quando você quer controlar toda a experiência de pagamento na sua própria interface.

**Body (JSON):**

```json
{
  "sessionId": "cs_abc123",
  "paymentMethod": "creditcard",
  "customer": {
    "name": "João da Silva",
    "email": "joao@email.com",
    "documentNumber": "12345678901",
    "phone": "+5511999998888",
    "address": {
      "street": "Av. Paulista",
      "number": "1000",
      "complement": "Apto 52",
      "neighborhood": "Bela Vista",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310100",
      "country": "BR",
      "cityCode": "3550308"
    }
  },
  "card": {
    "number": "4111111111111111",
    "cvv": "123",
    "name": "JOAO DA SILVA",
    "expiration": "12/2027"
  },
  "installments": 3
}
```

**Respostas:**

<details>
<summary><code>200</code> — Assinatura cartão</summary>

```json
{
  "success": true,
  "subscriptionId": "sub_xxx",
  "customerId": "cus_xxx",
  "chargeId": "cha_xxx"
}
```

</details>

<details>
<summary><code>200</code> — Assinatura PIX</summary>

```json
{
  "success": true,
  "subscriptionId": "sub_xxx",
  "pix": {
    "emv": "00020101...",
    "qrCode": "data:image/png;base64,..."
  }
}
```

</details>


### Criar Sessão de Checkout

```
POST {{base_url}}/v1/checkout-sessions
```

**Escopo necessário:** `checkouts/write`

Cria um acesso temporário e seguro (uso único) a uma página de pagamento.

> ⚠️ **Atenção:** Uma sessão só pode ser paga uma única vez. Após o pagamento, a sessão é marcada como `completed` e novas tentativas não serão possíveis.

**Body (JSON):**

```json
{
  "priceId": "price_abc123",
  "allowedPaymentMethods": ["pix", "creditcard", "boleto"],
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "documentNumber": "12345678901",
    "phone": "51999999999",
    "address": {
      "type": "BILLING",
      "street": "Rua das Flores",
      "number": "123",
      "complement": "Apto 4",
      "neighborhood": "Centro",
      "city": "Porto Alegre",
      "state": "RS",
      "zipCode": "90010000",
      "country": "BR",
      "cityCode": "4314902"
    }
  },
  "items": [
    { "priceId": "price_abc123", "quantity": 1 }
  ]
}
```

**Respostas:**

<details>
<summary><code>200</code> — Sessão criada</summary>

```json
{
  "id": "cs_abc123",
  "url": "https://app.validapay.com.br/pagamento/cs_abc123",
  "priceId": "price_abc123"
}
```

</details>

<details>
<summary><code>400</code> — Dados inválidos</summary>

```json
{
  "error": {
    "code": "INVALID_DATA",
    "message": "Campo inválido",
    "details": []
  }
}
```

</details>


### Buscar Sessão de Checkout

```
GET {{base_url}}/v1/checkout-sessions/:id
```

**Escopo necessário:** `checkouts/read`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:id` | ID da sessão |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "id": "cs_xxx",
  "status": "PENDING",
  "priceId": "price_xxx",
  "allowedPaymentMethods": ["pix", "creditcard"]
}
```

</details>

<details>
<summary><code>404</code> — Não encontrada</summary>

```json
{
  "code": "SESSION_NOT_FOUND"
}
```

</details>

---

## Assinaturas

Modelo de cobrança recorrente atrelado a um Produto/Preço. Os ciclos são gerados automaticamente conforme o tipo de recorrência (`recurrenceType`) do preço. Permite subir de plano com cobrança do valor proporcional ao tempo restante no ciclo atual, descer de plano com a mudança agendada para o próximo ciclo, e adicionar itens avulsos à assinatura.

**Ciclo de status:** `TRIALING` → `ACTIVE` → `PAST_DUE` → (`CANCELED` | `PAUSED`)

### Listar Assinaturas

```
GET {{base_url}}/v1/subscriptions
```

**Escopo necessário:** `subscriptions/read`

**Query params:**

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `limit` | não | Itens por página (padrão: 15) |
| `lastKey` | não | Código de posição retornado pela última consulta, para carregar a próxima página |
| `startDate` | não | Data início no formato `2026-07-01T00:00:00Z` |
| `endDate` | não | Data fim no formato `2026-07-01T00:00:00Z` |
| `status` | não | `ACTIVE` \| `PENDING` \| `CANCELED` \| `PAST_DUE` \| `PAUSED` |
| `search` | não | Busca por nome ou e-mail do cliente |
| `document` | não | CPF ou CNPJ do cliente (texto exato, sem busca parcial) |
| `paymentMethod` | não | `CREDIT_CARD` \| `PIX` \| `BOLETO` |
| `priceId` | não | Filtro por preço |
| `productId` | não | Filtro por produto |

**Respostas:**

<details>
<summary><code>200</code> — Sucesso</summary>

```json
{
  "items": [
    {
      "subscriptionId": "sub_xxx",
      "status": "ACTIVE",
      "interval": "MONTHLY",
      "billingDay": 15,
      "currentCycleNumber": 3,
      "currentCycleAmount": 99.9,
      "nextCycleChargeDate": "2026-07-15",
      "customer": {
        "customerId": "cus_xxx",
        "name": "João da Silva"
      }
    }
  ],
  "hasMore": false,
  "lastKey": null
}
```

</details>


### Buscar Assinatura

```
GET {{base_url}}/v1/subscriptions/:subscriptionId
```

**Escopo necessário:** `subscriptions/read`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:subscriptionId` | ID da assinatura |

**Respostas:**

<details>
<summary><code>200</code> — Assinatura encontrada</summary>

```json
{
  "subscriptionId": "sub_xxx",
  "status": "ACTIVE",
  "paymentMethod": "CREDIT_CARD",
  "amount": 99.9,
  "interval": "MONTHLY",
  "customerId": "cus_xxx",
  "customer": {
    "name": "Isaac Newton",
    "email": "isaac@example.com",
    "documentNumber": "12345678920"
  },
  "items": [
    {
      "itemId": "item_xxxx",
      "priceId": "price_xxxx",
      "quantity": 1,
      "amount": 99.9,
      "status": "ACTIVE"
    }
  ],
  "upgrades": [],
  "billingCycles": [],
  "coupon": null,
  "currentPeriodStart": "2026-06-01T00:00:00.000Z",
  "currentPeriodEnd": "2026-07-01T00:00:00.000Z",
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

</details>

<details>
<summary><code>404</code> — Não encontrada</summary>

```json
{
  "error": {
    "message": "Assinatura sub_xxxx não encontrada",
    "code": "SUBSCRIPTION_NOT_FOUND",
    "details": null,
    "timestamp": "2026-06-10T10:00:00.000Z"
  }
}
```

</details>


### Atualizar Assinatura

```
PATCH {{base_url}}/v1/subscriptions/:subscriptionId
```

**Escopo necessário:** `subscriptions/write`

Cancela a assinatura ou altera o plano de um item (subida ou descida de nível).

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:subscriptionId` | ID da assinatura |

**Body (JSON) — Cancelar:**

```json
{
  "action": "cancel",
  "reason": "Cliente solicitou cancelamento"
}
```

**Body (JSON) — Upgrade/Downgrade de item:**

```json
{
  "old": {
    "itemId": "item_xxx"
  },
  "new": {
    "priceId": "price_yyy",
    "quantity": 2
  }
}
```

**Respostas:**

<details>
<summary><code>200</code> — Cancelada</summary>

```json
{
  "success": true,
  "status": "CANCELED",
  "reason": "Cliente solicitou cancelamento"
}
```

</details>

<details>
<summary><code>200</code> — Upgrade realizado</summary>

```json
{
  "success": true,
  "type": "UPGRADE",
  "chargeId": "cha_xxx",
  "prorataAmount": 45.0
}
```

</details>


### Cancelar Assinatura

```
DELETE {{base_url}}/v1/subscriptions/:subscriptionId
```

**Escopo necessário:** `subscriptions/write`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:subscriptionId` | ID da assinatura |

**Body (JSON):**

```json
{
  "reason": "Cliente solicitou"
}
```

**Respostas:**

<details>
<summary><code>200</code> — Cancelada</summary>

```json
{
  "success": true,
  "message": "Assinatura cancelada com sucesso",
  "status": "CANCELED",
  "canceledCycles": 2
}
```

</details>

<details>
<summary><code>400</code> — Já cancelada</summary>

```json
{
  "code": "SUBSCRIPTION_ALREADY_CANCELED"
}
```

</details>


### Adicionar Item à Assinatura

```
POST {{base_url}}/v1/subscriptions/:subscriptionId/items
```

**Escopo necessário:** `subscriptions/write`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:subscriptionId` | ID da assinatura |

**Body (JSON):**

```json
{
  "priceId": "price_xxx",
  "quantity": 1,
  "type": "RECURRING",
  "boletoInstructions": {
    "fine": 2.0,
    "interest": 1.0
  },
  "expirationAfterDueDate": 30
}
```

**Respostas:**

<details>
<summary><code>200</code> — Item adicionado (cartão)</summary>

```json
{
  "success": true,
  "type": "ADD_ITEM",
  "chargeId": "cha_xxx",
  "amount": 49.9,
  "newAmount": 149.8
}
```

</details>

<details>
<summary><code>200</code> — Item adicionado (PIX/Boleto)</summary>

```json
{
  "success": true,
  "type": "ADD_ITEM",
  "paymentMethod": "PIX",
  "chargeId": "cha_xxx",
  "payment": {
    "emvQrCode": "00020101..."
  }
}
```

</details>


### Atualizar Item da Assinatura

```
PUT {{base_url}}/v1/subscriptions/:subscriptionId/items/:itemId
```

**Escopo necessário:** `subscriptions/write`

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:subscriptionId` | ID da assinatura |
| `:itemId` | ID do item |

**Body (JSON):**

```json
{
  "priceId": "price_yyy",
  "quantity": 2
}
```

**Respostas:**

<details>
<summary><code>200</code> — Upgrade</summary>

```json
{
  "success": true,
  "type": "UPGRADE",
  "chargeId": "cha_xxx",
  "prorataAmount": 33.5,
  "newAmount": 199.9
}
```

</details>

<details>
<summary><code>200</code> — Downgrade agendado</summary>

```json
{
  "success": true,
  "type": "DOWNGRADE",
  "effectiveAt": "2026-07-01",
  "newAmount": 59.9
}
```

</details>


### Cobrar Proporcional (Pro Rata)

```
POST {{base_url}}/v1/subscriptions/:subscriptionId/prorata
```

**Escopo necessário:** `subscriptions/write`

Calcula e gera uma cobrança pelo valor proporcional aos dias já utilizados no ciclo atual. Útil quando o cliente muda de plano no meio do período de cobrança.

**Parâmetros de rota:**

| Parâmetro | Descrição |
|-----------|-----------|
| `:subscriptionId` | ID da assinatura |

**Body (JSON):**

```json
{
  "old": {
    "priceId": "price_xxx",
    "quantity": 1
  },
  "new": {
    "priceId": "price_yyy",
    "quantity": 1
  }
}
```

**Respostas:**

<details>
<summary><code>200</code> — Pro rata calculado</summary>

```json
{
  "subscriptionId": "sub_xxx",
  "currentAmount": 99.9,
  "newAmount": 199.9,
  "prorataAmount": 45.48,
  "remainingDays": 15,
  "cycleDays": 31,
  "currentCredit": 48.34,
  "nextCycleChargeDate": "2026-07-15"
}
```

</details>

<details>
<summary><code>404</code> — Preço anterior não encontrado</summary>

```json
{
  "code": "OLD_PRICE_NOT_FOUND"
}
```

</details>

---

## Split de Pagamentos

Divide automaticamente o valor de uma cobrança entre múltiplas subcontas. Dois tipos: `fixed` (valor fixo em R$) e `percentage` (percentual do valor bruto). O split é descontado do valor que sobra após a dedução das taxas da ValidaPay.

O split é configurado pelo campo `split` nas rotas de criação de cobrança (ver seção Cobranças). Para gerar cobranças em subcontas com repasse para a conta principal, envie o header `X-Sub-Account`.

**Header necessário ao gerar cobranças em nome de uma subconta:**

| Header | Valor | Descrição |
|--------|-------|-----------|
| `X-Sub-Account` | `{{subaccount_number}}` | Obrigatório. Número da subconta onde a cobrança será gerada |

> ⚠️ **Atenção:** O número da subconta é retornado via webhook quando a subconta é aprovada.

---

## Glossário de IDs e Prefixos

| Prefixo | Recurso |
|---------|---------|
| `cha_` | Cobrança (charge) |
| `sub_` | Assinatura (subscription) |
| `prod_` | Produto (product) |
| `price_` | Preço de produto |
| `item_` | Item de assinatura |
| `cus_` | Cliente (customer) |
| `cpn_` | Cupom (coupon) |
| `txn_` | Transação de carteira |
| `wth_` | Saque (withdrawal) |
| `trf_` | Transferência PIX |
| `ref_` | Reembolso (refund) |
| `wh_` | Webhook |
| `pl_` | Checkout (payment link) |
| `cs_` | Sessão de checkout |
| `evt_` | Evento de webhook |
| `prop_` | Proposta de subconta |

---

## Apêndice — Campos Financeiros (Subcontas)

### financialDetails (PF)

| Campo | Descrição |
|-------|-----------|
| `declaredIncome` | Renda declarada (código) |
| `occupation` | Ocupação profissional (código) |
| `netWorth` | Patrimônio líquido (código) |

### financialOwnerDetails (sócio PJ)

| Campo | Descrição |
|-------|-----------|
| `ownerDeclaredIncome` | Renda declarada do sócio |
| `ownerDeclaredRevenue` | Faturamento declarado do sócio |

### financialCompanyDetails (PJ)

| Campo | Descrição |
|-------|-----------|
| `declaredCompanyRevenue` | Faturamento declarado da empresa |

