// Mensagens de commit no padrão Conventional Commits, em português:
//   feat: nova função · fix: correção · perf/refactor/style/docs/test/build/ci/chore
// Exemplo: "fix(pendencias): lembrete não repete antes do prazo (#12)"
export default {
  extends: ['@commitlint/config-conventional'],
  rules: { 'subject-case': [0], 'header-max-length': [2, 'always', 100] },
};
