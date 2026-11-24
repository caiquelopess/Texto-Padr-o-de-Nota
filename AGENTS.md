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

## Código e ambientes

- **Não edite `index.html` nem `teste/index.html` à mão** — são gerados. O código-fonte fica em `src/`:
  - `src/nucleo/*.mjs`: regras puras (formatação, datas/dias úteis, refat, versão). Sem DOM e sem pacotes externos. Toda regra nova de texto/cálculo vai aqui, com teste unitário.
  - `src/ui/NN-*.js`: interface, em seções (juntadas em ordem pelo build).
  - `src/estilos.css`, `src/pagina.html` (HTML com os marcadores do build).
- `npm run build` gera `index.html` (produção) e `teste/index.html` (`AMBIENTE_TESTE = true`: faixa amarela, histórico/pendências separados). O CI recusa PR com os gerados desatualizados.
- Ao mudar o site, aumente `VERSAO_ATUAL` (em `src/ui/13-site-sempre-atualizado.js`) e o `versao.json`/`teste/versao.json` (a página recarrega sozinha só com a tela limpa).
- **Login (Cloudflare Pages Functions):** `functions/_middleware.js` (portaria), `functions/_lib/autenticacao.js` (regras puras, com teste unitário) e `functions/_lib/telas.js` (login, troca de senha, administração). Nunca guardar senha em texto; nada de credenciais no código. Configuração em `docs/CONFIGURACAO.md`.
- **Gestor geral:** o usuário de `ADMIN_USUARIO` é o gestor do sistema. Nenhum outro administrador pode removê-lo, desativá-lo ou redefinir a senha dele, e só ele lê as sugestões (`/admin/sugestoes`) e a auditoria (`/admin/auditoria`).
- **Senha provisória:** usuário criado ou com senha redefinida pelo administrador fica com `trocarSenha: true` e só acessa "Trocar senha" e "Sair" até criar a própria senha.
- **Auditoria:** toda ação da administração (acessos e formulários) chama `registrar()` em `functions/_lib/auditoria.js`. Nunca registrar senhas nem dados de clientes.
- Produção = `main`, publicada pelo Cloudflare Pages (com login) e, até a migração terminar, pelo GitHub Pages. Mesclar o PR = publicar; por isso só com aprovação.

## Antes de abrir o PR

`npm run verificar` (build em dia, Biome, Knip, contratos de arquitetura, testes unitários com cobertura mínima e Playwright) e, se mexeu em `src/nucleo`, `npm run mutacao` (Stryker, nota mínima 80).
Commits no padrão **Conventional Commits** (verificado pelo commitlint): `feat:`, `fix:`, `perf:`, `refactor:`, `test:`, `docs:`, `build:`, `ci:`, `chore:` — ex.: `fix(pendencias): lembrete não repete antes do prazo (#12)`.
Se um modelo de texto oficial mudar de propósito, atualize `tests/e2e/modelos-oficiais.spec.mjs` no mesmo PR.

## Regras do produto

- **Dados de clientes nunca saem do navegador.** Nada de enviar campos, nomes, CPF/CNPJ, telefones ou textos gerados para serviços externos (inclusive ferramentas de monitoramento).
- Textos seguem os modelos oficiais enviados pelo responsável; não inventar texto de nota/agenda. Na dúvida, perguntar.
- Sempre "Solicitante" (sem Sr./Sra.), CPF/CNPJ em todo campo de documento, fase MONO/BI/TRI, telefone da nota `71-9XXXXXXXX`.
- Interface: animações curtas que nunca atrasam o atendimento; respeitar `prefers-reduced-motion` e o tema Alto Contraste. Ver princípios em https://github.com/kylezantos/design-principles (Issue #3).
- Testar no navegador (computador e celular) antes de abrir o PR; dados de teste fictícios.
