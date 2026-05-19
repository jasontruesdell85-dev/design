# AI Memorial Product Studio (Backend/Admin POC)

This repo now contains the Part 1 + Part 2 foundations:

- Next.js app ready for Vercel
- Supabase Postgres tables for orders, uploads, generated previews
- Supabase storage upload + generated image persistence
- Guarded memorial prompt builder for OpenAI image generation
- Server-side text overlay for accurate names/dates/messages
- Product mockup rendering for wooden plaque, glass plaque, and glass candle
- Order submission validation and persistence
- Password-protected admin dashboard at `/admin`
- Admin order list/detail, status updates, internal notes
- Admin preview approval flow that copies approved artwork to order storage paths

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
- `POST /api/generate-preview`
- `POST /api/orders` (order payload)
- `POST /api/admin/login` (`password`)
- `DELETE /api/admin/login` (logout)
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id`

### `POST /api/generate-preview` request body

- `sessionId` (required)
- `productId` (required: `wooden_plaque`, `glass_plaque`, `glass_candle`)
- `productName`
- `material`
- `orientation` (`portrait` or `landscape`)
- `deceasedName`
- `memorialDates`
- `quoteOrMessage`
- `themeStyle`
- `colors`
- `religiousOrSpiritualElements`
- `hobbiesInterestsPlaces`
- `generalInstructions`

### `POST /api/generate-preview` response

- `previewId`
- `prompt` (stored in DB for audit/debug)
- `artworkUrl` (flat artwork PNG with accurate app-rendered text)
- `mockupUrl` (product preview PNG)

## 5) Admin Preview Approval

In `/admin/orders/:id`, each generated preview can be approved.

Approval action:

- marks one preview as approved (`is_approved = true`)
- copies artwork to `orders/{orderId}/approved-artwork.png`
- copies mockup to `orders/{orderId}/mockup.png`
- updates `orders.approved_artwork_url` and `orders.approved_mockup_url`

## Notes

- The OpenAI key is never exposed client-side.
- AI is used for visual background generation; critical text is rendered by the app.
- Product definitions are hardcoded for POC and can be moved to database later.
