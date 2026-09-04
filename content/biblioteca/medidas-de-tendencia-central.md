# Medidas de tendência central e leitura de gráficos

*Média, mediana e moda: qual usar, quando cada uma engana e como não cair em gráfico manipulado.*

## Como usar este guia

O ENEM cobra estatística em contexto: salários, notas, população, consumo. A questão dá uma tabela ou gráfico e pede uma medida — ou pede para **julgar qual medida representa melhor** aquele conjunto.

> **Regra de ouro:** média é puxada por valores extremos; mediana e moda, não. Se há *outliers* (poucos valores muito altos ou baixos), a mediana costuma representar melhor "o típico".

## 1. As três medidas

| Medida    | Como calcular                                  | Sensível a extremos? | Quando brilha                        |
| --------- | ------------------------------------------ | ---------------- | -------------------------------- |
| Média      | soma dos valores ÷ quantidade                | **Sim**           | dados sem discrepâncias grandes    |
| Mediana    | ordene os dados; pegue o valor central (ou a média dos dois centrais) | Não | rendas, preços de imóveis, tempos |
| Moda       | o valor que mais se repete                    | Não               | dados categóricos; "tamanho mais vendido" |

**Exemplo:** salários (em mil): 2, 2, 3, 3, 4, 4, 40.
- Média = 58 ÷ 7 ≈ **8,3** (nenhum funcionário ganha isso!).
- Mediana = 4º valor = **3**.
- Moda = **2 e 3** (bimodal).

A mediana descreve melhor o salário "comum"; a média foi distorcida pelo salário de 40.

![Reta numérica mostrando seis salários agrupados e um valor extremo; a mediana fica no grupo e a média é puxada para a direita](/img/biblioteca/media-vs-mediana.svg "Com um valor extremo, a média se afasta do grupo enquanto a mediana continua representando o típico.")

> **Pegadinha:** "a média subiu, logo todo mundo melhorou." Um único valor muito alto novo pode elevar a média sem que a maioria mude.

## 2. Outras medidas úteis

| Medida            | O que diz                                              |
| ----------------- | ------------------------------------------------ |
| Amplitude          | maior valor − menor valor (mede dispersão bruta)  |
| Desvio-padrão       | o quanto os dados variam em torno da média (maior = mais espalhados) |
| Quartis / mediana   | dividem os dados ordenados em 4 partes iguais     |

## 3. Escolha do gráfico

| Gráfico            | Serve para                                   |
| ------------------ | --------------------------------------- |
| Barras/colunas      | comparar categorias                       |
| Linhas              | evolução de uma variável no tempo         |
| Setores (pizza)     | partes de um todo, em % (soma 100%)       |
| Histograma          | distribuição por faixas de valores        |
| Boxplot             | mediana, quartis e outliers de uma vez    |

> **Pegadinha visual:** eixo vertical que **não começa no zero** ou com escala "quebrada" exagera diferenças pequenas. Sempre confira a escala antes de concluir "cresceu muito".

## 4. Probabilidade básica (aparece junto)

`P(evento) = casos favoráveis ÷ casos possíveis`, resultado entre 0 e 1 (ou 0% a 100%).

- Eventos independentes (ex.: dois dados): multiplique as probabilidades.
- "Pelo menos um": às vezes é mais fácil calcular o complementar `1 − P(nenhum)`.

---

## Prática — 10 questões estilo ENEM

1. No conjunto 4, 4, 5, 9, 20, a mediana é:
   a) 4 · b) 5 · c) 9 · d) 8,4 · e) 20
2. Nesse mesmo conjunto, a média é:
   a) 5 · b) 8,4 · c) 9 · d) 4 · e) 20
3. A moda de 3, 7, 7, 7, 9, 12 é:
   a) 7 · b) 9 · c) 7,5 · d) não há · e) 12
4. Rendas com um valor muito alto isolado são melhor representadas pela:
   a) média · b) mediana · c) amplitude · d) soma · e) moda
5. Para mostrar a evolução da inflação mês a mês, o gráfico ideal é de:
   a) setores · b) linhas · c) pizza · d) barras horizontais · e) Venn
6. Um gráfico de setores deve somar:
   a) 90% · b) 100% · c) 180% · d) 360 valores · e) qualquer valor
7. Amplitude de 12, 15, 15, 30 é:
   a) 15 · b) 18 · c) 30 · d) 12 · e) 3
8. Se a média de uma turma subiu mas a mediana ficou igual, é provável que:
   a) todos melhoraram igualmente · b) poucas notas muito altas puxaram a média · c) a turma diminuiu · d) a moda sumiu · e) houve erro de cálculo
9. A probabilidade de sair cara ao lançar uma moeda honesta é:
   a) 0 · b) 1 · c) 1/2 · d) 1/6 · e) 2
10. (Discursiva) Explique por que, para divulgar o "salário típico" de uma empresa com poucos executivos muito bem pagos, a mediana é mais adequada que a média.

## Gabarito comentado

| Q  | Resp. | Comentário                                                      |
| -- | ----- | ------------------------------------------------------- |
| 1  | B     | Valor central de 5 dados ordenados é o 3º: 5.            |
| 2  | B     | 42 ÷ 5 = 8,4.                                            |
| 3  | A     | 7 se repete três vezes.                                  |
| 4  | B     | A mediana resiste ao valor extremo.                      |
| 5  | B     | Evolução no tempo → gráfico de linhas.                   |
| 6  | B     | Setores representam 100% do todo.                        |
| 7  | B     | 30 − 12 = 18.                                            |
| 8  | B     | Média sobe e mediana fica = típico de poucos valores altos novos. |
| 9  | C     | 1 caso favorável em 2 possíveis.                         |
| 10 | —     | A média é inflada pelos salários altos e não reflete o que a maioria recebe; a mediana mostra o valor central, mais próximo da experiência comum dos funcionários. |

## Diagnóstico rápido

| Acertos (1–9) | Situação                          | Próximo passo                             |
| ------------- | ----------------------------- | ----------------------------------- |
| 8–9           | Escolhe a medida certa         | Treine interpretar gráficos com escala manipulada. |
| 5–7           | Erra mediana ou leitura        | Releia as seções 1 e 3.               |
| 0–4           | Recomece                      | Refaça os exemplos e o diagnóstico.   |

---
*Versão inicial do resumo completo, no padrão dos guias de estudo. Ampliável pelo painel administrativo (Fase 9).*
