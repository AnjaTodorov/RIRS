# 0005 – Supabase Auth za identiteto in backend za dovoljenja

- Status: sprejeto
- Datum: 2026-10-25
- Nadomešča: —
- Nadomeščeno z: —

## Kontekst in problem

Domora potrebuje registracijo, prijavo in prijavne seje za iskalce, oglaševalce in administratorja. Poleg identitete mora preveriti lastništvo oglasa in dostop do zasebnega naslova. Lastna izvedba upravljanja gesel bi povečala obseg varnostno občutljive kode.

## Obravnavane alternative

- Supabase Auth: upravljani računi in seje, povezani z izbranim okoljem Supabase.
- Lastna prijava z gesli in sejami: popoln nadzor, vendar tudi lastno varno shranjevanje gesel, obnova dostopa in vzdrževanje sej.
- Ločen ponudnik identitete: ločitev od baze, vendar dodatna integracija in usklajevanje računov.

## Sprejeta odločitev in utemeljitev

Izberemo Supabase Auth za prijavo z e-pošto in geslom. Frontend pridobi dostopni žeton, backend pa preveri njegovo veljavnost ter iz `profiles` pridobi poslovno vlogo. Pravice preveri pri vsaki zaščiteni operaciji in konkretnem zapisu. Registracija dovoljuje le `SEEKER` in `ADVERTISER`; administrator se ustvari z inicializacijskim skriptom. Uporabnik prek urejanja profila ne sme spremeniti vloge. Strežniški ključi ostanejo v backendu.

### Posledice

- Pozitivno: aplikacija ne shranjuje gesel in ne izvaja lastnega sistema prijavnih sej.
- Pozitivno: poslovna dovoljenja ostanejo izrecno vezana na domenska pravila ter lastništvo.
- Negativno: prijava je odvisna od zunanje storitve in njenega načina upravljanja sej.
- Negativno: uskladiti moramo nastanek računa in profila ter obravnavati nepopolno registracijo; preverjanje žetona samo po sebi še ne zagotavlja dovoljenja.
