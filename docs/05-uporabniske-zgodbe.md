# Domora – uporabniške zgodbe (MVP)

## Skupna poslovna pravila

- **Obiskovalec** ni prijavljen. Pregleduje lahko samo javno objavljene oglase.
- **Iskalec** je prijavljen uporabnik z vlogo `SEEKER`. **Oglaševalec** ima vlogo `ADVERTISER` in lahko pri tujih oglasih nastopa tudi kot interesent. **Administrator** ima vlogo `ADMIN`.
- **Lastni oglas** je oglas, katerega `advertiser_id` je enak ID-ju prijavljenega uporabnika.
- **Statusi oglasa:** `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`, `INACTIVE`, `SOLD`, `RENTED`.
- **Statusi zahteve:** `PENDING`, `CONFIRMED`, `REJECTED`, `CANCELLED`.
- **Javni naslov** (`public_location`) je približna lokacija, ki jo lahko vidi vsak obiskovalec. **Natančni naslov** (`exact_address`) je zaseben, dokler interesent nima potrjenega ogleda aktivnega oglasa; vidi ga tudi lastnik oglasa in administrator pri pregledu.
- Cena je v EUR: pri prodaji skupna cena, pri najemu mesečna najemnina; površina je v m². Fotografije so povezane z oglasom.
- Oglas je **aktiven za javni prikaz in nove oglede** samo s statusom `PUBLISHED`. Termin ima začetek `starts_at` in konec `ends_at` ter mora imeti konec po začetku.
- Obvezni podatki za oddajo oglasa so naslov, opis, kraj, javna lokacija, natančen naslov, vrsta, namen ter pozitivna cena in površina.
- Za isti termin lahko zaprosi več interesentov; posamezni interesent ima največ eno zahtevo, termin pa največ eno potrjeno zahtevo.
- Po umiku, prodaji ali oddaji natančen naslov interesentu ni več dostopen. Prekličejo se samo prihodnje zahteve `PENDING` in `CONFIRMED`.
- Preverjanje pravic velja tudi za neposredne zahteve API; skrivanje gumbov ne zadošča.

## US-01 – Registracija računa

**Povezana funkcionalnost:** F01  
**Uporabniška vloga:** obiskovalec

**Uporabniška zgodba:** Kot obiskovalec želim ustvariti račun z izbrano vlogo, da lahko uporabljam funkcionalnosti, ki zahtevajo prijavo.

**Sprejemni kriteriji:**

1. KO obiskovalec odda veljavne registracijske podatke in izbere vlogo `SEEKER` ali `ADVERTISER`, MORA sistem ustvariti prijavni račun in z njim povezan profil z izbrano vlogo.
2. ČE obiskovalec poskuša pri registraciji izbrati vlogo `ADMIN`, POTEM MORA sistem registracijo s to vlogo zavrniti.
3. ČE registracijski podatki niso veljavni oziroma e-poštni naslov že pripada računu, POTEM MORA sistem prikazati napako in ne sme ustvariti podvojenega profila.
4. ČE uporabnik ne izpolni imena, priimka, uporabniškega imena ali telefonske številke, POTEM MORA sistem zahtevati dopolnitev profila.

## US-02 – Prijava in zaščiten dostop

**Povezana funkcionalnost:** F01  
**Uporabniška vloga:** registrirani uporabnik

**Uporabniška zgodba:** Kot registrirani uporabnik želim dostopati do svojega računa s prijavo, da lahko dostopam do dejanj svoje vloge.

**Sprejemni kriteriji:**

1. KO uporabnik vnese pravilne prijavne podatke, MORA sistem vzpostaviti prijavno sejo in prepoznati vlogo uporabnika iz profila.
2. ČE so prijavni podatki napačni, POTEM MORA sistem zavrniti prijavo brez ustvarjanja prijavljene seje.
3. ČE neprijavljen obiskovalec zahteva zaščiteno dejanje (npr. oddajo zahteve za ogled), POTEM MORA sistem zahtevati prijavo in ne sme izvesti dejanja.
4. ČE uporabnik poskuša izvajati dejanje, ki ni dovoljeno njegovi vlogi oziroma se nanaša na tuji zaščiten zapis, POTEM MORA sistem dejanje zavrniti.

## US-03 – Pregled in urejanje lastnega profila

**Povezana funkcionalnost:** F01  
**Uporabniška vloga:** registrirani uporabnik

**Uporabniška zgodba:** Kot registrirani uporabnik želim pregledati in posodobiti svoje kontaktne podatke, da so podatki v mojem profilu točni.

**Sprejemni kriteriji:**

1. KO uporabnik odpre svoj profil, MORA sistem prikazati ime, priimek, uporabniško ime, telefonsko številko in vlogo iz njegovega profila.
2. KO uporabnik shrani veljavne spremembe imena, priimka, uporabniškega imena ali telefonske številke, MORA sistem posodobiti samo njegov profil.
3. ČE novo uporabniško ime že uporablja drug profil, POTEM MORA sistem spremembo zavrniti in ohraniti prejšnjo vrednost.
4. ČE uporabnik poskuša prek urejanja profila spremeniti svojo vlogo ali podatke tujega profila, POTEM MORA sistem poseg zavrniti.

## US-04 – Ustvarjanje osnutka oglasa

**Povezana funkcionalnost:** F02  
**Uporabniška vloga:** oglaševalec

**Uporabniška zgodba:** Kot oglaševalec želim ustvariti osnutek oglasa za nepremičnino, da lahko podatke pripravim pred objavo.

**Sprejemni kriteriji:**

1. KO prijavljeni oglaševalec ustvari oglas, MORA sistem novemu oglasu dodeliti status `DRAFT` in kot lastnika zapisati prijavljenega oglaševalca.
2. KO oglaševalec v osnutek shrani naslov, opis, kraj, javno lokacijo, natančni naslov, vrsto nepremičnine, namen `SALE`/`RENT`, ceno in površino, MORA sistem ohraniti vnesene podatke.
3. DOKLER ima oglas status `DRAFT`, MORA sistem preprečiti njegov prikaz v javnih rezultatih iskanja.
4. ČE ustvarjanje osnutka zahteva uporabnik brez vloge oglaševalca ali spreminjanje zahteva uporabnik, ki ni lastnik, POTEM MORA sistem poseg zavrniti.

## US-05 – Dodajanje fotografij oglasa

**Povezana funkcionalnost:** F02  
**Uporabniška vloga:** oglaševalec

**Uporabniška zgodba:** Kot oglaševalec želim svojemu oglasu dodati fotografije, da lahko interesentom pokažem nepremičnino.

**Sprejemni kriteriji:**

1. KO lastnik oglasa doda veljavno slikovno datoteko, MORA sistem shraniti fotografijo in jo povezati z njegovim oglasom.
2. KO se fotografija uspešno naloži, MORA sistem v urejevalniku prikazati njen predogled.
3. KO lastnik odstrani fotografijo iz urejanega oglasa, MORA sistem odstraniti njeno povezavo z oglasom in je ne sme več prikazovati ob oglasu.
4. ČE uporabnik poskuša dodati ali odstraniti fotografijo pri tujem oglasu, POTEM MORA sistem poseg zavrniti.

## US-06 – Oddaja oglasa v pregled

**Povezana funkcionalnost:** F02  
**Uporabniška vloga:** oglaševalec

**Uporabniška zgodba:** Kot oglaševalec želim pripravljen oglas oddati administratorju v pregled, da bo po odobritvi lahko javno objavljen.

**Sprejemni kriteriji:**

1. KO lastnik odda popoln osnutek oglasa z obveznimi podatki iz skupnih pravil, MORA sistem status spremeniti iz `DRAFT` v `PENDING_REVIEW`.
2. ČE manjka kateri od zahtevanih podatkov oziroma cena ali površina ni pozitivna, POTEM MORA sistem oddajo zavrniti in navesti problematična polja.
3. DOKLER je oglas v statusu `PENDING_REVIEW`, MORA sistem preprečiti njegovo javno objavo brez odobritve administratorja.
4. ČE oddajo zahteva uporabnik, ki ni lastnik oglasa, POTEM MORA sistem operacijo zavrniti.

## US-07 – Odobritev oglasa

**Povezana funkcionalnost:** F03  
**Uporabniška vloga:** administrator

**Uporabniška zgodba:** Kot administrator želim odobriti ustrezen oglas, da je ustrezna ponudba javno dostopna.

**Sprejemni kriteriji:**

1. KO administrator odpre seznam oglasov za pregled, MORA sistem prikazati oglase s statusom `PENDING_REVIEW`.
2. KO administrator odpre izbrani oglas, MORA sistem prikazati njegove podatke, fotografije in natančni naslov za presojo.
3. KO administrator odobri oglas v statusu `PENDING_REVIEW`, MORA sistem spremeniti status v `PUBLISHED` in zabeležiti pregledovalca.
4. ČE oglas ni v statusu `PENDING_REVIEW` ali odobritev zahteva neadministrator, POTEM MORA sistem odobritev zavrniti.

## US-08 – Zavrnitev oglasa

**Povezana funkcionalnost:** F03  
**Uporabniška vloga:** administrator

**Uporabniška zgodba:** Kot administrator želim zavrniti neustrezen oglas z obrazložitvijo, da oglaševalec ve, katere pomanjkljivosti mora odpraviti.

**Sprejemni kriteriji:**

1. KO administrator zavrne oglas v statusu `PENDING_REVIEW` z neprazno obrazložitvijo, MORA sistem shraniti status `REJECTED`, razlog in pregledovalca.
2. ČE je obrazložitev prazna ali vsebuje samo presledke, POTEM MORA sistem zavrnitev preprečiti in ohraniti `PENDING_REVIEW`.
3. DOKLER je oglas `REJECTED`, MORA sistem preprečiti njegov javni prikaz.
4. ČE zavrnitev zahteva neadministrator ali oglas ni `PENDING_REVIEW`, POTEM MORA sistem dejanje zavrniti brez spremembe oglasa.

## US-09 – Popravek in ponovna oddaja oglasa

**Povezana funkcionalnost:** F03  
**Uporabniška vloga:** oglaševalec

**Uporabniška zgodba:** Kot oglaševalec želim popraviti zavrnjen oglas in ga ponovno oddati, da lahko po odpravi pomanjkljivosti dosežem objavo.

**Sprejemni kriteriji:**

1. KO lastnik odpre zavrnjen oglas, MORA sistem prikazati razlog zavrnitve in podatke za popravek.
2. KO lastnik shrani veljavne popravke zavrnjenega oglasa, MORA sistem ohraniti popravljene podatke s statusom `REJECTED`.
3. KO lastnik ponovno odda popoln zavrnjen oglas, MORA sistem neposredno spremeniti `REJECTED` v `PENDING_REVIEW`.
4. ČE ob ponovni oddaji manjkajo obvezni podatki ali cena oziroma površina ni pozitivna, POTEM MORA sistem oddajo zavrniti in označiti neveljavna polja.
5. ČE popravljanje ali ponovno oddajo zahteva uporabnik, ki ni lastnik oglasa, POTEM MORA sistem poseg zavrniti.

## US-10 – Pregled objavljenih oglasov

**Povezana funkcionalnost:** F04  
**Uporabniška vloga:** obiskovalec

**Uporabniška zgodba:** Kot obiskovalec želim pregledati trenutno objavljene nepremičnine, da lahko najdem ponudbe brez registracije.

**Sprejemni kriteriji:**

1. KO obiskovalec odpre seznam nepremičnin brez filtrov, MORA sistem vrniti samo oglase s statusom `PUBLISHED`.
2. KO sistem prikaže rezultate iskanja, MORA sistem za vsak oglas prikazati vsaj naslov, kraj, vrsto oziroma namen, ceno, površino in razpoložljivo naslovno fotografijo.
3. ČE javno objavljenih oglasov ni, POTEM MORA sistem prikazati sporočilo, da trenutno ni oglasov.
4. KO sistem vrne podatke javnega oglasa, MORA sistem prikazati `public_location` in izpustiti `exact_address`.
5. KO obiskovalec odpre objavljeni oglas, MORA sistem prikazati opis, fotografije, kraj, javno lokacijo, ceno, površino, vrsto nepremičnine in namen oglasa.

## US-11 – Kombinirano filtriranje oglasov

**Povezana funkcionalnost:** F04  
**Uporabniška vloga:** obiskovalec

**Uporabniška zgodba:** Kot obiskovalec želim filtrirati oglase po svojih merilih, da hitreje najdem primerno nepremičnino.

**Sprejemni kriteriji:**

1. KO obiskovalec izbere enega ali več filtrov za kraj, cenovni razpon, razpon površine, vrsto nepremičnine ali namen `SALE`/`RENT`, MORA sistem prikazati samo objavljene oglase, ki ustrezajo **vsem** nastavljenim filtrom.
2. KO obiskovalec odstrani filter, MORA sistem pri ponovnem iskanju upoštevati preostale filtre.
3. ČE je najmanjša cena ali površina večja od največje vrednosti istega razpona, POTEM MORA sistem prikazati validacijsko napako in ne sme izvesti iskanja z neveljavnim razponom.
4. ČE noben objavljen oglas ne ustreza izbranim merilom, POTEM MORA sistem prikazati sporočilo »Ni zadetkov«.

## US-12 – Dodajanje termina ogleda

**Povezana funkcionalnost:** F05  
**Uporabniška vloga:** oglaševalec

**Uporabniška zgodba:** Kot oglaševalec želim določiti proste termine za ogled svoje nepremičnine, da lahko interesenti izberejo čas obiska.

**Sprejemni kriteriji:**

1. KO lastnik objavljenega oglasa vnese začetni in končni čas prihodnjega termina, pri čemer je konec po začetku, MORA sistem termin shraniti pri njegovem oglasu.
2. ČE novi termin časovno prekriva obstoječi termin istega oglasa, POTEM MORA sistem ustvarjanje zavrniti.
3. ČE začetek termina ni v prihodnosti ali konec ni po začetku, POTEM MORA sistem ustvarjanje zavrniti.
4. ČE uporabnik poskuša ustvariti termin pri tujem oziroma neobjavljenem oglasu, POTEM MORA sistem operacijo zavrniti.

## US-13 – Prikaz razpoložljivih terminov

**Povezana funkcionalnost:** F05  
**Uporabniška vloga:** iskalec oziroma interesent

**Uporabniška zgodba:** Kot interesent želim videti proste termine oglasa, da lahko izberem čas, ki mi ustreza.

**Sprejemni kriteriji:**

1. KO interesent odpre objavljeni oglas, MORA sistem prikazati prihodnje termine s časom začetka in konca.
2. ČE ima termin že potrjeno zahtevo, POTEM MORA sistem preprečiti njegovo izbiro za novo zahtevo.
3. ČE oglas nima prostih prihodnjih terminov, POTEM MORA sistem prikazati sporočilo »Ni razpoložljivih terminov«.
4. DOKLER oglas ni objavljen, MORA sistem preprečiti javni prikaz njegovih terminov.

## US-14 – Oddaja zahteve za ogled

**Povezana funkcionalnost:** F05  
**Uporabniška vloga:** iskalec oziroma oglaševalec kot interesent tujega oglasa

**Uporabniška zgodba:** Kot interesent želim oddati zahtevo za izbrani prosti termin, da lahko zaprosim za ogled nepremičnine.

**Sprejemni kriteriji:**

1. KO prijavljeni interesent izbere prost prihodnji termin tujega objavljenega oglasa in odda zahtevo, MORA sistem ustvariti zahtevo s statusom `PENDING`, povezano s terminom in interesentom.
2. ČE interesent že ima zahtevo za isti termin (ne glede na status), POTEM MORA sistem novo zahtevo zavrniti, ker je kombinacija `slot_id` in `seeker_id` enolična.
3. ČE uporabnik poskuša oddati zahtevo za svoj oglas, POTEM MORA sistem dejanje zavrniti.
4. ČE termin ni več prost, se je že začel ali oglas ni objavljen, POTEM MORA sistem zavrniti zahtevo brez ustvarjanja novega zapisa.

## US-15 – Pregled prejetih zahtev

**Povezana funkcionalnost:** F06  
**Uporabniška vloga:** oglaševalec

**Uporabniška zgodba:** Kot oglaševalec želim videti zahteve za oglede svojih oglasov, da lahko odločim, koga bom sprejel.

**Sprejemni kriteriji:**

1. KO oglaševalec odpre zahteve za svoj oglas, MORA sistem prikazati povezane zahteve s terminom, interesentom in statusom.
2. KO oglaševalec izbere zahtevo, MORA sistem prikazati morebitno sporočilo interesenta.
3. ČE oglaševalec poskuša odpreti zahteve tujega oglasa, POTEM MORA sistem dostop zavrniti.
4. KO se status zahteve spremeni v `CONFIRMED`, `REJECTED` ali `CANCELLED`, MORA sistem pri naslednjem prikazu izpisati spremenjeni status.

## US-16 – Potrditev zahteve in preprečevanje dvojne rezervacije

**Povezana funkcionalnost:** F06  
**Uporabniška vloga:** oglaševalec

**Uporabniška zgodba:** Kot oglaševalec želim potrditi eno zahtevo za termin, da je termin rezerviran samo za enega interesenta.

**Sprejemni kriteriji:**

1. KO lastnik potrdi čakajočo zahtevo za prost prihodnji termin svojega objavljenega oglasa, MORA sistem nastaviti njen status na `CONFIRMED`.
2. KO sistem potrdi izbrano zahtevo, MORA sistem v isti transakciji vse druge zahteve za isti termin s statusom `PENDING` spremeniti v `REJECTED`.
3. ČE je za termin že potrjena druga zahteva, POTEM MORA sistem novo potrditev zavrniti; tudi ob sočasnih potrditvah sme za isti termin ostati največ ena zahteva `CONFIRMED`.
4. ČE poskuša potrjevati uporabnik, ki ni lastnik oglasa, ali zahteva nima statusa `PENDING`, termin ni več prihodnji ali oglas ni `PUBLISHED`, POTEM MORA sistem poseg zavrniti.

## US-17 – Zavrnitev posamezne zahteve

**Povezana funkcionalnost:** F06  
**Uporabniška vloga:** oglaševalec

**Uporabniška zgodba:** Kot oglaševalec želim zavrniti posamezno zahtevo, da lahko termin ponudim drugim interesentom.

**Sprejemni kriteriji:**

1. KO lastnik objavljenega oglasa pred začetkom termina zavrne zahtevo v statusu `PENDING`, MORA sistem status spremeniti v `REJECTED`.
2. KO je posamezna čakajoča zahteva zavrnjena, MORA sistem ohraniti termin prost, če zanj ni nobene potrjene zahteve.
3. ČE zahteva ni `PENDING`, se je termin že začel ali oglas ni `PUBLISHED`, POTEM MORA sistem poskus njenega zavračanja kot čakajoče zahteve zavrniti.
4. ČE zavrnitev zahteva oseba, ki ni lastnik oglasa, POTEM MORA sistem poseg zavrniti.

## US-18 – Spremljanje statusa in razkritje naslova

**Povezana funkcionalnost:** F06  
**Uporabniška vloga:** interesent

**Uporabniška zgodba:** Kot interesent želim spremljati stanje svojih zahtev in ob potrditvi videti natančno lokacijo ogleda, da vem, ali in kam naj pridem.

**Sprejemni kriteriji:**

1. KO interesent odpre seznam svojih zahtev, MORA sistem prikazati samo njegove zahteve ter status, pripadajoči oglas in čas termina.
2. DOKLER ima njegova zahteva status `PENDING` ali `REJECTED`, MORA sistem skriti natančni naslov in prikazati največ javno lokacijo oglasa.
3. KO je njegova zahteva `CONFIRMED` in je oglas še `PUBLISHED`, MORA sistem v podrobnostih potrjenega ogleda prikazati `exact_address`.
4. ČE poskuša interesent prebrati zahtevo drugega uporabnika ali naslov brez upravičenja, POTEM MORA sistem dostop zavrniti tudi prek API-ja.

## US-19 – Umik objavljenega oglasa

**Povezana funkcionalnost:** F07  
**Uporabniška vloga:** oglaševalec

**Uporabniška zgodba:** Kot oglaševalec želim umakniti svoj objavljeni oglas, da ne prejemam več novih interesentov.

**Sprejemni kriteriji:**

1. KO lastnik umakne oglas v statusu `PUBLISHED`, MORA sistem njegov status nastaviti na `INACTIVE`.
2. KO oglas preide v `INACTIVE`, MORA sistem preprečiti njegov javni prikaz in oddajo novih zahtev za ogled.
3. KO je oglas umaknjen, MORA sistem njegove prihodnje zahteve v statusih `PENDING` in `CONFIRMED` spremeniti v `CANCELLED`.
4. ČE umik poskuša sprožiti uporabnik, ki ni lastnik oglasa, POTEM MORA sistem dejanje zavrniti.

## US-20 – Označitev nepremičnine kot prodane ali oddane

**Povezana funkcionalnost:** F07  
**Uporabniška vloga:** oglaševalec

**Uporabniška zgodba:** Kot oglaševalec želim označiti svojo nepremičnino kot prodano ali oddano, da se zaključena ponudba odstrani iz iskanja in se ne dogovarjajo novi ogledi.

**Sprejemni kriteriji:**

1. KO lastnik označi objavljeni oglas kot prodan pri namenu `SALE` oziroma oddan pri namenu `RENT`, MORA sistem shraniti status `SOLD` oziroma `RENTED`.
2. ČE uporabnik poskuša označiti prodajni oglas kot `RENTED` ali najemni oglas kot `SOLD`, POTEM MORA sistem zavrniti neustrezno spremembo.
3. KO oglas preide v `SOLD` ali `RENTED`, MORA sistem preprečiti njegov javni prikaz in oddajo novih zahtev za ogled.
4. KO je oglas zaključen, MORA sistem vse njegove prihodnje čakajoče in potrjene oglede preklicati s statusom zahtev `CANCELLED`.
5. ČE zaključek zahteva uporabnik, ki ni lastnik, ali oglas ni `PUBLISHED`, POTEM MORA sistem spremembo zavrniti.

## Odprta vprašanja

O naslednjih podrobnostih odloči nosilec projekta pred implementacijo povezanih zgodb:

- **Registracija (US-01):** Ali je pred uporabo računa obvezna potrditev e-poštnega naslova?
- **Fotografije (US-05, US-06):** Kateri formati in velikosti datotek so dovoljeni, koliko fotografij je mogoče dodati in ali je vsaj ena obvezna ob oddaji oglasa?
- **Termini (US-12):** Ali sta določena najmanjše oziroma največje trajanje termina in minimalen čas med zahtevo ter začetkom ogleda? Kateri časovni pas se uporablja pri prikazu?
- **Zaključeni oglasi (US-18–US-20):** Kateri podatki oglasa ostanejo v zgodovini zahtev po zaključku? Natančen naslov interesentu po zaključku ni več dostopen.
