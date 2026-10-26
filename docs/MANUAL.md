# Manual do usuário — LottoMind AI

## Página inicial

Escolha uma modalidade no seletor superior. Os indicadores exibem o último concurso que foi possível consultar, a próxima data anunciada, o prêmio estimado e quantos resultados estão disponíveis para análise. O status **Fonte online** significa que a consulta à Caixa foi realizada; **Dados em cache** significa que a fonte não pôde ser atualizada e o servidor possui registros salvos; **Fonte indisponível** significa que não existem resultados atuais nem histórico salvo. Use o ícone de atualizar para tentar novamente.

Abaixo, veja as dezenas e o segundo sorteio quando aplicável, histogramas de frequência e paridade e uma tabela de resultados pesquisável. As dezenas podem aparecer sem ordenação no Super Sete porque a posição/coluna importa.

## Estatísticas

Selecione a janela (10, 30, 50, 100, 200, 500). As contagens consideram **somente concursos efetivamente disponíveis no servidor**, não números fictícios para preencher lacunas. Compare frequência observada e esperada, veja atraso nas observações disponíveis, pares coocorrentes e a tabela de frequência, Z-score e maior lacuna. Um Z-score alto não certifica um padrão causal; investigar muitos números amplia a chance de coincidências.

## Gerar jogos

Escolha estratégia, quantidade, tamanho da aposta, orçamento e filtros. Para Dia de Sorte, escolha também o mês. Para Timemania, insira o Time do Coração conforme o volante atual da Caixa — a plataforma **não valida a lista de clubes** nesta versão. O Super Sete gera uma escolha de 0 a 9 por cada uma das sete colunas; apostas múltiplas nessa modalidade ainda não são suportadas.

O sistema respeita o teto informado: se o orçamento comporta menos jogos que a quantidade pedida, gera apenas os que cabem. Nenhum pagamento é realizado. Para **Fechamento completo**, informe o tamanho do grupo; todas as combinações simples são criadas apenas se o limite máximo e o orçamento permitirem. A garantia condicional depende de todos os números sorteados estarem dentro do grupo, conforme descrito no resultado.

Os modos frequência, atraso, Fibonacci e numerologia são recreativos/heurísticos, **não preditivos**.

## Monte Carlo

Depois de criar um conjunto no gerador, escolha 10.000, 100.000 ou 1.000.000 sorteios. O processamento é isolado em Web Worker. Você verá quantos concursos simulados tiveram determinada quantidade **máxima** de acertos entre seus bilhetes. Para Dupla Sena, o cálculo de Monte Carlo considera o melhor resultado dos dois sorteios. A tabela inferior apresenta as probabilidades teóricas de **uma aposta simples e um único sorteio**, não comparáveis diretamente com um portfólio variado.

A simulação não revela os resultados futuros.

## Backtesting

Selecione uma estratégia e a quantidade de concursos finais para avaliação. Cada rodada cria o jogo a partir dos concursos anteriores à rodada; compara seu desempenho com um jogo aleatório de mesmo custo. Sem no mínimo 16 resultados disponíveis, o teste será recusado. O retorno histórico usa faixas numéricas quando o valor está disponível no payload, mas não calcula complementos de mês/time, nem o custo/retorno de apostas ampliadas.

## Histórico de apostas

Salve o conjunto criado, atribuindo um nome. Em **Meus jogos**, consulte e exporte CSV; use **Imprimir / PDF** no gerador para salvar como PDF pelo navegador. Marque como **aposta realizada** somente se realmente comprou o bilhete. A comparação com o último concurso é meramente informativa e não confirma compra. Os dados são salvos somente no navegador e podem desaparecer quando dados locais forem apagados.

## Preços

Os preços iniciais foram coletados de material e páginas oficiais da Caixa, mas não são atualizados automaticamente. Verifique os valores vigentes no momento de apostar, porque reajustes não são detectados pela plataforma.
