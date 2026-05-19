# AI Memorial Product Studio (Backend/Admin POC)

This repo now contains the architecture foundation from spec Part 1:

- Next.js app ready for Vercel
- Supabase Postgres tables for orders, uploads, generated previews
- Supabase storage upload + generated image persistence
- Server-side image generation route using OpenAI
- Order submission validation and persistence
- Password-protected admin dashboard at `/admin`
- Admin order list/detail, status updates, internal notes

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
- `POST /api/generate-preview` (`sessionId`, `productId`, `prompt`)
- `POST /api/orders` (order payload)
- `POST /api/admin/login` (`password`)
- `DELETE /api/admin/login` (logout)
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id`

## Notes

- The OpenAI key is never exposed client-side.
- Product definitions can remain hardcoded for POC and move to DB later.
- This commit focuses on backend architecture/admin requirements from the first PDF.
