-- ============================================================================
-- Postgres Functions for Video Folders
-- Created: 2025-11-13
-- Purpose: RPC functions to replace Drizzle recursive queries
-- ============================================================================

-- ============================================================================
-- Function: get_folder_descendants
-- Description: Get all descendant folder IDs recursively using CTE
-- Usage: SELECT * FROM get_folder_descendants(123)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_folder_descendants(p_folder_id INT)
RETURNS TABLE(id INT)
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
  WITH RECURSIVE descendants AS (
    -- Base case: direct children
    SELECT id
    FROM video_folders
    WHERE parent_folder_id = p_folder_id

    UNION ALL

    -- Recursive case: children of children
    SELECT vf.id
    FROM video_folders vf
    INNER JOIN descendants d ON vf.parent_folder_id = d.id
  )
  SELECT id FROM descendants;
$$;

-- ============================================================================
-- Function: get_folder_path
-- Description: Get breadcrumb path for a folder (from root to folder)
-- Returns: Array of JSON objects with {id, name}
-- Usage: SELECT * FROM get_folder_path(123)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_folder_path(p_folder_id INT)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE PLPGSQL
AS $$
DECLARE
  v_path JSON;
BEGIN
  WITH RECURSIVE folder_path AS (
    -- Base case: the target folder
    SELECT
      id,
      name,
      parent_folder_id,
      1 as depth
    FROM video_folders
    WHERE id = p_folder_id

    UNION ALL

    -- Recursive case: parent folders
    SELECT
      vf.id,
      vf.name,
      vf.parent_folder_id,
      fp.depth + 1
    FROM video_folders vf
    INNER JOIN folder_path fp ON vf.id = fp.parent_folder_id
  )
  SELECT json_agg(
    json_build_object('id', id, 'name', name)
    ORDER BY depth DESC
  )
  INTO v_path
  FROM folder_path;

  RETURN COALESCE(v_path, '[]'::json);
END;
$$;

-- ============================================================================
-- Function: check_folder_has_content
-- Description: Check if folder has subfolders or videos
-- Returns: JSON with {hasSubFolders: boolean, hasItems: boolean, count: number}
-- Usage: SELECT * FROM check_folder_has_content(123)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_folder_has_content(p_folder_id INT)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE PLPGSQL
AS $$
DECLARE
  v_has_subfolders BOOLEAN;
  v_has_items BOOLEAN;
  v_subfolder_count INT;
  v_item_count INT;
BEGIN
  -- Check for subfolders
  SELECT
    COUNT(*) > 0,
    COUNT(*)
  INTO v_has_subfolders, v_subfolder_count
  FROM video_folders
  WHERE parent_folder_id = p_folder_id;

  -- Check for video items
  SELECT
    COUNT(*) > 0,
    COUNT(*)
  INTO v_has_items, v_item_count
  FROM video_folder_items
  WHERE folder_id = p_folder_id;

  RETURN json_build_object(
    'hasSubFolders', v_has_subfolders,
    'hasItems', v_has_items,
    'subFolderCount', v_subfolder_count,
    'itemCount', v_item_count,
    'totalCount', v_subfolder_count + v_item_count
  );
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_folder_descendants(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_folder_path(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_folder_has_content(INT) TO authenticated;

-- Grant execute to anonymous (if needed for public access)
-- GRANT EXECUTE ON FUNCTION get_folder_descendants(INT) TO anon;
-- GRANT EXECUTE ON FUNCTION get_folder_path(INT) TO anon;
-- GRANT EXECUTE ON FUNCTION check_folder_has_content(INT) TO anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_folder_descendants(INT) IS
'Get all descendant folder IDs recursively. Used to prevent circular references.';

COMMENT ON FUNCTION get_folder_path(INT) IS
'Get breadcrumb path from root to specified folder as JSON array of {id, name}.';

COMMENT ON FUNCTION check_folder_has_content(INT) IS
'Check if folder has subfolders or videos. Returns JSON with counts and flags.';
