# Configuração do Supabase Vault

Este diretório contém as funções SQL necessárias para gerenciar segredos no Supabase Vault através da página de Settings.

## Pré-requisitos

1. **Habilitar o Vault no seu projeto Supabase**

   O Supabase Vault precisa estar habilitado no seu projeto. Para verificar:

   - Acesse o SQL Editor no painel do Supabase
   - Execute: `SELECT * FROM vault.secrets LIMIT 1;`
   - Se funcionar, o Vault está habilitado ✓

2. **Criar os segredos iniciais**

   Antes de usar a página de Settings, você precisa criar os segredos no Vault manualmente uma vez:

   ```sql
   -- Criar RapidAPI Key
   SELECT vault.create_secret(
     'rapidapi_key_1760651731629',
     'sua_chave_rapidapi_aqui',
     'RapidAPI Key for Social Blade and other services'
   );

   -- Criar OpenRouter API Key
   SELECT vault.create_secret(
     'openrouter_key_1760655833491',
     'sua_chave_openrouter_aqui',
     'OpenRouter API Key for AI model access'
   );
   ```

## Instalação das Funções RPC

Execute o arquivo `vault-functions.sql` no SQL Editor do Supabase:

1. Acesse o **SQL Editor** no painel do Supabase
2. Crie uma nova query
3. Cole o conteúdo de `vault-functions.sql`
4. Execute a query

Isso criará duas funções:

- `public.list_secrets()` - Lista os nomes dos segredos disponíveis
- `public.update_vault_secret(name, value)` - Atualiza um segredo existente

## Como Funciona

### Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                               │
│  ❌ Nunca recebe valores de segredos                            │
│  ✓ Apenas recebe nomes/descrições dos segredos                  │
│  ✓ Envia novos valores via Server Action                        │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER COMPONENTS                            │
│  📄 app/(dashboard)/settings/page.tsx                           │
│     - Lista segredos disponíveis (sem valores)                   │
│     - Renderiza formulário com nomes dos segredos               │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER ACTIONS                              │
│  🔒 lib/actions/settings.ts                                     │
│     - Recebe novos valores do formulário                         │
│     - Usa Admin Client para acessar Vault                        │
│     - Atualiza segredos via RPC functions                        │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE VAULT                               │
│  🔐 Armazenamento criptografado de segredos                     │
│     - Valores nunca são retornados em queries normais            │
│     - Acesso apenas via funções específicas                      │
│     - Requer Service Role Key                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes Criados

#### 1. Server Component: `app/(dashboard)/settings/page.tsx`
- **Responsabilidade**: Buscar metadados dos segredos (nomes, descrições)
- **Segurança**: Usa `createAdminClient()` apenas no servidor
- **Output**: Renderiza `<SettingsForm />` com lista de segredos

#### 2. Client Component: `app/(dashboard)/settings/components/SettingsForm.tsx`
- **Responsabilidade**: Interface do usuário para atualizar segredos
- **Tecnologias**: `react-hook-form`, `zod`, `sonner` (toasts)
- **Segurança**:
  - Inputs tipo `password` (valores ocultos)
  - Nunca exibe valores atuais
  - Chama Server Action para updates

#### 3. Server Action: `lib/actions/settings.ts`
- **Responsabilidade**: Atualizar segredos no Vault
- **Segurança**:
  - Usa `createAdminClient()` com Service Role Key
  - Validação de inputs
  - Verificação de permissões (TODO: implementar auth)
  - `revalidatePath()` para atualizar página

## Uso da Página de Settings

1. Acesse `http://localhost:3000/settings`
2. Você verá campos de formulário para cada segredo configurado
3. Digite os novos valores (tipo password - valores ocultos)
4. Clique em "Salvar Alterações"
5. Um toast confirmará o sucesso ou erro da operação

## Segurança

### ⚠️ Pontos Críticos de Segurança

1. **Admin Client Usage**
   - ✅ Apenas usado em Server Components e Server Actions
   - ❌ NUNCA importar em Client Components
   - ✅ Protegido por verificação de ambiente (browser check)

2. **Proteção da Página**
   - ⚠️ TODO: Implementar verificação de role 'admin'
   - Atualmente, qualquer usuário autenticado pode acessar
   - Ver comentários no código para implementação futura

3. **Valores dos Segredos**
   - ✅ Nunca são enviados ao cliente
   - ✅ Inputs tipo password (não visíveis)
   - ✅ Transmitidos apenas via HTTPS em produção
   - ✅ Processados apenas no servidor

### Próximos Passos de Segurança

1. **Implementar autenticação e autorização**
   ```typescript
   // Em app/(dashboard)/settings/page.tsx
   const session = await getServerSession()
   if (!session || session.user.role !== 'admin') {
     redirect('/unauthorized')
   }
   ```

2. **Restringir funções RPC apenas para role admin**
   ```sql
   -- Atualizar em vault-functions.sql
   REVOKE EXECUTE ON FUNCTION public.update_vault_secret(text, text) FROM authenticated;
   GRANT EXECUTE ON FUNCTION public.update_vault_secret(text, text) TO admin_role;
   ```

3. **Adicionar audit log**
   - Registrar todas as alterações de segredos
   - Incluir timestamp, usuário, e qual segredo foi alterado
   - Útil para compliance e debugging

## Troubleshooting

### Erro: "vault.update_secret does not exist"

O Vault pode não estar habilitado ou a sintaxe pode estar incorreta. Tente:

```sql
-- Verificar se o Vault está disponível
SELECT * FROM vault.secrets LIMIT 1;

-- Se não funcionar, você pode precisar habilitar a extensão
-- (requer permissões de superuser)
CREATE EXTENSION IF NOT EXISTS vault;
```

### Erro: "permission denied for function update_vault_secret"

Verifique as permissões da função:

```sql
GRANT EXECUTE ON FUNCTION public.update_vault_secret(text, text) TO authenticated;
```

### Segredos não aparecem no formulário

1. Verifique se os segredos foram criados no Vault
2. Verifique os nomes em `app/(dashboard)/settings/page.tsx`
3. Cheque os logs do servidor para erros

## Referências

- [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [React Hook Form](https://react-hook-form.com/)
- [Sonner Toast Library](https://sonner.emilkowal.ski/)
