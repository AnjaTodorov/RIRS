import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { createApp } from "./app";

config({ path: resolve(__dirname, "../../.env"), quiet: true });
const publicKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!process.env.DATABASE_URL || !process.env.SUPABASE_URL || !publicKey) {
  console.error(
    "Missing DATABASE_URL, SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in root .env.",
  );
  process.exit(1);
}
const db = new PrismaClient();
const frontendUrl = process.env.FRONTEND_URL || "http://127.0.0.1:5173/";
const signupRedirectUrl = process.env.SIGNUP_REDIRECT_URL || frontendUrl;
const app = createApp(
  {
    async emailExists(email) {
      const rows = await db.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS(SELECT 1 FROM auth.users WHERE lower(email) = ${email}) AS exists`;
      return rows[0].exists;
    },
    async usernameExists(username) {
      return !!(await db.profile.findUnique({
        where: { username },
        select: { id: true },
      }));
    },
    async signUp(input) {
      // One stateless client per signup; never share a user's auth state across requests.
      const auth = createClient(process.env.SUPABASE_URL!, publicKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (url, options) =>
            fetch(url, { ...options, signal: AbortSignal.timeout(15000) }),
        },
      });
      const { data, error } = await auth.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: signupRedirectUrl,
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
            username: input.username,
            phone_number: input.phoneNumber,
            role: input.role,
          },
        },
      });
      return {
        userId: data.user?.id ?? null,
        requiresEmailConfirmation: !data.session,
        duplicate: !!data.user && data.user.identities?.length === 0,
        errorCode: error ? error.code || "auth_error" : undefined,
      };
    },
    async profileExists(id) {
      return !!(await db.profile.findUnique({
        where: { id },
        select: { id: true },
      }));
    },
  },
  { frontendUrl },
);
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, "127.0.0.1", () =>
  console.log(`Domora API: http://127.0.0.1:${port}`),
);
async function shutdown() {
  server.close(async () => {
    await db.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
