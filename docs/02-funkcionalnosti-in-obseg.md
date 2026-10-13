# Domora – funkcionalnosti in obseg

## Uporabniške vloge

Vsak registriran uporabnik ima eno vlogo. Ob registraciji lahko izbere vlogo iskalca ali oglaševalca. Oglaševalec ima tudi vse pravice iskalca pri tujih oglasih, zato ne potrebuje dodatne vloge ali drugega računa. Administratorski račun se ustvari ob inicializaciji sistema in ga ni mogoče izbrati pri javni registraciji.

Uporabnik brez aplikacijskega profila lahko pregleduje javne oglase, pred objavo, zahtevo za ogled ali pogovorom pa mora dokončati profil. Iskalec lahko izbere »Postani oglaševalec«; po preverjanju potrebnih podatkov backend spremeni vlogo istega profila iz `SEEKER` v `ADVERTISER`. Identifikator, zahteve in pogovori ostanejo nespremenjeni. Obratna sprememba vloge in samostojna dodelitev `ADMIN` nista podprti.

### Podatki profila in njihov prikaz

- Profil vsebuje ime in priimek, enolično uporabniško ime, telefonsko številko in neobvezen datum rojstva, iz katerega se izračuna starost. Ime, priimek, uporabniško ime in telefon so obvezni za dokončan profil. Drugim uporabnikom se pokaže le izračunana starost, ne datum rojstva; podatke vnese uporabnik sam.
- Pri javnem oglasu je vidno uporabniško ime oglaševalca. Lastnik ob prejeti zahtevi za ogled vidi ime, uporabniško ime in morebitno starost interesenta.
- Po potrditvi ogleda oba udeleženca vidita ime, uporabniško ime, morebitno starost in telefon drugega udeleženca. Po uvedbi sporočanja sta ime in morebitna starost vidna tudi udeležencema sprejetega pogovora; telefon se prek pogovora samodejno ne razkrije.
- Uporabnik ureja samo svoj profil; polje vloge spreminja samo namenska akcija »Postani oglaševalec« oziroma inicializacija administratorja. Profil ne predstavlja preverjene identitete ali dokazila, da je uporabnik najemnik.

### Pravice vlog

| Vloga | Dovoljena dejanja | Omejitve |
|---|---|---|
| Iskalec nepremičnine | Filtriranje objavljenih oglasov, oddaja in spremljanje lastnih zahtev za ogled; po MVP tudi priljubljeni oglasi, primerjava, prijava neprimernega oglasa, zahteva za pogovor in sporočanje po sprejetju zahteve. | Ne objavlja oglasov, ne odloča o zahtevah drugih uporabnikov in ne vidi tujih zahtev ali pogovorov. |
| Oglaševalec | Vse pravice iskalca pri tujih oglasih; priprava in oddaja lastnih oglasov, določanje terminov, odločanje o zahtevah za ogled, deaktivacija, označitev kot prodano ali oddano ter logični izbris lastnih oglasov; po MVP tudi sprejem ali zavrnitev zahtev za pogovor pri lastnih oglasih ter sporočanje. | Ne spreminja tujih oglasov, ne odobri objave, ne upravlja uporabniških računov, ne zahteva ogleda ali pogovora pri svojem oglasu in ne vidi pogovorov, v katerih ni udeleženec. |
| Administrator | Odobritev ali zavrnitev oglasov z obrazložitvijo; v nadaljnjem razvoju obravnava prijav in onemogočanje računov. | Ne oddaja zahtev v imenu iskalcev, ne potrjuje ogledov namesto oglaševalca in nima dostopa do gesel v berljivi obliki. |

Neprijavljen obiskovalec lahko išče in pregleduje samo objavljene oglase. To je način dostopa, ne dodatna registrirana vloga.

## Predvidene funkcionalnosti

MVP pomeni prvo delujočo različico. Izbranih je **7 funkcionalnosti**, od katerih je **6 domensko specifičnih** (F02–F06 in F11). V opisih zahtev za ogled in pogovor izraz iskalec označuje uporabnika v vlogi iskalca ali oglaševalca, ki se zanima za tuj oglas.

| ID | Funkcionalnost | Obseg |
|---|---|---|
| F01 | Registracija, prijava, odjava, dokončanje in urejanje lastnega profila, prehod iskalca v oglaševalca ter nadzor dostopa glede na vlogo in lastništvo podatkov. | **MVP** |
| F02 | Priprava oglasa za prodajo ali oddajo z opisom, fotografijami, krajem, javno lokacijo, ločenim natančnim naslovom, ceno, površino, vrsto nepremičnine in izbranimi oznakami ter oddaja v pregled. | **MVP – domenska** |
| F03 | Administratorski pregled oglasa: odobritev objave ali zavrnitev z razlogom; popravek in ponovna oddaja zavrnjenega oglasa. | **MVP – domenska** |
| F04 | Iskanje objavljenih nepremičnin s kombiniranimi filtri po kraju, cenovnem razponu, površini, vrsti in namenu oglasa ter pregled podrobnosti. | **MVP – domenska** |
| F05 | Oglaševalec določi termine ogledov, iskalec pa odda zahtevo za izbrani prihodnji termin; sistem preveri razpoložljivost in podvajanje zahtev. | **MVP – domenska** |
| F06 | Oglaševalec potrdi ali zavrne zahtevo; iskalec spremlja status. Potrditev zasede termin, prepreči dvojno rezervacijo ter razkrije natančen naslov in morebitna navodila za zbirno mesto. | **MVP – domenska** |
| F07 | Shranjevanje oglasov med priljubljene za kasnejši pregled. | Po MVP |
| F08 | Primerjava do treh nepremičnin po ceni, površini, vrsti in ceni na kvadratni meter; primerjajo se oglasi z istim namenom. | Po MVP |
| F09 | Elektronska obvestila ob potrditvi ali zavrnitvi zahteve za ogled. | Po MVP |
| F10 | Preklic lastne zahteve oziroma potrjenega ogleda pred začetkom termina in ponovna aktivacija istega preklicanega zapisa, če je termin še prihodnji in prost ter oglas aktiven. Preklic potrjenega ogleda sprosti termin. | Po MVP |
| F11 | Upravljanje življenjskega cikla oglasa: označitev kot neaktiven, prodan ali oddan oziroma logični izbris, umik iz javnega prikaza in preklic prihodnjih čakajočih ter potrjenih ogledov; po uvedbi sporočanja tudi zaprtje pogovorov ob ohranjeni zgodovini sporočil. | **MVP – domenska** |
| F12 | Prijava zavajajočega ali neprimernega oglasa z razlogom in administratorska obravnava prijave. | Po MVP |
| F13 | Administratorsko onemogočanje in ponovno omogočanje uporabniških računov zaradi kršitev. | Po MVP |
| F14 | Interno sporočanje: iskalec ali oglaševalec pri tujem objavljenem oglasu pošlje zahtevo za pogovor. Lastnik jo sprejme ali zavrne. Po sprejetju oba pošiljata sporočila in pregledujeta zgodovino; ob zaključku oglasa ostane samo dostop do zgodovine. Poslanih sporočil ni mogoče urejati ali brisati. | Po MVP |

### Pravila internega sporočanja (po MVP)

- Zahtevo za pogovor lahko pošlje prijavljen iskalec ali oglaševalec pri tujem objavljenem oglasu, tudi brez oddane zahteve za ogled. Začetni status je `PENDING`; v tem stanju pošiljanje sporočil ni dovoljeno.
- Lastnik oglasa sprejme zahtevo (`ACTIVE`) ali jo zavrne (`REJECTED`). Ob odločitvi se zabeleži `decided_at`.
- Za isti oglas in istega pobudnika obstaja največ en pogovor; ponoven dostop odpre obstoječo zahtevo ali zgodovino. Ponovna oddaja zavrnjene zahteve in ponovno odpiranje neaktivnega pogovora nista del F14.
- Udeleženca sta pobudnik in lastnik oglasa. Sporočila in zgodovino lahko pregledujeta samo ta dva uporabnika; administrator nima dostopa do zasebnih pogovorov.
- Nova sporočila lahko pošiljata samo v statusu `ACTIVE`, dokler je oglas `PUBLISHED` in ni logično izbrisan. Sporočila vsebujejo besedilo in čas pošiljanja; poslanih sporočil ni mogoče urejati ali brisati. Priponke niso del začetne izvedbe sporočanja.
- Ob deaktivaciji, prodaji, oddaji ali logičnem izbrisu oglasa vsi njegovi pogovori, tudi čakajoči in zavrnjeni, postanejo `INACTIVE`; zabeleži se `closed_at`. Zgodovina sporočil ostane berljiva udeležencema, podrobnosti nepremičnine pa niso več dostopne drugemu udeležencu. Prikaže se »Oglas ni več aktiven« oziroma »Oglas je izbrisan«.
- Dogovor v sporočilih ne rezervira termina. Potrditev ogleda še vedno poteka prek zahtev za ogled (F05–F06).

| Status pogovora | Pomen |
|---|---|
| `PENDING` | Zahteva za pogovor čaka na odločitev. |
| `ACTIVE` | Oglaševalec je zahtevo sprejel; sporočanje je omogočeno. |
| `REJECTED` | Oglaševalec je zahtevo zavrnil. |
| `INACTIVE` | Pogovor je zaprt; zgodovina je dostopna, novih sporočil ni mogoče poslati. |

## Pravila prve različice

### Življenjski cikel oglasa

- Statusi: `OSNUTEK`, `V_PREGLEDU`, `OBJAVLJEN`, `ZAVRNJEN`, `NEAKTIVEN`, `PRODAN`, `ODDAN` (v bazi DRAFT / PENDING_REVIEW / PUBLISHED / REJECTED / INACTIVE / SOLD / RENTED).
- Oglaševalec lahko ureja samo lastne osnutke in zavrnjene oglase.
- Oddaja popolnega oglasa spremeni status v `V_PREGLEDU`.
- Ob ponovni oddaji zavrnjenega oglasa se `reviewed_by`, `review_reason` in `reviewed_at` izpraznijo. MVP hrani samo zadnji pregled; zgodovina pregledov je nadgradnja.
- Administrator lahko oglas v pregledu odobri ali zavrne. Ob zavrnitvi je razlog obvezen.
- Javno so vidni samo oglasi s statusom `OBJAVLJEN` in `deleted_at IS NULL`.
- Lastnik lahko objavljen oglas označi kot `NEAKTIVEN` (`INACTIVE`), prodajni oglas kot `PRODAN` (`SOLD`), oglas za oddajo pa kot `ODDAN` (`RENTED`). V MVP teh oglasov ni mogoče ponovno aktivirati.
- Lastnik lahko svoj oglas v kateremkoli statusu logično izbriše z nastavitvijo `deleted_at`. Fizičnega brisanja ni; povezave s starimi zahtevami in pogovori ostanejo veljavne. Izbrisani oglasi niso več dostopni prek običajnih uporabniških pogledov, tudi lastnikovega seznama.
- Deaktivacija, zaključek ali logični izbris v eni transakciji umakne oglas iz javnega prikaza in prekliče prihodnje čakajoče ali potrjene zahteve za ogled (`CANCELLED`, čas v `cancelled_at`). Novi termini in zahteve niso več dovoljeni. Samostojen preklic uporabnika ostaja nadgradnja F10.
- Po uvedbi F14 ista transakcija zapre vse pogovore oglasa (`INACTIVE`, `closed_at`), ne da bi izbrisala sporočila. Ob že zaprtem pogovoru se prvotni `closed_at` ohrani.
- Lastnik lahko vidi svoje neaktivne, prodane in oddane oglase. Drugim uporabnikom zgodovina pokaže samo »Oglas ni več aktiven« oziroma, prednostno ob `deleted_at`, »Oglas je izbrisan«; podrobnosti, fotografije, naslov in navodila niso več dostopni prek oglasa ali zahtev za ogled. Zgodovina sporočil ostane berljiva.
- `public_location` hrani javno lokacijo, katere natančnost določi oglaševalec. `exact_address` hrani ločen natančen naslov, ki ga vidi lastnik, administrator pri pregledu in interesent s potrjenim ogledom, dokler je oglas aktiven. Ob potrditvi lahko lastnik doda navodila za zbirno mesto. Ogled ni odvisen od sprejetega pogovora.
- Urejanje že objavljenega oglasa s ponovnim pregledom je kasnejša nadgradnja.

### Namen oglasa in oznake

- Obvezno polje `listing_type` je `SALE` ali `RENT`; oznake namena ne nadomeščajo.
- `tags` vsebuje izbrane vrednosti iz vnaprej določenega seznama: dolgoročni najem, kratkoročni najem, najem za eno leto, primerno za študente, primerno za Erasmus študente in primerno za družine.
- Oznake trajanja najema so dovoljene samo pri `RENT`; izbrana je lahko največ ena oznaka trajanja. Oznake ciljnih uporabnikov se lahko kombinirajo in uporabijo tudi pri `SALE`.

### Dogovarjanje za ogled

1. Oglaševalec za objavljeno nepremičnino določi prihodnji termin z začetkom in koncem. Termini iste nepremičnine se ne smejo prekrivati.
2. Iskalec odda zahtevo za prost termin. Status je `V_CAKANJU`.
3. Več iskalcev lahko odda zahtevo za isti termin, vendar ima posamezni iskalec največ eno zahtevo na termin.
4. Oglaševalec potrdi eno zahtevo ali jo zavrne. Status postane `POTRJENA` oziroma `ZAVRNJENA`.
5. Pri potrditvi sistem v isti podatkovni transakciji preveri, da termin še ni zaseden, potrdi zahtevo in zavrne druge čakajoče zahteve za ta termin.
6. Po začetku termina zahteve ni mogoče potrditi ali zavrniti. Čakajoča zahteva v bazi ostane `PENDING`, v zgodovini pa se prikaže kot »Pretekla zahteva«. Terminov z zahtevami v MVP ni mogoče spreminjati ali fizično brisati.
7. Oglaševalec lahko zahteva ogled tuje nepremičnine, nikoli lastne. Neaktivnega, zaključenega ali logično izbrisanega oglasa ni mogoče zahtevati ali potrjevati.
8. Natančen naslov in morebitna navodila za zbirno mesto interesent prejme ob potrditvi, brez pogoja sprejetega pogovora.

Po uvedbi F10 uporabnik lahko prekliče svojo zahtevo pred začetkom termina. Ob ponovni prijavi se isti zapis `CANCELLED` spremeni v `PENDING`, če je termin prihodnji, prost in oglas `PUBLISHED` brez `deleted_at`. Ponastavijo se `decided_at`, `decision_reason`, `meeting_instructions` in `cancelled_at`. Zavrnjene zahteve ni mogoče samostojno ponovno aktivirati; omejitev `UNIQUE(slot_id, seeker_id)` ostane veljavna.

Primer: za isti termin sta oddani dve zahtevi. Ko oglaševalec potrdi prvo, sistem drugo zavrne. Ob hkratnih potrditvah podatkovna baza dovoli samo eno potrjeno zahtevo.

## Kasnejše nadgradnje

Poleg funkcionalnosti F07–F10 in F12–F14 so možne naslednje nadgradnje:

1. Iskanje nepremičnin na zemljevidu.
2. Shranjena iskanja z obvestili o novih ustreznih oglasih.
3. Obvestila o novih sporočilih in oznake neprebranih sporočil.
4. Virtualni ogledi in videopredstavitve nepremičnin.
5. Agencijski računi z več zaposlenimi in skupnimi oglasi.
6. Urejanje objavljenega oglasa z novo različico in ponovnim pregledom.
7. Koledarski izvoz potrjenih ogledov.
8. Zgodovina administratorskih pregledov oglasa.

## Izven obsega projekta (out of scope)

- Plačila, rezervacijski pologi in obdelava bančnih podatkov.
- Priprava ali elektronsko podpisovanje prodajnih in najemnih pogodb.
- Samodejno vrednotenje nepremičnin in finančno svetovanje.
- Preverjanje lastništva in povezovanje z zemljiško knjigo.
- Uvoz oglasov z drugih nepremičninskih portalov.
- Namenska mobilna aplikacija; projekt vključuje odzivno spletno aplikacijo.

## Meja prve delujoče različice

MVP zajema F01–F06 in F11 ter omogoča proces od oddaje oglasa do potrjenega ogleda in zaključka oglasa. F07–F10 in F12–F14 niso pogoj za zaključek MVP. Pogovori in njihovo zapiranje se dodajo s F14 ter uporabijo že obstoječo akcijo zaključka oglasa F11. Nadaljnji razvoj temelji na istem podatkovnem modelu in postopnem dodajanju novih modulov.
