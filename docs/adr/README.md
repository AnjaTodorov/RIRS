# Arhitekturne odločitve

Zapisi pojasnjujejo odločitve iz [arhitekturne zasnove](../04-arhitektura-in-tehnoloski-sklad.md). Status »sprejeto« pomeni sprejeto zasnovo; ne pomeni, da je rešitev že implementirana. Datum označuje zapis odločitve v ADR.

| ADR | Odločitev |
|---|---|
| [0001](0001-react-in-typescript.md) | React in TypeScript za spletni vmesnik |
| [0002](0002-rest-in-modularni-monolit.md) | REST API in modularni monolit |
| [0003](0003-postgresql-na-supabase.md) | Relacijska baza PostgreSQL na Supabase |
| [0004](0004-prisma-in-sql-migracije.md) | Prisma ter SQL migracije in omejitve |
| [0005](0005-supabase-auth.md) | Supabase Auth in strežniško preverjanje dovoljenj |
| [0006](0006-supabase-storage.md) | Zasebna shramba fotografij Supabase Storage |
| [0007](0007-docker-compose.md) | Docker Compose za lokalni razvoj |

## Dodajanje in spreminjanje odločitev

1. Kopiraj [predlogo](adr-template.md) v datoteko z naslednjo štirimestno številko in opisnim imenom.
2. Opiši dejanski problem, vsaj dve alternativi, razloge izbire ter pozitivne in negativne posledice.
3. Predlagano odločitev vključi v pull request skupaj s povezavami na povezano dokumentacijo. Ob sprejetju spremeni status v »sprejeto«.
4. Če se sprejeta odločitev spremeni, ustvari nov ADR s poljem »Nadomešča«, v starem pa status spremeni v »nadomeščeno« in dopolni »Nadomeščeno z«. Stare utemeljitve ohrani.
5. Posodobi ta kazalnik in prizadete dele zasnove.

Predloga je slovenska prilagoditev [minimalne predloge MADR 4.0.0](https://github.com/adr/madr/blob/4.0.0/template/adr-template-minimal.md). Dodatna navodila: [uporaba MADR](https://adr.github.io/madr/) in [uporaba ADR](https://adr.github.io/).
