# Domora – zasnova rešitve

## Osnovni podatki

- **Ime rešitve:** Domora
- **Vrsta rešitve:** spletna platforma za oglaševanje nepremičnin in usklajevanje ogledov.
- **Avtorica:** Anastasija Todorov

## Namen in problem

Domora povezuje ljudi, ki iščejo nepremičnino za nakup ali najem, z oglaševalci, ki nepremičnine prodajajo ali oddajajo. Iskalci pogosto pregledujejo veliko oglasov, nato pa se za ogled dogovarjajo po telefonu ali elektronski pošti. Oglaševalci morajo ročno usklajevati termine in spremljati posamezna povpraševanja.

Rešitev omogoča iskanje nepremičnin po konkretnih merilih ter oddajo in obravnavo zahtev za ogled na enem mestu. Skrbniški pregled pred objavo zmanjšuje število nepopolnih ali očitno neprimernih oglasov; ne pomeni preverjanja lastništva ali pravne ustreznosti nepremičnine.

## Ciljni uporabniki

- **Iskalci nepremičnin:** posamezniki, pari, družine in študenti, ki iščejo stanovanje, hišo ali drugo nepremičnino za najem ali nakup.
- **Oglaševalci:** lastniki in posamezni nepremičninski posredniki, ki želijo objaviti oglas in usklajevati oglede. Skupni agencijski računi niso del prve različice.
- **Administratorji:** skrbniki platforme, ki pregledujejo oglase in skrbijo za ustrezno uporabo sistema.

## Kratek opis delovanja

Obiskovalec lahko brez prijave pregleduje objavljene oglase in jih filtrira po kraju, ceni, površini, vrsti nepremičnine ter namenu oglasa (prodaja ali oddaja). Pri posameznem oglasu vidi opis, fotografije, lastnosti, javno lokacijo, izbrane oznake in razpoložljive termine ogledov. Oglaševalec sam določi natančnost javne lokacije; natančen naslov se shrani ločeno in je interesentu viden šele ob potrjenem ogledu. Lastnik ga vidi pri upravljanju oglasa, administrator pa pri pregledu.

Prijavljen iskalec izbere termin in odda zahtevo za ogled. Oglaševalec zahtevo potrdi ali zavrne. Iskalec v svojem računu spremlja odločitev, oglaševalec pa seznam zahtev za svoje nepremičnine. Sistem prepreči, da bi bila za isti termin potrjena dva ogleda.

Ob potrditvi lahko oglaševalec doda navodila za zbirno mesto. Potrjeni interesent vidi natančen naslov in navodila neodvisno od sprejetja pogovora. Uporabniški profil vsebuje ime, uporabniško ime, telefonsko številko in neobvezno starost, da se udeleženca pri dogovarjanju lahko predstavita in po potrditvi ogleda stopita v stik.

Oglaševalec ima tudi pravice iskalca: lahko išče nepremičnine, zahteva ogled in po MVP pošlje zahtevo za pogovor pri tujem oglasu. Uporabnik zato ne potrebuje dveh vlog. Iskalec ne more objavljati oglasov.

Uporabnik brez dokončanega profila lahko pregleduje javne oglase, pred objavo, zahtevo za ogled ali pogovorom pa mora profil dokončati. Iskalec lahko pozneje izbere »Postani oglaševalec«; po preverjanju potrebnih podatkov se vloga istega profila spremeni v `ADVERTISER`, njegove obstoječe zahteve in pogovori pa ostanejo ohranjeni.

Oglaševalec pripravi oglas in ga odda v pregled. Administrator preveri popolnost in primernost vsebine ter oglas objavi ali zavrne z obrazložitvijo. Zavrnjen oglas lahko oglaševalec popravi in ponovno odda.

Oglaševalec lahko v MVP objavljeno nepremičnino označi kot prodano, oddano ali neaktivno, oglas pa lahko tudi logično izbriše. Oglas se umakne iz aktivnega iskanja, prihodnje čakajoče in potrjene zahteve za ogled pa se prekličejo. Lastnik lahko vidi svoje neaktivne oglase; izbrisani izginejo tudi iz njegovega običajnega seznama. Drugi uporabniki v zgodovini vidijo samo oznako »Oglas ni več aktiven« oziroma »Oglas je izbrisan«, brez dostopa do podrobnosti nepremičnine.

Po MVP bo iskalec ali oglaševalec pri tujem objavljenem oglasu poslal zahtevo za zaseben pogovor. Lastnik oglasa jo sprejme ali zavrne; sporočanje je omogočeno šele po sprejetju. Poslanih sporočil ni mogoče urejati ali brisati. Ob zaključku, deaktivaciji ali logičnem izbrisu oglasa njegovi pogovori postanejo neaktivni: zgodovina sporočil ostane berljiva udeležencema, novih sporočil pa ni mogoče poslati.

## Primer uporabe

Študentka išče stanovanje za najem v Mariboru s ceno do 600 EUR na mesec. Nastavi filtre, odpre ustrezen oglas in izbere ponujeni termin. Lastnik potrdi njeno zahtevo, študentka pa v svojem računu vidi potrjen datum in uro ogleda. Termin nato ni več na voljo za nove zahteve.

## Osrednji delovni proces

Priprava oglasa → oddaja v pregled → odobritev in objava → objava terminov → zahteva za ogled → potrditev ali zavrnitev.

Življenjski cikel oglasa se zaključi, ko ga oglaševalec označi kot prodanega ali oddanega.

Sistem podpira pripravo na ogled. Nakup, sklenitev najemne pogodbe in plačila potekajo zunaj platforme.
