const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STORAGE_BUCKET_NAME",
  "ADMIN_PASSWORD"
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  openAiApiKey: process.env.OPENAI_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL as string,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  storageBucketName: process.env.STORAGE_BUCKET_NAME as string,
  adminPassword: process.env.ADMIN_PASSWORD as string,
  appUrl: process.env.NEXT_PUBLIC_APP_URL
};
