import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
config({ path: resolve(__dirname, "../../.env"), quiet: true });
const db = new PrismaClient();
async function main() {
  const index = process.argv.indexOf("--email");
  const email =
    index >= 0 ? process.argv[index + 1]?.trim().toLowerCase() : undefined;
  if (!email)
    throw new Error(
      "Uporaba: npm run admin:promote -- --email vas-naslov@example.com",
    );
  const rows = await db.$queryRaw<
    { id: string }[]
  >`SELECT id FROM auth.users WHERE lower(email)=${email} AND email_confirmed_at IS NOT NULL`;
  if (rows.length !== 1)
    throw new Error(
      "Potrjen račun ne obstaja. Najprej se registrirajte in potrdite e-pošto.",
    );
  await db.profile.update({
    where: { id: rows[0].id },
    data: { role: "ADMIN" },
  });
  console.log(
    "Vloga izbranega računa je posodobljena v ADMIN. Ponovno odprite aplikacijo.",
  );
}
main()
  .catch(() => {
    console.error(
      "Administrator ni bil nastavljen. Preverite e-poštni naslov potrjenega računa in povezavo do baze.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
