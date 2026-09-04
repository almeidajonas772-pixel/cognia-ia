# Fase 10 — Infraestrutura, Performance, Armazenamento e Monitoramento

Esta fase é **transversal**: não adiciona telas para o estudante, mas dá ao
produto a espinha dorsal para escalar — fila de jobs, cache, logging
estruturado, rastreamento de custo de IA, armazenamento de arquivos validado,
painéis de saúde/consumo e otimizações de entrega.

Nada das fases 2–9 muda de comportamento. Tudo é aditivo e degrada com
elegância quando as variáveis opcionais não estão configuradas.

---

## 1. Migração do banco

No **SQL Editor** do Supabase, rode na ordem:

```
supabase/migrations/0009_infra.sql
```

Cria:

| Objeto | Papel |
| --- | --- |
| `jobs` | Fila de processamento assíncrono (status, payload, tentativas, backoff). |
| `system_logs` | Log estruturado da aplicação (nível, origem, mensagem, meta). |
| `ai_calls` | Uma linha por chamada de IA — provedor, modelo, tokens, duração, custo estimado. |
| `storage_objects` | Metadados de todo arquivo enviado (bucket, path, dono, mime, tamanho). |
| `claim_jobs` / `finish_job` / `set_job_progress` | Reivindicação atômica (`FOR UPDATE SKIP LOCKED`), conclusão com backoff exponencial, progresso. |
| `log_system_event` / `record_ai_call` | Escrita de telemetria (SECURITY DEFINER). |
| `publish_scheduled_posts` / `purge_old_telemetry` | Rotinas do cron. |
| Índices extras | `payments(created_at)`, `subscriptions(status)`, `billing_events(type,created_at)`, `activity_log(kind,created_at)`, `essay_submissions(status,created_at)`. |

RLS: `jobs` visível ao dono e a admins; `system_logs` e `ai_calls` só a
admins; `storage_objects` ao dono e a admins.

Depois, `lib/supabase/types.ts` já foi estendido com as novas tabelas,
funções e enums (`job_status`, `log_level`).

---

## 2. Buckets de Storage

No painel **Storage** do Supabase, crie quatro buckets:

| Bucket | Acesso | Uso |
| --- | --- | --- |
| `avatars` | **público** | foto de perfil |
| `blog` | **público** | capas de artigos (upload só admin) |
| `essays` | **privado** | imagens/PDF de redação |
| `materials` | **privado** | anexos de materiais da comunidade |

Os buckets privados são servidos por **URL assinada** (`signedUrl`, 1 h por
padrão). O endpoint único de upload é `POST /api/upload`
(`multipart/form-data`, campos `kind` e `file`) — valida no servidor tamanho,
MIME real e _magic bytes_ (`lib/storage/validate.ts`).

Sem os buckets, o restante do app continua funcionando; só o upload retorna
erro amigável.

---

## 3. Variáveis de ambiente (todas opcionais)

```bash
# Cache KV — sem elas, cache em memória do processo
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Segredo do worker/cron
CRON_SECRET=            # openssl rand -hex 32
```

- **Sem Upstash:** `lib/cache` usa um `Map` em memória com TTL. Funciona em
  dev e em um único processo; em serverless com múltiplas instâncias o cache
  não é compartilhado (mas nunca serve dado errado — só perde hit rate).
- **Sem `CRON_SECRET`:** `/api/cron` e `/api/jobs/run` aceitam apenas sessão
  de **admin**. Com o segredo, aceitam também `Authorization: Bearer <valor>`.

---

## 4. Agendar o cron

O `vercel.json` já declara um cron a cada 5 minutos apontando para
`/api/cron`. Na Vercel, defina `CRON_SECRET` nas env vars do projeto — a
plataforma injeta o header automaticamente.

Fora da Vercel (Render, Fly, VPS), use **cron-job.org**, **GitHub Actions** ou
`crontab`:

```
*/5 * * * *  curl -s -H "Authorization: Bearer $CRON_SECRET" https://SEU-DOMINIO/api/cron
```

O `/api/cron` executa, tolerante a falhas em cada passo:

1. `expire_due_subscriptions` (Fase 8)
2. `publish_scheduled_posts` (Fase 9) + invalida o cache do blog
3. `processJobs(15)` — drena a fila
4. `purge_old_telemetry(90)` — limpa `page_views`, logs não-erro e `ai_calls`
   com mais de 90 dias, e jobs concluídos com mais de 7 dias

---

## 5. Fila de jobs

`lib/queue/index.ts`:

- `enqueue(type, payload, opts)` — insere um job. `opts.dedupeKey` evita
  duplicar um job `queued`/`running` equivalente.
- `processJobs(limit)` — reivindica um lote via `claim_jobs` e roda o handler
  registrado. Falha → reprogramada com backoff `2^tentativa` minutos até
  `max_attempts` (padrão 3).
- `registerHandler(type, fn)` — em `lib/queue/handlers.ts`. Importar esse
  módulo registra os handlers (feito nas rotas `/api/jobs/run` e `/api/cron`).

**Handler incluído:** `essay_correction` → chama `runCorrection` com um
cliente **service role** (o worker não tem sessão para satisfazer o RLS de
`essay_submissions`).

### Correção de redação, agora assíncrona

`POST /api/redacao/[id]/corrigir` **enfileira** e tenta processar já na
request (best-effort). Se estourar tempo ou falhar, o job fica na fila para o
cron retomar. O componente `RunCorrection` faz _polling_ de
`GET /api/redacao/[id]/status` (estado do job + `status` da redação) e mostra
barra de progresso.

Escolha de projeto: **fila no Postgres**, não um broker dedicado — zero
infra extra, transacional, suficiente para a escala inicial. Trocar por
QStash/SQS depois é local a `lib/queue`.

---

## 6. Cache

`lib/cache/index.ts` — `cached(key, ttlSeconds, fn)` memoiza com TTL,
deduplica chamadas concorrentes e faz _stale-on-error_. `bust(prefixo)`
invalida por prefixo.

Ligado no blog público (`lib/blog/queries.ts`, TTL 5 min); as mutações do
admin (`lib/blog/actions.ts`) e o cron chamam `bust("blog:")`.

---

## 7. Logging e telemetria

`lib/observability/log.ts`:

- `logEvent({ level, source, message, userId, meta })` e
  `logError(source, err, meta, userId)` — gravam em `system_logs` via service
  role **e** ecoam no console (para o coletor da hospedagem). Nunca lançam.

`lib/observability/ai-usage.ts`:

- `recordAiCall({ provider, model, kind, userId, tokensIn, tokensOut, ... })`
  grava em `ai_calls` com custo estimado (`estimateCostUsd` + tabela de
  preços aproximada, editável no topo do arquivo).
- `getAiUsage(days)` agrega para o painel.

`lib/ai/resilient.ts` — `resilientChat` / `resilientVision` envolvem um
provedor com **retry + backoff + fallback para o mock** (aviso "serviço
temporariamente indisponível") e registram cada chamada. Use via
`getResilientChatProvider(kind, userId)` / `getResilientVisionProvider(...)`
em `lib/ai`. Já aplicado no OCR de redação e na correção.

---

## 8. Painéis admin novos

| Rota | O que mostra |
| --- | --- |
| `/admin/saude` | Ping do banco, round-trip do cache, profundidade/atraso da fila, erros 24 h, status de IA e pagamentos. CPU/memória do host = "N/D" (não exposto pela runtime). |
| `/admin/consumo` | Chamadas de IA e **custo estimado** (30 d): série diária, por provedor, por funcionalidade, top usuários. |

Ambas já estão no `AdminSidebar`.

---

## 9. Performance de entrega

`next.config.mjs`:

- `poweredByHeader: false`, `compress: true`, sem source maps de produção.
- `experimental.optimizePackageImports` para `lucide-react`,
  `react-markdown`, `remark-gfm`.
- `images.formats` AVIF/WebP + `remotePatterns` para `*.supabase.co`.
- Headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  e `Cache-Control` imutável para `/_next/static` e longo para `/img`.

`loading.tsx` adicionados em `/chat`, `/redacao`, `/comunidade`, `/admin`
(esqueletos — `components/ui/Skeleton.tsx`).

---

## 10. Checklist de verificação

- [ ] `0009_infra.sql` rodou sem erro.
- [ ] 4 buckets criados (2 públicos, 2 privados).
- [ ] `/admin/saude` abre e lista as checagens (fila, cache, banco).
- [ ] `/admin/consumo` abre (zerado até haver chamadas de IA reais).
- [ ] Enviar uma redação → correção conclui via fila (barra de progresso).
- [ ] `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron` → JSON `ok`.
- [ ] `npm run typecheck` limpo.
