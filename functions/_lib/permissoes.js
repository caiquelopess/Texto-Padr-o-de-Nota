// Perfis e permissões (regras puras, com teste unitário).
// O gestor geral é o usuário de ADMIN_USUARIO: tem todas as permissões e
// nenhum outro perfil pode alterá-lo.
export const PERFIS = {
  gestor: 'Gestor geral',
  administrador: 'Administrador',
  supervisor: 'Supervisor',
  atendente: 'Atendente',
  consulta: 'Consulta',
};

// Operação → perfis que podem executá-la (o gestor pode tudo).
const MATRIZ = {
  'atendimento.usar': ['administrador', 'supervisor', 'atendente', 'consulta'],
  'painel.ver': ['administrador', 'supervisor', 'consulta'],
  'usuarios.ver': ['administrador', 'supervisor', 'consulta'],
  'usuarios.gerenciar': ['administrador', 'supervisor'],
  'formularios.ver': ['administrador', 'supervisor', 'consulta'],
  'formularios.gerenciar': ['administrador'],
  'modelos.ver': ['administrador', 'supervisor', 'consulta'],
  'modelos.editar': ['administrador', 'supervisor'],
  'modelos.publicar': ['administrador'],
  'backups.gerenciar': ['administrador'],
  'backups.restaurar': [],
  'auditoria.ver': [],
  'sugestoes.ver': [],
  'configuracoes.gerenciar': [],
};

// Quem cada perfil pode criar e gerenciar.
const GERENCIA = {
  gestor: ['administrador', 'supervisor', 'atendente', 'consulta'],
  administrador: ['administrador', 'supervisor', 'atendente', 'consulta'],
  supervisor: ['atendente', 'consulta'],
};

// Perfil efetivo de um cadastro (cadastros antigos usavam só "admin: true/false").
export function perfilDe(reg, usuarioGestor) {
  if (!reg) return null;
  if (reg.usuario && reg.usuario === usuarioGestor) return 'gestor';
  if (reg.perfil && PERFIS[reg.perfil] && reg.perfil !== 'gestor') return reg.perfil;
  return reg.admin ? 'administrador' : 'atendente';
}

export function pode(perfil, operacao) {
  if (perfil === 'gestor') return true;
  return (MATRIZ[operacao] || []).includes(perfil);
}

export function perfisQuePodeCriar(perfil) {
  return GERENCIA[perfil] || [];
}

// Pode alterar (redefinir senha, ativar/desativar, remover, mudar perfil) o usuário alvo?
export function podeGerenciar(perfil, perfilAlvo) {
  if (perfilAlvo === 'gestor') return false;
  return perfisQuePodeCriar(perfil).includes(perfilAlvo);
}
