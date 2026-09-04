# Marca COGNI IA — referência

Consolidação da identidade a partir dos documentos oficiais do iCloud
(`COGNI ia_/Mkt/Manual de Identidade e Produção` e
`COGNI ia_/Documentação/COGNI IA — Base de Conhecimento Ampliada`, §7 Sistema de
Cores). Fonte única no código: [`lib/brand.ts`](../lib/brand.ts).

## Nome

**COGNI IA** — sempre em caixa alta, com espaço antes de "IA".

## Posicionamento

> Uma ponte entre o conhecimento complexo e o público geral. A missão é
> **democratizar o conhecimento complexo através da clareza** — a IA atua como
> uma camada inteligente que amplia o potencial humano, não como um fim.

Tagline de marca: **"Do conhecimento complexo à clareza."**
Tagline de SEO (usada no `<title>`): "Estude para o ENEM e vestibulares com
inteligência artificial."

## Tom de voz

Curioso, acessível, autoritário — mas amigável. A educação como experiência
convidativa e esclarecedora. Princípios editoriais:

1. **Verdade científica** — tudo fundamentado em dados verificáveis.
2. **Simplificação sem perda de rigor** — clareza, nunca superficialidade.
3. **Engajamento emocional** — narrativa e visual que fixam o aprendizado.

## Estilo visual

**Neo-Minimalismo Educativo**: formas limpas e geométricas, texturas sutis,
foco absoluto na legibilidade. Sem distrações — a atenção vai para o conteúdo.

- **Tipografia:** sans-serif moderna para títulos (o app usa **Inter**);
  a base recomenda uma serif legível para textos longos.
- **Mascote:** o "Explorador Cogni" — guia visual da curiosidade. O símbolo da
  marca abstrai essa ideia num **anel aberto** (o "C" / a órbita da exploração)
  com um **nó guia** (o explorador) e uma **faísca central** (o insight).

## Paleta (confirmada na Base de Conhecimento §7)

| Papel | Hex | Token |
| --- | --- | --- |
| Fundo | `#0B1220` | `background` |
| Cards / superfície elevada | `#111A2E` | `card` / `surface` |
| Primária | `#3B82F6` | `primary` |
| Secundária | `#60A5FA` | `secondary` |
| Texto | `#E5E7EB` | `foreground` |
| Suporte / muted | `#94A3B8` | `muted` |

Já refletida em `tailwind.config.ts`. A base pede arquitetura de **tokens**
(valor → primitivo → marca → semântico → componente), não hexadecimais soltos —
por isso os componentes usam apenas classes de token.

> A base ainda descreve uma paleta **por disciplina** para o conteúdo de vídeo
> (Exatas: azul profundo/neon; Humanas: terracota/mostarda; Tecnologia:
> roxo/cinza; Biológicas: verde sálvia/coral). Não aplicada à UI do produto,
> que mantém a paleta única acima; fica registrada para materiais de conteúdo.

## Ativos no repositório

| Arquivo | Uso |
| --- | --- |
| `lib/brand.ts` | constantes + `markSvg()` / `markDataUri()` (fonte única) |
| `components/brand/Logo.tsx` | marca inline (herda cor do tema); `variant="mark" \| "full"` |
| `public/img/brand/cogni-mark.svg` | símbolo isolado (e-mail, imprensa) |
| `public/img/brand/cogni-logo.svg` | lockup horizontal símbolo + wordmark |
| `app/icon.tsx`, `app/apple-icon.tsx`, `app/opengraph-image.tsx` | favicon / ícone iOS / OG, gerados com o símbolo |

Aplicado em: cabeçalho do marketing, layout de autenticação, sidebar do app e
menu mobile.

## Trocar por uma logo própria (raster)

O símbolo atual é um SVG **fiel ao manual** (Neo-Minimalismo, cores oficiais),
criado por não ter sido possível localizar os arquivos originais da logo entre
as fotos da biblioteca do iCloud. Para substituir:

1. Coloque `logo.svg` (preferível) ou `logo.png` em `public/img/brand/`.
2. Em `components/brand/Logo.tsx`, troque o bloco `<svg>` inline por
   `<img src="/img/brand/logo.svg" alt="" className="h-full w-full" />`.
3. Em `lib/brand.ts`, ajuste `markSvg()` se quiser o novo símbolo também no
   favicon/OG — ou aponte `app/icon.tsx` para o arquivo estático.
