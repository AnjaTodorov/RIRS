# 0004 – Prisma za dostop do podatkov in SQL za posebne omejitve

- Status: sprejeto
- Datum: 2026-10-25
- Nadomešča: —
- Nadomeščeno z: —

## Kontekst in problem

Backend v TypeScript potrebuje pregleden dostop do povezanih entitet in ponovljivo spreminjanje sheme. Pravila o enem potrjenem ogledu in neprekrivanju terminov zahtevajo omejitve baze, ki jih ne smemo zamenjati zgolj s preverjanjem pred zapisom v aplikaciji.

## Obravnavane alternative

- Prisma in SQL migracije: tipiziran odjemalec za običajne operacije in SQL za posebnosti PostgreSQL.
- Ročni SQL z gonilnikom PostgreSQL: popoln nadzor nad poizvedbami, vendar več ročnega preslikovanja podatkov in tipov.
- Supabase podatkovni API: priročen dostop, vendar bi večstopenjske transakcije zahtevale dodatne podatkovne funkcije.

## Sprejeta odločitev in utemeljitev

Izberemo Prisma za običajne poizvedbe in transakcije, vse spremembe sheme pa hranimo v verzioniranih migracijah. SQL migracije vključijo delni enolični indeks za status `CONFIRMED` in omejitev neprekrivanja terminov istega oglasa. S tem ohranimo tipiziran razvoj, posebna pravila pa uveljavi PostgreSQL tudi pri sočasnih zahtevah. Potrditev ene in zavrnitev drugih čakajočih zahtev se izvedeta skupaj v transakciji.

### Posledice

- Pozitivno: zgodovina migracij omogoča ponovljivo pripravo razvojne baze in pregled sprememb sheme v pull requestih.
- Pozitivno: generirani tipi zmanjšajo napake pri običajnem dostopu do podatkov.
- Negativno: ekipa mora poznati tudi SQL in skrbeti za skladnost sheme Prisma s prilagojenimi migracijami.
- Negativno: migracije s posebnimi omejitvami so vezane na PostgreSQL; napake zaradi kršitev omejitev mora API prevesti v razumljiv odgovor.
