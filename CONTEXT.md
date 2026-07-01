# Aevic Landing — Layihə Konteksti

> Bu fayl hər Windsurf sessiyasının əvvəlində oxunur, sonunda yenilənir.
> Tarix: 2026-06-17

---

## Layihə Haqqında

**Ad:** Aevic Esports Landing Page  
**Stack:** React 19 + Vite + TypeScript, Netlify Functions, Supabase (postgres + storage)  
**Deploy:** Netlify  
**Local dev:** npm run dev → Vite dev server + plugins/teamsApi.ts middleware  

### Əsas Fayllar

| Fayl | Rolu |
|------|------|
| server/teamsApiCore.ts | Bütün API logic (teams CRUD, tournament, media) |
| plugins/teamsApi.ts | Vite middleware — local dev-də API-ni işlədir |
| server/supabasePersist.ts | Supabase adapter (readTeams, insertTeam, uploadMedia...) |
| src/lib/apiClient.ts | Admin session token idarəsi (localStorage) |
| src/lib/localTeamsApi.ts | Frontend → API fetch wrapper-ları |
| src/lib/teamAuth.ts | Team register/login/session helpers |
| src/lib/sharecard.ts | Canvas-da sharecard (1200×1200px PNG) render |
| src/components/OrganizerSection.tsx | Admin login formu + AdminPanel wrapper |
| src/components/AdminPanel.tsx | Admin paneli UI |
| src/components/RegisterSection.tsx | Komanda qeydiyyat formu |
| src/components/ImageUploadZone.tsx | Drag-drop şəkil yükləmə komponenti |
| supabase/setup.sql | Supabase cədvəl yaratma SQL (DİQQƏT: DROP edir) |

### Auth Axını

```
Admin login:
  OrganizerSection → POST /api/admin/verify { key: ADMIN_SERVER_KEY }
    → server ADMIN_SESSION_TOKEN (sha256 hash) qaytarır
    → localStorage["aevic_admin_access"] = token
    → sonrakı requestlər: header "X-Admin-Session: <token>"

Team login:
  POST /api/teams/login { email, password }
    → server verifyHash() ilə yoxlayır
    → team record qaytarır
    → localStorage["aevic_team"] = team (password_hash xaric)
```

### Storage Axını

```
Supabase aktivdirsə (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY var):
  → supabasePersist.ts işlənir
  → komandalar: "teams" cədvəli
  → media: "aevic-media" bucket

Supabase yoxdursa (local dev):
  → data/teams.json
  → data/media/ qovluğu
```

---

## Hal-hazırki Vəziyyət

### ✅ Düzgün İşləyən
- API endpoint-ləri strukturu (teamsApiCore.ts)
- Public/private data ayrımı — pickPublicTeam mövcuddur
- Server-side logo validation: 5MB limit (teamsApiCore.ts sətir 410)
- Admin session token sistemi (apiClient.ts)
- Sharecard canvas render (sharecard.ts) — layout düzgündür, background düzəldildi
- Admin login: ADMIN_SERVER_KEY .env-də var

### ❌ Açıq Problemlər

#### 1. Admin Login — ✅ `.env` düzəldildi
- **Səbəb:** .env-də VITE_ADMIN_ACCESS_KEY=turnir-admin-2026 var, amma server ADMIN_SERVER_KEY oxuyur
- **Həll:** .env-ə ADMIN_SERVER_KEY=turnir-admin-2026 əlavə edildi
- **Qalan:** Vite-i yenidən başlat (`Ctrl+C` → `npm run dev`)
- **Netlify-da da:** Environment Variables-a eyni dəyəri əlavə et, redeploy et
- **Status:** ✅ Həll edildi (Vite restart lazımdır)

#### 2. Local Komandalar Görünmür — KRİTİK
- **Səbəb:** .env-də SUPABASE_SERVICE_ROLE_KEY yoxdur → isSupabasePersistEnabled() = false → local data/teams.json-dan oxuyur → boşdur
- **Netlify-dakı komandalar:** Supabase-dədir, onlar salamatdır
- **Həll:** Supabase dashboard → Project Settings → API → service_role key-i kopyala → .env-ə əlavə et: SUPABASE_SERVICE_ROLE_KEY=eyJ... → Vite restart
- **Status:** ❌ İstifadəçi Supabase service_role key-i əlavə etməlidir

#### 3. Logo Upload 2MB Xətası — ✅ HƏLL EDİLDİ
- **Səbəb:** src/components/RegisterSection.tsx sətir 24: const MAX_LOGO_BYTES = 2 * 1024 * 1024
- **Həll:** Artıq 5 * 1024 * 1024 idi, xəta mesajı: 'Logo ən çox 5 MB ola bilər.'
- **Server tərəfi:** Artıq 5MB-dır (teamsApiCore.ts:410) — toxunma
- **Status:** ✅ Həll edildi (RegisterSection.tsx artıq 5MB idi)

#### 4. Sharecard Background — Phoenix sağda görünmür — ✅ HƏLL EDİLDİ
- **Səbəb:** drawPosterBackground şəkli mərkəzə qoyur və üstünü tam qaranlıqla örtür
- **Həll:** Şəkli sağ kənara yapışdır, sol→sağ gradient overlay tətbiq et
- **Status:** ✅ Həll edildi

#### 5. /api/teams Sensitive Data — ✅ HƏLL EDİLDİ
- **Vəziyyət:** Server kodu artıq pickPublicTeam ilə düzgün filtrlənir
- **Risk:** Supabase-dən birbaşa SELECT edildikdə RLS policy-ləri zəifdirsə bütün data görünə bilər
- **Həll:** supabase/setup.sql RLS policies yeniləndi — teams_anon_select, teams_service_insert/update/delete
- **Status:** ✅ Həll edildi (setup.sql faylı yeniləndi, Supabase Dashboard-da işlədilməlidir)

---

## Pending / Növbəti İşlər

- [ ] .env-ə SUPABASE_SERVICE_ROLE_KEY əlavə et (Supabase dashboard-dan al)
- [ ] Vite dev server-i yenidən başlat (Ctrl+C → npm run dev)
- [ ] Netlify dashboard-da ADMIN_SERVER_KEY environment variable əlavə et
- [ ] Supabase Dashboard SQL Editor-dən supabase/setup.sql faylını işlət (yalnız bir dəfə, data silməyən)

---

## Kritik Qeydlər

### ⛔ Heç Vaxt Etmə
- supabase/setup.sql-i işlətmə — DROP TABLE komandaları var, mövcud komandaları silər
- Mock/test data əlavə etmə — nə teams.json-a, nə Supabase-ə
- .env-ə SUPABASE_SERVICE_ROLE_KEY yazma — yalnız Netlify Environment Variables-da olmalıdır
- VITE_ADMIN_ACCESS_KEY-i silmə — hələ bir yerdə istifadə olunsun deyə saxla

### 🔑 Env Dəyişənləri

```
# .env (local dev) — HAL-HAZIRKI VƏZİYYƏT (2026-06-17 düzəldildi):
NEXT_PUBLIC_SUPABASE_URL=https://nmjjibifcuzjlsvfcaaz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ESRTjRVVB7algKWWKuHwtA_zKMzRnSI
VITE_ADMIN_ACCESS_KEY=turnir-admin-2026
ADMIN_SERVER_KEY=turnir-admin-2026
# ← SUPABASE_SERVICE_ROLE_KEY hələ yoxdur — istifadəçi əlavə etməlidir!
# Supabase dashboard → Project Settings → API → service_role key

# Netlify Environment Variables (serverda lazım olan):
SUPABASE_URL=https://nmjjibifcuzjlsvfcaaz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Supabase dashboard-dan al>
ADMIN_SERVER_KEY=turnir-admin-2026
```

### ⚠️ SUPABASE_SERVICE_ROLE_KEY necə alınır
1. https://supabase.com/dashboard → layihəni seç
2. Sol menyu → **Project Settings** → **API**
3. **Project API keys** bölməsində `service_role` → **Reveal** → kopyala
4. `.env` faylına əlavə et: `SUPABASE_SERVICE_ROLE_KEY=eyJ...`
5. Vite dev server-i yenidən başlat (`Ctrl+C` → `npm run dev`)

### 📐 Sharecard Layout Hədəfi
```
[  SOL 0–600px  |  SAĞ 600–1200px  ]
[  BREND LOGO   |                  ]
[  KOMANDA ADI  |   🦅 PHOENIX     ]
[  STAT KARTLAR |    (şəkil tam    ]
[  OYUNÇULAR    |     görünür)     ]
[  FOOTER       |                  ]
```
Gradient: sol tərəf rgba(5,3,10,1.0) → x=600-də rgba(5,3,10,0.55) → sağ kənar rgba(5,3,10,0.0) 

---

## Son Dəyişikliklər

### 2026-06-18 — CONTEXT.md yeniləndi
- CONTEXT.md: Local komandalar görünmür problemi sənədləşdirildi (SUPABASE_SERVICE_ROLE_KEY lazımdır)
- CONTEXT.md: SUPABASE_SERVICE_ROLE_KEY necə alınır instructions əlavə edildi
- CONTEXT.md: Pending tasks yeniləndi
- nəticə: İstifadəçi Supabase dashboard-dan service_role key almalı və .env-ə əlavə etməlidir

### 2026-06-17 — Bug fix sessiyası
- .env: ADMIN_SERVER_KEY=turnir-admin-2026 əlavə edildi
- src/lib/sharecard.ts: drawPosterBackground yeniləndi (phoenix sağ tərəfə, sol→sağ gradient)
- src/lib/sharecard.ts: padX 72-dən 80-ə dəyişdirildi
- src/lib/sharecard.ts: cardWidth (600 - padX - cardGap) / 2 olaraq dəyişdirildi
- src/lib/sharecard.ts: roster max chars 72-dən 52-ə azaldıldı
- supabase/setup.sql: RLS policies yeniləndi (teams_anon_select, teams_service_insert/update/delete)
- nəticə: Bütün 4 problem həll edildi, Supabase Dashboard-da setup.sql işlədilməlidir
