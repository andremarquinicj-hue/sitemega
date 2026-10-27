# Cobertura combinatória — versão 1.1

## O que foi implementado

O módulo `lib/math.ts` introduz `makeDiverseTickets` e `coverageAudit`. No menu **Gerador Inteligente → Máxima diversidade**, a Mega-Sena com apostas simples de 6 dezenas apresenta três focos de cobertura:

- **Sena:** combinações únicas de seis dezenas; não repetir um bilhete já gerado.
- **Quadra:** prioriza carteiras com pouca sobreposição entre jogos. Quando cada par de jogos compartilha no máximo uma dezena, os eventos de pelo menos quatro acertos são mutuamente exclusivos. Nesse caso, a chance agregada de ao menos uma quadra, quina ou Sena é a soma das chances individuais.
- **Quina:** prioriza a ausência de pares de jogos que compartilham quatro ou mais dezenas. Quando os pares compartilham no máximo três dezenas, não é possível acertar a quina ou Sena simultaneamente em duas apostas de seis dezenas, logo a chance de ao menos uma quina é a soma das chances individuais.

Com **8 jogos simples, sem dezenas obrigatórias/excluídas**, os três focos retornam **48 dezenas distintas**. Os resultados convergem nesse caso: evitar qualquer repetição oferece a melhor distribuição de dezenas possível e elimina as sobreposições de eventos de quadra/quina. Isso NÃO torna uma combinação individual mais provável. Um conjunto uniforme de oito combinações diferentes possui exatamente a mesma probabilidade de Sena, qualquer que seja a estratégia.

Com filtros obrigatórios, repetições inevitáveis ou mais de dez jogos, o algoritmo usa uma heurística gulosa com reinícios aleatórios. **Não promete ótimo global**, mas documenta a cobertura observada. O orçamento máximo é respeitado. A interface e a API não simulam compra de bilhetes.

## Auditoria apresentada

A resposta do endpoint `POST /api/generate` fornece, quando possível, o campo `coverage`:

- `uniqueNumbers`: quantidade de dezenas distintas.
- `repeatedSelections`: posições repetidas além da primeira aparição.
- `uniqueTickets`: quantidade de bilhetes distintos.
- `maxPairOverlap`: máximo de dezenas comuns entre dois bilhetes.
- `distinctQuartets`, `distinctQuintets`, `distinctSextets`: quantidade de subconjuntos únicos de 4, 5 e 6 dezenas em bilhetes Mega-Sena simples.
- `atLeastQuadraChance`, `atLeastQuinaChance`: probabilidades **exatas**, mas só quando os pares de jogos atendem aos critérios de eventos disjuntos acima. Caso contrário, `null` (não calculada), para não divulgar estimativas incorretas.
- `jackpotChance`: cobertura exata de combinações de Sena distintas no universo `C(60,6)`.

Para uma aposta de 6 dezenas e resultado uniforme de 6 entre 60:

```
N = C(60,6) = 50.063.860
P(quadra ou melhor) = [C(6,4)C(54,2) + C(6,5)C(54,1) + 1] / N
P(quina ou melhor) = [C(6,5)C(54,1) + 1] / N
P(sena) = 1 / N
```

Para oito jogos sem números repetidos, a chance de ao menos uma quadra ou melhor é oito vezes a chance individual — aproximadamente 1 em 287,2. A chance da Sena é 8 em 50.063.860 (aproximadamente 1 em 6.257.983).

**Nota:** quadra exata (exatamente 4 acertos) é diferente de "quadra ou melhor". O cálculo acima usa o segundo conceito e inclui quina e Sena. Prêmios pagos, arrecadação e número de outros ganhadores não são estimados por essa métrica.

## Testes e limites

`tests/coverage.test.ts` cobre oito jogos sem repetições, dez jogos usando 60 dezenas, orçamento, filtros, provas combinatórias, probabilidades exatas em eventos disjuntos e os oito jogos históricos informados no acompanhamento do usuário. Outras modalidades continuam aceitando a estratégia diversificada e recebendo relatório básico, mas os cálculos exatos de quadra/quina agregadas foram implementados **apenas para Mega-Sena simples**, para não misturar regras de loterias distintas.

### Execução de verificação em ambiente local

```bash
npm install
npm run lint
npm test
npm run build
```

Execute também o deploy da Vercel para validar o build no ambiente real. Sem acesso ao registry npm, o build integral não pode ser atestado apenas com a compilação isolada de `lib/math.ts`.

## Opção de preenchimento do orçamento

Foi adicionada a caixa opcional **Preencher automaticamente o orçamento**, que usa `min(100, floor(orçamento/preço da aposta))` como quantidade solicitada, considerando o preço da aposta configurada. Mantém-se desmarcada por padrão para evitar induzir o usuário a aumentar os gastos automaticamente. O gerador continua respeitando o teto de orçamento definido e não compra bilhetes.
