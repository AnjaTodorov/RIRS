# 0001 – React in TypeScript za spletni vmesnik

- Status: sprejeto
- Datum: 2026-10-25
- Nadomešča: —
- Nadomeščeno z: —

## Kontekst in problem

Domora potrebuje odziven vmesnik za iskanje s filtri, pripravo oglasov, izbiro terminov in administratorski pregled. Pogledi si delijo podatke in obrazce, dovoljena dejanja pa se razlikujejo glede na vlogo in status. Želimo ponovno uporabiti komponente ter zgodaj zaznati napačne tipe podatkov.

## Obravnavane alternative

- React in TypeScript: sestavljanje pogledov iz komponent in statično preverjanje tipov, vendar potrebujemo orodje za gradnjo.
- React in JavaScript: enak komponentni pristop z manj začetnih nastavitev, vendar brez statičnega preverjanja tipov.
- Strežniško izrisane HTML predloge: manj odjemalskega stanja, vendar več prilagajanja za interaktivne filtre in večstopenjske obrazce.

## Sprejeta odločitev in utemeljitev

Izberemo React in TypeScript z Vite, React Router in CSS. Komponente kartice oglasa, obrazca in statusa zahteve lahko uporabimo v več pogledih. Tipi pomagajo uskladiti podatke REST API z vmesnikom in preprečiti zamenjavo statusov ali polj. Vite podpira ločen razvoj vmesnika, React Router pa navigacijo med uporabniškimi pogledi. Odzivno spletno mesto pokriva predvidene naprave brez ločene mobilne aplikacije.

### Posledice

- Pozitivno: skupne komponente zmanjšajo podvajanje; TypeScript odkrije del napak pred zagonom.
- Pozitivno: enoten jezik v frontendu in backendu olajša razvoj majhni ekipi.
- Negativno: dodamo gradnjo ter upravljanje odjemalskega stanja; tipi ne nadomestijo preverjanja podatkov med izvajanjem.
- Negativno: odjemalsko izrisovanje zahteva dodatno presojo indeksiranja javnih oglasov, če to postane pomembna zahteva.
