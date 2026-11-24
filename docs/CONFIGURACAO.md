# Configuração: Cloudflare (site com login) e Codecov (cobertura dos testes)

Faça uma vez. Nenhuma senha ou token vai para o código nem para o chat — tudo fica nas telas de configuração.

## Parte 1 — Cloudflare Pages (site com login)

### 1. Criar o projeto a partir do GitHub
1. Entre em https://dash.cloudflare.com → menu **Compute (Workers & Pages)** → **Workers & Pages** → **Create** → aba **Pages** → **Import an existing Git repository** (Connect to Git).
2. Autorize o GitHub e escolha o repositório **Texto-Padr-o-de-Nota**.
3. Em **Set up builds and deployments**:
   - **Project name:** `textos-padroes` (vira o endereço `https://textos-padroes.pages.dev`)
   - **Production branch:** `main`
   - **Framework preset:** None
   - **Build command:** `node scripts/dist.mjs`
   - **Build output directory:** `dist`
4. Clique em **Save and Deploy**. O primeiro deploy vai mostrar "Login ainda não configurado" — normal, os próximos passos resolvem.

### 2. Criar o "banco" de usuários (KV)
1. Menu **Storage & Databases** → **KV** → **Create** (Create a namespace).
2. Nome: `textos-padroes-usuarios` → **Add**.

### 3. Ligar o KV e os segredos ao projeto
Abra **Workers & Pages** → projeto **textos-padroes** → **Settings**.

**a) Bindings** → **Add** → **KV namespace**:
- **Variable name:** `USUARIOS`
- **KV namespace:** `textos-padroes-usuarios`
- Faça para **Production** e também para **Preview** (pode usar o mesmo KV ou criar outro só para testes).

**b) Variables and Secrets** → **Add** (tipo **Secret** para os dois primeiros):
| Nome | Tipo | Valor |
|---|---|---|
| `SEGREDO_SESSAO` | Secret | uma sequência aleatória **com 32 caracteres ou mais** (ex.: gere em https://www.random.org/strings/ ou digite 40 letras/números misturados) |
| `ADMIN_SENHA` | Secret | a senha inicial do administrador (mín. 4; **não use a senha real dos sistemas corporativos**) |
| `ADMIN_USUARIO` | Text | o seu usuário no padrão `nome.sobrenome` |

Repita em **Production** e **Preview**.

### 4. Publicar de novo com a configuração
**Deployments** → no último deploy, **⋯** → **Retry deployment** (ou mescle qualquer PR).

### 5. Primeiro acesso
1. Abra `https://textos-padroes.pages.dev` → tela de login.
2. Entre com `ADMIN_USUARIO` e `ADMIN_SENHA`. Seu cadastro de administrador é criado nesse momento.
3. Vá em **Trocar senha** e troque a senha (a `ADMIN_SENHA` passa a servir só se o seu cadastro for apagado).
4. Em **Administração**, crie os atendentes: usuário `nome.sobrenome` + senha provisória (mín. 4). Passe a senha a cada um e peça para trocarem em **Trocar senha**.

### Dia a dia do administrador
- **Esqueceu a senha:** Administração → **Redefinir senha** (as sessões abertas da pessoa caem na hora).
- **Saiu da equipe:** **Desativar** (pode reativar depois) ou **Remover**.
- **5 senhas erradas** bloqueiam o usuário por 15 minutos (ou redefina a senha para liberar antes).
- A sessão dura **12 horas** (um turno); depois pede login de novo.

### Pré-visualização de cada PR
Com o projeto ligado ao GitHub, cada PR ganha um link `https://<código>.textos-padroes.pages.dev` (aparece no PR). Também exige login (usa a configuração **Preview**).

## Parte 2 — Codecov (cobertura dos testes)
1. Entre em https://app.codecov.io → **Login with GitHub**; autorize o app do Codecov para o repositório **Texto-Padr-o-de-Nota**.
2. Abra o repositório na lista do Codecov → **Configuration → General** → copie o **Repository Upload Token**.
3. No GitHub: repositório → **Settings → Secrets and variables → Actions → New repository secret** → Name `CODECOV_TOKEN`, Secret = o token → **Add secret**.
4. No próximo PR, o relatório de cobertura aparece no Codecov e como comentário no PR.

> Se algum token ou senha for colado em chat, e-mail ou mensagem, gere outro (no Codecov: **Regenerate**; no Cloudflare: edite o secret).

## Depois que o site com login estiver funcionando (próximo PR)
- Exportar o histórico e as pendências do endereço antigo (GitHub Pages) e importar no novo — o navegador guarda esses dados por endereço.
- Apontar o site antigo para o novo endereço e tornar o repositório privado.
