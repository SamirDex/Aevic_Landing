# Netlify deploy — Aevic Landing

## 1. Supabase (mütləq — production data)

1. [supabase.com](https://supabase.com) → layihə yaradın
2. **SQL Editor** → `supabase/setup.sql` məzmununu **tam** işə salın (`teams`, `tournament_state`, `aevic-media` bucket)
3. **Settings → API** — aşağıdakı dəyərləri götürün

## 2. Netlify environment variables

**Site configuration → Environment variables** (hamısı üçün **Production** scope):

| Dəyişən | Haradan | Qeyd |
|--------|---------|------|
| `VITE_SUPABASE_URL` | Project URL | Build üçün |
| `VITE_SUPABASE_ANON_KEY` | anon public key | Build üçün |
| `SUPABASE_URL` | Project URL | Server API (eyni URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role secret | **Yalnız Netlify** — commit etməyin |
| `VITE_ADMIN_ACCESS_KEY` | Özünüz | Admin şifrəsi |
| `SMTP_HOST` | smtp.gmail.com (və ya başqa SMTP) | Email server |
| `SMTP_PORT` | 587 (TLS) və ya 465 (SSL) | Email port |
| `SMTP_USER` | Gmail email ünvanı | Email hesabı |
| `SMTP_PASS` | Gmail App Password | **Yalnız Netlify** — normal şifrə deyil |
| `ADMIN_SERVER_KEY` | Özünüz | Server-side admin auth |

`SUPABASE_SERVICE_ROLE_KEY` olmadan API `/tmp` fayllarına yazır — deploy/cold start-dan sonra **komandalar itir**.

## 3. Deploy

Push → Netlify avtomatik build (`netlify.toml`).

## 4. Yoxlama

1. `https://SIZIN-SAYT.netlify.app/api/health` → `{"ok":true,"storage":"supabase"}`
2. `https://SIZIN-SAYT.netlify.app/api/teams` → komanda siyahısı (JSON array)
3. Qeydiyyat → Supabase **Table Editor → teams**-də yeni sətir
4. Admin panel → nəticə / şəkil yükləmə → **Storage → aevic-media** və **tournament_state**

## 5. `/api/teams/by-email` 404

Bu endpoint komanda **tapılmadıqda** 404 qaytarır (normal). Email Supabase-də yoxdursa belə olur.

Əgər bütün `/api/*` HTML qaytarırsa — `netlify.toml`-da API redirect var; **Clear cache and deploy** edin.

## 6. Admin

- URL: `https://SIZIN-SAYT.netlify.app/#organizer`
- Şifrə: `VITE_ADMIN_ACCESS_KEY`
