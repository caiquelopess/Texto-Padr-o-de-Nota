# Instruções para agentes (qualquer modelo ou ferramenta)

Projeto: **Textos Padrões — Neoenergia**, gerador de textos de NOTA e AGENDA usado no atendimento.
Objetivo permanente: **reduzir o tempo de atendimento**. Toda mudança deve deixar o atendente mais rápido (ou, no mínimo, não mais lento).

## Fluxo obrigatório

1. **Toda tarefa tem uma Issue** antes de começar: título com o tipo — `[Correção]`, `[Melhoria]` ou `[Nova função]` — e critérios de aceite.
2. **Branch própria** a partir da `main`: `tipo/descricao-curta-N` (ex.: `melhoria/skeleton-abas-3`).
3. **Pull Request** para a `main` com:
   - `Closes #N` (a Issue) na descrição;
   - o que mudou, em linguagem simples, e exemplos do texto gerado antes/depois;
   - link de **pré-visualização** (pasta `/teste/` ou preview automático) e prints;
   - resultado dos testes.
4. **Nada vai para produção sem aprovação do responsável (@caiquelopess).** O agente mostra a pré-visualização, detalha o que foi feito e **espera o "pode publicar"**. Nunca mesclar o próprio PR sem essa aprovação.
5. Commits pequenos, mensagem descrevendo o porquê.

## Ambientes

- **Produção:** raiz do repositório (`index.html`, `versao.json`), publicada pelo GitHub Pages a partir da `main`.
- **Teste:** pasta `teste/` (mesmo arquivo com `AMBIENTE_TESTE = true`: faixa amarela, histórico/pendências separados).
- Para publicar: `index.html` = `teste/index.html` com `AMBIENTE_TESTE = false`; aumentar `VERSAO_ATUAL` e o `versao.json` (a página recarrega sozinha só com a tela limpa).

## Regras do produto

- **Dados de clientes nunca saem do navegador.** Nada de enviar campos, nomes, CPF/CNPJ, telefones ou textos gerados para serviços externos (inclusive ferramentas de monitoramento).
- Textos seguem os modelos oficiais enviados pelo responsável; não inventar texto de nota/agenda. Na dúvida, perguntar.
- Sempre "Solicitante" (sem Sr./Sra.), CPF/CNPJ em todo campo de documento, fase MONO/BI/TRI, telefone da nota `71-9XXXXXXXX`.
- Interface: animações curtas que nunca atrasam o atendimento; respeitar `prefers-reduced-motion` e o tema Alto Contraste. Ver princípios em https://github.com/kylezantos/design-principles (Issue #3).
- Testar no navegador (computador e celular) antes de abrir o PR; dados de teste fictícios.

## Qualidade (em implantação — Issues #5 e #6)

Lint/formatação (Biome), código morto (Knip), contratos de arquitetura, testes de mutação (Stryker), unitários/integração/E2E (Playwright) e cobertura (Codecov) devem passar no CI antes do merge.
