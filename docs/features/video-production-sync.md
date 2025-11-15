# Video Production Sync Feature

## Visão Geral

O sistema de sincronização de vídeos para produção permite enviar vídeos selecionados da plataforma Automedia para bancos de dados de produção externos através de webhooks configuráveis.

Esta feature foi desenvolvida para facilitar o processo de migração de vídeos enriquecidos (com métricas, categorização e análises) para ambientes de produção, mantendo total rastreabilidade através de logs de auditoria.

## Casos de Uso

1. **Migração de Vídeos Analisados**: Enviar vídeos que foram completamente analisados e categorizados para um banco de produção.
2. **Múltiplos Ambientes**: Suporte para diferentes ambientes (produção, staging, QA) através de webhooks distintos.
3. **Backup e Sincronização**: Manter múltiplos bancos de dados sincronizados com os mesmos dados de vídeos.
4. **Integração com Sistemas Externos**: Alimentar sistemas externos com dados enriquecidos de vídeos do YouTube.

## Fluxo de Dados

```
┌─────────────────┐
│  Página Videos  │
│                 │
│  1. Usuário     │
│  seleciona      │
│  vídeos         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Clica "Enviar  │
│  para Produção" │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Dialog abre    │
│  mostrando      │
│  webhooks ativos│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Usuário        │
│  seleciona      │
│  webhook        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Server Action          │
│  sendVideosToProduction │
│                         │
│  1. Busca webhook       │
│  2. Busca dados         │
│     completos dos       │
│     vídeos              │
│  3. Envia POST para     │
│     webhook URL         │
│  4. Registra log        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Edge Function Externa  │
│  (Banco de Produção)    │
│                         │
│  - Recebe payload       │
│  - Valida dados         │
│  - Insere/atualiza      │
│    vídeos               │
│  - Retorna confirmação  │
└─────────────────────────┘
```

## Estrutura de Dados

### Payload Enviado ao Webhook

```typescript
{
  "videos": [
    {
      "id": 123,
      "youtube_video_id": "dQw4w9WgXcQ",
      "channel_id": "UCuAXFkgsw1L7xaCfnd5JJOw",
      "title": "Título do Vídeo",
      "description": "Descrição...",
      "views": 1000000,
      "likes": 50000,
      "comments": 1000,
      "upload_date": "2024-01-01T00:00:00Z",
      "video_length": "00:03:45",
      "thumbnail_url": "https://...",
      "tags": ["tag1", "tag2"],
      "categorization": {
        "category": "Tutorial",
        "subcategory": "Tech",
        // ... outros dados de categorização
      },
      "keywords": ["keyword1", "keyword2"],
      "related_video_ids": ["abc123", "def456"],
      "enrichment_data": { /* dados completos do enrichment */ },
      "performance_vs_avg_historical": 1.25,
      "performance_vs_median_historical": 1.15,
      "performance_vs_recent_14d": 0.98,
      "performance_vs_recent_30d": 1.05,
      "performance_vs_recent_90d": 1.12,
      "is_outlier": true,
      "outlier_threshold": 1.5,
      "last_enriched_at": "2024-11-14T10:00:00Z",
      "created_at": "2024-11-01T00:00:00Z",
      "updated_at": "2024-11-14T10:00:00Z"
    }
    // ... mais vídeos
  ],
  "metadata": {
    "sent_at": "2024-11-14T15:30:00Z",
    "source": "automedia-platform",
    "video_count": 10
  }
}
```

### Resposta Esperada do Webhook

```typescript
{
  "success": true,
  "inserted": 10,
  "updated": 0,
  "failed": 0,
  "message": "Videos processed successfully"
}
```

## Como Usar

### 1. Configurar Webhooks

Antes de enviar vídeos, você precisa configurar pelo menos um webhook:

1. Acesse **Configurações → Webhooks** (`/settings/webhooks`)
2. Clique em **"Novo Webhook"**
3. Preencha:
   - **Nome**: Nome descritivo (ex: "Produção Principal")
   - **URL**: URL completa da Edge Function que receberá os vídeos
   - **Descrição**: (Opcional) Descrição do propósito
   - **Ativo**: Toggle para ativar/desativar

4. Clique em **"Criar Webhook"**

### 2. Enviar Vídeos para Produção

1. Acesse a página **Videos** (`/videos`)
2. Selecione os vídeos desejados usando as checkboxes
3. Clique no botão **"Enviar para Produção"** (verde com ícone de upload)
4. Selecione o webhook de destino no dialog
5. Revise a URL do webhook e confirme
6. Clique em **"Enviar para Produção"**
7. Aguarde a confirmação de sucesso

### 3. Verificar Logs

Os logs de envio são armazenados na tabela `webhook_logs` e incluem:
- Data e hora do envio
- Webhook utilizado
- Quantidade de vídeos
- IDs dos vídeos enviados
- Status (success/failed/partial)
- Código de resposta HTTP
- Corpo da resposta (limitado a 5000 caracteres)
- Mensagem de erro (se houver)

Para consultar os logs via SQL:

```sql
SELECT
  wl.*,
  pw.name as webhook_name,
  pw.webhook_url
FROM webhook_logs wl
JOIN production_webhooks pw ON pw.id = wl.webhook_id
ORDER BY wl.sent_at DESC
LIMIT 50;
```

## Gerenciamento de Webhooks

### Editar Webhook

1. Acesse **Configurações → Webhooks**
2. Clique no menu (⋮) do webhook desejado
3. Selecione **"Editar"**
4. Atualize os campos necessários
5. Clique em **"Salvar Alterações"**

### Ativar/Desativar Webhook

1. Acesse **Configurações → Webhooks**
2. Clique no menu (⋮) do webhook
3. Selecione **"Ativar"** ou **"Desativar"**

**Nota**: Webhooks inativos não aparecem na lista de seleção ao enviar vídeos.

### Excluir Webhook

1. Acesse **Configurações → Webhooks**
2. Clique no menu (⋮) do webhook
3. Selecione **"Excluir"**
4. Confirme a exclusão

**⚠️ Atenção**: A exclusão é permanente. Os logs associados ao webhook serão excluídos automaticamente (CASCADE).

## Tratamento de Erros

### Webhook Não Responde

Se o webhook não responder ou retornar timeout:
- A operação é registrada como **failed** no log
- Uma mensagem de erro é exibida ao usuário
- Os vídeos não são marcados como enviados (possível reenvio)

### Webhook Retorna Erro (4xx/5xx)

- O código de status HTTP é registrado no log
- O corpo da resposta (se disponível) é armazenado
- A operação é marcada como **failed**
- Mensagem de erro detalhada é mostrada ao usuário

### Erro Parcial

Se apenas alguns vídeos falharem:
- O webhook deve retornar status **partial**
- Incluir na resposta quais vídeos falharam e por quê
- O sistema registrará como **partial** no log

## Segurança

### Validações

1. **URL do Webhook**: Deve começar com `http://` ou `https://`
2. **Nome Único**: Cada webhook deve ter um nome único
3. **Webhook Ativo**: Apenas webhooks ativos podem receber vídeos
4. **Dados Completos**: Todos os campos do vídeo são enviados

### Recomendações

1. **HTTPS**: Sempre use HTTPS para URLs de webhook em produção
2. **Autenticação**: Implemente autenticação na Edge Function receptora
3. **Rate Limiting**: Implemente rate limiting para evitar abuse
4. **Validação de Payload**: Valide o payload recebido no webhook
5. **Idempotência**: Trate envios duplicados graciosamente

## Limitações Conhecidas

1. **Tamanho do Payload**: Não há limite implementado no tamanho do payload. Para grandes volumes (>100 vídeos), considere fazer envios em lotes.
2. **Timeout**: Envios podem falhar se o webhook demorar muito para responder (timeout padrão do fetch).
3. **Retry**: Não há sistema automático de retry. Envios falhados devem ser refeitos manualmente.
4. **Webhooks Síncronos**: A operação é síncrona. O usuário aguarda a resposta do webhook.

## Melhorias Futuras

- [ ] Sistema de retry automático para falhas temporárias
- [ ] Envio em lotes (chunking) para grandes volumes
- [ ] Fila assíncrona para não bloquear o usuário
- [ ] Dashboard de logs e estatísticas de webhooks
- [ ] Webhooks com autenticação (API keys, OAuth)
- [ ] Notificações de falhas via email/Slack
- [ ] Teste de webhook antes de salvar
- [ ] Versionamento de payload (v1, v2, etc.)

## Troubleshooting

### Webhook não aparece na lista de seleção

**Possíveis causas**:
- Webhook está inativo → Ative em Configurações
- Nenhum webhook cadastrado → Crie um novo webhook

### Erro "Failed to send videos to production"

**Possíveis causas**:
- URL do webhook inválida ou inacessível
- Webhook retornou erro (verifique logs)
- Problemas de rede/firewall
- Timeout na resposta

**Solução**: Verifique a tabela `webhook_logs` para detalhes do erro.

### Vídeos não aparecem no banco de destino

**Possíveis causas**:
- Edge Function não está processando corretamente
- Problemas na inserção no banco de dados de destino
- Schema incompatível

**Solução**: Verifique os logs da Edge Function no banco de destino.

## Suporte

Para issues ou dúvidas:
1. Verifique os logs em `webhook_logs`
2. Revise a documentação da Edge Function receptora
3. Entre em contato com o administrador do sistema
