# Domora – podatkovni model

## Izbira podatkovne baze

**Podatkovna baza:** PostgreSQL, gostovan na platformi Supabase.

Relacijska baza je primerna za povezane profile, oglase, termine in zahteve. Tuji ključi zagotavljajo referenčno integriteto, transakcije pa varno potrjevanje ogledov in umik oglasov.

Imena tabel in polj bodo angleška, identifikatorji tipa UUID, časovni trenutki tipa `TIMESTAMPTZ` in datum rojstva tipa `DATE`. Čas se prikazuje v lokalnem časovnem pasu uporabnika. Cene so izražene v EUR.

## Osrednje entitete MVP

| Entiteta | Glavna polja |
|---|---|
| `profiles` | `id` (PK in FK → auth.users.id), `first_name`, `last_name`, `username` (UNIQUE), `phone_number`, `date_of_birth` (neobvezno), `role` (SEEKER / ADVERTISER / ADMIN), `created_at` |
| `properties` | `id` (PK), `advertiser_id` (FK → profiles), `title`, `description`, `city`, `public_location`, `exact_address`, `property_type` (APARTMENT / HOUSE / LAND / COMMERCIAL), `listing_type` (SALE / RENT), `tags` (TEXT[]), `price` (NUMERIC), `area_m2` (NUMERIC), `rooms` (neobvezno), `status` (DRAFT / PENDING_REVIEW / PUBLISHED / REJECTED / INACTIVE / SOLD / RENTED), `deleted_at` (neobvezno), `reviewed_by` (neobvezni FK → profiles), `review_reason` (neobvezno), `reviewed_at` (neobvezno), `created_at`, `updated_at` |
| `property_photos` | `id` (PK), `property_id` (FK → properties), `storage_path`, `position` |
| `viewing_slots` | `id` (PK), `property_id` (FK → properties), `starts_at`, `ends_at`, `created_at` |
| `viewing_requests` | `id` (PK), `slot_id` (FK → viewing_slots), `seeker_id` (FK → profiles), `status` (PENDING / CONFIRMED / REJECTED / CANCELLED), `message` (neobvezno), `decision_reason` (neobvezno), `meeting_instructions` (neobvezno), `created_at`, `decided_at` (neobvezno), `cancelled_at` (neobvezno) |

Supabase Auth upravlja prijavne račune, e-poštne naslove in gesla v shemi `auth`. Tabela `profiles` je povezana 1:1 z `auth.users` prek istega UUID; uporabnik lahko pred dokončanjem registracije še nima profila. Gesel aplikacija ne podvaja. Uporabnik brez profila lahko pregleduje javne oglase, za poslovne operacije pa mora profil dokončati. Backend ob ustvarjanju dovoli samo `SEEKER` ali `ADVERTISER`.

Ime se sestavi iz `first_name` in `last_name`, starost pa iz neobveznega `date_of_birth`; ločeno polje starosti ni potrebno. Datum rojstva ni prikazan drugim uporabnikom. Javno je vidno uporabniško ime oglaševalca; lastnik pri prejeti zahtevi vidi ime, uporabniško ime in morebitno starost interesenta. Pri potrjenem ogledu udeleženca vidita tudi telefon drugega udeleženca. Po uvedbi pogovorov sta ime in morebitna starost vidna tudi udeležencema sprejetega pogovora, telefon pa se prek pogovora samodejno ne razkrije.

Akcija »Postani oglaševalec« po preverjanju obveznih profilnih podatkov spremeni `profiles.role` iz `SEEKER` v `ADVERTISER`. UUID ostane isti, zato se povezave z zahtevami in pogovori ohranijo. Polje `seeker_id` lahko kaže na profil v vlogi `SEEKER` ali `ADVERTISER`; označuje interesenta pri tujem oglasu, ne izključno uporabniške vloge.

Pri oddaji cena pomeni mesečno najemnino, pri prodaji skupno prodajno ceno. Stroški niso vključeni, razen če so navedeni v opisu. `public_location` je javna lokacija v natančnosti, ki jo določi lastnik. Ločen obvezni `exact_address` ni v javnem odgovoru: vidi ga lastnik, administrator pri pregledu in interesent s `CONFIRMED` ogledom pri aktivnem oglasu. `meeting_instructions` lastnik lahko doda ob potrditvi; interesent jih vidi pod istimi pogoji. Dostop ni odvisen od sprejetega pogovora.

Aktiven oglas pomeni `status = PUBLISHED` in `deleted_at IS NULL`. `SOLD` je dovoljen samo za `SALE`, `RENTED` samo za `RENT`. `INACTIVE` pomeni umik brez prodaje ali oddaje. V MVP ni ponovne aktivacije teh statusov. Logični izbris nastavi `deleted_at` in ohrani obstoječi status ter povezave; ob prikazu ima oznaka »Oglas je izbrisan« prednost pred »Oglas ni več aktiven«.

### Oznake oglasa

`listing_type` je obvezen in neodvisen od oznak. `tags` je seznam brez podvojenih vrednosti iz spodnjega nabora; privzeta vrednost je prazen seznam.

| Vrednost | Prikaz | Dovoljen namen |
|---|---|---|
| `LONG_TERM_RENT` | Dolgoročni najem | RENT |
| `SHORT_TERM_RENT` | Kratkoročni najem | RENT |
| `ONE_YEAR_RENT` | Najem za eno leto | RENT |
| `STUDENT_FRIENDLY` | Primerno za študente | SALE ali RENT |
| `ERASMUS_FRIENDLY` | Primerno za Erasmus študente | SALE ali RENT |
| `FAMILY_FRIENDLY` | Primerno za družine | SALE ali RENT |

Izbrana je lahko največ ena oznaka trajanja najema. Backend zavrne neznane oznake in oznake trajanja pri prodajnem oglasu.

## Povezave med entitetami

- Prijavni račun ima **0..1 aplikacijski profil**; vsak profil pripada enemu računu.
- Oglaševalec ima **0..N oglasov**; vsak oglas pripada enemu oglaševalcu.
- Administrator pregleda **0..N oglasov**; oglas pred pregledom nima pregledovalca, po pregledu ima enega.
- Oglas ima **0..N fotografij**; ob oddaji v pregled je obvezna vsaj ena.
- Oglas ima **0..N terminov**; vsak termin pripada enemu oglasu.
- Termin ima **0..N zahtev**, največ eno potrjeno.
- Interesent ima **0..N zahtev**; vsaka zahteva pripada enemu interesentu in enemu terminu tuje nepremičnine.
- Po uvedbi F14 ima oglas **0..N pogovorov**, vsak pogovor pa enega pobudnika in **0..N sporočil**. Drugi udeleženec je lastnik oglasa.

## Osnutek podatkovnega modela

![ERD podatkovnega modela Domora](img/Nepremicnine_ERD.png)

Diagram prikazuje MVP in načrtovani entiteti `conversations` ter `messages` za sporočanje po MVP. Imena tabel in polj so usklajena z diagramom. Tabele zgoraj dodatno navajajo metapodatke pregleda, odločitve in časovne podatke, ki jih osnutek ne prikazuje vseh. `read_at` iz diagrama je predviden za kasnejše oznake prebranih sporočil. Vsa polja za časovne trenutke bodo v implementaciji `TIMESTAMPTZ`.

## Pravila integritete in poslovne omejitve

- Prijavne e-poštne naslove in gesla upravlja Supabase Auth. Uporabniško ime se pred shranjevanjem normalizira in mora biti enolično brez razlikovanja velikosti črk. Ime, priimek in telefon so obvezni za dokončan profil; datum rojstva, če je naveden, ne sme biti v prihodnosti.
- Cena in površina sta pozitivni; število sob, če je podano, ni negativno.
- Pred oddajo v pregled so obvezni podatki oglasa, vključno z javno lokacijo, natančnim naslovom in vsaj eno fotografijo.
- Ponovna oddaja zavrnjenega oglasa nastavi `PENDING_REVIEW` in izprazni `reviewed_by`, `review_reason` ter `reviewed_at`. MVP hrani samo zadnji pregled.
- Konec termina je poznejši od začetka; ustvarjanje in zahtevanje termina zahtevata prihodnji začetek. Termini istega oglasa se ne smejo prekrivati.
- `UNIQUE(slot_id, seeker_id)` prepreči več zapisov istega interesenta na termin. Delni enolični indeks na `viewing_requests(slot_id)` za `status = 'CONFIRMED'` zagotavlja največ eno potrjeno zahtevo.
- Ustvarjanje termina, oddaja zahteve in odločanje najprej zaklenejo oglas in preverijo, da je aktiven; nato po potrebi zaklenejo termin. Potrditev v isti transakciji potrdi izbrano zahtevo in zavrne ostale čakajoče zahteve za termin.
- Potrditev in zavrnitev sta dovoljeni samo za `PENDING` pred začetkom termina. Pretekli `PENDING` se v zgodovini prikaže kot »Pretekla zahteva«, brez spremembe shranjenega statusa.
- Deaktivacija, prodaja, oddaja ali logični izbris zaklenejo oglas in v isti transakciji prekličejo prihodnje `PENDING` in `CONFIRMED` oglede ter nastavijo `cancelled_at`. Prihodnji pomeni `starts_at > trenutni čas`; pretekle oziroma že začete zahteve ostanejo nespremenjene.
- Lastnik lahko pregleduje svoje neaktivne, prodane in oddane oglase. Drugi uporabniki v zgodovini zahtev vidijo samo oznako nedostopnega oglasa in podatke lastne zahteve, brez podrobnosti nepremičnine, fotografij, natančnega naslova in navodil. Logično izbrisani oglasi izginejo tudi iz lastnikovega običajnega seznama; branje sporočil udeležencev ostane dovoljeno.
- Fizično brisanje oglasov ni uporabniška operacija. Oglasi se logično brišejo prek `deleted_at`, zato tuji ključi zahtev in pogovorov ostanejo veljavni. Fizično brisanje terminov z zahtevami ni podprto.
- Backend preveri vlogo, lastništvo in udeležence; sam tuji ključ ne preveri pravic. Zahteve za ogled ali pogovor pri lastnem oglasu se zavrnejo.
- Fotografije hrani Supabase Storage; `storage_path` vsebuje pot objekta v zasebnem bucketu, ne začasnega podpisanega URL-ja.

## Predvidene razširitve po MVP

| Entiteta oziroma sprememba | Namen in povezave |
|---|---|
| `favorites(user_id, property_id, created_at)` | Povezava N:M med profili in oglasi; `user_id` je FK → profiles, sestavljen PK prepreči podvojeno shranjevanje. |
| `listing_reports(id, property_id, reporter_id, reason, status, resolved_by, resolved_at)` | Prijave oglasov; FK povezujejo oglas, prijavitelja in administratorja v profiles. |
| `conversations(id, property_id, seeker_id, status, created_at, decided_at, closed_at)` | FK → properties in profiles; `status` je PENDING / ACTIVE / REJECTED / INACTIVE. `decided_at` in `closed_at` sta neobvezna. `UNIQUE(property_id, seeker_id)` prepreči podvojene pogovore. |
| `messages(id, conversation_id, sender_id, content, sent_at)` | FK → conversations in profiles; `content` je neprazno besedilo. Pošiljanje je dovoljeno samo udeležencema pri ACTIVE in aktivnem oglasu. Poslanih sporočil ni mogoče urejati ali brisati. |
| `profiles.is_active` | Onemogočanje računov in preverjanje ob vsaki zaščiteni operaciji. |
| `messages.read_at` | Kasnejša oznaka prebranega sporočila; ne spreminja vsebine sporočila. |
| `listing_reviews` | Kasnejša zgodovina pregledov oglasa namesto hranjenja samo zadnjega pregleda. |

Razširitve se dodajo z migracijami. Primerjava nepremičnin in cena na kvadratni meter se izračunata iz obstoječih podatkov.

### Preklic in ponovna aktivacija zahteve (F10)

Uporabnik lahko pred začetkom termina prekliče svojo zahtevo `PENDING` ali `CONFIRMED`, kar nastavi `CANCELLED` in `cancelled_at`; preklic potrjenega ogleda sprosti termin. Ob ponovni prijavi se pod zaklepom istega oglasa in termina ponovno aktivira isti zapis v `PENDING`, samo če je termin prihodnji, prost in oglas aktiven. Polja `decided_at`, `decision_reason`, `meeting_instructions` in `cancelled_at` se ponastavijo. Zapis `REJECTED` se ne more samostojno ponovno aktivirati. Ohranita se UUID in prvotni `created_at`; zgodovina posameznih preklicev ni del F10.

### Življenjski cikel pogovora (F14)

| Status | Pomen |
|---|---|
| `PENDING` | Zahteva čaka na odločitev lastnika; sporočanje ni dovoljeno. |
| `ACTIVE` | Lastnik je zahtevo sprejel; sporočanje je omogočeno. |
| `REJECTED` | Lastnik je zahtevo zavrnil; sporočanje ni dovoljeno. |
| `INACTIVE` | Pogovor je zaprt; zgodovina je berljiva, novih sporočil ni mogoče poslati. |

- Ob nastanku je `PENDING`, `decided_at` in `closed_at` pa sta NULL. Samo lastnik aktivnega oglasa lahko odloči o čakajoči zahtevi ter nastavi ACTIVE ali REJECTED in `decided_at`.
- Deaktivacija, prodaja, oddaja ali logični izbris v isti transakciji zaprejo vse pogovore v INACTIVE. `closed_at` se zabeleži ob prvem zaprtju in se pozneje ne prepisuje. `decided_at` se ohrani oziroma ostane NULL pri še neobravnavani zahtevi.
- Zahteva za pogovor, odločanje in pošiljanje najprej zaklenejo oglas, nato pogovor ter ponovno preverijo status, `deleted_at` in udeležence. Tako umik oglasa prepreči sočasno sporočanje ali sprejetje zahteve po zaprtju.
- Ponovna oddaja zavrnjenega pogovora in odpiranje neaktivnega pogovora nista podprta. Zgodovina sporočil ostane berljiva; podrobnosti nedostopnega oglasa se nadomestijo z oznako »Oglas ni več aktiven« oziroma »Oglas je izbrisan«.
