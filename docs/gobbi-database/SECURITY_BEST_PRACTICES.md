# 🔒 Segurança e Best Practices

**Última atualização:** 2025-11-15
**Versão:** 1.0.0

---

## 📋 Índice

1. [Overview de Segurança](#overview-de-segurança)
2. [API Key Management](#api-key-management)
3. [Authentication & Authorization](#authentication--authorization)
4. [CORS Configuration](#cors-configuration)
5. [Audit Logging](#audit-logging)
6. [Data Privacy & Compliance](#data-privacy--compliance)
7. [Security Checklist](#security-checklist)
8. [Incident Response](#incident-response)

---

## 🛡️ Overview de Segurança

### Modelo de Segurança Atual

```
┌──────────────────────────────────────────────────────────────┐
│                   AUTOMEDIA PLATFORM                          │
│                                                               │
│  UI (Browser) ──→ Server Action ──→ Edge Function            │
│     ↓                 ↓                 ↓                     │
│  Auth: Supabase   Auth: Server      Auth: Service Role       │
│  (RLS enabled)    (JWT validation)   (Full DB access)        │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ HTTPS + API Key (X-Webhook-Key)
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                      GOBBI DATABASE                           │
│                                                               │
│  Edge Function ──→ Database                                   │
│       ↓               ↓                                       │
│  Auth: API Key    Auth: Service Role                         │
│  (Optional)       (Full DB access)                           │
└──────────────────────────────────────────────────────────────┘
```

### Princípios de Segurança

1. **Defense in Depth** - Múltiplas camadas de segurança
2. **Least Privilege** - Acesso mínimo necessário
3. **Zero Trust** - Verificar sempre, nunca confiar
4. **Encryption in Transit** - HTTPS obrigatório
5. **Audit Everything** - Log de todas as operações

---

## 🔑 API Key Management

### 1.1 Geração de API Keys

**Recomendações:**

- ✅ **Mínimo 32 caracteres** de entropia
- ✅ **Alfanuméricos + símbolos** (a-zA-Z0-9!@#$%^&*)
- ✅ **Única por webhook** (não reusar)
- ✅ **Rotação regular** (a cada 90 dias)

**Gerar API Key segura:**

```bash
# Opção 1: OpenSSL (mais seguro)
openssl rand -base64 32

# Opção 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opção 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Exemplo de output:
# Y8jK3mN9pQ2rS5tU7vW0xX1zA4bC6dE8fG0hH2iI4jJ6kK8lL0mM2nN4oO6pP8qQ0rR2sS4tT
```

### 1.2 Armazenamento Seguro

**❌ NUNCA fazer:**

```typescript
// ❌ Hardcoded no código
const API_KEY = "my-secret-key-123"

// ❌ Commitar no Git
// .env
WEBHOOK_API_KEY=my-secret-key-123  # ❌ NÃO COMMITADO NO GIT!

// ❌ Expor no frontend
const webhookKey = process.env.NEXT_PUBLIC_WEBHOOK_KEY  // ❌ NEVER!
```

**✅ Fazer:**

```typescript
// ✅ Usar Supabase Secrets (Edge Functions)
const webhookApiKey = Deno.env.get('WEBHOOK_API_KEY')

// ✅ Ou Environment Variables (Server-side apenas)
const apiKey = process.env.WEBHOOK_API_KEY  // Server-side only

// ✅ Ou Database (encrypted)
const { data } = await supabase
  .from('production_webhooks')
  .select('api_key')
  .eq('name', 'receive-benchmark-videos')
  .single()
```

**Configurar no Supabase:**

```bash
# Sua plataforma (se necessário)
npx supabase secrets set WEBHOOK_API_KEY="your-secret-key" --project-ref xlpkabexmwsugkmbngwm

# Gobbi (para validar requests recebidos)
npx supabase secrets set WEBHOOK_API_KEY="your-secret-key" --project-ref eafkhsmgrzywrhviisdl
```

### 1.3 Rotação de API Keys

**Processo de Rotação (Zero Downtime):**

```
Passo 1: Gerar nova API key
  ↓
Passo 2: Adicionar nova key ao Gobbi (secret)
  ↓
Passo 3: Atualizar código para aceitar AMBAS as keys (temporário)
  ↓
Passo 4: Atualizar key na sua plataforma (production_webhooks table)
  ↓
Passo 5: Testar com nova key
  ↓
Passo 6: Remover key antiga do código
  ↓
Passo 7: Revogar key antiga
```

**Código para suportar múltiplas keys (transição):**

```typescript
// receive-benchmark-videos (Gobbi)
const validKeys = [
  Deno.env.get('WEBHOOK_API_KEY'),        // Key atual
  Deno.env.get('WEBHOOK_API_KEY_OLD'),    // Key antiga (deprecada)
]

const incomingKey = req.headers.get('X-Webhook-Key')
if (!validKeys.includes(incomingKey)) {
  // Rejeitar
}
```

### 1.4 Key Revogação

**Quando revogar imediatamente:**

- 🚨 Key vazada publicamente (GitHub, logs, etc.)
- 🚨 Funcionário deixou a empresa
- 🚨 Suspeita de comprometimento
- 🚨 Key não usada há > 180 dias

**Como revogar:**

```sql
-- Sua plataforma: Remover da tabela
UPDATE production_webhooks
SET api_key = NULL
WHERE name = 'receive-benchmark-videos-old';

-- Gobbi: Remover do secret
npx supabase secrets unset WEBHOOK_API_KEY_OLD --project-ref eafkhsmgrzywrhviisdl
```

---

## 🔐 Authentication & Authorization

### 2.1 Autenticação da Edge Function (send-to-gobbi)

**Sua plataforma → Gobbi:**

```typescript
// send-to-gobbi/index.ts
const webhookResponse = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Key': webhook.api_key,  // ✅ Custom header
  },
  body: JSON.stringify(webhookPayload),
})
```

**Status atual:** ✅ Implementado

### 2.2 Autenticação da Edge Function (receive-benchmark-videos)

**Gobbi valida requests recebidos:**

```typescript
// receive-benchmark-videos/index.ts (atualmente DESABILITADO para testes)
const webhookApiKey = Deno.env.get('WEBHOOK_API_KEY')
if (webhookApiKey) {
  const incomingKey = req.headers.get('X-Webhook-Key')

  if (!incomingKey || incomingKey !== webhookApiKey) {
    console.warn('[receive-benchmark-videos] Unauthorized request')
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
```

**Status atual:** ⚠️ DESABILITADO para facilitar testes iniciais

**📝 TODO: Habilitar em produção**

```typescript
// Descomentar linhas 152-164 em receive-benchmark-videos-function.ts
```

### 2.3 Rate Limiting

**Proteger contra abuso:**

```typescript
// Implementação futura: Rate limiting por IP
const RATE_LIMIT = 100  // requests por minuto
const requestCounts = new Map<string, number>()

function checkRateLimit(ip: string): boolean {
  const count = requestCounts.get(ip) || 0
  if (count > RATE_LIMIT) {
    return false  // Rate limited
  }
  requestCounts.set(ip, count + 1)
  return true
}

// Usar no Edge Function
const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
if (!checkRateLimit(clientIp)) {
  return new Response('Rate limit exceeded', { status: 429 })
}
```

**Nota:** Supabase Edge Functions já têm rate limiting built-in.

### 2.4 IP Whitelisting (Opcional)

**Se precisar restringir por IP:**

```typescript
// receive-benchmark-videos (Gobbi)
const ALLOWED_IPS = [
  '123.456.789.0',  // Sua plataforma (Supabase IP)
  '987.654.321.0',  // Backup IP
]

const clientIp = req.headers.get('x-forwarded-for')
if (!ALLOWED_IPS.includes(clientIp)) {
  return new Response('Forbidden', { status: 403 })
}
```

**Nota:** IPs do Supabase podem mudar. Não recomendado.

---

## 🌐 CORS Configuration

### 3.1 CORS Headers Atuais

**send-to-gobbi (sua plataforma):**

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // ⚠️ Permitir todos
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

**receive-benchmark-videos (Gobbi):**

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // ⚠️ Permitir todos
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-key',
}
```

### 3.2 CORS Restritivo (Recomendado para Produção)

**Permitir apenas domínios conhecidos:**

```typescript
// receive-benchmark-videos (Gobbi) - PRODUÇÃO
const ALLOWED_ORIGINS = [
  'https://xlpkabexmwsugkmbngwm.supabase.co',  // Sua plataforma
  'https://your-custom-domain.com',            // Seu domínio customizado
]

const origin = req.headers.get('origin') || ''
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
  'Access-Control-Allow-Headers': 'content-type, x-webhook-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',  // 24h cache
}
```

**Benefícios:**

- ✅ Previne CORS-based attacks
- ✅ Reduz surface de ataque
- ✅ Compliance com OWASP

---

## 📜 Audit Logging

### 4.1 Log de Ações Críticas

**O que logar:**

- ✅ Todas as chamadas de webhook (success + failure)
- ✅ Mudanças em webhooks (criação, edição, deleção)
- ✅ Rotação de API keys
- ✅ Falhas de autenticação
- ✅ Erros de validação
- ✅ Volume anormal de requests

**Implementação de Audit Log:**

```sql
-- Criar tabela de audit logs
CREATE TABLE IF NOT EXISTS webhook_audit_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,  -- 'webhook_call', 'auth_failure', 'key_rotation', etc.
  user_id UUID,  -- Se aplicável
  webhook_id INT REFERENCES production_webhooks(id),
  request_ip TEXT,
  request_headers JSONB,
  request_body JSONB,  -- ⚠️ Sanitizar dados sensíveis
  response_status INT,
  response_body JSONB,
  success BOOLEAN,
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_webhook_audit_logs_event_type ON webhook_audit_logs(event_type);
CREATE INDEX idx_webhook_audit_logs_created_at ON webhook_audit_logs(created_at DESC);
CREATE INDEX idx_webhook_audit_logs_success ON webhook_audit_logs(success) WHERE success = false;

-- RLS (Row Level Security)
ALTER TABLE webhook_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs visible apenas para admins" ON webhook_audit_logs
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');
```

**Inserir log no Edge Function:**

```typescript
// send-to-gobbi/index.ts
async function logWebhookCall(supabase, payload, response, duration) {
  await supabase.from('webhook_audit_logs').insert({
    event_type: 'webhook_call',
    webhook_id: payload.webhook_id,
    request_ip: req.headers.get('x-forwarded-for'),
    request_body: { video_count: payload.video_ids.length },  // Sanitizado
    response_status: response.status,
    response_body: { success: response.success },  // Sanitizado
    success: response.success,
    error_message: response.error || null,
    duration_ms: duration,
  })
}
```

### 4.2 Retenção de Logs

**Política de retenção:**

- **Logs de sucesso:** Manter por 30 dias
- **Logs de erro:** Manter por 90 dias
- **Logs de security events:** Manter por 1 ano

**Cleanup automático:**

```sql
-- Criar função de cleanup
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Delete success logs > 30 dias
  DELETE FROM webhook_audit_logs
  WHERE success = true
    AND created_at < NOW() - INTERVAL '30 days';

  -- Delete error logs > 90 dias
  DELETE FROM webhook_audit_logs
  WHERE success = false
    AND event_type != 'auth_failure'  -- Manter auth failures por mais tempo
    AND created_at < NOW() - INTERVAL '90 days';

  -- Delete auth failures > 1 ano
  DELETE FROM webhook_audit_logs
  WHERE event_type = 'auth_failure'
    AND created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Agendar via pg_cron (se disponível)
SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_old_audit_logs()');
```

### 4.3 Análise de Audit Logs

**Query para detectar ataques:**

```sql
-- Múltiplas falhas de auth do mesmo IP
SELECT
  request_ip,
  COUNT(*) as failed_attempts,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt,
  ARRAY_AGG(DISTINCT error_message) as errors
FROM webhook_audit_logs
WHERE event_type = 'auth_failure'
  AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY request_ip
HAVING COUNT(*) > 5  -- 5+ falhas em 1 hora
ORDER BY failed_attempts DESC;

-- Volume anormal de requests
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as request_count,
  SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed_count,
  ROUND(SUM(CASE WHEN success = false THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as error_rate
FROM webhook_audit_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
HAVING COUNT(*) > 1000  -- Alertar se > 1000 req/hora
ORDER BY hour DESC;
```

---

## 🔏 Data Privacy & Compliance

### 5.1 Dados Sensíveis

**Classificação de Dados:**

| Categoria | Exemplos | Nível de Sensibilidade |
|-----------|----------|------------------------|
| **Público** | youtube_video_id, title, views | Baixo |
| **Interno** | channel_name, description | Médio |
| **Confidencial** | API keys, service role keys | Alto |
| **PII** | (N/A - não coletamos PII) | N/A |

**Dados que NÃO devem ser logados:**

- ❌ API keys completas (logar apenas últimos 4 chars)
- ❌ Service role keys
- ❌ Full request/response bodies (sanitizar)
- ❌ IPs completos (opcionalmente anonimizar últimos octetos)

**Sanitização de Logs:**

```typescript
function sanitizeForLogging(data: any) {
  const sanitized = { ...data }

  // Sanitizar API keys
  if (sanitized.api_key) {
    sanitized.api_key = `***${sanitized.api_key.slice(-4)}`
  }

  // Sanitizar headers
  if (sanitized.headers && sanitized.headers['x-webhook-key']) {
    sanitized.headers['x-webhook-key'] = '***[REDACTED]'
  }

  // Remover campos grandes
  if (sanitized.video_transcript) {
    delete sanitized.video_transcript
  }

  return sanitized
}
```

### 5.2 LGPD / GDPR Compliance

**Dados pessoais coletados:** Nenhum (apenas IDs públicos do YouTube)

**Direitos dos titulares:**

- ✅ **Direito de acesso:** N/A (dados públicos)
- ✅ **Direito de correção:** Atualizar via sync
- ✅ **Direito de exclusão:** Deletar vídeos/canais
- ✅ **Direito de portabilidade:** Export via SQL

**Procedimento de deleção:**

```sql
-- Deletar vídeo específico (Gobbi)
DELETE FROM benchmark_videos
WHERE youtube_video_id = 'xxx';

-- Deletar canal e todos os vídeos (CASCADE)
DELETE FROM benchmark_channels
WHERE channel_id = 'UCxxx';
```

### 5.3 Encryption

**Em trânsito:**

- ✅ **HTTPS obrigatório** (Supabase force SSL)
- ✅ **TLS 1.2+** (Supabase default)
- ✅ **Certificate pinning** (opcional, via Supabase)

**Em repouso:**

- ✅ **Database encryption at rest** (Supabase default - AES-256)
- ✅ **Backup encryption** (Supabase default)
- ⚠️ **Application-level encryption** (não implementado - não necessário)

---

## ✅ Security Checklist

### Pré-Deploy (Obrigatório)

- [ ] API keys geradas com >= 32 chars de entropia
- [ ] API keys armazenadas em Supabase Secrets (nunca hardcoded)
- [ ] CORS configurado (permitir apenas origens conhecidas)
- [ ] Autenticação habilitada em receive-benchmark-videos
- [ ] Rate limiting testado
- [ ] Audit logging implementado
- [ ] Logs sanitizados (sem API keys completas)
- [ ] HTTPS obrigatório (verificar certificado válido)
- [ ] RLS habilitado em tabelas sensíveis

### Pós-Deploy (Recomendado)

- [ ] Monitorar logs de auth failures
- [ ] Configurar alertas de security events
- [ ] Revisar audit logs semanalmente
- [ ] Rotacionar API keys a cada 90 dias
- [ ] Testar disaster recovery (rollback)
- [ ] Documentar incident response plan
- [ ] Treinar equipe em security best practices

### Manutenção Contínua

- [ ] Review de audit logs mensalmente
- [ ] Patch de vulnerabilidades (Supabase auto-updates)
- [ ] Teste de penetração anualmente (opcional)
- [ ] Security assessment trimestral
- [ ] Atualização de documentação de segurança

---

## 🚨 Incident Response

### 6.1 Classificação de Incidentes

**Severidade 1 (Crítico):**

- 🚨 API key vazada publicamente
- 🚨 Acesso não autorizado ao database
- 🚨 Data breach (exfiltração de dados)
- 🚨 DDoS attack bem-sucedido

**Severidade 2 (Alto):**

- ⚠️ Múltiplas tentativas de auth failure
- ⚠️ Spike anormal de requests
- ⚠️ Edge Function comprometida

**Severidade 3 (Médio):**

- ℹ️ Vulnerability scan detectou issue
- ℹ️ Configuração de segurança incorreta

### 6.2 Procedimento de Resposta

**Passo 1: Contenção**

```sql
-- Desabilitar webhook imediatamente
UPDATE production_webhooks
SET is_active = false
WHERE name = 'receive-benchmark-videos';

-- Revogar API key comprometida
UPDATE production_webhooks
SET api_key = NULL
WHERE name = 'receive-benchmark-videos';
```

**Passo 2: Investigação**

```sql
-- Verificar audit logs
SELECT *
FROM webhook_audit_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND (success = false OR event_type = 'auth_failure')
ORDER BY created_at DESC;

-- Identificar IP do atacante
SELECT
  request_ip,
  COUNT(*) as attempts,
  ARRAY_AGG(event_type) as events
FROM webhook_audit_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY request_ip
HAVING COUNT(*) > 100
ORDER BY attempts DESC;
```

**Passo 3: Remediação**

1. Gerar nova API key
2. Atualizar secrets no Supabase
3. Re-deploy Edge Functions com configuração mais restritiva
4. Habilitar rate limiting mais agressivo
5. Adicionar IP do atacante à blocklist

**Passo 4: Recuperação**

```sql
-- Reabilitar webhook com nova key
UPDATE production_webhooks
SET
  is_active = true,
  api_key = '[NEW-KEY]',
  updated_at = NOW()
WHERE name = 'receive-benchmark-videos';
```

**Passo 5: Lições Aprendidas**

- Documentar incident (o que, quando, como, por quê)
- Atualizar runbook de security
- Melhorar monitoramento
- Treinar equipe

### 6.3 Contatos de Emergência

| Papel | Contato | Quando chamar |
|-------|---------|---------------|
| **Lead Dev** | [Seu nome] | Severidade 1-3 |
| **DevOps** | [Time] | Severidade 1-2 |
| **Legal** | [Advogado] | Data breach (Sev 1) |
| **Supabase Support** | support@supabase.com | Platform issues |

---

## 📚 Recursos Adicionais

### Links Úteis

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Supabase Security:** https://supabase.com/docs/guides/platform/security
- **LGPD:** https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd
- **Monitoramento:** [MONITORING_AND_TROUBLESHOOTING.md](./MONITORING_AND_TROUBLESHOOTING.md)
- **Testes:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

**Última revisão:** 2025-11-15
**Mantido por:** Claude Code + Davi Luis
**Próxima revisão:** 2026-02-15 (trimestral)
