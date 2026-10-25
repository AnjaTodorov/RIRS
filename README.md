# Domora

Domora je spletna aplikacija za oglaševanje nepremičnin in usklajevanje ogledov. Iskalci pregledujejo oglase in zaprosijo za ogled, oglaševalci upravljajo oglase in termine, administrator pa pred objavo preveri oglase.

Projekt je trenutno v fazi načrtovanja. Izvedbena koda in konfiguracija zagona še nista pripravljeni; mapi `frontend/` in `backend/` vsebujeta le datoteki `.gitkeep`.

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
