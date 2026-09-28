# SLOs, gate de aprovação e calibração de baseline

## Gate padrão (`scripts/analyze-results.mjs`)

| Critério | Aprovado | Atenção | Reprovado |
| --- | --- | --- | --- |
| Taxa de erro | < 0,5% | 0,5–1% | > 1% |
| p95 agregado | ≤ 800 ms | 800–1500 ms | > 1500 ms |
| p99 agregado | ≤ 1500 ms | 1500–3000 ms | > 3000 ms |
| Regressão de p95 vs baseline | ≤ +10% | +10–25% | > +25% |
| Queda de RPS vs baseline | ≤ 10% | 10–20% | > 20% |

Um run também é **reprovado** de cara, independente do agregado, se:

- Total de requests < 100 (run pequeno demais pra significar algo).
- Qualquer rota/action individual com p99 > 3s ou taxa de erro > 1%.

Esses números são um ponto de partida genérico — ajuste em `analyze-results.mjs`
(constante `LIMITES`) se o projeto tiver SLO próprio (ex. uma página de
checkout pode exigir p95 bem menor que 800ms).

## Por que esses números

- **p95/p99 em vez de média**: a média esconde a cauda. Um p95 de 800ms com
  average de 200ms geralmente indica um subconjunto de requests caro (N+1,
  cache miss, lock) que a média mascara.
- **Taxa de erro em vez de "zero erros"**: em runtime real, timeouts
  esporádicos de rede acontecem mesmo com o app saudável; 1% é a linha onde
  isso deixa de ser ruído e vira sintoma.
- **Regressão vs valor absoluto**: um p95 de 900ms pode ser "sempre foi assim,
  a página é pesada" (não é regressão) ou "piorou 300ms desde ontem" (é). Por
  isso o baseline importa mais que o número absoluto pra decisão de "pode
  mergear".

## Calibrando o primeiro baseline

1. Rode o cenário `baseline` **3 vezes seguidas**, máquina ociosa (feche
   outros builds/testes rodando).
2. Compare as 3: se p95 variar mais de ~10% entre elas, o ambiente está
   instável (Docker Desktop com pouca RAM alocada, disco lento, throttling de
   CPU) — resolva isso antes de confiar em qualquer número.
3. Use a mediana das 3 como baseline inicial:
   ```bash
   ./run-load-test.sh --scenario baseline --update-baseline
   ```

## Quando NÃO comparar com baseline

- Ambiente diferente (outra máquina, outro container spec, com/sem CDN).
- Cenário diferente (`stress` não é comparável com `baseline`).
- Dataset de tamanho muito diferente (banco de teste vazio vs com 6 meses de
  dados semeados) — paginação e agregações escalam com volume.
- `--dev` (modo `next dev`): números de dev mode não são comparáveis com
  produção nem com outros runs de dev (HMR, sem otimizações de build). Use
  `--dev` só pra validar que o cenário roda (equivalente ao `smoke`), nunca
  pra decidir aprovado/reprovado de capacidade.
