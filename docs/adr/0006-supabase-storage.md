# 0006 – Zasebna shramba Supabase Storage za fotografije

- Status: sprejeto
- Datum: 2026-10-25
- Nadomešča: —
- Nadomeščeno z: —

## Kontekst in problem

Oglas ima več fotografij, osnutki in zavrnjeni oglasi pa niso javni. Fotografije morajo ostati dosegljive po ponovnem zagonu backenda. Shranjevanje binarnih datotek v relacijske zapise bi povečalo bazo in breme njenih varnostnih kopij.

## Obravnavane alternative

- Zasebni Supabase Storage: trajna objektna shramba s časovno omejenimi podpisanimi povezavami.
- Lokalni disk backenda: preprost prototip, vendar zahtevnejša trajnost podatkov pri vsebnikih in več instancah.
- Binarna polja v PostgreSQL: skupne podatkovne transakcije, vendar večja baza in dražji prenos fotografij prek nje.

## Sprejeta odločitev in utemeljitev

Izberemo zasebno shrambo Supabase Storage. Backend sprejema fotografije z Multer, preveri uporabnika, lastništvo, dovoljeno vrsto in velikost datoteke ter jo shrani prek Supabase SDK. V `property_photos` zapiše pot in vrstni red. Pred izdajo časovno omejene podpisane povezave preveri vidnost oglasa oziroma pravice do neobjavljenega oglasa. Tako fotografije ostanejo zunaj baze, pravila dostopa pa sledijo statusu oglasa.

### Posledice

- Pozitivno: ponovni zagon backenda ne izbriše fotografij, baza pa hrani samo metapodatke.
- Pozitivno: zasebna shramba prepreči trajen javni URL do fotografij neobjavljenih oglasov.
- Negativno: datotečni zapis in zapis v bazo nista ena transakcija; ob napakah potrebujemo čiščenje osirotelih datotek.
- Negativno: izdana povezava velja do izteka tudi ob spremembi statusa oglasa, zato mora biti njena veljavnost kratka; frontend mora znati pridobiti novo povezavo.
