# Google OAuth Setup Guide

Untuk mengaktifkan Google login, ikuti langkah-langkah berikut:

## 1. Setup Google OAuth Credentials

### a. Buat Google Cloud Project
1. Pergi ke [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Aktifkan Google+ API dan Google Identity API

### b. Configure OAuth Consent Screen
1. Di Google Cloud Console, pergi ke "APIs & Services" > "OAuth consent screen"
2. Pilih "External" user type
3. Isi informasi aplikasi:
   - App name: "Studio Foto App"
   - User support email: email Anda
   - Developer contact information: email Anda
4. Tambahkan scopes: `email`, `profile`, `openid`
5. Tambahkan test users jika masih dalam development

### c. Create OAuth 2.0 Credentials
1. Pergi ke "APIs & Services" > "Credentials"
2. Klik "Create Credentials" > "OAuth client ID"
3. Pilih "Web application"
4. Tambahkan Authorized JavaScript origins:
   - `http://localhost:3000` (untuk development)
   - `https://yourdomain.com` (untuk production)
5. Tambahkan Authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (untuk development)
   - `https://yourdomain.com/auth/callback` (untuk production)
6. Copy Client ID dan Client Secret

## 2. Configure Supabase

### a. Tambahkan Google Provider
1. Buka Supabase Dashboard
2. Pergi ke "Authentication" > "Providers"
3. Enable Google provider
4. Masukkan Client ID dan Client Secret dari Google Cloud Console
5. Set redirect URL: `https://yourproject.supabase.co/auth/v1/callback`

### b. Update Site URL
1. Di Authentication Settings, set Site URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
2. Tambahkan redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

## 3. Environment Variables

Tambahkan ke `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Testing

1. Jalankan aplikasi: `npm run dev`
2. Pergi ke `/login`
3. Klik "Lanjutkan dengan Google"
4. Login dengan akun Google
5. User akan dibuat otomatis dengan role 'customer'

## 5. User Profile Creation

Ketika user login dengan Google untuk pertama kali:
1. Profile otomatis dibuat di `user_profiles` table
2. Role default: 'customer'
3. Nama diambil dari Google profile
4. Email tersimpan di Supabase Auth

## 6. Troubleshooting

### Redirect URI Mismatch
- Pastikan redirect URI di Google Cloud Console sama dengan yang dikonfigurasi di Supabase
- Format: `https://yourproject.supabase.co/auth/v1/callback`

### CORS Issues
- Pastikan domain sudah ditambahkan di Authorized JavaScript origins
- Include protocol (http/https)

### Profile Creation Issues
- Check trigger `handle_new_user()` sudah aktif
- Pastikan RLS policies mengizinkan profile creation

## 7. Production Checklist

- [ ] Update Google OAuth credentials dengan domain production
- [ ] Update Supabase Site URL dengan domain production  
- [ ] Update redirect URIs untuk production
- [ ] Test OAuth flow di production environment
- [ ] Verify user profile creation works
- [ ] Check role-based redirections