-- Function to get recent book activity (recently added books OR books with recent progress updates)
CREATE OR REPLACE FUNCTION get_recent_book_activity(user_id_param UUID, limit_param INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  title TEXT,
  author TEXT,
  cover_image TEXT,
  total_pages INTEGER,
  updated_at TIMESTAMP,
  activity_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  (
    -- Get books with recent progress updates
    SELECT 
      b.id,
      b.title,
      b.author,
      b.cover_image,
      b.total_pages,
      rp.updated_at,
      'progress_update'::TEXT as activity_type
    FROM books b
    INNER JOIN reading_progress rp ON b.id = rp.book_id
    WHERE b.user_id = user_id_param
    ORDER BY rp.updated_at DESC
    LIMIT limit_param
  )
  UNION ALL
  (
    -- Get recently added books that don't have progress yet
    SELECT 
      b.id,
      b.title,
      b.author,
      b.cover_image,
      b.total_pages,
      b.updated_at,
      'book_added'::TEXT as activity_type
    FROM books b
    WHERE b.user_id = user_id_param
    AND b.id NOT IN (
      SELECT DISTINCT book_id 
      FROM reading_progress 
      WHERE book_id = b.id
    )
    ORDER BY b.updated_at DESC
    LIMIT limit_param
  )
  ORDER BY updated_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 