# Domora

Domora je spletna aplikacija za oglaševanje nepremičnin in usklajevanje ogledov. Iskalci pregledujejo oglase in zaprosijo za ogled, oglaševalci upravljajo oglase in termine, administrator pa pred objavo preveri oglase.

Implementiran je MVP z uporabniškimi zgodbami **US-01–US-20**.
Naloge in napredek so na [GitHub Project boardu Domora – MVP](https://github.com/users/AnjaTodorov/projects/6).
Preslikava sprejemnih kriterijev na implementacijo in teste je v
[preverjanju MVP](docs/08-preverjanje-mvp.md).
Obiskovalec izbere vlogo iskalca ali oglaševalca, izpolni kontaktne podatke in
ustvari račun Supabase Auth s povezanim profilom. Administratorska registracija
ni dovoljena. Implementirani sta tudi prijava in zaščiten dostop (US-02) ter
urejanje lastnega profila (US-03). Na začetni strani sta povezavi na prijavo in
registracijo; prijavljen uporabnik lahko odpre profil in se odjavi.
Oglaševalci lahko pripravljajo oglase s fotografijami in jih oddajo v pregled;
administrator jih odobri ali zavrne z razlogom (US-04–US-09). Javni katalog
prikazuje samo objavljene oglase s kombiniranimi filtri (US-10–US-11).
Oglaševalec določa termine, interesenti oddajo zahteve, lastnik pa potrdi enega
interesenta in zavrne ostale (US-12–US-18). Ob umiku, prodaji ali oddaji se
prihodnje čakajoče in potrjene zahteve prekličejo, naslov pa skrije (US-19–US-20).

### Uporabniški vmesnik

Začetna stran `/` predstavlja Domoro, javna ponudba s filtri pa je na
`/nepremicnine`. Prijavljeni uporabnik odpre osebni pregled na `/racun`;
navigacija se prilagodi vlogi iskalca, oglaševalca ali administratorja.
Vmesnik vključuje prilagodljive nadzorne plošče, urejevalnik oglasa s predogledom,
galerijo, mobilne filtre in potrditvena okna za pomembne odločitve.
Lastnik lahko pri objavljenem oglasu izbere **Uredi oglas → Začni urejanje**.
Oglas se začasno umakne iz javne ponudbe in vrne v osnutek; termini in zahteve
ostanejo shranjeni. Po spremembah ga mora ponovno oddati v pregled.
Šele administratorjeva odobritev ponovno objavi podatke in fotografije.
Fotografije posameznih oglasov vedno izvirajo iz njihovih dejanskih zapisov.
Uredniške fotografije in pisave se nalagajo lokalno; viri in licence so navedeni
v [frontend/public/assets/CREDITS.md](frontend/public/assets/CREDITS.md).

### Račun administratorja in fotografije

Najprej registriraj in potrdi poseben račun. Nato v korenu izrecno določi njegov naslov:

```powershell
npm run admin:promote -- --email vas-admin@example.com
```

Ukaz spremeni vlogo samo izbranega potrjenega računa. Ob naslednjem nalaganju
aplikacije se prikaže administratorski pregled. Običajni uporabnik svoje vloge
ne more spremeniti prek obrazca ali API.

Migracije pripravijo zasebni bucket `domora-properties` in pravila dostopa.
Fotografije: JPG/PNG/WebP, do 5 MB, največ 10 na oglas; pri oddaji niso obvezne.
Backend preveri vsebino datoteke in lastništvo. Fotografije neobjavljenega oglasa
vidita lastnik in administrator; objavljene so dostopne obiskovalcem prek
kratkotrajnih podpisanih povezav. Za ta tok ni potreben skrivni ključ Storage.

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

Če stara potrditvena povezava odpre `http://localhost:3000/`, jo API preusmeri
na frontend (`FRONTEND_URL`, privzeto `http://127.0.0.1:5173/`). Brskalnik prenese
fragment potrditvene povezave na frontend, ta pa ga po obdelavi odstrani iz URL.
Za nove povezave API vedno poda `SIGNUP_REDIRECT_URL` oziroma `FRONTEND_URL`.
Supabase mora ta naslov dovoljevati v **Authentication → URL Configuration →
Redirect URLs**, sicer uporabi svojo nastavljeno vrednost Site URL.

Potrditev naslova se izvede v Supabase pred preusmeritvijo v aplikacijo: tudi
napaka na napačnem povratnem naslovu ne pomeni, da naslov ni bil potrjen.
Ponovna registracija potrjenega računa ni potrebna. Brisanje vrstice `profiles`
ne odstrani računa iz **Authentication → Users** in ne sproži novega sporočila.
Za ponovni razvojni preizkus z istim naslovom mora biti odstranjen tudi račun
iz Auth; profilov in računov ne briši za običajno uporabo aplikacije.

## Preverjanje

```powershell
npm test
npm run build
npm run db:test
npm run db:status
npm run test:integration
npm run test:browser
```

Testi API in obrazca uporabljajo nadomestne odgovore Auth, zato ne pošiljajo
e-pošte. Integracijski SQL testi preverijo dejansko razvojno bazo, avtomatsko
ustvarjanje profila, zavrnitev vloge ADMIN, manjkajočih podatkov in podvojenih
uporabniških imen ter omejitve ogledov. Testni računi in podatki se razveljavijo
z `ROLLBACK`. Samo izvajanje migracij trajno spremeni shemo.

Podrobnosti baze so v [backend/README.md](backend/README.md).

`npm run test:integration` dodatno preveri dejanski Supabase Auth in Storage:
ustvari začasne račune SQL z enoličnimi identifikatorji, se prijavi z geslom,
preveri tok oglasa in zasebne fotografije ter po preizkusu odstrani svoje račune,
oglase in datoteke. Ta preizkus ne pošilja e-pošte in ne spreminja obstoječih računov.

`npm run test:browser` izvede tok prek dejanskega vmesnika z začasnimi računi
oglaševalca, administratorja in interesenta. Zažene lasten frontend na prostih
vratih in ne ustavlja obstoječega razvojnega strežnika. Na Windows uporablja
nameščeni Microsoft Edge; na drugih sistemih pred prvo uporabo izvedi
`npx playwright install chromium`. Posnetki so v prezrti mapi `test-results/`.

## Preizkus celotnega MVP

1. Registriraj in potrdi račune oglaševalca ter iskalca. Za administracijo uporabi
   ločen potrjen račun in zgornji ukaz `admin:promote`.
2. Oglaševalec v **Moji oglasi** ustvari osnutek, vnese podatke, doda fotografije
   in izbere **Oddaj v pregled**. Osnutki in čakajoči oglasi niso javni.
3. Administrator v **Pregled oglasov** oglas odobri ali zavrne z razlogom.
   Lastnik lahko zavrnjen oglas popravi in ponovno odda.
4. Po odobritvi je oglas v javnem katalogu. Lastnik na podrobnostih doda prihodnje,
   neprekrivajoče se termine. Vnos in prikaz uporabljata `Europe/Ljubljana`;
   neobstoječ čas ob pomladnem premiku ure je zavrnjen.
5. Iskalec izbere termin in odda zahtevo. V **Moji ogledi** spremlja njen status.
   Oglaševalec lahko pri tujih oglasih nastopa tudi kot interesent.
6. Lastnik v **Prejete zahteve** potrdi eno zahtevo. Druge čakajoče zahteve za isti
   termin se v isti transakciji zavrnejo. Za osvežitev interesent izbere
   **Osveži statuse**. Potrjeni interesent vidi tudi natančen naslov.
7. Lastnik lahko oglas umakne ali ga skladno z namenom označi kot prodanega/oddanega.
   Potrdi opozorilo o preklicu prihodnjih ogledov. Javni prikaz in novi ogledi se
   onemogočijo, prihodnje aktivne zahteve se prekličejo, pretekla zgodovina ostane.

Pregled preverjanja vseh zgodb je v [preverjanju MVP](docs/08-preverjanje-mvp.md).

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
