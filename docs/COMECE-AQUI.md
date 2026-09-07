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

Pronto. O cron (`/api/cron`) roda **1x por dia** sozinho (limite do plano
grátis da Vercel). As correções de redação e exportações de dados já rodam na
hora, sem depender do cron — ele serve só de "faxina" e ajustes diários.

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

O site já está no ar e funciona em "modo demonstração". Cada passo abaixo
**liga um recurso de verdade**. Faça **um por vez**, sem pressa. Nenhum deles
mexe no código — é sempre: **pegar uma chave → colar na Vercel → Redeploy**.

**Custo:** dá para ligar quase tudo **sem pagar nada no começo**:

| Recurso | Opção grátis (sem cartão) | Quando custa |
| --- | --- | --- |
| IA de texto (Passo 23) | Groq / Gemini — tier grátis | só se passar do limite grátis diário |
| OCR da redação (Passo 24) | Gemini AI Studio — tier grátis | idem |
| Pagamentos (Passo 25) | Mercado Pago — conta grátis | só uma taxa **por venda** (nada adiantado) |
| Domínio (Passo 26) | usar o endereço `.vercel.app` grátis | só se comprar um domínio (~R$ 40/ano) |
| Analytics (Passo 27) | Google Analytics — grátis | nunca |

### As duas micro-tarefas que se repetem (leia uma vez)

**TAREFA A — adicionar/editar uma variável na Vercel:**

1. Abra https://vercel.com e faça login
2. Clique no seu projeto (**cognia-ia**)
3. No menu de cima, clique em **Settings**
4. No menu da esquerda, clique em **Environment Variables**
5. Para **adicionar**: no campo **Key** digite o NOME da variável; no campo
   **Value** cole o VALOR; deixe marcados os 3 ambientes (Production, Preview,
   Development); clique **Save**
6. Para **editar** uma que já existe: ache a linha, clique nos **três
   pontinhos** (**⋯**) à direita → **Edit** → troque o Value → **Save**
7. Se aparecer um aviso sobre "Sensitive" / "public prefix": escolha o tipo
   **Plain Text** (ou **Config**), nunca **Sensitive**, e salve

**TAREFA B — fazer Redeploy (aplicar o que você mudou):**

1. Na Vercel, no seu projeto, clique na aba **Deployments** (menu de cima)
2. Na **primeira linha** da lista, clique nos **três pontinhos** (**⋯**) →
   **Redeploy**
3. Na janelinha que abre, clique **Redeploy** de novo (pode deixar marcado
   "Use existing Build Cache")
4. Espere ~2 minutos até a primeira linha ficar **Ready** (bolinha verde)

> Toda vez que um passo abaixo disser "faça a TAREFA A" ou "faça a TAREFA B",
> é só seguir a receita acima.

---

### Passo 23 — IA de texto (chat e correção de redação de verdade) — GRÁTIS

Sem isso, o chat e a correção de redação respondem textos de exemplo ("modo
demonstração"). O site aceita **qualquer** provedor compatível com a API da
OpenAI — vamos usar o **Groq**, que é grátis, rápido e **não pede cartão**.

**23.1 — Pegar a chave grátis no Groq**

1. Abra https://console.groq.com e entre (dá para entrar com a conta Google)
2. No menu da esquerda, clique em **API Keys**
3. Clique em **Create API Key**
4. Nome qualquer (ex.: `cogni-ia`) → **Submit**
5. Vai aparecer uma chave começando com `gsk_...`. Clique em **Copy** e cole
   num bloco de notas (ela **só aparece uma vez**)

**23.2 — Colocar 4 variáveis na Vercel**

Faça a **TAREFA A** uma vez para cada linha desta tabela:

| Key (nome) | Value (valor) |
| --- | --- |
| `OPENAI_API_KEY` | a chave `gsk_...` que você copiou |
| `OPENAI_BASE_URL` | `https://api.groq.com/openai/v1` |
| `OPENAI_CHAT_MODEL` | `llama-3.1-8b-instant` |
| `OPENAI_CHAT_MODEL_STRONG` | `llama-3.3-70b-versatile` |

**23.3 — Redeploy**

Faça a **TAREFA B**.

**Como saber se funcionou:**

- [ ] Entre no site → abra o **Chat** → mande uma pergunta
- [ ] A resposta **não** tem mais o aviso de "modo demonstração"
- [ ] Site → **Redação** → envie um texto → a correção sai com nota e
      comentários (não o texto de exemplo)
- [ ] `/admin/saude` → o cartão de IA aparece como configurado

> **Alternativa ao Groq:** o Gemini também tem tier grátis sem cartão. Use as
> mesmas 4 variáveis, trocando os valores por:
> `OPENAI_BASE_URL` = `https://generativelanguage.googleapis.com/v1beta/openai` ·
> `OPENAI_CHAT_MODEL` = `gemini-2.0-flash` ·
> `OPENAI_CHAT_MODEL_STRONG` = `gemini-2.5-flash` ·
> `OPENAI_API_KEY` = a chave do AI Studio (a mesma do Passo 24 serve).
>
> **Se um dia bater no limite grátis:** aí sim vale um provedor pago (a própria
> OpenAI, com `OPENAI_BASE_URL` = `https://api.openai.com/v1`,
> `OPENAI_CHAT_MODEL` = `gpt-4o-mini`, `OPENAI_CHAT_MODEL_STRONG` = `gpt-4o` e
> um cartão em platform.openai.com → Billing). Só trocar as 4 variáveis.

---

### Passo 24 — IA de imagem (ler foto de redação manuscrita / OCR) — GRÁTIS

Sem isso, quem manda a **foto** de uma redação escrita à mão recebe uma
transcrição de exemplo. Com a chave do Google, o texto é lido de verdade. O
AI Studio tem **tier grátis sem cartão**.

1. Abra https://aistudio.google.com e entre com sua conta Google
2. No menu da esquerda, clique em **Get API key** (ou abra direto
   https://aistudio.google.com/apikey)
3. Clique em **Create API key**
4. Se pedir para escolher um projeto, aceite o que ele sugere
   ("Generative Language Client" ou similar) → **Create API key in new
   project**
5. Vai aparecer uma chave começando com `AIza...`. Clique em **Copy** e cole
   no bloco de notas
6. Faça a **TAREFA A**: variável **`GEMINI_API_KEY`** = a chave `AIza...`
7. Faça a **TAREFA B** (Redeploy)

**Como saber se funcionou:**

- [ ] Site → **Redação** → **Nova redação** → escolha enviar **por foto** →
      suba uma imagem com texto → a transcrição sai do conteúdo real da foto
      (não um texto genérico)

---

### Passo 25 — Pagamentos do Premium (Mercado Pago) — sem custo adiantado

Sem isso, o botão "Assinar Premium" roda em modo simulado (confirma sozinho,
sem cobrar). Com o Mercado Pago, a assinatura é cobrada de verdade.

Criar a conta e integrar é **de graça**. O Mercado Pago só desconta uma
**taxa por venda** (um percentual de cada assinatura paga) — você não paga
nada adiantado nem mensalidade. Só faça este passo quando for **realmente
começar a vender** o Premium; até lá, o modo simulado não atrapalha nada.

**25.1 — Pegar o Access Token de produção**

1. Abra https://www.mercadopago.com.br/developers e entre com sua conta
   Mercado Pago
2. No menu, clique em **Suas integrações** (ou **Your integrations**)
3. Clique em **Criar aplicação**
4. Nome: `COGNI IA` · em "Produto que vai integrar" escolha
   **Pagamentos online / Checkout** · finalize criando a aplicação
5. Dentro da aplicação, no menu da esquerda, clique em **Credenciais de
   produção**
6. Pode ser que peçam preencher dados da empresa/CPF antes de liberar. Faça
   isso e volte aqui.
7. Copie o campo **Access Token** (é um texto longo, tipo `APP_USR-...`).
   Cole no bloco de notas.

**25.2 — Inventar o segredo do webhook**

1. Você precisa de uma senha longa só sua. Gere uma: no PowerShell, dentro
   de `C:\Users\leomi\cogni-ia`, rode:

```bash
cd C:\Users\leomi\cogni-ia
```

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

2. Copie o texto que aparecer (48 caracteres). Esse é o seu
   `MERCADOPAGO_WEBHOOK_SECRET`. Guarde no bloco de notas.

**25.3 — Colocar as duas na Vercel**

1. Faça a **TAREFA A**: variável **`MERCADOPAGO_ACCESS_TOKEN`** = o
   `APP_USR-...`
2. Faça a **TAREFA A** de novo: variável **`MERCADOPAGO_WEBHOOK_SECRET`** = a
   senha de 48 caracteres
3. Faça a **TAREFA B** (Redeploy)

**25.4 — Cadastrar o aviso de pagamento (webhook) no Mercado Pago**

1. Monte esta URL trocando as duas partes em MAIÚSCULAS:
   `https://SUA-URL-DA-VERCEL/api/billing/webhook?secret=SEU-WEBHOOK-SECRET`
   - exemplo: `https://cognia-ia.vercel.app/api/billing/webhook?secret=ab12...`
2. No painel de desenvolvedor do Mercado Pago, dentro da sua aplicação, clique
   em **Webhooks** (ou **Notificações** → **Webhooks**)
3. Em **URL de produção**, cole a URL que você montou → **Salvar**
4. Em "Eventos", marque **Pagamentos** (payments) e, se existir,
   **Assinaturas** (subscriptions/preapproval)

**Como saber se funcionou:**

- [ ] Site → **Preços** → **Assinar Premium** → você é levado a uma tela de
      pagamento real do Mercado Pago (cartão / Pix)
- [ ] Depois de um pagamento de teste aprovado, sua conta vira **Premium**
      sozinha em ~1 minuto
- [ ] `/admin/saude` → cartão de pagamentos configurado

> Enquanto estiver testando, use o valor mais baixo possível ou as contas de
> teste do Mercado Pago (menu **Contas de teste** no painel de desenvolvedor).

---

### Passo 26 — Domínio próprio (ex.: `cogniai.com.br`) — opcional, pago

**Não é obrigatório.** O endereço grátis `cognia-ia.vercel.app` funciona
perfeitamente para lançar, tem cadeado (HTTPS) e nunca expira. Só faça este
passo se quiser um endereço mais bonito — aí sim precisa **comprar** o domínio
(um `.com.br` custa ~R$ 40/ano no Registro.br).

Depois de comprado (no Registro.br, GoDaddy, Hostinger, etc.):

1. Faça login onde você comprou o domínio e deixe essa aba aberta
2. Na Vercel → seu projeto → **Settings** → menu da esquerda **Domains**
3. No campo, digite seu domínio (ex.: `cogniai.com.br`) → **Add**
4. A Vercel vai mostrar 1 ou 2 **registros de DNS** para você criar. Anote
   exatamente: o **Tipo** (A ou CNAME), o **Name/Host** e o **Value**
5. Na aba do seu provedor de domínio, procure **DNS** / **Zona DNS** /
   **Gerenciar DNS**
6. Adicione **exatamente** os registros que a Vercel pediu (mesmo Tipo, Name
   e Value) → salve
7. Volte na Vercel e espere. Pode levar de alguns minutos a algumas horas. A
   Vercel mostra **Valid Configuration** (verde) quando reconhecer.
8. Quando estiver verde, faça a **TAREFA A**: edite **`NEXT_PUBLIC_APP_URL`**
   = `https://cogniai.com.br` (seu domínio, sem barra no final)
9. Faça a **TAREFA B** (Redeploy)
10. Ajuste o login: Supabase → **Authentication → URL Configuration** →
    **Site URL** = `https://cogniai.com.br` → em **Redirect URLs** clique
    **Add URL** e some `https://cogniai.com.br/auth/callback` → **Save**
11. (Se você já tinha ligado o Mercado Pago no Passo 25) refaça a URL do
    webhook com o domínio novo e atualize lá no Mercado Pago

**Como saber se funcionou:**

- [ ] Digitar `https://cogniai.com.br` abre o seu site com cadeado (HTTPS)
- [ ] Criar conta e login funcionam pelo domínio novo

---

### Passo 27 — Google Analytics (opcional, 2 min)

Para acompanhar visitas.

1. Abra https://analytics.google.com → crie uma propriedade para o site
2. Em **Fluxos de dados** → crie um fluxo **Web** com a URL do site
3. Copie o **ID de medição**, no formato `G-XXXXXXXXXX`
4. Faça a **TAREFA A**: variável **`NEXT_PUBLIC_GA_ID`** = `G-XXXXXXXXXX`
5. Faça a **TAREFA B** (Redeploy)

Ele só carrega para visitantes que **aceitarem** os cookies de análise no
aviso do site.

---

## PARTE 9 — Segurança: trocar a chave secreta do Supabase

**Faça isto quando o site estiver estável.** A chave `service_role` do
Supabase (a `SUPABASE_SERVICE_ROLE_KEY`) foi exposta durante a configuração,
então o certo é **gerar uma nova e aposentar a antiga**. Leva ~5 min.

### Passo 28 — Rolar (regenerar) a chave

1. Abra https://supabase.com e entre no seu projeto
2. Menu da esquerda → ícone de engrenagem **Project Settings**
3. Clique em **API**
4. Ache a seção **Project API keys** → a linha **`service_role`** (marcada
   como `secret`)
5. Clique em **Roll** (ou **Generate new key** / ícone de recarregar) na
   linha do `service_role` → confirme
6. A chave antiga para de funcionar **na hora**. Copie a **nova** chave
   `service_role` (começa com `sb_secret_...` ou `eyJ...`)
7. Faça a **TAREFA A**: edite **`SUPABASE_SERVICE_ROLE_KEY`** na Vercel →
   cole a nova → **Save**
8. Faça a **TAREFA B** (Redeploy)
9. Atualize também no seu computador: abra
   `C:\Users\leomi\cogni-ia\.env.local` **no VS Code** (não no Bloco de
   Notas), troque o valor da linha `SUPABASE_SERVICE_ROLE_KEY=` pela nova
   chave, e salve. Se o VS Code perguntar a codificação, use **UTF-8**.

**Como saber se funcionou:**

- [ ] `/admin/saude` no site continua com banco e cache no verde
- [ ] O seed ainda roda:

```bash
cd C:\Users\leomi\cogni-ia
```

```bash
npm run seed:biblioteca
```

- [ ] Terminou com `✓ Seed concluído: ...` (sem erro de autorização)

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
| Chat responde texto "de demonstração" | Normal sem `OPENAI_API_KEY` (Passo 23). |
| `/admin/saude` com "Fila / erros" degradado | Falta `SUPABASE_SERVICE_ROLE_KEY` nas variáveis da Vercel. |

**Se o tempo for curto:** PARTE 0 → 1 → 2 → 3 → 4 → 5 → 6 já coloca o site
utilizável no ar. As PARTES 8 e 9 são evolução, podem ser em outro dia.
