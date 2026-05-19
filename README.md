# AI Memorial Product Studio (POC)

This repo now contains Part 1 + Part 2 + Part 3 foundations, plus a stabilization pass:

- Next.js app ready for Vercel
- Supabase Postgres tables for orders, uploads, generated previews
- Supabase storage upload + generated image persistence
- Guarded memorial prompt builder for OpenAI image generation
- Server-side text overlay for accurate names/dates/messages
- Product mockup rendering for wooden plaque, glass plaque, and glass candle
- Customer-facing multi-step `/studio` workflow
- Customer preview approval before order submission
- Password-protected admin dashboard at `/admin`
- Admin order list/detail, status updates, internal notes
- Hardened backend input validation/sanitization
- Upload deletion endpoint for customer photo removal
- Automated validation tests

## Routes

- `/` home launcher
- `/studio` full customer workflow
- `/admin`
- `/admin/orders/:id`

## 1) Environment

Copy `.env.example` to `.env.local` and set values:

- `OPENAI_API_KEY`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STORAGE_BUCKET_NAME`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL`

## 2) Database Setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor.

## 3) Storage Setup

Create a bucket matching `STORAGE_BUCKET_NAME`.

Expected file paths:

- `uploads/{sessionId}/{filename}`
- `generated/{sessionId}/artwork-{timestamp}.png`
- `generated/{sessionId}/mockup-{timestamp}.png`
- `orders/{orderId}/approved-artwork.png`
- `orders/{orderId}/mockup.png`

## 4) API Routes

- `POST /api/upload` (multipart `file` + `sessionId`)
- `DELETE /api/upload` (remove uploaded file by `sessionId` + `filePath/fileUrl`)
- `POST /api/generate-preview`
- `POST /api/previews/approve` (customer approval step)
- `POST /api/orders` (requires approved preview)
- `POST /api/admin/login` (`password`)
- `DELETE /api/admin/login` (logout)
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id`

## 5) Deploy Checklist (Vercel + Supabase)

1. In Supabase SQL Editor, run `supabase/schema.sql`.
2. In Supabase Storage, create your bucket (example: `memorial-assets`).
3. For this POC, set the storage bucket to public (required by current public URL usage).
4. In Vercel project settings, add these environment variables for Production:
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STORAGE_BUCKET_NAME`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL` (set to your Vercel production URL, e.g. `https://your-app.vercel.app`)
5. Redeploy after variables are saved.
6. Smoke test production:
- Open `/studio`
- Select a product
- Upload at least one image
- Generate preview
- Approve preview
- Submit order
- Confirm record appears in `/admin`

## 6) Tests

Run:

- `npm test`

Current test coverage includes core validation rules in `tests/validation.test.ts`.

## Notes

- The OpenAI key is never exposed client-side.
- AI is used for visual background generation; critical text is rendered by the app.
- Product definitions are hardcoded for POC and can move to DB later.
