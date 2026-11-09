# Domora – preverjanje implementacije MVP

Implementacija sledi zgodbam US-01–US-20 iz `05-uporabniske-zgodbe.md`.
Preverjanje vloge, lastništva in statusnih prehodov velja tudi za neposredni API.

| Zgodbe | Implementirani tok | Preverjanje |
|---|---|---|
| US-01 | Registracija iskalca/oglaševalca in atomski profil | Validacija, prepoved ADMIN, podvojeni podatki, napake Auth; SQL sprožilec; ročna potrditev e-pošte |
| US-02 | Prijava, obnova seje, odjava in zaščiten API | Pravilno/napačno geslo; dejanski Auth in preverjanje tokena; brskalniška prijava/odjava |
| US-03 | Samo lastni kontaktni podatki | Lastništvo, prepoved vloge/ID, obvezna polja in podvojeno uporabniško ime |
| US-04 | Osnutek DRAFT z lastnikom iz seje; urejanje objavljenega oglasa z vrnitvijo v DRAFT | Nepopoln osnutek, shranjevanje, prepoved tujega urejanja in javnega prikaza; sočasen začetek urejanja, ponovna odobritev, ohranitev ogledov in zasebnost med urejanjem |
| US-05 | Nalaganje, predogled in odstranitev fotografij | Dejanski zasebni Storage, podpisan dostop, lastništvo in brskalniški predogled |
| US-06 | Popoln oglas v PENDING_REVIEW | Manjkajoča polja zavrnjena; čakajoči oglas ni javen |
| US-07 | Odobritev v PUBLISHED | Vloga ADMIN, začetni status, javni prikaz po odobritvi |
| US-08 | Zavrnitev z razlogom | Prazna obrazložitev zavrnjena; shranjen razlog in REJECTED |
| US-09 | Popravek in ponovna oddaja | Popravek ohrani REJECTED; oddaja gre neposredno v PENDING_REVIEW |
| US-10 | Javni seznam in podrobnosti | Brez exactAddress v javnih odgovorih; prazni rezultati |
| US-11 | Kombinirani filtri z AND | Kraj, vrsta, namen, cena, površina; napačni razponi; odstranitev enega filtra |
| US-12 | Prihodnji neprekrivajoči termini | Napačni/pretekli časi, prekrivanje, sosednji termini, tuj/neobjavljen oglas, časovni pas |
| US-13 | Razpoložljivost terminov | Prihodnji termini, zaseden termin onemogočen, neobjavljen oglas skrit |
| US-14 | Zahteva PENDING za tuj oglas | Neprijavljen uporabnik, lasten oglas, podvojena/zasedena zahteva; oglaševalec kot interesent |
| US-15 | Lastnikov pregled zahtev | Prepoved tujega seznama; osvežitev stanj po odločitvi |
| US-16 | Ena potrditev in zavrnitev ostalih | Dve sočasni potrditvi prek API; največ ena CONFIRMED; druge PENDING postanejo REJECTED |
| US-17 | Zavrnitev PENDING zahteve | Termin ostane prost; podvojena ponovna zahteva istega interesenta ni dovoljena |
| US-18 | Lastne zahteve in pogojni naslov | Drugi uporabnik ne prebere zahteve; naslov samo pri CONFIRMED + PUBLISHED; po zaključku je skrit |
| US-19 | Umik v INACTIVE | Prepoved tujemu lastniku; preklic samo prihodnjih PENDING/CONFIRMED; pretekli in REJECTED ostanejo |
| US-20 | Zaključek v SOLD/RENTED | Ujemanje namena in statusa; sočasna potrditev in zaključek; blokada novih ogledov in javnega prikaza |

## Ukazi

- `npm test`: izolirani testi storitev, HTTP poti in React vmesnika.
- `npm run build`: TypeScript in produkcijski gradnji.
- `npm run db:test`: SQL omejitve in RLS v transakciji z ROLLBACK.
- `npm run test:integration`: dejanski Supabase Auth, Storage, API in sočasni dostopi.
- `npm run test:browser`: uporabniški tok z ločenimi sejami vlog v brskalniku.

Integracijski testi uporabljajo začasne UUID in predpono `mvp-`, po izvedbi pa
odstranijo svoje zapise in datoteke. Ne spreminjajo obstoječih računov in ne
pošiljajo potrditvenih sporočil. Posnetki ne vsebujejo pravih uporabniških podatkov.

## Odločitve

- Potrjevanje e-pošte sledi nastavitvam Supabase.
- Fotografije so neobvezne; JPG/PNG/WebP, do 5 MB, največ deset na oglas.
- Časovni pas je `Europe/Ljubljana`, baza uporablja TIMESTAMPTZ. Poleg prihodnjega
  začetka in konca po začetku ni dodatne omejitve trajanja.
- Zgodovina ohrani javne podatke oglasa in status. Po zaključku ni natančnega
  naslova, tudi če je pretekla zahteva ostala potrjena.
- Pri ponovnem urejanju objavljenega oglasa termini in zahteve ostanejo
  shranjeni. Interesent do ponovne odobritve vidi le status urejanja, ne pa
  neodobrenih podatkov, fotografij ali natančnega naslova.
- Administrator ne ureja tujih oglasov in ne odloča o ogledih namesto lastnika.
- Poslovne tabele so zaščitene pred neposrednim PostgREST dostopom. Storage ima
  namenska pravila za lastnikove datoteke in fotografije javno objavljenih oglasov.
