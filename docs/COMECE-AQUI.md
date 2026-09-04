# COMECE AQUI — colocar o COGNI IA no ar

Guia passo a passo, na ordem. Caminho mais rápido: **primeiro no ar em
`seu-projeto.vercel.app`** (sem domínio, sem chaves de IA — modo demonstração),
depois liga o resto.

Tempo total: ~1 hora se tudo correr bem.

O que você vai precisar de conta (todas grátis para começar):

- **GitHub** — github.com (guardar o código)
- **Supabase** — supabase.com (banco + login)
- **Vercel** — vercel.com (hospedagem)
- **Node.js** no seu PC — nodejs.org (LTS, versão 20)

Secretos já gerados para você (guarde num lugar seguro — vão para a Vercel):

```
CRON_SECRET        = 715b262da7c37f59f8da2ffe6313d279a84da978d5b4abcb1bea45a8d0610993
APP_ENCRYPTION_KEY = 377f6a79ba0f08fc3d0aee66237f5a18d0d4886d6768b6664df7bf3558cf6b81
```

---

## BLOCO 1 — Local (≈15 min)

### 1.1 Instalar o Node.js

Baixe em https://nodejs.org (botão **"LTS"**), instale com as opções padrão.
Reinicie o terminal depois.

### 1.2 Abrir o terminal na pasta do projeto

Abra o **PowerShell** e rode:

```powershell
cd C:\Users\leomi\cogni-ia
```

### 1.3 Instalar as dependências

```powershell
npm install
```

Isso cria a pasta `node_modules` e o arquivo `package-lock.json`.

### 1.4 Testar a compilação

```powershell
npm run build
```

- **Se terminar com "Compiled successfully"** → ótimo, siga para 1.5.
- **Se der erro de tipo (`Type error:` …)** → me mande a mensagem completa do
  erro; eu corrijo. (O código foi escrito sem uma máquina com Node para rodar,
  então pode haver ajustes pontuais de tipo.)

### 1.5 Enviar o código para o GitHub

O repositório local já está criado com o primeiro commit. Falta só o GitHub:

1. Em https://github.com/new crie um repositório **privado** chamado
   `cogni-ia` (deixe tudo desmarcado — sem README, sem .gitignore).
2. No terminal, troque `SEU-USUARIO` pelo seu nome de usuário do GitHub:

```powershell
git remote add origin https://github.com/SEU-USUARIO/cogni-ia.git
git push -u origin main
```

Se pedir login, use o navegador que abrir ou um **Personal Access Token**
(github.com → Settings → Developer settings → Tokens).

---

## BLOCO 2 — Supabase (≈25 min)

### 2.1 Criar o projeto

1. https://supabase.com → **New project**.
2. Nome: `cogni-ia`. **Region: `South America (São Paulo)`**. Defina uma senha
   forte para o banco (anote).
3. Espere ~2 min terminar de provisionar.

### 2.2 Pegar as chaves

Menu lateral → **Project Settings** → **API**. Copie e guarde:

| Nome na Supabase | Você vai chamar de |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` |

> A `service_role` é secreta. Nunca coloque no código; só nas variáveis da Vercel.

### 2.3 Rodar as 13 migrações — NA ORDEM

Menu lateral → **SQL Editor** → **+ New query**. Para **cada** arquivo abaixo,
na ordem: abra o arquivo no seu PC, copie **todo** o conteúdo, cole no editor,
clique **Run**. Confirme "Success" antes do próximo.

```
supabase/migrations/0001_init.sql
supabase/migrations/0002_biblioteca.sql
supabase/migrations/0003_chat.sql
supabase/migrations/0004_progresso.sql
supabase/migrations/0005_redacao.sql
supabase/migrations/0006_comunidade.sql
supabase/migrations/0007_billing.sql
supabase/migrations/0008_admin_blog.sql
supabase/migrations/0009_infra.sql
supabase/migrations/0010_seguranca.sql
supabase/migrations/0011_onboarding.sql
supabase/migrations/0012_crescimento.sql
supabase/migrations/0013_ia_adaptativa.sql
```

### 2.4 Criar os 5 buckets de Storage

Menu lateral → **Storage** → **New bucket**. Crie exatamente estes:

| Nome | Public? |
| --- | --- |
| `avatars` | **✅ Public** |
| `blog` | **✅ Public** |
| `essays` | ❌ (privado) |
| `materials` | ❌ (privado) |
| `exports` | ❌ (privado) |

### 2.5 Configurar o login

Menu lateral → **Authentication** → **URL Configuration**:

- **Site URL:** por enquanto deixe `http://localhost:3000` (troca depois para a
  URL da Vercel).
- **Redirect URLs:** adicione `http://localhost:3000/auth/callback`
  (depois adiciona também a da Vercel).

Em **Authentication → Providers**, deixe **Email** ligado. (Google é opcional e
pode ficar para depois.)

### 2.6 Popular a biblioteca + virar admin

No seu PC, crie o arquivo **`C:\Users\leomi\cogni-ia\.env.local`** com (use
suas chaves reais):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Rode:

```powershell
npm run seed:biblioteca
```

Depois **crie sua conta**: rode `npm run dev`, abra `http://localhost:3000`,
vá em **Criar conta**, cadastre-se com o seu e-mail e confirme (o link chega no
e-mail; ou em Supabase → Authentication → Users você pode confirmar na mão).

Por fim, vire administrador. Em **SQL Editor**, rode (troque o e-mail):

```sql
insert into public.app_admins (user_id)
select id from public.users where email = 'almeidajonas772@gmail.com'
on conflict do nothing;
```

---

## BLOCO 3 — Vercel (≈15 min) → NO AR

### 3.1 Importar o projeto

1. https://vercel.com → **Add New… → Project** → **Import** o repositório
   `cogni-ia` do GitHub.
2. Framework: **Next.js** (detectado automaticamente). Não mude nada.

### 3.2 Adicionar as variáveis de ambiente

Antes de clicar em Deploy, abra **Environment Variables** e adicione (uma por
linha, para os 3 ambientes — Production/Preview/Development):

**Obrigatórias:**

```
NEXT_PUBLIC_SUPABASE_URL        = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJ...
```

**Fortemente recomendadas (o app funciona melhor):**

```
SUPABASE_SERVICE_ROLE_KEY = eyJ...
NEXT_PUBLIC_APP_URL       = https://cogni-ia.vercel.app   (ajuste depois de saber a URL final)
CRON_SECRET               = 715b262da7c37f59f8da2ffe6313d279a84da978d5b4abcb1bea45a8d0610993
APP_ENCRYPTION_KEY        = 377f6a79ba0f08fc3d0aee66237f5a18d0d4886d6768b6664df7bf3558cf6b81
```

### 3.3 Deploy

Clique **Deploy**. Em ~2 min você recebe uma URL tipo
`https://cogni-ia-xxxx.vercel.app`. **O site está no ar.**

- Se o build falhar com erro de tipo/lint: me mande o log; eu corrijo, você
  faz `git push` e a Vercel re-deploya sozinha.

### 3.4 Fechar o ciclo

1. Copie a URL real da Vercel.
2. **Vercel → Settings → Environment Variables:** ajuste `NEXT_PUBLIC_APP_URL`
   para essa URL. Depois **Deployments → ⋯ → Redeploy**.
3. **Supabase → Authentication → URL Configuration:**
   - Site URL → a URL da Vercel
   - Redirect URLs → adicione `https://SUA-URL.vercel.app/auth/callback`
4. O **cron já está configurado** (`vercel.json`) — roda `/api/cron` a cada
   5 min automaticamente porque `CRON_SECRET` existe.

---

## BLOCO 4 — Deixar tudo "de verdade" (quando quiser)

Tudo abaixo é **opcional**. Sem isso o site funciona em modo demonstração
(respostas de IA são esqueletos, checkout é simulado).

### 4.1 IA de texto (chat, resumos, questões, redação)

1. https://platform.openai.com → **API keys** → **Create new secret key**.
2. Adicione um cartão em **Billing** e coloque um limite baixo (ex.: US$ 10/mês).
3. Vercel → Environment Variables:
   ```
   OPENAI_API_KEY = sk-...
   ```
   (opcional: `OPENAI_CHAT_MODEL = gpt-4o-mini`). Redeploy.

### 4.2 IA de imagem (OCR de redação)

1. https://aistudio.google.com/apikey → **Create API key**.
2. Vercel:
   ```
   GEMINI_API_KEY = ...
   ```
   Redeploy.

### 4.3 Pagamentos (Mercado Pago)

1. https://www.mercadopago.com.br/developers → suas credenciais →
   **Access Token de produção**.
2. Vercel:
   ```
   MERCADOPAGO_ACCESS_TOKEN  = APP_USR-...
   MERCADOPAGO_WEBHOOK_SECRET = (invente uma string aleatória longa)
   ```
   Redeploy.
3. No painel do Mercado Pago, configure o **Webhook** apontando para:
   `https://SUA-URL/api/billing/webhook?secret=SEU_MERCADOPAGO_WEBHOOK_SECRET`

### 4.4 Domínio próprio (cogniai.com.br)

1. Vercel → Settings → **Domains** → adicione `cogniai.com.br` e `www`.
2. Aponte o DNS conforme a Vercel indicar (registro A / CNAME).
3. Ajuste `NEXT_PUBLIC_APP_URL` para `https://cogniai.com.br` e a Site URL do
   Supabase. Redeploy.

### 4.5 Google Analytics (opcional)

`NEXT_PUBLIC_GA_ID = G-XXXXXXXXXX` na Vercel. Só carrega se o visitante aceitar
os cookies de análise.

### 4.6 Cache compartilhado (opcional, para escala)

Upstash Redis grátis (https://upstash.com): crie um banco Redis, pegue as
credenciais **REST**:
```
UPSTASH_REDIS_REST_URL   = ...
UPSTASH_REDIS_REST_TOKEN = ...
```
Sem isso o cache/rate-limit usa a memória de cada instância (funciona, só não
é compartilhado).

---

## BLOCO 5 — Conferir que está tudo certo

Abra a URL da Vercel e teste:

- [ ] Landing carrega; `/precos` mostra R$ 14,90 e R$ 119,90.
- [ ] Criar conta → confirmar e-mail → cai no onboarding `/bem-vindo`.
- [ ] `/dashboard` abre; a biblioteca lista conteúdo (se rodou o seed).
- [ ] Chat responde (esqueleto sem `OPENAI_API_KEY`, real com).
- [ ] `/admin` abre (você é admin) → `/admin/saude` com os cartões no verde/aceitável.
- [ ] `/perfil/privacidade` → "Solicitar exportação" gera um arquivo.
- [ ] `curl -H "Authorization: Bearer 715b262d..." https://SUA-URL/api/cron`
      responde `{"ok":true,...}`.

---

## Se algo der errado

| Sintoma | Causa provável |
| --- | --- |
| Build falha na Vercel com `Type error` | erro de tipo no código — me mande o log, eu corrijo |
| Login não funciona | Redirect URL do Supabase não bate com a URL da Vercel |
| Biblioteca vazia | faltou `npm run seed:biblioteca` (com o `.env.local` certo) |
| `/admin` redireciona para `/dashboard` | você não está em `app_admins` (rode o SQL do passo 2.6) |
| Chat/redação em "modo demonstração" | falta `OPENAI_API_KEY` (bloco 4.1) — é esperado |
| `/admin/saude` mostra "Fila / erros" degradado | falta `SUPABASE_SERVICE_ROLE_KEY` na Vercel |
| Cron dá 401 | `CRON_SECRET` diferente entre a Vercel e o header do curl |

Ordem de prioridade se o tempo for curto: **Bloco 1 → 2 → 3** já coloca o site
no ar utilizável. Bloco 4 é evolução.
