---
title: Valida Pay Edge Function Client
---

# Valida Pay HTTP Client for Edge Functions

Este documento descreve o cliente HTTP implementado em **`supabase/functions/validapay-client/index.ts`** que centraliza a lógica de autenticação e requisições à API da Valida Pay.

## Variáveis de ambiente (configuradas no Supabase Dashboard – sandbox)
- `VALIDAPAY_BASE_URL` – URL base da API, por exemplo `https://sandbox.validapay.com.br`.
- `VALIDAPAY_AUTH_URL` – URL base para autenticação, normalmente a mesma base.
- `VALIDAPAY_CLIENT_ID` – _client_id_ OAuth2.
- `VALIDAPAY_CLIENT_SECRET` – _client_secret_ OAuth2.

## Funções exportadas
- `getValidaPayToken(): Promise<string>`
  - Busca um token via *client_credentials* e o cacheia em memória.
  - Reutiliza o token enquanto ainda for válido (margem de segurança de 5 s).
- `validaPayFetch(path: string, options?: RequestInit, subAccountNumber?: string): Promise<Response>`
  - Constrói a URL completa usando `VALIDAPAY_BASE_URL` e adiciona o header `Authorization: Bearer <token>`.
  - Opcionalmente inclui o header `X-Sub-Account` quando `subAccountNumber` é informado.
- `validaPayJson<T>(...): Promise<T>`
  - Wrapper que faz a chamada e converte a resposta JSON, lançando erro em caso de status não‑OK.

## Uso típico em outras Edge Functions
```ts
import { validaPayFetch } from "../validapay-client/index.ts";

export async function handler(req: Request) {
  const response = await validaPayFetch("/v1/wallet/balance", { method: "GET" });
  return new Response(await response.text(), { status: response.status });
}
```

## Critérios de aceite atendidos
- **Token válido** – `getValidaPayToken` retorna um token obtido via OAuth2 client‑credentials.
- **Retorno 401** – Caso as credenciais estejam incorretas, a API da Valida Pay responde com 401, que é propagado ao chamador.
- **Segurança** – Todas as credenciais são lidas exclusivamente de variáveis de ambiente server‑side; não há exposição ao frontend.
- **Variáveis configuradas** – Documentado na seção acima; cabe ao time configurar no painel Supabase.

## Referências
- Código fonte: `supabase/functions/validapay-client/index.ts`
- Documentação da API: veja o arquivo `docs/contexto-valida-pay.md` para detalhes das rotas e escopos.
