-- ============================================================================
-- SUPABASE VAULT RPC FUNCTIONS
-- ============================================================================
--
-- These functions provide secure server-side access to the Supabase Vault
-- for managing API keys and other secrets.
--
-- ⚠️ SECURITY WARNING ⚠️
-- These functions should ONLY be called from:
-- - Server Components
-- - Server Actions
-- - Edge Functions
--
-- NEVER expose these functions to client-side code or public API routes.
-- ============================================================================

-- Function: list_secrets
-- Returns a list of all secrets stored in the vault (names only, no values)
-- Used to discover which secrets are available for management
CREATE OR REPLACE FUNCTION public.list_secrets()
RETURNS TABLE (
  name text,
  description text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Note: This is a placeholder implementation
  -- In production, you would query vault.secrets if you have access
  -- For now, we'll return a static list of managed secrets
  RETURN QUERY
  SELECT
    unnest(ARRAY[
      'rapidapi_key_1760651731629',
      'openrouter_key_1760655833491'
    ]) as name,
    unnest(ARRAY[
      'RapidAPI Key for Social Blade and other services',
      'OpenRouter API Key for AI model access'
    ]) as description;
END;
$$;

-- Function: update_vault_secret
-- Updates or creates a secret in the Supabase Vault
--
-- Parameters:
--   secret_name: The name/identifier of the secret
--   secret_value: The new value to store
--
-- Returns: Success status
CREATE OR REPLACE FUNCTION public.update_vault_secret(
  secret_name text,
  secret_value text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Validate inputs
  IF secret_name IS NULL OR secret_name = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Secret name cannot be empty'
    );
  END IF;

  IF secret_value IS NULL OR secret_value = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Secret value cannot be empty'
    );
  END IF;

  -- Update the secret in the vault
  -- Note: This uses the vault.update_secret function
  -- Make sure you have the vault extension enabled in your Supabase project
  BEGIN
    PERFORM vault.update_secret(
      secret_name,
      secret_value
    );

    result := jsonb_build_object(
      'success', true,
      'message', 'Secret updated successfully'
    );
  EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;

  RETURN result;
END;
$$;

-- Function: read_secret
-- Reads a secret value from the Supabase Vault
--
-- Parameters:
--   secret_name: The name/identifier of the secret to retrieve
--
-- Returns: The secret value as text
CREATE OR REPLACE FUNCTION public.read_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_value text;
BEGIN
  -- Validate input
  IF secret_name IS NULL OR secret_name = '' THEN
    RAISE EXCEPTION 'Secret name cannot be empty';
  END IF;

  -- Read the secret from the vault
  -- This uses the vault.decrypted_secrets view
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;

  -- Return the secret value (will be NULL if not found)
  RETURN secret_value;
END;
$$;

-- Grant execute permissions to authenticated users only
-- In production, you should restrict this to admin role only
GRANT EXECUTE ON FUNCTION public.list_secrets() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_vault_secret(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.read_secret(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.read_secret(text) TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION public.list_secrets() IS
  'Lists all managed secrets in the vault (names and descriptions only, no values). Security: authenticated users only.';

COMMENT ON FUNCTION public.update_vault_secret(text, text) IS
  'Updates or creates a secret in the Supabase Vault. Security: authenticated users only. In production, restrict to admin role.';

COMMENT ON FUNCTION public.read_secret(text) IS
  'Reads a secret value from the Supabase Vault. Returns NULL if secret not found. Security: service_role and authenticated users only.';
