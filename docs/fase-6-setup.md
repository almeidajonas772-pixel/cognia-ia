# Fase 6 — Sistema de Redação ENEM & Vestibulares

Módulo independente. **Exclusivo do Plano Premium** (spec Fase 3 §5 / Fase 8).
Integra-se ao histórico e às estatísticas da Fase 5.

---

## 1. Migração

No SQL Editor do Supabase, execute
[`supabase/migrations/0005_redacao.sql`](../supabase/migrations/0005_redacao.sql)
(depois de 0001–0004).

Cria `essay_submissions`, `essay_rubrics`, `essay_error_bank`, a função
`bump_error_bank()` e as políticas de RLS (cada redação só é vista pelo dono —
spec §17).

## 2. Chaves de IA

- Sem chave → **modo demonstração**: OCR devolve placeholder e a correção gera
  um relatório de exemplo completo (nota, competências, erros, feedback).
- `OPENAI_API_KEY` → correção real (nota, análise, feedback, comparação com a
  nota máxima) + interpretação de rubrica personalizada.
- `GEMINI_API_KEY` → OCR real de foto/PDF de redação manuscrita.

## 3. Rodar

```bash
npm run dev
```

`/redacao` (Premium) → "Nova redação" → texto ou foto/PDF → escolher banca ou
rubrica → correção.

---

## Fluxo

```
TEXTO digitado ─────────────► status: transcricao_confirmada ─► correção automática
FOTO / PDF ─► OCR (Gemini) ─► status: aguardando_transcricao
                              "Confira a transcrição" [✔ Confirmar] [✏ Editar]
                              └─► confirmar ─► transcricao_confirmada ─► correção
correção ─► corrigida ─► relatório  (ou "erro" se não for redação)
```

## O que foi implementado (spec Fase 6)

| Item | Onde |
| --- | --- |
| Envio por texto / imagem / PDF + rascunho automático | `RedacaoComposer` |
| OCR de alta precisão + confirmação de transcrição | `/api/redacao/ocr` + `TranscriptionReview` |
| 12 bancas oficiais (ENEM preciso; demais aproximadas) | `lib/redacao/bancas.ts` |
| Rubrica personalizada (texto/imagem → interpretação) | `/api/redacao/rubrica` + `essay_rubrics` |
| Correção simples / comentada · 3 níveis de detalhe | `lib/redacao/prompts.ts` |
| Modo treino / simulação oficial | idem |
| Nota final na escala da banca + nota por competência | `runCorrection` + `CorrectionReport` |
| Análise de erro (trecho, regra, correção, reescrita, prioridade) | `ErrorList` |
| Feedback obrigatório: 13 áreas ordenadas por prioridade 🔴🟠🟡🟢 | `ImprovementList` |
| Comparação com a nota máxima | `CorrectionReport` (max_score_gap) |
| Banco de erros recorrentes ("já apareceu N×") | `essay_error_bank` + `bump_error_bank` |
| Histórico de evolução + estatísticas (média, competência forte/fraca) | `lib/redacao/stats.ts` + `/redacao/estatisticas` |
| Integração com Fase 5 (histórico + atividade) | `runCorrection` → `logActivity('essay')` |
| Privacidade das redações | RLS own-only |

## Notas

- As escalas/critérios de bancas que não o ENEM são **aproximações** — o `rigor`
  no `bancas.ts` orienta o modelo a aplicar os critérios reais que conhece.
  Ajuste conforme o edital.
- Geração de `.docx` da correção e OCR em lote ficam para uma fase futura.
- Limite de uso: hoje o único gate é "ser Premium". Um teto diário opcional pode
  entrar na Fase 8.
