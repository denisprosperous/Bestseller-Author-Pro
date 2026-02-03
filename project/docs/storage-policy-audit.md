# Supabase Storage Policy Audit

- Buckets: `audio-samples`
- Access: prefer signed URLs for user-specific assets
- Policies:
  - Only owner can upload/delete
  - Public read disabled; serve via signed URLs
  - Max object size limits per plan
- Verify:
  - Upload succeeds authenticated
  - Public URL blocked when policy disables read
  - Signed URL generation works and expires
