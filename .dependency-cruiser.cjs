// Contratos de arquitetura: quem pode depender de quem.
module.exports = {
  forbidden: [
    { name: 'nucleo-sem-dom', severity: 'error', comment: 'O núcleo (regras de texto/datas/cálculo) é puro: não depende da interface, dos testes nem dos scripts.',
      from: { path: '^src/nucleo' }, to: { path: '^(src/ui|tests|scripts)' } },
    { name: 'nucleo-sem-dependencias-externas', severity: 'error', comment: 'O núcleo não usa pacotes do npm (vai embutido na página).',
      from: { path: '^src/nucleo' }, to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-no-pkg', 'npm-unknown'] } },
    { name: 'portaria-isolada', severity: 'error', comment: 'O login (functions) não depende da interface nem dos testes.',
      from: { path: '^functions' }, to: { path: '^(src/ui|tests)' } },
    { name: 'sem-ciclos', severity: 'error', from: {}, to: { circular: true } },
    { name: 'sem-orfaos', severity: 'warn', from: { orphan: true, pathNot: ['^src/ui/', '\\.d\\.ts$', '(^|/)\\.[^/]+\\.(c|m)?js$', '\\.config\\.(c|m)?js$', '^tests/', '^scripts/'] }, to: {} },
    { name: 'testes-nao-entram-no-produto', severity: 'error', from: { path: '^src' }, to: { path: '^tests' } },
  ],
  options: { doNotFollow: { path: 'node_modules' }, moduleSystems: ['es6', 'cjs'] },
};
