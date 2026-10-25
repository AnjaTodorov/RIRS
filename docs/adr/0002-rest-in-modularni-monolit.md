# 0002 – REST API in modularni monolit

- Status: sprejeto
- Datum: 2026-10-25
- Nadomešča: —
- Nadomeščeno z: —

## Kontekst in problem

Objava oglasa zahteva administratorsko odobritev, potrditev ogleda pa mora v eni transakciji zasedeti termin in zavrniti ostale čakajoče zahteve. Poslovna pravila in preverjanje lastništva morajo veljati tudi pri neposrednem klicu API. Za študentski MVP želimo preprost zagon z jasno ločenimi odgovornostmi.

## Obravnavane alternative

- Modularni monolit z REST API: en strežnik in skupne transakcije, moduli pa ločujejo odgovornosti.
- Mikrostoritve: neodvisno nameščanje in skaliranje, vendar zahtevnejši razvoj, komunikacija in usklajevanje transakcij.
- Neposreden dostop frontenda do Supabase za poslovne podatke: manj strežniške kode, vendar več poslovnih pravil v podatkovnih politikah in funkcijah.

## Sprejeta odločitev in utemeljitev

Izberemo modularni monolit v Node.js, Express in TypeScript z moduli za uporabnike, oglase, pregled in oglede. Frontend poslovne operacije izvaja prek REST API z JSON; fotografije pošilja kot `multipart/form-data`. Backend združi preverjanje identitete, dovoljenj in poslovnih pravil ter lahko izvede celotno potrditev ogleda v eni transakciji. Neposredna prijava v Supabase Auth ostaja izjema, opisana v ADR 0005. REST zadošča znanim operacijam MVP brez dodatne infrastrukture za poizvedovalni jezik.

### Posledice

- Pozitivno: celoten backend lahko zaženemo in namestimo kot eno aplikacijo, brez usklajevanja več ločenih storitev.
- Pozitivno: dovoljenja in poslovne operacije se preverjajo na enem strežniškem mestu.
- Negativno: module nameščamo in skaliramo skupaj; napaka procesa lahko vpliva na celoten API.
- Negativno: meje modulov moramo dosledno ohranjati, sicer se poveča medsebojna odvisnost kode.
