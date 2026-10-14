# Domora – zasnova rešitve

**01 Ideja in uporabniki** · [02 Vloge in funkcionalnosti](02-funkcionalnosti-in-obseg.md) · [03 Podatki in povezave](03-podatkovni-model.md) · [04 Arhitektura in tehnologije](04-arhitektura-in-tehnoloski-sklad.md)

---

## Osnovni podatki

| Podatek | Vrednost |
|---|---|
| **Ime** | Domora |
| **Vrsta rešitve** | Spletna platforma za oglaševanje nepremičnin in usklajevanje ogledov. |
| **Avtorica** | Anastasija Todorov |

---

## Namen in problem

### Problem uporabnikov

Domora povezuje ljudi, ki iščejo nepremičnino za nakup ali najem, z oglaševalci, ki nepremičnine prodajajo ali oddajajo. Iskalci pogosto pregledujejo veliko oglasov, nato pa se za ogled dogovarjajo po telefonu ali elektronski pošti. Oglaševalci morajo ročno usklajevati termine in spremljati posamezna povpraševanja.

### Predlagana rešitev

Rešitev omogoča iskanje nepremičnin po konkretnih merilih ter oddajo in obravnavo zahtev za ogled na enem mestu. Skrbniški pregled pred objavo zmanjšuje število nepopolnih ali očitno neprimernih oglasov; ne pomeni preverjanja lastništva ali pravne ustreznosti nepremičnine.

---

## Ciljni uporabniki

- **Iskalci nepremičnin:** posamezniki, pari, družine in študenti, ki iščejo stanovanje, hišo ali drugo nepremičnino za najem ali nakup.
- **Oglaševalci:** lastniki in posamezni nepremičninski posredniki, ki želijo objaviti oglas in usklajevati oglede. Skupni agencijski računi niso del prve različice.
- **Administratorji:** skrbniki platforme, ki pregledujejo oglase in skrbijo za ustrezno uporabo sistema.

---

## Kratek opis delovanja

- **Iskanje nepremičnin:** Obiskovalec brez prijave pregleduje objavljene oglase in jih filtrira po kraju, ceni, površini, vrsti ter namenu oglasa. V podrobnostih vidi fotografije, lastnosti, javno lokacijo, oznake in termine ogledov.

- **Zahteva za ogled:** Prijavljen interesent izbere termin in odda zahtevo. Oglaševalec jo potrdi ali zavrne; sistem prepreči dvojno rezervacijo, interesent pa odločitev spremlja v svojem računu.

- **Lokacija in stik:** Natančen naslov je shranjen ločeno od javne lokacije. Lastnik ga vidi pri upravljanju, administrator pri pregledu, interesent pa ob potrjenem ogledu skupaj z morebitnimi navodili za zbirno mesto. Sprejet pogovor ni pogoj za ogled.

- **Profil in pravice:** Profil vsebuje osebne in kontaktne podatke ter morebitno starost. Pred objavo, zahtevo za ogled ali pogovorom ga mora uporabnik dokončati. Iskalec ne objavlja oglasov; oglaševalec ima tudi pravice iskalca pri tujih oglasih.

- **Prehod v oglaševalca:** Iskalec lahko izbere »Postani oglaševalec«. Po preverjanju potrebnih podatkov dobi vlogo `ADVERTISER` na istem profilu, obstoječe zahteve in pogovori pa ostanejo ohranjeni.

- **Objava oglasa:** Oglaševalec pripravi oglas in ga odda v pregled. Administrator preveri popolnost in primernost ter objavo odobri ali zavrne z razlogom. Zavrnjen oglas je mogoče popraviti in ponovno oddati.

- **Umik ali izbris oglasa:** Lastnik oglas deaktivira, označi kot prodan ali oddan oziroma ga logično izbriše. Oglas izgine iz javnega prikaza, prihodnji ogledi se prekličejo, drugi uporabniki pa v zgodovini vidijo le oznako nedostopnega oglasa. Lastnik še vidi svoje neaktivne oglase; izbrisani izginejo tudi iz njegovega običajnega seznama.

- **Zasebni pogovori · po MVP:** Pri tujem objavljenem oglasu interesent pošlje zahtevo za pogovor. Sporočanje se omogoči po sprejetju; poslanih sporočil ni mogoče spreminjati ali brisati. Ob umiku ali izbrisu oglasa se pogovori zaprejo, zgodovina sporočil pa ostane berljiva udeležencema.

---

## Primer uporabe

> **Primer: najem stanovanja v Mariboru**
>
> Študentka išče stanovanje za najem v Mariboru s ceno do 600 EUR na mesec. Nastavi filtre, odpre ustrezen oglas in izbere ponujeni termin. Lastnik potrdi njeno zahtevo, študentka pa v svojem računu vidi potrjen datum in uro ogleda. Termin nato ni več na voljo za nove zahteve.

---

## Osrednji delovni proces

**Priprava oglasa** → oddaja v pregled → **odobritev in objava** → objava terminov → **zahteva za ogled** → potrditev ali zavrnitev.

Življenjski cikel oglasa se zaključi, ko ga oglaševalec označi kot prodanega ali oddanega.

> **Meja rešitve:** Sistem podpira pripravo na ogled. Nakup, sklenitev najemne pogodbe in plačila potekajo zunaj platforme.
