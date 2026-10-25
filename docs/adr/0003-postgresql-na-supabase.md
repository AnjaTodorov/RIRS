# 0003 – PostgreSQL na Supabase za povezane podatke

- Status: sprejeto
- Datum: 2026-10-25
- Nadomešča: —
- Nadomeščeno z: —

## Kontekst in problem

Profili, oglasi, fotografije, termini in zahteve imajo jasne relacije. Pri sočasnih potrditvah mora baza zagotoviti največ eno potrjeno zahtevo na termin. Potrebujemo transakcije in omejitve, pri omejenem obsegu projekta pa želimo zmanjšati skrb za podatkovni strežnik.

## Obravnavane alternative

- PostgreSQL na Supabase: relacijske omejitve in upravljano gostovanje ob integraciji z Auth in Storage.
- Samostojno gostovan PostgreSQL: enake podatkovne zmogljivosti in več nadzora, vendar lastno upravljanje namestitve in vzdrževanja.
- Dokumentna baza: prilagodljivi dokumenti, vendar manj naravno modeliranje povezav in dodatno delo za opisane relacijske omejitve.

## Sprejeta odločitev in utemeljitev

Izberemo PostgreSQL na Supabase. Tuji ključi ohranijo povezave med entitetami, transakcije ter delni enolični indeks za potrjene zahteve pa varujejo pravilo enega potrjenega ogleda tudi pri sočasnem dostopu. Upravljana baza zmanjšuje infrastrukturne naloge. Backend dostopa do baze prek Prisma; posebne omejitve določimo s SQL migracijami (ADR 0004).

### Posledice

- Pozitivno: celovitost podatkov ni odvisna samo od pravil v aplikaciji.
- Pozitivno: razvojni projekt združi bazo, prijavo in shrambo pri enem ponudniku.
- Negativno: lokalni razvoj potrebuje internet in razpoložljiv razvojni projekt Supabase.
- Negativno: upoštevati moramo omejitve izbranega paketa ter pripraviti izvoz in obnovo podatkov; prehod ponudnika zahteva tudi prilagoditve Auth in Storage.
