# COMECE AQUI — colocar o COGNI IA no ar (guia para iniciante total)

Este guia dita **cada ação**, uma por vez. Não pula nada. Se travar em algum
passo, anote o **número do passo** e a mensagem de erro e me chame.

Onde os comandos aparecem assim:

```
npm install
```

…você **digita exatamente isso no PowerShell e aperta Enter** (explico o que é
o PowerShell no Passo 5).

> Objetivo: site no ar em um endereço tipo `cogni-ia-xxxx.vercel.app`.
> Sem domínio próprio e sem chaves de IA no começo — isso entra depois.

---

## PARTE 0 — Criar as contas (faça antes de tudo, ~15 min)

Você precisa de 3 contas, todas **grátis**. Crie as 3 agora, deixe as abas
abertas.

### Passo 1 — Conta no GitHub

1. Abra https://github.com/signup
2. Digite seu **e-mail** → **Continue**
3. Crie uma **senha** → **Continue**
4. Escolha um **nome de usuário** (ex.: `jonasalmeida`) → **Continue**
5. Resolva o quebra-cabeça de verificação → **Create account**
6. Digite o código que chegou no seu e-mail
7. Nas perguntas de personalização, pode escolher qualquer coisa ou pular
   ("Skip personalization")

Pronto. Guarde seu **nome de usuário do GitHub** — vamos usar.

### Passo 2 — Conta no Supabase

1. Abra https://supabase.com
2. Clique em **Start your project** (botão verde no topo)
3. Clique em **Continue with GitHub** → clique **Authorize Supabase**
4. Se pedir, dê um nome para sua "organização" (ex.: `cogni`) e escolha o plano
   **Free** → **Create organization**

### Passo 3 — Conta na Vercel

1. Abra https://vercel.com/signup
2. Clique em **Continue with GitHub** → **Authorize Vercel**
3. Se perguntar seu nome/tipo de uso, responda o que quiser e continue.
   Se aparecer "Install Vercel" no GitHub, clique **Install** e escolha
   **All repositories** → **Install**

Agora você tem as 3 contas. Vamos para o computador.

---

## PARTE 1 — Instalar o Node.js (~5 min)

O Node.js é o programa que faz o site funcionar no seu PC para testar.

### Passo 4 — Baixar e instalar

1. Abra https://nodejs.org
2. Clique no botão grande à esquerda que diz **"LTS"** (vai baixar um arquivo
   `.msi`, algo como `node-v20.xx.x-x64.msi`)
3. Abra o arquivo baixado (canto inferior do navegador ou pasta **Downloads**,
   dê **dois cliques**)
4. Na janela do instalador:
   - **Next**
   - Marque "I accept the terms..." → **Next**
   - **Next** (deixa a pasta padrão)
   - **Next** (deixa as opções padrão)
   - Se aparecer uma tela "Tools for Native Modules" com um **quadradinho para
     marcar**: **deixe desmarcado** → **Next**
   - **Install**
   - O Windows pergunta *"Deseja permitir que este aplicativo faça alterações?"*
     → **Sim**
   - Espere a barrinha encher → **Finish**

---

## PARTE 2 — Abrir o terminal e instalar o projeto (~15 min)

### Passo 5 — Abrir o PowerShell na pasta certa

1. Aperte a tecla **Windows** do teclado
2. Digite: `powershell`
3. Clique em **Windows PowerShell** (o de ícone azul)
4. Vai abrir uma janela azul/preta com um texto e um cursor piscando. Digite
   **exatamente** isto e aperte **Enter**:

```
cd C:\Users\leomi\cogni-ia
```

5. A linha antes do cursor deve mudar para
   `PS C:\Users\leomi\cogni-ia>`. **É esse o sinal de que você está na pasta
   certa.** Se der erro "não pode encontrar o caminho", me avise.

> **Dicas do PowerShell:** para **colar** um texto copiado, clique com o
> **botão direito** dentro da janela (ele cola sozinho). Para **copiar** o que
> está na tela, selecione com o mouse e aperte **Enter** ou **Ctrl+C**.

### Passo 6 — Instalar as dependências

Digite e Enter:

```
npm install
```

- Vai aparecer **muito texto** rolando por 1 a 3 minutos. Normal.
- **Terminou quando** o cursor volta a piscar depois da linha
  `PS C:\Users\leomi\cogni-ia>` e **não há texto em vermelho** escrito
  `npm error`.
- Texto **amarelo** (`npm warn ...`) é normal, pode ignorar.

### Passo 7 — Testar se compila

Digite e Enter:

```
npm run build
```

Espere 1 a 2 minutos. Dois resultados possíveis:

- ✅ **Deu certo:** aparece `✓ Compiled successfully` e depois uma **tabela com
  os endereços do site** (`Route`, `Size`, etc.). Pode seguir para o Passo 8.

- ❌ **Deu erro:** aparece texto **vermelho** com `Failed to compile` ou
  `Type error:` e um caminho de arquivo. → **Selecione todo esse texto
  vermelho com o mouse, aperte Enter para copiar, e me cole aqui.** Eu conserto,
  você repete o Passo 7.

---

## PARTE 3 — Mandar o código para o GitHub (~10 min)

O código já está "empacotado" (fiz isso por você). Falta só enviar para a
internet.

### Passo 8 — Criar o repositório no GitHub

1. Abra https://github.com/new (precisa estar logado)
2. Em **Repository name**, digite: `cogni-ia`
3. Logo abaixo, clique na bolinha **Private** (privado)
4. **NÃO marque nada** em "Add a README file", "Add .gitignore", "Choose a
   license" — deixe tudo desmarcado
5. Clique no botão verde **Create repository**

### Passo 9 — Enviar

A página que abriu tem vários blocos de comando. Ache o bloco com o título
**"…or push an existing repository from the command line"**. Ele mostra 3
linhas parecidas com estas.

No PowerShell, digite **estas 3 linhas, uma de cada vez** (Enter depois de
cada). **Troque `SEU-USUARIO`** pelo seu nome de usuário do GitHub:

```
git remote add origin https://github.com/SEU-USUARIO/cogni-ia.git
```

```
git branch -M main
```

```
git push -u origin main
```

- Na terceira linha, vai abrir uma **janelinha "Connect to GitHub"** ou uma aba
  no navegador. Clique **"Sign in with your browser"** → **Authorize** →
  volte para o PowerShell.
- Quando terminar, aparece algo como `main -> main`. **Atualize a página do
  GitHub** — seus arquivos devem aparecer lá.

---

## PARTE 4 — Supabase: o banco de dados (~25 min)

### Passo 10 — Criar o projeto

1. Abra https://supabase.com/dashboard
2. Clique **New project** (botão verde)
3. **Name:** `cogni-ia`
4. **Database Password:** clique **Generate a password**, depois no **ícone de
   copiar** ao lado. **Cole essa senha num bloco de notas e guarde** (você
   quase não vai usar, mas não dá pra recuperar).
5. **Region:** abra a lista e escolha **South America (São Paulo)**
6. **Plan:** Free
7. Clique **Create new project**
8. Espere ~2 minutos (aparece "Setting up project...")

### Passo 11 — Copiar as 3 chaves

1. No menu da **esquerda**, lá embaixo, clique no ícone de **engrenagem**
   (**Project Settings**)
2. No submenu, clique em **API**
3. Nesta página você vê:
   - **Project URL** — uma caixa com um endereço `https://xxxxx.supabase.co` e
     um botão de copiar. **Copie e cole no bloco de notas** com a etiqueta
     `URL`.
   - **Project API Keys** →
     - a chave **`anon` `public`** — copie, etiquete `ANON`
     - a chave **`service_role` `secret`** — clique em **Reveal**, copie,
       etiquete `SERVICE`
4. Agora você tem 3 valores anotados: `URL`, `ANON`, `SERVICE`.

### Passo 12 — Preencher o arquivo de chaves no seu PC

1. Abra o **Explorador de Arquivos** do Windows
2. Vá em `C:\Users\leomi\cogni-ia`
3. Ache o arquivo chamado **`.env.local`** (começa com um ponto). Se não
   aparecer, no Explorador clique em **Exibir → Mostrar → Itens ocultos**.
4. Clique nele com o **botão direito → Abrir com → Bloco de Notas**
5. Você vai ver 3 linhas com `PLACEHOLDER_...`. Troque **só o que vem depois do
   `=`**:
   - `NEXT_PUBLIC_SUPABASE_URL=` → cole o `URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=` → cole o `ANON`
   - `SUPABASE_SERVICE_ROLE_KEY=` → cole o `SERVICE`
6. **Ctrl+S** para salvar. Feche o Bloco de Notas.

> Deve ficar tipo: `NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co`
> (sem espaços, sem aspas).

### Passo 13 — Rodar as 13 migrações (criar as tabelas) — NA ORDEM

Isto cria toda a estrutura do banco. São 13 arquivos; repita o mesmo ritual
para cada um.

1. Na Supabase, menu da esquerda → **SQL Editor**
2. Clique **+ New query** (ou use o editor em branco que já está aberto)
3. No seu PC, no Explorador, vá em `C:\Users\leomi\cogni-ia\supabase\migrations`
4. Clique com o **botão direito** no primeiro arquivo (`0001_init.sql`) →
   **Abrir com → Bloco de Notas**
5. No Bloco de Notas: **Ctrl+A** (seleciona tudo) → **Ctrl+C** (copia)
6. Volte para a Supabase, clique dentro da área grande do SQL Editor →
   **Ctrl+V** (cola)
7. Clique **Run** (botão no canto inferior direito, ou aperte **Ctrl+Enter**)
8. Espere aparecer **"Success. No rows returned"** (verde) no rodapé
9. Clique dentro do editor, **Ctrl+A** → **Delete** (apaga tudo)
10. Repita os passos 4 a 9 para o **próximo arquivo**, nesta ordem exata:

```
0001_init.sql
0002_biblioteca.sql
0003_chat.sql
0004_progresso.sql
0005_redacao.sql
0006_comunidade.sql
0007_billing.sql
0008_admin_blog.sql
0009_infra.sql
0010_seguranca.sql
0011_onboarding.sql
0012_crescimento.sql
0013_ia_adaptativa.sql
```

> Se algum der **erro vermelho**, pare e me mande: o **nome do arquivo** e a
> **mensagem completa**. Não pule para o próximo.

### Passo 14 — Criar os 5 "baldes" de arquivos (Storage)

1. Menu da esquerda → **Storage**
2. Clique **New bucket**
3. **Name:** `avatars` · **ligue** a chave **Public bucket** · **Save**
4. Repita **New bucket** para os outros 4:

| Name | Public bucket? |
| --- | --- |
| `avatars` | **ligado** |
| `blog` | **ligado** |
| `essays` | desligado |
| `materials` | desligado |
| `exports` | desligado |

### Passo 15 — Configurar o login

1. Menu da esquerda → **Authentication**
2. No submenu, clique **URL Configuration** (ou **Configuration → URL
   Configuration**)
3. **Site URL:** digite `http://localhost:3000`
4. **Redirect URLs:** clique **Add URL**, digite
   `http://localhost:3000/auth/callback` → **Save**
5. Ainda em **Authentication**, clique em **Providers** (ou **Sign In / Up**) e
   confirme que **Email** está **ligado** (verde). Google fica para depois.

### Passo 16 — Popular a biblioteca

Volte ao PowerShell (Passo 5). Digite e Enter:

```
npm run seed:biblioteca
```

Deve imprimir várias linhas e terminar sem vermelho. Isso enche a biblioteca
com os conteúdos iniciais.

### Passo 17 — Criar a sua conta e virar admin

1. No PowerShell, digite e Enter:

```
npm run dev
```

2. Espere aparecer `Ready` e uma linha `Local: http://localhost:3000`
3. Abra o navegador em **http://localhost:3000**
4. Clique **Criar conta** → preencha nome, seu e-mail, uma senha → enviar
5. Vai aparecer "confira seu e-mail". Duas opções:
   - **Opção A:** abra seu e-mail, clique no link de confirmação.
   - **Opção B (mais rápida):** na Supabase → **Authentication → Users** → ache
     sua linha → botão **⋯** → **Confirm email**
6. Volte ao PowerShell e aperte **Ctrl+C** para parar o `npm run dev`
7. Na Supabase → **SQL Editor** → cole isto e clique **Run** (troque o e-mail
   se for outro):

```sql
insert into public.app_admins (user_id)
select id from public.users where email = 'almeidajonas772@gmail.com'
on conflict do nothing;
```

Deve dizer "Success". Agora você é administrador.

---

## PARTE 5 — Vercel: colocar no ar (~15 min)

### Passo 18 — Importar o projeto

1. Abra https://vercel.com/new
2. Você vê uma lista **"Import Git Repository"** com seus repositórios do
   GitHub. Ache **`cogni-ia`** e clique **Import**.
   - Se não aparecer: clique **Adjust GitHub App Permissions** / **Configure**,
     dê acesso ao repositório `cogni-ia`, volte.
3. Na tela "Configure Project": **não mude nada** (Framework = Next.js já vem
   selecionado).

### Passo 19 — Adicionar as variáveis de ambiente

Ainda nessa tela, clique para expandir **Environment Variables**. Para **cada
par abaixo**: digite o **Name** na caixa esquerda, o **Value** na caixa
direita, clique **Add**.

**Obrigatórias** (use os valores que você anotou no Passo 11):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | seu `URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sua chave `ANON` |

**Recomendadas:**

| Name | Value |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | sua chave `SERVICE` |
| `NEXT_PUBLIC_APP_URL` | `https://cogni-ia.vercel.app` *(ajusta no Passo 21)* |
| `CRON_SECRET` | `715b262da7c37f59f8da2ffe6313d279a84da978d5b4abcb1bea45a8d0610993` |
| `APP_ENCRYPTION_KEY` | `377f6a79ba0f08fc3d0aee66237f5a18d0d4886d6768b6664df7bf3558cf6b81` |

### Passo 20 — Deploy

1. Clique no botão **Deploy**
2. Espere ~2 minutos (barra de progresso + logs rolando)
3. ✅ **Deu certo:** aparecem uns confetes e **"Congratulations!"**. Clique
   **Continue to Dashboard**. No painel, o endereço do site aparece no topo
   (algo como `cogni-ia-a1b2c3.vercel.app`). **Abra esse link — o site está no
   ar.**
4. ❌ **Falhou** (texto vermelho no log, "Error"): clique em **View Build
   Logs**, role até o primeiro erro em vermelho, **copie e me mande**. Eu
   conserto, você faz no PowerShell:
   ```
   git add -A
   git commit -m "corrige build"
   git push
   ```
   e a Vercel re-publica sozinha.

---

## PARTE 6 — Amarrar as pontas (~5 min)

### Passo 21 — Ajustar a URL

1. Copie o endereço real do seu site (ex.: `https://cogni-ia-a1b2c3.vercel.app`)
2. Na Vercel: **seu projeto → Settings → Environment Variables** → ache
   `NEXT_PUBLIC_APP_URL` → **Edit** → cole a URL real → **Save**
3. Vá na aba **Deployments** → no deploy mais recente clique **⋯** →
   **Redeploy** → **Redeploy**

### Passo 22 — Ajustar o login para a URL de produção

1. Na Supabase → **Authentication → URL Configuration**
2. **Site URL:** troque para a URL real da Vercel
3. **Redirect URLs:** clique **Add URL** e adicione
   `https://SUA-URL.vercel.app/auth/callback` (mantenha também a de localhost)
4. **Save**

Pronto. O cron (`/api/cron` a cada 5 min) já roda sozinho porque você definiu
`CRON_SECRET`.

---

## PARTE 7 — Conferir que está tudo funcionando

Abra a URL da Vercel e teste, na ordem:

- [ ] A página inicial carrega
- [ ] `/precos` mostra R$ 14,90 e R$ 119,90
- [ ] **Criar conta** com um e-mail novo → confirma → cai em **Bem-vindo**
- [ ] `/dashboard` abre; a **Biblioteca** lista conteúdos
- [ ] O **Chat** responde (resposta "de demonstração" enquanto não houver
      chave de IA — isso é esperado)
- [ ] Logado com a **sua** conta, `/admin` abre (você é admin)
- [ ] `/admin/saude` mostra os cartões — banco e cache no verde

Se tudo isso passou: **está no ar e funcional.** 🎉

---

## PARTE 8 — Deixar "de verdade" (quando quiser, um de cada vez)

Cada item abaixo é: **pegar a chave → adicionar na Vercel (Settings →
Environment Variables → Add) → Redeploy**. Nada de mexer no código.

### 8.1 — IA de texto (chat, resumos, questões, correção de redação)

1. https://platform.openai.com/api-keys → **Create new secret key** → copie
2. Em **Settings → Billing** adicione um cartão e um limite (ex.: **US$ 10**)
3. Vercel → nova variável: `OPENAI_API_KEY` = a chave. Redeploy.

### 8.2 — IA de imagem (OCR da foto da redação)

1. https://aistudio.google.com/apikey → **Create API key** → copie
2. Vercel → `GEMINI_API_KEY` = a chave. Redeploy.

### 8.3 — Pagamentos (Mercado Pago)

1. https://www.mercadopago.com.br/developers → **Suas integrações** → crie uma
   aplicação → **Credenciais de produção** → copie o **Access Token**
2. Vercel:
   - `MERCADOPAGO_ACCESS_TOKEN` = o token
   - `MERCADOPAGO_WEBHOOK_SECRET` = invente uma senha longa (letras+números)
   Redeploy.
3. No Mercado Pago, em **Webhooks / Notificações**, cadastre a URL:
   `https://SUA-URL/api/billing/webhook?secret=O_MESMO_WEBHOOK_SECRET`

### 8.4 — Domínio próprio (cogniai.com.br)

1. Vercel → seu projeto → **Settings → Domains** → digite `cogniai.com.br` →
   **Add**
2. A Vercel mostra registros de DNS. No painel de onde você comprou o domínio
   (Registro.br, GoDaddy, etc.), adicione **exatamente** esses registros.
3. Espere propagar (minutos a algumas horas)
4. Vercel → `NEXT_PUBLIC_APP_URL` = `https://cogniai.com.br` → Redeploy
5. Supabase → Authentication → troque a Site URL e adicione
   `https://cogniai.com.br/auth/callback`

### 8.5 — Google Analytics (opcional)

Vercel → `NEXT_PUBLIC_GA_ID` = `G-XXXXXXXXXX`. Só carrega se o visitante
aceitar os cookies de análise.

---

## Problemas comuns

| O que aconteceu | O que fazer |
| --- | --- |
| `npm` não é reconhecido no PowerShell | Feche e reabra o PowerShell depois de instalar o Node (Passo 4/5). Reinicie o PC se persistir. |
| `npm run build` deu `Type error` | Copie o texto vermelho e me mande. É ajuste rápido. |
| Deploy da Vercel falhou | **View Build Logs** → copie o primeiro erro → me mande. |
| Login não funciona no site | A **Redirect URL** do Supabase (Passo 22) tem que ser **exatamente** `https://SUA-URL.vercel.app/auth/callback`. |
| Biblioteca vazia | Faltou o Passo 16 (`npm run seed:biblioteca`) com o `.env.local` preenchido. |
| `/admin` te joga para `/dashboard` | Faltou o SQL do Passo 17 (te tornar admin). Rode de novo. |
| Chat responde texto "de demonstração" | Normal sem `OPENAI_API_KEY` (Passo 8.1). |
| `/admin/saude` com "Fila / erros" degradado | Falta `SUPABASE_SERVICE_ROLE_KEY` nas variáveis da Vercel. |

**Se o tempo for curto:** PARTE 0 → 1 → 2 → 3 → 4 → 5 → 6 já coloca o site
utilizável no ar. A PARTE 8 é evolução, pode ser em outro dia.
