# Fase 12 — Testes, Qualidade e Produção

Fase de consolidação: infraestrutura de testes, portões de qualidade e
prontidão para produção. **Nenhuma mudança de comportamento** nas fases 2–11 —
apenas ferramentas, redes de segurança e documentação.

---

## 1. Instalar as novas dependências

```bash
npm install
```

Adiciona (devDependencies): `vitest`, `@vitest/coverage-v8`,
`vite-tsconfig-paths`, `@playwright/test`, `prettier`.

> **Commite o `package-lock.json`** gerado por este primeiro `npm install` — o
> CI usa `npm ci`, que exige o lockfile. (O repo ainda não tinha um.)

---

## 2. Testes unitários — Vitest

```bash
npm test              # roda uma vez
npm run test:watch    # modo watch
npm run test:coverage # com cobertura (coverage/index.html)
```

- Config: `vitest.config.ts` (ambiente `node`, alias `@/` via
  `vite-tsconfig-paths`, setup em `test/setup.ts`).
- Suíte em `test/**/*.test.ts` — cobre a **lógica pura e testável sem browser
  nem banco**:

| Arquivo | Cobre |
| --- | --- |
| `test/security/crypto.test.ts` | AES-GCM round-trip, tampering, hash de IP determinístico, `clientIp` |
| `test/security/rate-limit.test.ts` | janela fixa, limite, isolamento por identificador, reset |
| `test/security/sessions.test.ts` | parsing de `iat` do JWT (base64url, malformado) |
| `test/cache/cache.test.ts` | get/set/TTL, `cached()` memo + dedupe, `bust(prefixo)`, `cacheIncr` |
| `test/storage/validate.test.ts` | magic bytes, mime x conteúdo, limite de tamanho, vazio |
| `test/comunidade/moderation.test.ts` | heurística offline (ofensa, spam, links, CAPS) |
| `test/observability/ai-usage.test.ts` | `estimateCostUsd` (tabela + substring), `approxTokens` |
| `test/ai/mock-provider.test.ts` | provedor mock determinístico (texto, JSON, stream) |
| `test/data/reference.test.ts` | bancas, preços/limites da spec, `cn()` |

> Fluxos que dependem de Supabase (queries, actions, RLS) **não** são testados
> em unidade — ficam para o Playwright contra um ambiente provisionado, ou para
> testes de integração futuros com um Supabase local (`supabase start`).

---

## 3. Testes de ponta a ponta — Playwright

```bash
npm run test:e2e:install   # baixa o Chromium (uma vez)
npm run test:e2e           # sobe o dev server na porta 3100 e roda e2e/
```

- `e2e/smoke.spec.ts` — smoke **público**: landing + CTA, `/precos` com os
  preços, `/privacidade` e `/termos`, redirect de rota protegida, banner de
  cookies. Não precisa de secrets (usa placeholders no `webServer.env`).
- Para rodar contra um ambiente real: `E2E_BASE_URL=https://staging... npm run test:e2e`
  (aí o Playwright não sobe servidor local).

---

## 4. Portão único de qualidade

```bash
npm run check   # typecheck + lint + test
```

Use antes de abrir PR. O CI roda o mesmo (`.github/workflows/ci.yml`):

| Job | Passos |
| --- | --- |
| `quality` | `npm ci` → `typecheck` → `lint` → `test --coverage` (+ artefato) |
| `build` | `next build` com env placeholder (não contacta serviços) |
| `e2e` | só em `push`: instala Chromium, roda o smoke |

---

## 5. Formatação — Prettier

`.prettierrc.json` alinhado ao estilo já usado no repo (2 espaços, aspas
duplas, `trailingComma: es5`).

```bash
npm run format          # aplica
npm run format:check    # só verifica (não está no CI por ora)
```

---

## 6. Variáveis de ambiente — inventário e checagem

`lib/env.ts` documenta em código **cada** variável (fase, propósito, fallback).
`instrumentation.ts` (ligado por `experimental.instrumentationHook`) imprime no
boot do servidor:

- aviso se faltar variável **obrigatória** (`NEXT_PUBLIC_SUPABASE_*`);
- em dev, lista as opcionais ausentes (recursos em modo demo).

`checkEnv()` também alimenta o painel `/admin/saude` (Fase 10).

---

## 7. Error boundaries

| Arquivo | Escopo |
| --- | --- |
| `app/global-error.tsx` | falha no próprio RootLayout (HTML/estilos inline) |
| `app/error.tsx` | qualquer erro abaixo da raiz |
| `app/(app)/error.tsx` | área logada — recuperação sem sair do app |

Todos mostram um `reset()` amigável e enviam um beacon para
`POST /api/observability/client-error`, que grava um `system_logs` nível `warn`
(rate-limited, nunca 5xx).

---

## 8. Checklist de produção

Ver **`docs/producao-checklist.md`** — provisionamento, secrets, migrações em
ordem, buckets, cron, verificações pós-deploy e rollback.

---

## 9. Checklist da fase

- [ ] `npm install` (novas devDeps).
- [ ] `npm test` verde.
- [ ] `npm run typecheck` e `npm run lint` limpos.
- [ ] `npm run build` conclui com env placeholder.
- [ ] (opcional) `npm run test:e2e:install && npm run test:e2e` verde.
- [ ] CI configurado (`.github/workflows/ci.yml`) e passando no PR.
