import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

export async function browserFlow({
  apiUrl,
  emails,
  password,
  prefix,
  png,
}: {
  apiUrl: string;
  emails: string[];
  password: string;
  prefix: string;
  png: Buffer;
}) {
  const probe = createServer();
  await new Promise<void>((r) => probe.listen(0, "127.0.0.1", r));
  const address = probe.address();
  if (!address || typeof address === "string") throw Error("No preview port");
  const port = address.port;
  await new Promise<void>((r) => probe.close(() => r()));
  const origin = `http://127.0.0.1:${port}`;
  const vite = spawn(
    process.execPath,
    [
      resolve(__dirname, "../../node_modules/vite/bin/vite.js"),
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    {
      cwd: resolve(__dirname, "../../frontend"),
      env: { ...process.env, API_TARGET: apiUrl },
      stdio: "ignore",
      windowsHide: true,
    },
  );
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try {
        if ((await fetch(origin)).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) throw Error("Frontend preview failed to start");
    browser = await chromium.launch({
      headless: true,
      ...(process.platform === "win32" ? { channel: "msedge" } : {}),
    });
    const context = await browser.newContext({
      viewport: { width: 1365, height: 1000 },
    });
    const ownerPage = await context.newPage();
    async function login(page: typeof ownerPage, index: number) {
      await page.goto(origin + "/prijava");
      await page
        .getByLabel("E-poštni naslov", { exact: true })
        .fill(emails[index]);
      await page.getByLabel("Geslo", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Prijava", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Odjava", exact: true }),
      ).toBeVisible({ timeout: 15000 });
    }
    await login(ownerPage, 0);
    await ownerPage
      .getByRole("link", { name: "Moji oglasi", exact: true })
      .click();
    await ownerPage
      .getByRole("button", { name: "+ Nov oglas", exact: true })
      .click();
    await expect(
      ownerPage.getByRole("heading", { name: "Urejanje oglasa" }),
    ).toBeVisible();
    const title = "Svetlo stanovanje " + prefix;
    for (const [label, value] of [
      ["Naslov", title],
      ["Opis", "Prostorno stanovanje z veliko naravne svetlobe."],
      ["Kraj", prefix],
      ["Javna lokacija", "Maribor, Tabor"],
      ["Natančen naslov", "Browser private address"],
      ["Vrsta nepremičnine", "Stanovanje"],
      ["Cena (€)", "180000"],
      ["Površina (m²)", "75"],
    ])
      await ownerPage.getByLabel(label, { exact: true }).fill(value);
    await ownerPage.getByLabel("Namen", { exact: true }).selectOption("SALE");
    await ownerPage
      .getByLabel("Dodaj fotografijo", { exact: true })
      .setInputFiles({
        name: "stanovanje.png",
        mimeType: "image/png",
        buffer: png,
      });
    await expect(
      ownerPage.getByRole("button", { name: "Odstrani fotografijo" }),
    ).toBeVisible({ timeout: 15000 });
    await ownerPage
      .getByRole("button", { name: "Oddaj v pregled", exact: true })
      .click();
    await expect(
      ownerPage.getByText("V pregledu", { exact: true }),
    ).toBeVisible({ timeout: 15000 });
    const listingUrl = ownerPage.url();
    const adminContext = await browser.newContext();
    const admin = await adminContext.newPage();
    await login(admin, 4);
    await admin
      .getByRole("link", { name: "Pregled oglasov", exact: true })
      .click();
    await admin.getByRole("link").filter({ hasText: title }).click();
    await admin
      .getByRole("button", { name: "Odobri objavo", exact: true })
      .click();
    await expect(admin.getByText("Objavljen", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    const publicContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const visitor = await publicContext.newPage();
    await visitor.goto(origin + "/?city=" + encodeURIComponent(prefix));
    await expect(visitor.getByRole("heading", { name: title })).toBeVisible({
      timeout: 15000,
    });
    await mkdir(resolve(__dirname, "../../test-results"), { recursive: true });
    const photoPreview=visitor.getByAltText("Fotografija nepremičnine").first();
    await expect(photoPreview).toBeVisible({timeout:15000});
    await expect.poll(()=>photoPreview.evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth>0)).toBeTruthy();
    await visitor.screenshot({
      path: resolve(__dirname, "../../test-results/mvp-catalogue-mobile.png"),
      fullPage: true,
    });
    await visitor.getByRole("link").filter({ hasText: title }).click();
    await expect(
      visitor.getByText("Browser private address", { exact: false }),
    ).toHaveCount(0);
    await ownerPage.goto(listingUrl);
    await ownerPage
      .getByLabel("Začetek (Europe/Ljubljana)", { exact: true })
      .fill("2099-01-15T10:00");
    await ownerPage
      .getByLabel("Konec (Europe/Ljubljana)", { exact: true })
      .fill("2099-01-15T11:00");
    await ownerPage
      .getByRole("button", { name: "Dodaj termin", exact: true })
      .click();
    await expect(
      ownerPage.getByText("Termin je dodan.", { exact: true }),
    ).toBeVisible({ timeout: 15000 });
    const seekerContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const seeker = await seekerContext.newPage();
    await login(seeker, 2);
    await seeker.goto(listingUrl);
    await seeker
      .getByRole("button", { name: "Zahtevaj ogled", exact: true })
      .click();
    await expect(
      seeker.getByText("Zahteva je oddana in čaka na odgovor oglaševalca.", {
        exact: true,
      }),
    ).toBeVisible({ timeout: 15000 });
    await seeker
      .getByRole("link", { name: "Moji ogledi", exact: true })
      .click();
    await expect(
      seeker.getByText("Browser private address", { exact: false }),
    ).toHaveCount(0);
    await ownerPage.reload();
    await ownerPage
      .getByRole("button", { name: "Potrdi ogled", exact: true })
      .click();
    await expect(ownerPage.getByText("Potrjeno", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await seeker.reload();
    await expect(
      seeker.getByText("Browser private address", { exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await seeker.screenshot({
      path: resolve(
        __dirname,
        "../../test-results/mvp-confirmed-viewing-mobile.png",
      ),
      fullPage: true,
    });
    await ownerPage
      .getByLabel("Potrjujem zaključek in preklic prihodnjih ogledov.", {
        exact: true,
      })
      .check();
    await ownerPage
      .getByRole("button", { name: "Zaključi oglas", exact: true })
      .click();
    await expect(ownerPage.getByText("Umaknjen", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(
      ownerPage.getByText("Preklicano", { exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await seeker.reload();
    await expect(
      seeker.getByText("Browser private address", { exact: true }),
    ).toHaveCount(0);
    await ownerPage
      .getByRole("button", { name: "Odjava", exact: true })
      .click();
    await expect(
      ownerPage.getByRole("link", { name: "Prijava", exact: true }),
    ).toBeVisible();
    await ownerPage.goto(origin + "/profil");
    await expect(
      ownerPage.getByRole("heading", { name: "Prijavite se v Domoro" }),
    ).toBeVisible();
    console.log(
      "Browser: login, draft form, photo upload, review, public catalogue, booking, confirmation, private address, closure and logout passed.",
    );
  } finally {
    await browser?.close();
    vite.kill();
  }
}
