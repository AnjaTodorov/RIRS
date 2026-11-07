import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

// Keep the local credentials in the repository-root .env, outside source control.
config({ path: resolve(__dirname, "../.env"), quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
});
