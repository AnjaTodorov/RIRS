# 0007 – Docker Compose za lokalni frontend in backend

- Status: sprejeto
- Datum: 2026-10-25
- Nadomešča: —
- Nadomeščeno z: —

## Kontekst in problem

Frontend in backend uporabljata Node.js, vendar imata ločene odvisnosti in vrata. Razlike med razvojnimi računalniki lahko povzročijo težave pri zagonu. Potrebujemo ponovljivo lokalno okolje, ne da bi v okviru MVP upravljali še lokalne različice vseh storitev Supabase.

## Obravnavane alternative

- Docker Compose za frontend in backend ter razvojni projekt Supabase: enotno izvajalno okolje z omejenim številom lokalnih storitev.
- Neposredni zagon z npm: manj začetne konfiguracije, vendar lokalna namestitev ustreznih različic Node.js in usklajevanje procesov.
- Celoten lokalni sklad, vključno s Supabase: več neodvisnosti od interneta, vendar več porabe virov in vzdrževanja konfiguracije.

## Sprejeta odločitev in utemeljitev

Izberemo Docker Compose za razvojni frontend in backend; PostgreSQL, Auth in Storage uporabljajo ločen razvojni projekt Supabase. Konfiguracijo okolja bomo opisali v `.env.example`, dejanske skrivnosti pa izključili iz Git. S tem poenotimo izvajanje obeh aplikacijskih delov in ohranimo lokalni zagon obvladljiv. Načrtovani ukazi in vrata so opisani v arhitekturni zasnovi; vsebniki pri tej nalogi še niso implementirani.

### Posledice

- Pozitivno: enaka konfiguracija vsebnikov zmanjša razlike med razvojnimi okolji.
- Pozitivno: frontend in backend lahko zaženemo ter ustavimo kot celoto.
- Negativno: potrebna sta Docker in internet; izpad razvojnega projekta Supabase ovira delo.
- Negativno: vsebniki porabljajo dodatne vire, skupna razvojna baza pa zahteva usklajevanje migracij in uporabo testnih podatkov.
