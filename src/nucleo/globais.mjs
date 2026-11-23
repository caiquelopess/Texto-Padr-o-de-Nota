// Ponte para a interface: a página usa as regras como funções globais.
import * as nucleo from './index.mjs';

Object.assign(globalThis, nucleo);
