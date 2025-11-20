# Git Conventions

Este documento estabelece as convenções de Git para o projeto Automedia.

## Padrão de Nomenclatura de Branches

### Estrutura Base
```
<tipo>/<descrição-curta>
```

### Tipos de Branches

#### 1. `feat/` - Novas Funcionalidades
Usado para desenvolvimento de novas features.

**Exemplos:**
- `feat/distribution-flow-phases`
- `feat/gobbi-webhook-integration`
- `feat/video-queue-processor`
- `feat/benchmark-radar-settings`

#### 2. `fix/` - Correções de Bugs
Usado para correções de bugs em ambiente de desenvolvimento.

**Exemplos:**
- `fix/radix-ui-dependencies`
- `fix/channel-sync-error`
- `fix/video-upload-validation`

#### 3. `refactor/` - Refatorações
Usado para melhorias de código sem alterar funcionalidade.

**Exemplos:**
- `refactor/channels-videos-ui`
- `refactor/database-queries`
- `refactor/gobbi-client-integration`

#### 4. `docs/` - Documentação
Usado para adições ou melhorias na documentação.

**Exemplos:**
- `docs/platform-reorganization`
- `docs/api-documentation`
- `docs/setup-instructions`

#### 5. `deploy/` - Ajustes de Deploy
Usado para ajustes específicos de deployment.

**Exemplos:**
- `deploy/production-config`
- `deploy/vercel-optimization`

#### 6. `chore/` - Tarefas de Manutenção
Usado para tarefas de manutenção, atualizações de dependências, etc.

**Exemplos:**
- `chore/update-dependencies`
- `chore/cleanup-unused-code`

#### 7. `hotfix/` - Correções Urgentes
Usado para correções críticas em produção.

**Exemplos:**
- `hotfix/critical-security-patch`
- `hotfix/production-crash`

## Regras de Nomenclatura

### ✅ Boas Práticas

1. **Use kebab-case** (palavras separadas por hífen)
   - ✅ `feat/user-authentication`
   - ❌ `feat/user_authentication`
   - ❌ `feat/userAuthentication`

2. **Seja descritivo mas conciso**
   - ✅ `feat/video-distribution-flow`
   - ❌ `feat/feature`
   - ❌ `feat/add-new-video-distribution-flow-with-phases-and-webhook`

3. **Use apenas minúsculas**
   - ✅ `fix/login-error`
   - ❌ `fix/Login-Error`

4. **Evite caracteres especiais** (exceto `-` e `/`)
   - ✅ `feat/gobbi-integration`
   - ❌ `feat/gobbi's-integration`
   - ❌ `feat/gobbi_integration!`

5. **Não use espaços**
   - ✅ `refactor/ui-components`
   - ❌ `refactor/ui components`

### Padrão com Issues/Tickets (Opcional)

Se o projeto usar um sistema de issues, você pode incluir o número:

```
<tipo>/<numero>-<descrição>
```

**Exemplos:**
- `feat/123-user-profile`
- `fix/456-header-alignment`
- `refactor/789-database-optimization`

## Workflow de Branches

### 1. Criar Nova Branch
```bash
# A partir da main atualizada
git checkout main
git pull origin main

# Criar nova branch
git checkout -b feat/nome-da-feature
```

### 2. Trabalhar na Branch
```bash
# Fazer commits seguindo Conventional Commits
git add .
git commit -m "feat: adiciona nova funcionalidade"
```

### 3. Manter Branch Atualizada
```bash
# Atualizar com main periodicamente
git checkout main
git pull origin main
git checkout feat/nome-da-feature
git merge main
```

### 4. Finalizar e Fazer Merge
```bash
# Push da branch
git push origin feat/nome-da-feature

# Criar Pull Request no GitHub
# Após aprovação, fazer merge para main
```

## Conventional Commits

As mensagens de commit devem seguir o padrão Conventional Commits, alinhado com os tipos de branches:

```
<tipo>: <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos de Commits

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `refactor:` - Refatoração de código
- `docs:` - Documentação
- `chore:` - Tarefas de manutenção
- `test:` - Adição ou correção de testes
- `perf:` - Melhorias de performance
- `style:` - Formatação de código
- `ci:` - Mudanças em CI/CD

### Exemplos de Commits

```bash
feat: implement production distribution flow (Phases 0-3)

refactor: Use Gobbi's database (gobbiClient) for distribution flow

fix: Adiciona dependência @radix-ui/react-tabs

docs: rename distribution flow folder and update implementation plan

chore: update Next.js to v14
```

## Branch Principal

- **`main`** - Branch principal de produção
  - Todo código em `main` deve estar pronto para deploy
  - Merges para `main` devem ser feitos via Pull Request
  - Requires review antes do merge (recomendado)

## Proteção de Branches

Recomenda-se configurar no GitHub:

1. **Proteção da branch `main`:**
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - No direct pushes to main

2. **Delete branch after merge:**
   - Manter repositório limpo deletando branches após merge

## Referências

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Branch Naming Convention](https://dev.to/varbsan/a-simplified-convention-for-naming-branches-and-commits-in-git-il4)
