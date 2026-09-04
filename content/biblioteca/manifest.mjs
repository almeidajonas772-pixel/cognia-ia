// @ts-check
/**
 * Catálogo inicial da Biblioteca ENEM (Fase 3) — fonte de autoria do seed.
 *
 * JS puro de propósito: o script `npm run seed:biblioteca` (Node) importa este
 * arquivo diretamente. O app NÃO usa este arquivo — lê tudo do banco.
 *
 * - `summaryShort`: RESUMO RÁPIDO (grátis) — só os tópicos principais (markdown).
 * - `premiumFile`: .md deste diretório com o RESUMO COMPLETO (Premium), no
 *   mesmo padrão dos guias de estudo do usuário.
 *
 * Recorrência ENEM: 'muito_recorrente' | 'recorrente' | 'ocasional' | 'raro'
 * Áreas: 'linguagens' | 'matematica' | 'natureza' | 'humanas' | 'redacao'
 */

/** @typedef {{ slug: string, title: string, recurrence: string, readingMinutes: number, summaryShort: string, premiumFile: string }} ContentSeed */
/** @typedef {{ slug: string, name: string, contents: ContentSeed[] }} TopicSeed */
/** @typedef {{ area: string, slug: string, name: string, description: string, icon: string, topics: TopicSeed[] }} SubjectSeed */

const lines = (arr) => arr.join("\n");

/** @type {SubjectSeed[]} */
export const CATALOG = [
  {
    area: "linguagens",
    slug: "literatura",
    name: "Literatura",
    description: "Escolas literárias, obras e análise de texto para o ENEM.",
    icon: "BookOpen",
    topics: [
      {
        slug: "realismo-naturalismo",
        name: "Realismo e Naturalismo",
        contents: [
          {
            slug: "realismo-naturalismo-brasil",
            title: "Realismo e Naturalismo no Brasil",
            recurrence: "recorrente",
            readingMinutes: 16,
            premiumFile: "realismo-naturalismo-brasil.md",
            summaryShort: lines([
              "**Contexto (fim do séc. XIX):** reação ao Romantismo; ciência, positivismo, determinismo e crítica social.",
              "**Realismo — marco:** *Memórias Póstumas de Brás Cubas* (1881), Machado de Assis. Análise psicológica, ironia, narrador não confiável.",
              "**Naturalismo — marco:** *O Cortiço* (1890), Aluísio Azevedo. Determinismo (meio + raça + momento), zoomorfização, personagem-coletivo.",
              "**Realismo x Romantismo:** objetividade x idealização; análise x emoção; herói comum e falho x herói virtuoso.",
              "**Realismo x Naturalismo:** ambos criticam a sociedade, mas o Naturalismo radicaliza o determinismo e foca no instinto e nas classes marginalizadas.",
              "**Machado — recursos:** metalinguagem, diálogo com o leitor, digressão, ironia fina, capítulos curtos.",
              "**Temas de prova:** crítica à burguesia e à escravidão, casamento por interesse, aparência x essência, condição social como prisão.",
            ]),
          },
        ],
      },
    ],
  },
  {
    area: "linguagens",
    slug: "lingua-portuguesa",
    name: "Língua Portuguesa",
    description: "Gramática de texto, semântica e recursos expressivos.",
    icon: "Languages",
    topics: [
      {
        slug: "semantica-estilistica",
        name: "Semântica e estilística",
        contents: [
          {
            slug: "figuras-de-linguagem",
            title: "Figuras de linguagem",
            recurrence: "muito_recorrente",
            readingMinutes: 12,
            premiumFile: "figuras-de-linguagem.md",
            summaryShort: lines([
              "**Para que servem:** produzem sentido além do literal; no ENEM aparecem em poema, propaganda, tirinha e letra de música.",
              "**Figuras de palavra:** metáfora, comparação, metonímia, catacrese, sinestesia, perífrase.",
              "**Figuras de pensamento:** antítese, paradoxo, ironia, eufemismo, hipérbole, personificação (prosopopeia), gradação.",
              "**Figuras de sintaxe:** elipse, zeugma, pleonasmo, anáfora, hipérbato, polissíndeto, assíndeto.",
              "**Figuras de som:** aliteração, assonância, onomatopeia, paronomásia.",
              "**Pegadinha clássica:** metáfora (sem conectivo) x comparação (com *como, tal qual*); metáfora x metonímia (semelhança x contiguidade).",
              "**Na prova:** quase sempre pedem a **função** da figura no texto, não só o nome.",
            ]),
          },
        ],
      },
    ],
  },
  {
    area: "matematica",
    slug: "matematica",
    name: "Matemática",
    description: "Funções, estatística, proporção e raciocínio quantitativo.",
    icon: "Sigma",
    topics: [
      {
        slug: "funcoes",
        name: "Funções",
        contents: [
          {
            slug: "funcao-afim-e-quadratica",
            title: "Função afim e função quadrática",
            recurrence: "muito_recorrente",
            readingMinutes: 14,
            premiumFile: "funcao-afim-e-quadratica.md",
            summaryShort: lines([
              "**Função afim:** f(x) = ax + b. `a` = taxa de variação (inclinação); `b` = valor inicial (corta o eixo y).",
              "`a > 0` crescente · `a < 0` decrescente · gráfico é reta · raiz: x = −b/a.",
              "**Função quadrática:** f(x) = ax² + bx + c. Gráfico é parábola.",
              "`a > 0` concavidade para cima (tem mínimo) · `a < 0` para baixo (tem máximo).",
              "**Vértice:** x_v = −b/2a · y_v = −Δ/4a. É onde está o valor máximo ou mínimo.",
              "**Δ = b² − 4ac:** Δ > 0 duas raízes · Δ = 0 uma raiz · Δ < 0 nenhuma raiz real.",
              "**No ENEM:** modelar custo/receita/lucro, altura de projétil, área máxima, comparar planos de preço.",
            ]),
          },
        ],
      },
      {
        slug: "estatistica-probabilidade",
        name: "Estatística e Probabilidade",
        contents: [
          {
            slug: "medidas-de-tendencia-central",
            title: "Medidas de tendência central e leitura de gráficos",
            recurrence: "muito_recorrente",
            readingMinutes: 12,
            premiumFile: "medidas-de-tendencia-central.md",
            summaryShort: lines([
              "**Média:** soma dos valores ÷ quantidade. Sensível a valores extremos (*outliers*).",
              "**Mediana:** valor central com os dados **em ordem**. Resistente a extremos.",
              "**Moda:** valor que mais se repete. Pode não existir ou haver mais de uma.",
              "**Quando usar:** distribuição com valores muito discrepantes → mediana representa melhor que a média.",
              "**Gráficos:** barras (comparar categorias) · linhas (evolução no tempo) · setores/pizza (partes de um todo, %) · histograma (faixas).",
              "**Pegadinha de prova:** eixos com escala quebrada ou não começando no zero exageram a diferença visual.",
              "**Probabilidade:** P = casos favoráveis ÷ casos possíveis (de 0 a 1).",
            ]),
          },
        ],
      },
    ],
  },
  {
    area: "natureza",
    slug: "biologia",
    name: "Biologia",
    description: "Ecologia, evolução, fisiologia e diversidade dos seres vivos.",
    icon: "Leaf",
    topics: [
      {
        slug: "ecologia",
        name: "Ecologia",
        contents: [
          {
            slug: "ciclos-biogeoquimicos",
            title: "Ciclos biogeoquímicos e impactos ambientais",
            recurrence: "muito_recorrente",
            readingMinutes: 18,
            premiumFile: "ciclos-biogeoquimicos.md",
            summaryShort: lines([
              "**Ideia central:** matéria circula (ciclos do carbono, água, nitrogênio); energia flui em sentido único e se dissipa como calor.",
              "**Ciclo do carbono:** fotossíntese retira CO₂; respiração, decomposição e queima devolvem. Combustível fóssil = carbono que estava fora de circulação.",
              "**Efeito estufa intensificado:** mais CO₂/CH₄ → retém mais calor → aquecimento global. Causas: queima de combustível fóssil, desmatamento, pecuária.",
              "**Ciclo da água:** evaporação, transpiração, condensação, precipitação. Vegetação garante infiltração e regula o regime de chuvas.",
              "**Ciclo do nitrogênio:** fixação (bactérias) → nitrificação → assimilação → amonificação → desnitrificação.",
              "**Eutrofização:** excesso de nutrientes (esgoto, adubo) → explosão de algas → falta de O₂ na água → morte de peixes.",
              "**Cadeia x teia alimentar:** produtores → consumidores → decompositores; só ~10% da energia passa de um nível ao seguinte.",
            ]),
          },
        ],
      },
      {
        slug: "zoologia",
        name: "Zoologia e evolução animal",
        contents: [
          {
            slug: "organizacao-corporal-dos-animais",
            title: "Organização corporal dos animais: folhetos, celoma e simetria",
            recurrence: "recorrente",
            readingMinutes: 16,
            premiumFile: "organizacao-corporal-dos-animais.md",
            summaryShort: lines([
              "**Regra de ouro:** para cada característica pergunte *o que é*, *para que serve* e *qual consequência evolutiva*.",
              "**Folhetos embrionários:** diblásticos (ecto + endoderme = cnidários) · triblásticos (+ mesoderme = de platelmintos a cordados). Porífero não tem tecido verdadeiro.",
              "**Celoma** = cavidade **totalmente** revestida por mesoderme: acelomado (platelminto) · pseudocelomado (nematelminto) · celomado (anelídeo em diante).",
              "**Simetria:** radial (cnidário; sem cabeça) x bilateral (favorece deslocamento e cefalização). Equinodermo: larva bilateral, adulto pentarradial.",
              "**Blastóporo:** vira boca → protostômios · vira ânus → deuterostômios (equinodermos e cordados).",
              "**Grupos filogenéticos:** monofilético (ancestral + todos os descendentes) · parafilético (‘répteis’ sem aves) · polifilético (artificial).",
              "**Pegadinha:** ter 3 folhetos **não** garante celoma; só há celoma verdadeiro se a cavidade for toda revestida por mesoderme.",
            ]),
          },
        ],
      },
    ],
  },
  {
    area: "humanas",
    slug: "historia",
    name: "História",
    description: "Brasil e mundo contemporâneo, com foco no que o ENEM cobra.",
    icon: "Landmark",
    topics: [
      {
        slug: "brasil-republica",
        name: "Brasil República",
        contents: [
          {
            slug: "era-vargas",
            title: "Era Vargas (1930–1945)",
            recurrence: "muito_recorrente",
            readingMinutes: 18,
            premiumFile: "era-vargas.md",
            summaryShort: lines([
              "**O que é:** período em que Getúlio Vargas governou o Brasil de 1930 a 1945, em três fases.",
              "**Governo Provisório (1930–1934):** fim da República Velha e da política do café com leite; centralização; ministérios do Trabalho e da Educação.",
              "**Governo Constitucional (1934–1937):** Constituição de 1934 (voto feminino, voto secreto, leis trabalhistas); polarização ANL x AIB.",
              "**Estado Novo (1937–1945):** golpe com apoio militar; ditadura; Constituição ‘polaca’; censura (DIP); repressão; culto ao líder.",
              "**Trabalhismo:** leis trabalhistas, salário mínimo (1940), CLT (1943) — direitos concedidos ‘de cima’, atrelando o trabalhador ao Estado (populismo).",
              "**Economia:** industrialização por substituição de importações; Vale do Rio Doce e CSN (Volta Redonda).",
              "**Fim:** Brasil entra na 2ª Guerra ao lado dos Aliados (FEB); a contradição entre combater o nazifascismo e manter ditadura interna derruba Vargas em 1945.",
            ]),
          },
        ],
      },
    ],
  },
  {
    area: "humanas",
    slug: "geografia",
    name: "Geografia",
    description: "Geografia física e humana do Brasil e do mundo.",
    icon: "Globe2",
    topics: [
      {
        slug: "geografia-do-brasil",
        name: "Geografia do Brasil",
        contents: [
          {
            slug: "urbanizacao-brasileira",
            title: "Urbanização brasileira",
            recurrence: "recorrente",
            readingMinutes: 12,
            premiumFile: "urbanizacao-brasileira.md",
            summaryShort: lines([
              "**Definição:** crescimento da população urbana em relação à rural. O Brasil passou de rural a urbano entre 1960 e 1970.",
              "**Causas:** industrialização (Sudeste), mecanização do campo, concentração fundiária, atração por emprego e serviços (êxodo rural).",
              "**Urbanização brasileira:** rápida, tardia e desigual — sem infraestrutura para absorver a população.",
              "**Consequências:** periferização, favelização, déficit habitacional, ocupação de áreas de risco, mobilidade precária.",
              "**Conceitos:** metrópole, região metropolitana, conurbação, megalópole, cidades médias (as que mais crescem hoje).",
              "**Macrocefalia urbana:** cidade cresce mais que a infraestrutura consegue atender.",
              "**Segregação socioespacial:** o preço da terra separa a cidade em áreas ricas (bem servidas) e pobres (precárias).",
            ]),
          },
        ],
      },
    ],
  },
  {
    area: "redacao",
    slug: "redacao",
    name: "Redação",
    description: "Base teórica de apoio para o texto dissertativo-argumentativo.",
    icon: "PenLine",
    topics: [
      {
        slug: "estrutura-e-competencias",
        name: "Estrutura e competências",
        contents: [
          {
            slug: "cinco-competencias-enem",
            title: "As cinco competências da redação do ENEM",
            recurrence: "muito_recorrente",
            readingMinutes: 15,
            premiumFile: "cinco-competencias-enem.md",
            summaryShort: lines([
              "**Formato:** texto dissertativo-argumentativo em prosa, ~7 a 30 linhas, com proposta de intervenção. 5 competências, 0 a 200 cada, total 1000.",
              "**C1 — Norma culta:** ortografia, concordância, regência, pontuação, paralelismo.",
              "**C2 — Compreensão do tema:** não fugir nem tangenciar; repertório sociocultural **pertinente e produtivo**.",
              "**C3 — Projeto de texto:** tese clara na introdução, argumentos organizados e desenvolvidos, sem contradição.",
              "**C4 — Coesão:** conectivos entre parágrafos e períodos; retomadas sem repetição.",
              "**C5 — Proposta de intervenção:** agente + ação + meio/modo + finalidade + detalhamento; respeitar os direitos humanos.",
              "**Zera se:** fuga total ao tema, não ser dissertativo-argumentativo, menos de 7 linhas, desenho/impropério, cópia dos textos motivadores.",
            ]),
          },
        ],
      },
      {
        slug: "argumentacao",
        name: "Argumentação",
        contents: [
          {
            slug: "repertorio-sociocultural",
            title: "Repertório sociocultural produtivo",
            recurrence: "recorrente",
            readingMinutes: 10,
            premiumFile: "repertorio-sociocultural.md",
            summaryShort: lines([
              "**O que é:** conhecimento de áreas diversas (história, filosofia, sociologia, ciência, artes, atualidades) usado para sustentar o argumento.",
              "**Produtivo x improdutivo:** produtivo = ligado à tese e explorado; improdutivo = citação enfeite, sem conexão.",
              "**Fórmula:** apresentar o repertório → explicar → **conectar explicitamente** ao ponto do parágrafo.",
              "**Fontes seguras:** Constituição de 1988, dados de IBGE/IPEA/OMS, conceitos (indústria cultural, lugar de fala, distopia), obras e fatos históricos.",
              "**Evite:** frases prontas (‘desde os primórdios’), ‘Aristóteles já dizia’ sem precisão, dado inventado.",
              "**Meta:** 1 repertório bem explorado por parágrafo de desenvolvimento vale mais que 3 soltos.",
            ]),
          },
        ],
      },
    ],
  },
];
