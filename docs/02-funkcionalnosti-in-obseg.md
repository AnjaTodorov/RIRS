# Domora – funkcionalnosti in obseg

## Uporabniške vloge

| Vloga | Kaj lahko počne | Katerih pravic nima |
|---|---|---|
| Iskalec nepremičnine | Išče nepremičnine, oddaja zahteve za ogled in spremlja njihove statuse; po MVP tudi shranjuje in primerja oglase ter uporablja sporočanje. | Ne objavlja oglasov, ne odloča o tujih zahtevah in ne vidi zasebnih podatkov drugih iskalcev. |
| Oglaševalec | Pripravlja lastne oglase, jih oddaja v pregled, določa termine, odloča o zahtevah in zaključi oglas. Pri tujih oglasih ima tudi pravice iskalca. | Ne ureja tujih oglasov, ne odobri objave in ne zahteva ogleda lastne nepremičnine. |
| Administrator | Odobri ali zavrne oglas z obrazložitvijo; po MVP obravnava prijave in onemogoča račune zaradi kršitev. | Ne potrjuje ogledov namesto oglaševalca, ne oddaja zahtev v imenu iskalcev in ne bere zasebnih pogovorov. |

Neprijavljen obiskovalec lahko išče in pregleduje objavljene oglase. Ob registraciji uporabnik izbere vlogo iskalca ali oglaševalca; administratorski račun se ustvari ob inicializaciji sistema.

## Predvidene funkcionalnosti

Predvidenih je 14 funkcionalnosti. Prva delujoča različica vključuje 7 funkcionalnosti z oznako **MVP**; F02–F07 so domensko specifične.

| ID | Funkcionalnost | Obseg |
|---|---|---|
| F01 | Registracija, prijava in upravljanje lastnega profila z dostopom glede na uporabniško vlogo. | **MVP** |
| F02 | Priprava oglasa za prodajo ali oddajo z opisom, fotografijami, lokacijo, ceno, površino in vrsto nepremičnine ter oddaja v pregled. | **MVP** |
| F03 | Administratorski pregled oglasa: odobritev ali zavrnitev z razlogom ter ponovna oddaja popravljenega oglasa. | **MVP** |
| F04 | Iskanje objavljenih nepremičnin s kombiniranimi filtri po kraju, ceni, površini, vrsti in namenu oglasa. | **MVP** |
| F05 | Določanje razpoložljivih terminov ogledov in oddaja zahteve za izbrani termin tuje nepremičnine. | **MVP** |
| F06 | Potrditev ali zavrnitev zahteve za ogled, spremljanje statusa in preprečevanje dvojne rezervacije; ob potrditvi se razkrije natančen naslov. | **MVP** |
| F07 | Umik oglasa oziroma označitev kot prodan ali oddan ter preklic prihodnjih ogledov ob zaključku oglasa. | **MVP** |
| F08 | Shranjevanje zanimivih nepremičnin med priljubljene za kasnejši pregled. | Po MVP |
| F09 | Primerjava do treh nepremičnin z istim namenom po ceni, površini in ceni na kvadratni meter. | Po MVP |
| F10 | Elektronska obvestila o potrditvi ali zavrnitvi ogleda. | Po MVP |
| F11 | Preklic lastne zahteve ali potrjenega ogleda pred začetkom termina in sprostitev zasedenega termina. | Po MVP |
| F12 | Prijava neprimernega ali zavajajočega oglasa in administratorska obravnava prijave. | Po MVP |
| F13 | Administratorsko onemogočanje in ponovno omogočanje računov zaradi kršitev. | Po MVP |
| F14 | Zasebno sporočanje med interesentom in oglaševalcem pri oglasu po sprejetju zahteve za pogovor. | Po MVP |

### Osrednji delovni proces MVP

1. Oglaševalec pripravi oglas in ga odda v pregled.
2. Administrator odobri objavo ali oglas zavrne z razlogom; oglaševalec ga lahko popravi in ponovno odda.
3. Pri objavljenem oglasu oglaševalec določi prihodnje termine, ki se med seboj ne prekrivajo.
4. Iskalci oddajo zahteve za termin; posamezni iskalec ima največ eno zahtevo za isti termin.
5. Oglaševalec potrdi eno zahtevo. Sistem v eni transakciji zasede termin in zavrne ostale čakajoče zahteve zanj. Iskalec vidi potrditev in natančen naslov.
6. Ob umiku, prodaji ali oddaji oglas izgine iz javnega prikaza, prihodnji čakajoči in potrjeni ogledi pa se prekličejo.

## Kasnejše nadgradnje

Poleg funkcionalnosti F08–F14 so možne naslednje nadgradnje:

- Iskanje nepremičnin na zemljevidu.
- Shranjena iskanja z obvestili o novih ustreznih oglasih.
- Virtualni ogledi in videopredstavitve nepremičnin.
- Agencijski računi z več zaposlenimi in skupnimi oglasi.
- Koledarski izvoz potrjenih ogledov.

## Izven obsega projekta (out of scope)

- Plačila in rezervacijski pologi.
- Priprava in elektronsko podpisovanje prodajnih ali najemnih pogodb.
- Samodejno vrednotenje nepremičnin in finančno svetovanje.
- Preverjanje lastništva in povezovanje z zemljiško knjigo.
- Uvoz oglasov z drugih nepremičninskih portalov.
- Namenska mobilna aplikacija; rešitev bo odzivna spletna aplikacija.
