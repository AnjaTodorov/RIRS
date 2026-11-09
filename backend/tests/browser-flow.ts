import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, readFile } from "node:fs/promises";
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
    const browserErrors: string[] = [];
    context.on("page", (page) =>
      page.on("pageerror", (error) => browserErrors.push(error.message)),
    );
    ownerPage.on("pageerror", (error) => browserErrors.push(error.message));
    async function capture(page: typeof ownerPage, name: string) {
      const previous = page.viewportSize();
      await mkdir(resolve(__dirname, "../../test-results/redesign"), {
        recursive: true,
      });
      for (const width of [1440, 768, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(() => document.fonts.ready);
        await expect
          .poll(() => page.locator(".loading-state, .skeleton").count(), {
            timeout: 15000,
          })
          .toBe(0);
        await expect
          .poll(() => page.locator(".photo-loading").count(), {
            timeout: 15000,
          })
          .toBe(0);
        await page.evaluate(async () => {
          document.documentElement.style.scrollBehavior = "auto";
          window.scrollTo(0, 0);
          (document.activeElement as HTMLElement)?.blur();
          for (const img of document.images) img.loading = "eager";
          await Promise.all(
            Array.from(document.images).map((img) =>
              img.decode().catch(() => {}),
            ),
          );
        });
        await page.screenshot({
          path: resolve(
            __dirname,
            `../../test-results/redesign/${name}-${width}.png`,
          ),
          fullPage: true,
        });
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
          `${name}: horizontal overflow at ${width}px`,
        ).toBeLessThanOrEqual(width);
      }
      if (previous) await page.setViewportSize(previous);
    }
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
      await page.goto(origin + "/racun");
    }
    await login(ownerPage, 0);
    await expect(ownerPage.getByRole("heading", { level: 1 })).toBeVisible();
    await capture(ownerPage, "advertiser-dashboard");
    await ownerPage
      .getByRole("link", { name: "Moji oglasi", exact: true })
      .click();
    await capture(ownerPage, "my-listings");
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
        name: "stanovanje.webp",
        mimeType: "image/webp",
        buffer: await readFile(
          resolve(__dirname, "../../frontend/public/assets/interior.webp"),
        ),
      });
    await expect(
      ownerPage.getByRole("button", { name: "Odstrani fotografijo" }),
    ).toBeVisible({ timeout: 15000 });
    await capture(ownerPage, "listing-editor");
    await ownerPage
      .getByRole("button", { name: "Oddaj v pregled", exact: true })
      .click();
    await expect(
      ownerPage
        .locator(".detail-heading")
        .getByText("V pregledu", { exact: true }),
    ).toBeVisible({ timeout: 15000 });
    const listingUrl = ownerPage.url();
    const adminContext = await browser.newContext();
    const admin = await adminContext.newPage();
    await login(admin, 4);
    await capture(admin, "admin-dashboard");
    await admin
      .getByRole("link", { name: "Pregled oglasov", exact: true })
      .click();
    await expect(
      admin.getByRole("link").filter({ hasText: title }),
    ).toBeVisible();
    await capture(admin, "admin-queue");
    await admin.getByRole("link").filter({ hasText: title }).click();
    await capture(admin, "admin-review");
    await admin
      .getByRole("button", { name: "Odobri objavo", exact: true })
      .click();
    await admin
      .getByRole("button", { name: "Potrdi objavo", exact: true })
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
    const photoPreview = visitor
      .getByAltText("Fotografija nepremičnine")
      .first();
    await expect(photoPreview).toBeVisible({ timeout: 15000 });
    await expect
      .poll(() =>
        photoPreview.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBeTruthy();
    await visitor.screenshot({
      path: resolve(__dirname, "../../test-results/mvp-catalogue-mobile.png"),
      fullPage: true,
    });
    await visitor.getByRole("link").filter({ hasText: title }).click();
    await capture(visitor, "property-detail");
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
      .getByRole("main")
      .getByRole("link", { name: "Moji ogledi", exact: true })
      .click();
    await expect(
      seeker.getByText("Browser private address", { exact: false }),
    ).toHaveCount(0);
    await ownerPage.reload();
    await ownerPage
      .getByRole("button", { name: "Potrdi ogled", exact: true })
      .click();
    await ownerPage
      .getByRole("button", { name: "Potrdi zahtevo", exact: true })
      .click();
    await expect(ownerPage.getByText("Potrjeno", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await seeker.reload();
    await expect(
      seeker.getByText("Browser private address", { exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await capture(seeker, "seeker-viewings");
    await seeker.goto(origin + "/racun");
    await capture(seeker, "seeker-dashboard");
    await seeker.goto(origin + "/profil");
    await expect(
      seeker.getByRole("heading", { name: "Vaš profil" }),
    ).toBeVisible();
    await seeker.getByLabel("Ime", { exact: true }).fill("Nika");
    await seeker.getByRole("button", { name: "Shrani spremembe" }).click();
    await expect(seeker.getByText("Profil je posodobljen.")).toBeVisible({
      timeout: 15000,
    });
    await capture(seeker, "profile");
    await seeker.goto(origin + "/moji-ogledi");
    await seeker.screenshot({
      path: resolve(
        __dirname,
        "../../test-results/mvp-confirmed-viewing-mobile.png",
      ),
      fullPage: true,
    });
    // Published listings can be edited only after explicitly returning to draft.
    await ownerPage.goto(origin + "/moji-oglasi");
    const publishedRow = ownerPage.getByRole("row").filter({ hasText: title });
    await expect(
      publishedRow.getByRole("button", { name: "Uredi oglas", exact: true }),
    ).toBeVisible();
    await capture(ownerPage, "published-listing-actions");
    await publishedRow
      .getByRole("button", { name: "Uredi oglas", exact: true })
      .click();
    await ownerPage
      .getByRole("dialog")
      .getByRole("button", { name: "Prekliči", exact: true })
      .click();
    await visitor.goto(listingUrl);
    await expect(
      visitor.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await publishedRow
      .getByRole("button", { name: "Uredi oglas", exact: true })
      .click();
    await ownerPage
      .getByRole("button", { name: "Začni urejanje", exact: true })
      .click();
    await expect(
      ownerPage.getByRole("heading", { name: "Urejanje oglasa", exact: true }),
    ).toBeVisible();
    const publicApi = origin + "/api/properties/" + listingUrl.split("/").pop();
    expect((await visitor.request.get(publicApi)).status()).toBe(404);
    await visitor.reload();
    await expect(
      visitor.getByRole("heading", {
        name: "Tega oglasa ni mogoče odpreti.",
        exact: true,
      }),
    ).toBeVisible();
    await seeker.reload();
    await expect(seeker.getByText("Potrjeno", { exact: true })).toBeVisible();
    await expect(
      seeker.getByText("Browser private address", { exact: true }),
    ).toHaveCount(0);
    const editedTitle = "Prenovljeno stanovanje " + prefix;
    await ownerPage.getByLabel("Naslov", { exact: true }).fill(editedTitle);
    await ownerPage.getByLabel("Cena (€)", { exact: true }).fill("190000");
    await ownerPage
      .getByRole("button", { name: "Shrani osnutek", exact: true })
      .click();
    await expect(
      ownerPage.getByText("Osnutek je shranjen.", { exact: true }),
    ).toBeVisible();
    await ownerPage.reload();
    await expect(ownerPage.getByLabel("Naslov", { exact: true })).toHaveValue(
      editedTitle,
    );
    await ownerPage
      .getByRole("button", { name: "Oddaj v pregled", exact: true })
      .click();
    await expect(
      ownerPage
        .locator(".detail-heading")
        .getByText("V pregledu", { exact: true }),
    ).toBeVisible();
    expect((await visitor.request.get(publicApi)).status()).toBe(404);
    await seeker.reload();
    await expect(
      seeker.getByRole("heading", {
        name: "Oglas je začasno v urejanju",
        exact: true,
      }),
    ).toBeVisible();
    await expect(seeker.getByText(editedTitle, { exact: true })).toHaveCount(0);
    await admin.goto(origin + "/pregled");
    await admin.getByRole("link").filter({ hasText: editedTitle }).click();
    await admin
      .getByRole("button", { name: "Odobri objavo", exact: true })
      .click();
    await admin
      .getByRole("button", { name: "Potrdi objavo", exact: true })
      .click();
    await expect(
      admin.locator(".detail-heading").getByText("Objavljen", { exact: true }),
    ).toBeVisible();
    await visitor.goto(listingUrl);
    await expect(
      visitor.getByRole("heading", { name: editedTitle, exact: true }),
    ).toBeVisible();
    await expect(visitor.locator(".detail-price strong")).toContainText(
      "190.000",
    );
    await seeker.reload();
    await expect(
      seeker.getByText("Browser private address", { exact: true }),
    ).toBeVisible();
    await ownerPage.goto(listingUrl);
    await ownerPage
      .getByRole("button", { name: "Zaključi oglas", exact: true })
      .click();
    await ownerPage
      .getByLabel("Potrjujem zaključek in preklic prihodnjih ogledov.", {
        exact: true,
      })
      .check();
    await ownerPage
      .getByRole("button", { name: "Potrdi zaključek", exact: true })
      .click();
    await expect(
      ownerPage
        .locator(".detail-heading")
        .getByText("Umaknjen", { exact: true }),
    ).toBeVisible({
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
      "Browser: login, draft form, photo upload, review, public catalogue, booking, confirmation, private address, published edits with reapproval, closure and logout passed.",
    );
    expect(browserErrors).toEqual([]);
  } finally {
    await browser?.close();
    vite.kill();
  }
}
