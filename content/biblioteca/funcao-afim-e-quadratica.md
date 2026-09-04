# Função afim e função quadrática

*Duas funções que modelam quase todo problema de variação no ENEM: crescimento constante e crescimento com máximo ou mínimo.*

## Como usar este guia

O ENEM raramente pede "resolva a equação". Ele descreve uma situação (preço, distância, lucro, altura) e pede para **modelar**, **comparar** ou **encontrar o ponto ótimo**. Traduzir o enunciado em `f(x)` é metade da questão.

> **Regra de ouro:** identifique a variável independente (x), a taxa de variação (o quanto muda por unidade) e o valor inicial. Taxa constante → função afim. Taxa que muda de forma proporcional a x → função quadrática.

## 1. Função afim: f(x) = ax + b

| Parâmetro | Significado                              | No gráfico                     |
| --------- | ----------------------------------- | -------------------------- |
| `a`        | taxa de variação (quanto y muda quando x aumenta 1) | inclinação da reta         |
| `b`        | valor inicial (y quando x = 0)          | ponto onde a reta corta o eixo y |

- `a > 0` → **crescente**; `a < 0` → **decrescente**; `a = 0` → função constante (reta horizontal).
- **Raiz (zero):** onde `f(x) = 0` → `x = -b/a`. É onde a reta cruza o eixo x.
- **Taxa a partir de dois pontos:** `a = (y₂ - y₁) / (x₂ - x₁)`.

**Exemplo:** táxi cobra R$ 5,00 fixos + R$ 2,50 por km. `f(x) = 2,5x + 5`. Para 8 km: `f(8) = 2,5·8 + 5 = 25`.

> **Pegadinha:** "dobrar x dobra o preço" só vale se `b = 0`. Com taxa fixa (`b ≠ 0`), a relação **não** é proporcional.

## 2. Função quadrática: f(x) = ax² + bx + c

Gráfico: **parábola**.

| Parâmetro | Efeito                                                  |
| --------- | -------------------------------------------------- |
| `a`        | `a > 0` concavidade para **cima** (tem ponto de **mínimo**); `a < 0` para **baixo** (tem **máximo**) |
| `c`        | valor de `f(0)` — onde a parábola corta o eixo y     |

**Raízes:** `x = (-b ± √Δ) / 2a`, com `Δ = b² - 4ac`.

| Δ        | Raízes reais         | Parábola e o eixo x           |
| -------- | ---------------- | ------------------------- |
| Δ > 0     | duas               | cruza em dois pontos       |
| Δ = 0     | uma (dupla)        | tangencia o eixo x         |
| Δ < 0     | nenhuma            | não toca o eixo x          |

**Vértice** (ponto de máximo ou mínimo):

`x_v = -b / 2a`  ·  `y_v = -Δ / 4a`

`x_v` é também o eixo de simetria da parábola.

**Exemplo:** um objeto é lançado e sua altura é `h(t) = -5t² + 20t`. Altura máxima em `t_v = -20 / (2·(-5)) = 2 s`; `h(2) = -5·4 + 40 = 20 m`. Volta ao chão quando `h(t) = 0` → `t = 0` ou `t = 4 s`.

> **Não diga:** "o máximo é o maior valor de x."
> **Diga:** "o máximo é `y_v`, atingido em `x_v = -b/2a`."

![Plano cartesiano com a reta da função afim (valor inicial b e raiz) e a parábola da função quadrática (vértice e raízes)](/img/biblioteca/funcao-afim-e-quadratica.svg "A reta corta o eixo y em b e o eixo x na raiz −b/a. A parábola tem vértice em xᵥ = −b/2a e, com Δ > 0, duas raízes.")

## 3. Quando usar cada uma

| Situação                                       | Função         |
| ------------------------------------------ | ----------- |
| Conta de luz/água com tarifa fixa + consumo | afim          |
| Plano A × plano B (qual compensa a partir de quando) | duas afins; iguale-as |
| Lucro = receita − custo, com preço variável | quadrática (procura o preço de lucro máximo) |
| Altura de projétil no tempo                 | quadrática     |
| Área máxima com perímetro fixo              | quadrática     |

---

## Prática — 10 questões estilo ENEM

1. Na função `f(x) = 3x - 6`, a raiz é:
   a) 0 · b) 2 · c) -2 · d) 6 · e) 3
2. Em `f(x) = ax + b`, se a reta decresce, então:
   a) a > 0 · b) a < 0 · c) b < 0 · d) b > 0 · e) a = 0
3. Um serviço cobra R$ 40 fixos + R$ 15 por hora. O custo de 5 horas é:
   a) R$ 75 · b) R$ 95 · c) R$ 115 · d) R$ 55 · e) R$ 115,50
4. Na quadrática `f(x) = 2x² - 8x + 6`, a concavidade é:
   a) para baixo · b) para cima · c) não há · d) depende de x · e) reta
5. O `x` do vértice de `f(x) = -x² + 6x - 5` é:
   a) -3 · b) 3 · c) 6 · d) -6 · e) 5
6. Se `Δ < 0`, a parábola:
   a) tem duas raízes reais · b) tangencia o eixo x · c) não corta o eixo x · d) é uma reta · e) passa pela origem
7. `h(t) = -5t² + 30t` representa uma altura. O tempo até a altura máxima é:
   a) 6 s · b) 3 s · c) 30 s · d) 5 s · e) 15 s
8. Dois planos: A = 50 + 2x; B = 20 + 5x. Eles custam o mesmo quando x vale:
   a) 5 · b) 10 · c) 15 · d) 30 · e) 70
9. Numa função afim, dobrar x dobra f(x) somente se:
   a) a = 1 · b) b = 0 · c) a = 0 · d) b = 1 · e) sempre
10. (Discursiva) Uma empresa tem lucro `L(p) = -2p² + 40p - 150`, com `p` = preço. Determine o preço de lucro máximo e o lucro correspondente.

## Gabarito comentado

| Q  | Resp. | Comentário                                                     |
| -- | ----- | ------------------------------------------------------- |
| 1  | B     | `3x - 6 = 0` → `x = 2`.                                  |
| 2  | B     | Reta decrescente ⇔ `a < 0`.                              |
| 3  | C     | `15·5 + 40 = 115`.                                       |
| 4  | B     | `a = 2 > 0` → concavidade para cima.                     |
| 5  | B     | `x_v = -6 / (2·(-1)) = 3`.                               |
| 6  | C     | Δ < 0 → sem raízes reais → não toca o eixo x.            |
| 7  | B     | `t_v = -30 / (2·(-5)) = 3`.                              |
| 8  | B     | `50 + 2x = 20 + 5x` → `30 = 3x` → `x = 10`.              |
| 9  | B     | Proporcionalidade exige `b = 0`.                         |
| 10 | —     | `p_v = -40 / (2·(-2)) = 10`; `L(10) = -200 + 400 - 150 = 50`. Preço R$ 10, lucro máximo R$ 50. |

## Diagnóstico rápido

| Acertos (1–9) | Situação                            | Próximo passo                              |
| ------------- | ------------------------------- | ------------------------------------- |
| 8–9           | Modela e resolve bem             | Treine problemas de lucro e área máximos. |
| 5–7           | Erra vértice ou taxa             | Releia as seções 1 e 2.                  |
| 0–4           | Recomece                        | Refaça os exemplos passo a passo.        |

---
*Versão inicial do resumo completo, no padrão dos guias de estudo. Ampliável pelo painel administrativo (Fase 9).*
