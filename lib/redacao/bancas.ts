/**
 * Catálogo de bancas (spec §2.1). Dados de referência fixos — ficam em código.
 *
 * ENEM é preciso. Para as demais bancas, `scaleMax` e a lista de critérios são
 * APROXIMAÇÕES razoáveis; o `rigor` orienta o modelo a aplicar os critérios
 * reais que conhece. Ajuste conforme o edital de cada vestibular.
 */

export type Competency = {
  id: string;
  name: string;
  max: number;
  weight: number;
};

export type Banca = {
  id: string;
  name: string;
  scaleMax: number;
  competencies: Competency[];
  rigor: string;
};

const c = (id: string, name: string, max: number, weight = 1): Competency => ({
  id,
  name,
  max,
  weight,
});

export const BANCAS: Banca[] = [
  {
    id: "enem",
    name: "ENEM",
    scaleMax: 1000,
    competencies: [
      c("c1", "Competência 1 — Norma culta", 200),
      c("c2", "Competência 2 — Compreensão do tema e repertório", 200),
      c("c3", "Competência 3 — Projeto de texto (argumentação)", 200),
      c("c4", "Competência 4 — Coesão", 200),
      c("c5", "Competência 5 — Proposta de intervenção", 200),
    ],
    rigor:
      "Aplique a matriz de referência oficial do ENEM. Cada competência vai de 0 a 200 em níveis (0, 40, 80, 120, 160, 200). Zera a redação: fuga total ao tema, não ser dissertativo-argumentativo, menos de 7 linhas, cópia dos textos motivadores. A proposta de intervenção deve ter agente, ação, meio/modo, finalidade e detalhamento, e respeitar os direitos humanos.",
  },
  {
    id: "fuvest",
    name: "FUVEST (USP)",
    scaleMax: 50,
    competencies: [
      c("registro", "Registro e norma", 12.5),
      c("tema", "Desenvolvimento do tema e consistência argumentativa", 12.5),
      c("estrutura", "Estrutura dissertativa e progressão", 12.5),
      c("coesao", "Coesão e coerência", 12.5),
    ],
    rigor:
      "A FUVEST valoriza densidade argumentativa, repertório consistente e domínio da norma. Escala 0 a 50. É rigorosa com clareza de tese e com o uso produtivo dos textos da coletânea.",
  },
  {
    id: "unicamp",
    name: "UNICAMP (Comvest)",
    scaleMax: 12,
    competencies: [
      c("genero", "Adequação ao gênero e à proposta", 4),
      c("leitura", "Leitura e uso dos textos da coletânea", 4),
      c("coerencia", "Coerência, coesão e norma", 4),
    ],
    rigor:
      "A UNICAMP cobra gêneros textuais variados (não só dissertação): identifique o gênero pedido e avalie a adequação a ele. Escala 0 a 12. Penaliza fortemente o desvio de gênero e o uso superficial da coletânea.",
  },
  {
    id: "fgv",
    name: "FGV",
    scaleMax: 10,
    competencies: [
      c("conteudo", "Conteúdo e argumentação", 4),
      c("estrutura", "Estrutura e coerência", 3),
      c("expressao", "Expressão e norma", 3),
    ],
    rigor:
      "A FGV valoriza raciocínio analítico, precisão conceitual e articulação lógica. Escala 0 a 10. Exigente com consistência argumentativa e clareza.",
  },
  {
    id: "insper",
    name: "Insper",
    scaleMax: 10,
    competencies: [
      c("tese", "Tese e argumentação", 4),
      c("estrutura", "Organização e coesão", 3),
      c("linguagem", "Linguagem e norma", 3),
    ],
    rigor:
      "O Insper valoriza posicionamento claro, repertório pertinente e capacidade de análise crítica. Escala 0 a 10.",
  },
  {
    id: "mackenzie",
    name: "Mackenzie",
    scaleMax: 10,
    competencies: [
      c("tema", "Adequação ao tema e conteúdo", 4),
      c("estrutura", "Estrutura e coesão", 3),
      c("norma", "Norma culta", 3),
    ],
    rigor: "Dissertativo-argumentativo padrão. Escala 0 a 10.",
  },
  {
    id: "espm",
    name: "ESPM",
    scaleMax: 10,
    competencies: [
      c("conteudo", "Conteúdo e criatividade", 4),
      c("estrutura", "Estrutura e coesão", 3),
      c("norma", "Norma culta", 3),
    ],
    rigor:
      "A ESPM valoriza repertório cultural, originalidade e boa articulação. Escala 0 a 10.",
  },
  {
    id: "vunesp",
    name: "VUNESP",
    scaleMax: 20,
    competencies: [
      c("tema", "Adequação ao tema e ao tipo textual", 5),
      c("coerencia", "Coerência e progressão", 5),
      c("coesao", "Coesão", 5),
      c("norma", "Modalidade escrita formal", 5),
    ],
    rigor:
      "A VUNESP corrige por critérios de adequação, coerência, coesão e norma. Escala típica 0 a 20 (pode variar por concurso/vestibular).",
  },
  {
    id: "puc",
    name: "PUC",
    scaleMax: 10,
    competencies: [
      c("tema", "Adequação ao tema e argumentação", 4),
      c("estrutura", "Estrutura e coesão", 3),
      c("norma", "Norma culta", 3),
    ],
    rigor: "Dissertativo-argumentativo. Escala 0 a 10.",
  },
  {
    id: "fcc",
    name: "FCC",
    scaleMax: 10,
    competencies: [
      c("conteudo", "Conteúdo e pertinência", 4),
      c("estrutura", "Estrutura e articulação", 3),
      c("expressao", "Expressão e correção gramatical", 3),
    ],
    rigor:
      "Estilo concurso: avalia conteúdo, estrutura e expressão. Rigorosa com correção gramatical. Escala 0 a 10.",
  },
  {
    id: "cesgranrio",
    name: "CESGRANRIO",
    scaleMax: 10,
    competencies: [
      c("conteudo", "Conteúdo e desenvolvimento", 4),
      c("estrutura", "Coesão e coerência", 3),
      c("norma", "Norma culta", 3),
    ],
    rigor:
      "Estilo concurso: conteúdo, coesão/coerência e domínio da norma. Escala 0 a 10.",
  },
  {
    id: "cebraspe",
    name: "CEBRASPE (CESPE)",
    scaleMax: 10,
    competencies: [
      c("conteudo", "Apresentação e domínio do conteúdo", 5),
      c("norma", "Domínio da modalidade escrita formal", 5),
    ],
    rigor:
      "O CEBRASPE usa desconto por erros: Nota = NC − (NE × fator), onde NE conta erros gramaticais e de estrutura. Seja rigoroso ao contabilizar erros e explique cada desconto. Escala normalizada aqui em 0 a 10.",
  },
];

export const BANCA_IDS = BANCAS.map((b) => b.id);

export function getBanca(id: string): Banca | undefined {
  return BANCAS.find((b) => b.id === id);
}
