# Aba Peso Diário do Estoque

## Objetivo
Adicionar uma tela própria para consultar o peso total do estoque gravado em cada dia.

## O que será feito
- Criar a aba **Peso diário** com gráfico de evolução e lista por data.
- Mostrar peso atual, variação em relação ao dia anterior e período registrado.
- Ler os registros diários já salvos pelo app, sem alterar os cálculos de estoque.
- Incluir acesso claro pelo painel e opção para voltar à apresentação.
- Manter a tela protegida pelo mesmo login do restante do app.

## Detalhes técnicos
- Expor somente data e peso por uma função protegida no servidor.
- Consolidar múltiplos registros do mesmo dia, usando o último valor daquele dia.
- Criar uma rota própria com metadados e interface adaptada para celular e computador.
- Validar carregamento, gráfico, lista e navegação no preview.
