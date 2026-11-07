# Domora

Domora je spletna aplikacija za oglaševanje nepremičnin in usklajevanje ogledov. Iskalci pregledujejo oglase in zaprosijo za ogled, oglaševalci upravljajo oglase in termine, administrator pa pred objavo preveri oglase.

Pripravljena sta podatkovna baza in prva funkcionalnost MVP: **US-01 – registracija**.
Obiskovalec izbere vlogo iskalca ali oglaševalca, izpolni kontaktne podatke in
ustvari račun Supabase Auth s povezanim profilom. Administratorska registracija
ni dovoljena. Preostale funkcionalnosti, vključno s prijavo US-02, sledijo.

## Lokalni zagon

1. Namesti Node.js 22 LTS in npm. Projekt vsebuje tudi lokalno razvojno odvisnost
   `node`, ki skriptam npm zagotovi Node 22 brez menjave sistemske namestitve.
2. V korenu pripravi `.env` po [.env.example](.env.example). Za registracijo potrebuješ
   `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL` in `SUPABASE_PUBLISHABLE_KEY`.
   Pravi ključi in gesla ostanejo samo v `.env`, ki je izključen iz Gita.
3. V terminalu v **korenu repozitorija** izvedi:

```powershell
npm ci
npm run db:deploy
npm run db:generate -w backend
npm run dev
```

Odpri **http://127.0.0.1:5173**. React teče na vratih `5173`, Express API na
`127.0.0.1:3000`. Vite posreduje zahteve `/api` backendu; frontend ne prejme
povezave do baze ali strežniških ključev. Za ustavitev uporabi `Ctrl+C`.
Povezava z razvojnim Supabase projektom zahteva internet.

Supabase **Authentication → URL Configuration → Site URL** nastavi na
`http://127.0.0.1:5173`, če želiš po potrditvi e-pošte pristati v lokalni aplikaciji.
Po potrebi dodaj isto povezavo med dovoljene Redirect URLs in nastavi
`SIGNUP_REDIRECT_URL` v `.env`. Potrjevanje e-pošte ostane nastavljeno v Supabase;
aplikacija prepozna, ali je po registraciji potrebno. V razvojnem projektu
privzeti pošiljatelj Supabase omejuje število e-poštnih sporočil; pri omejitvi
aplikacija prikaže napako in ne obljubi uspešne registracije.

Za preizkus izpolni obrazec s svojim e-poštnim naslovom, izberi vlogo in preveri
sporočilo po oddaji. V **Supabase → Authentication → Users** ter tabeli `profiles`
mora obstajati po en povezan zapis. Nato preveri še podvojen e-poštni naslov,
zasedeno uporabniško ime in manjkajoča polja.

Račune aplikacije ustvarjaj prek obrazca Domora, ne prek gumba **Add user** v
Supabase. Ta ne pošlje obveznih profilnih podatkov, zato sprožilec zavrne
ustvarjanje računa in Supabase prikaže splošno napako ustvarjanja uporabnika.
Za nastavitev povratne povezave uporabi **Authentication → URL Configuration**;
razdelek **OAuth Server** je namenjen uporabi Supabase kot ponudnika prijave za
druge aplikacije in ni potreben za registracijo z e-pošto in geslom.

## Preverjanje

```powershell
npm test
npm run build
npm run db:test
npm run db:status
```

Testi API in obrazca uporabljajo nadomestne odgovore Auth, zato ne pošiljajo
e-pošte. Integracijski SQL testi preverijo dejansko razvojno bazo, avtomatsko
ustvarjanje profila, zavrnitev vloge ADMIN, manjkajočih podatkov in podvojenih
uporabniških imen ter omejitve ogledov. Testni računi in podatki se razveljavijo
z `ROLLBACK`. Samo izvajanje migracij trajno spremeni shemo.

Podrobnosti baze so v [backend/README.md](backend/README.md).

## Predvidene tehnologije

| Področje | Tehnologije |
|---|---|
| Frontend | React, TypeScript, Vite, React Router, CSS |
| Backend | Node.js, Express, TypeScript, REST API, Multer |
| Podatki | PostgreSQL na Supabase, Prisma, SQL migracije |
| Prijava in fotografije | Supabase Auth, Supabase Storage, Supabase JavaScript SDK |
| Razvoj | npm, Docker Compose, Git, GitHub Flow |

## Dokumentacija

1. [Zasnova rešitve](docs/01-zasnova-resitve.md)
2. [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
3. [Podatkovni model](docs/03-podatkovni-model.md)
4. [Arhitektura in tehnološki sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
5. [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
6. [Žični modeli](docs/06-wireframes.md)
7. [Arhitekturne odločitve (ADR)](docs/adr/README.md)
8. [Razvojni proces in nastavitve GitHub](docs/07-razvojni-proces.md)

## Struktura repozitorija

```text
RIRS/
├── README.md
├── .gitignore
├── .env.example
├── package.json
├── package-lock.json
├── frontend/
├── backend/
└── docs/
    ├── 01-zasnova-resitve.md
    ├── 02-funkcionalnosti-in-obseg.md
    ├── 03-podatkovni-model.md
    ├── 04-arhitektura-in-tehnoloski-sklad.md
    ├── 05-uporabniske-zgodbe.md
    ├── 06-wireframes.md
    ├── 07-razvojni-proces.md
    ├── img/
    ├── wireframes/
    └── adr/
```

Repozitorij: [AnjaTodorov/RIRS](https://github.com/AnjaTodorov/RIRS).
Spremembe pripravljamo na razvojnih vejah in jih v `main` vključimo prek pull requesta. Podrobnosti so v [navodilih za razvoj](docs/07-razvojni-proces.md).
