# Textos Padrões — Neoenergia

Gerador de textos de NOTA e AGENDA para os serviços de atendimento.

**Acesse:** https://caiquelopess.github.io/Texto-Padr-o-de-Nota/

## Como funciona

- Página única (`index.html`), sem servidor. Tudo o que é digitado fica **só no navegador** de quem usa; nada é enviado para fora.
- **Histórico:** cada texto gerado fica salvo no navegador daquele computador por 90 dias (botão *Histórico*).
- **Calculadora de Refaturamento:** leitura esperada da fatura reclamada pela média diária de consumo.
- **Tensão Fornecimento:** consulta da tensão por cidade (Bahia).
- **Atualização:** pelo link, a página confere o `versao.json` a cada 30 minutos e mostra *Atualizar agora* quando sai versão nova. Quem usa o arquivo `.html` no PC recebe o aviso com *Abrir versão online*.

## Publicar uma nova versão

1. No `index.html`, aumente `var VERSAO_ATUAL = '...'` (ex.: `2.3.0` → `2.4.0`).
2. No `versao.json`, coloque o mesmo número em `versao`, a data e as `novidades`.
3. Envie os dois arquivos para a branch `main`. O GitHub Pages atualiza o site em 1 a 2 minutos.
