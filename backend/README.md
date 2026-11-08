# Domora – podatkovna baza

Začetna shema vsebuje pet tabel v shemi `public`: `profiles`, `properties`,
`property_photos`, `viewing_slots` in `viewing_requests`. Supabase že upravlja
`auth.users`; Prisma ne upravlja sheme te tabele. Registracijska migracija
nanjo doda sprožilec, ki ob registraciji ustvari profil v isti transakciji.
Prisma dodatno ustvari tehnično tabelo `_prisma_migrations` za zgodovino migracij;
tudi ta je zaščitena pred neposrednim dostopom iz brskalnika.

## Nastavitve in zagon

1. V korenu repozitorija pripravi `.env` po `.env.example`.
2. Povezavo vzemi iz **Supabase → Connect → Session pooler**, vrata `5432`.
   Geslo v URL mora biti odstotkovno kodirano. Za migracije ne uporabljaj
   transakcijskega poolerja na vratih `6543`. Če neposredna povezava deluje,
   lahko `DIRECT_URL` namesto tega kaže neposredno na bazo.
3. Odvisnosti namesti v korenu repozitorija z `npm ci`. Nato v mapi `backend` izvedi:

```powershell
npm run db:validate
npm run db:deploy
npm run db:generate
npm run db:status
```

Konfiguracija Prisma samodejno prebere korensko `.env`. Javni ključ Supabase
ni geslo za PostgreSQL. Za migracije zadostujeta `DATABASE_URL` in `DIRECT_URL`.
`SUPABASE_SECRET_KEY` bo potreben kasneje za strežniške operacije Auth/Storage;
ne sme biti del kode frontenda.

Prisma CLI in odjemalec sta pripeta na različico `6.19.3`, združljivo z
obstoječim Node.js. Za nadaljnji razvoj uporabljaj podprto različico Node.js LTS.
Odvisnost `deepmerge-ts` je prepisana na popravljeno različico 8 zaradi
varnostne napake v starejši tranzitivni odvisnosti konfiguracije Prisma.

## Pravila baze

- Profil mora pripadati obstoječemu računu Supabase Auth; uporabniško ime je enolično.
- Osnutek je lahko nepopoln. Po oddaji so obvezni vsi podatki iz zasnove.
- Vnesena cena in površina morata biti pozitivni; zavrnitev potrebuje razlog.
- Prodajni oglas se lahko zaključi kot `SOLD`, najemni kot `RENTED`.
- Termini istega oglasa se ne smejo prekrivati. Konec enega je lahko začetek drugega.
- Kombinacija termina in interesenta je enolična tudi po zavrnitvi zahteve.
- Delni enolični indeks dopušča največ eno `CONFIRMED` zahtevo na termin.
- RLS je vključen na vseh petih tabelah. Vlogi `anon` in `authenticated`
  nimata neposrednega dostopa. Poslovni podatki bodo dostopni prek backenda,
  ki bo preverjal vlogo in lastništvo ter oblikoval varen odgovor brez zasebnega naslova.

SQL migracija vsebuje dodatne omejitve in povezavo s `auth.users`, ki jih sama
shema Prisma ne opisuje v celoti. Za naslednje spremembe pripravi pregledano
migracijo; `prisma db push` in ponastavitev Supabase baze nista postopek nadgradnje.

Registracija je implementirana z `POST /api/auth/register`. API preveri podatke,
dovoljeni vlogi, zaseden e-poštni naslov in uporabniško ime ter pokliče Supabase
Auth z javnim ključem. Sprožilec ustvari profil in še na ravni baze zavrne
nedovoljeno vlogo, manjkajoče podatke in podvojeno uporabniško ime. Napaka pri
profilu razveljavi tudi ustvarjanje računa. Gesla upravlja izključno Supabase Auth.
Vloge se kasneje preverjajo iz `profiles`, nikoli iz uporabniško spremenljivih
metapodatkov Auth. Za prihodnjo inicializacijo administratorja bo treba najprej
ustvariti veljaven račun in mu s privilegirano strežniško operacijo spremeniti vlogo.

Preverjanje dovoljenj drugih API poti, statusni prehodi in prihodnji časi terminov
bodo implementirani v naslednjih zgodbah.
Potrditev zahteve z zavrnitvijo ostalih ter zaključek oglasa s preklicem
prihodnjih ogledov zahtevata transakciji v backendu; sama shema teh tokov ne izvaja.

## Preverjanje omejitev

```powershell
npm run db:test
```

Preizkus preveri tuje ključe, obvezna polja, enoličnost uporabniških imen,
pozitivne vrednosti, popolnost oglasa, razlog zavrnitve, dovoljeni zaključek,
fotografije, časovne razpone, prekrivanje in sosednje termine, podvojene zahteve,
eno potrditev ter preprečitev neposrednega branja zasebnega naslova.
Vsi testni zapisi, tudi računi Auth, se izvedejo v transakciji z `ROLLBACK`.
Preizkus zahteva razvojno povezavo z dovoljenjem za vstavljanje v `auth.users`.

## Registracijski API (US-01, Issues #3 in #4)

```http
POST /api/auth/register
Content-Type: application/json
```

Telo vsebuje `firstName`, `lastName`, `username`, `phoneNumber`, `email`,
`password` (8–128 znakov) in `role` (`SEEKER` ali `ADVERTISER`). Odgovor `201`
vsebuje samo `message` in `requiresEmailConfirmation`. Prijavnih žetonov in gesla
ne vrača. Registracija uporabnika še ne prijavi; prijava je del US-02.

Napake: `400` za neveljavne podatke, `409` za zaseden naslov ali uporabniško ime,
`429` za omejitev števila poskusov in `503` za nedosegljivo storitev. Napake
polj so v objektu `fields`. API omeji telo zahteve na 16 kB in registracijo na
10 poskusov na 15 minut na naslov IP samo pri `NODE_ENV=production`; pri lokalnem
razvoju je ta omejitev izključena. Neodvisne omejitve Supabase Auth in pošiljanja
e-pošte še vedno veljajo; aplikacija jih ne more izključiti. V produkciji bo za več strežniških instanc
potrebna skupna shramba omejitev.

`npm test` v korenu preveri storitev, HTTP pot in obrazec. SQL testi dodatno
preverijo registracijski sprožilec in razveljavitev neuspelih registracij.
