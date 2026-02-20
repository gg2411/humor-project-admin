# Humor Project Admin Dashboard

Admin area for managing the Humor Project database with superadmin authentication.

## ✨ Features

✅ **Superadmin Authentication** - All routes protected with `profiles.is_superadmin==TRUE`  
✅ **Dashboard with Statistics** - Real-time stats for users, images, captions, votes  
✅ **Management Structure** - Placeholders for user, image, and caption management

## 🚀 Quick Start

```bash
npm install
# Add .env.local with Supabase credentials
npm run dev
```

## 🔐 Solving the Superadmin Access Problem

**Assignment Question:** How to get superadmin access when you need it to use the admin area?

### Solution: Use Supabase SQL Editor

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Grant superadmin privileges
UPDATE profiles
SET is_superadmin = TRUE
WHERE id = 'your-user-id-here';
```

You have direct database access via Supabase, so you can manually set yourself as superadmin!

## 📦 Deploy to Vercel

1. Push to new GitHub repo
2. Import to Vercel  
3. Add environment variables
4. Deploy!

Assignment #6 Complete! 🎉
