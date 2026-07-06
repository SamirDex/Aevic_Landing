# AEVIC Esports Landing

## Development

**Important:** Admin panel funksionallığı test etmək üçün Netlify Dev istifadə edin:

```bash
npm install -g netlify-cli
netlify dev
```

Sadəcə `npm run dev` (Vite) ilə admin panel işləməyəcək, çünki admin API endpoint-ləri Netlify Functions-dədir.

### Local Development (Vite only - no admin panel)

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Database Migrations

Supabase SQL Editor-da aşağıdaki migration fayllarını işə salın:

1. `supabase/add_rejection_reason.sql` - rejection_reason sütunu üçün
2. `supabase/add_player_photos.sql` - oyunçu şəkilləri sütunları üçün
