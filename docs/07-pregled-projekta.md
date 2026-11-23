US-01 Registracija računa

Za začetek sem se registriral s svojim osebnim mailom in dodal postfix +iskalec/+oglasevalec itd..Sporočilo je ustrezno bilo poslano 
na moj email naslov, prijava je pa po aktivaciji tudi delovala kot pričakovano.

V primeru da sem napačno vnesel podatke, me je obrazec o tem obvestil.

Izbira vloge admin ni bila mogoča, ker UI pravilno skrije tisti window.

US-02 Prijava

Ko sem se prijavil pod vlogo iskalec, sem lahko gledal svoj račun, se odjavil in pregledal objavljene nepremičnine. Pri prijavi me je 
zavrnilo, če sem vnesel napačne podatke. 

Če sem želel objaviti oglas, me je sistem pravilno preusmeril na ustvarjanje računa z vlogo "advertiser". Aplikacija pravilno omejuje dostop.

US-03 Pregled in urejanje lastnega profila

Kot v prejšnjem US, pregled profila deluje pravilno, vsi podatki se pravilno izpišejo, lahko pa jih tudi spremenim.
Spremembe se pokazejo samo na mojem racunu, so tudi takojsnje. 

US-04 ustvarjanje osnutka oglasa

Status draft je dodeljen pravilo. Na vrhu na desni strani piše "osnutek". 
Pravilno se tudi izriše dropdown, ki prikazuje izbiro namena oglasa.
Po prijavi na račun iskalca, se ta oglas pravilno še ne prikazuje na domači strani. 
Ustvarjanje zahtevka kot navaden uporabnik ni mogoče (sistem zavrne)
Po oddaji oglasa ga more administrantor pregledati. (Uporabnika moraš seedati z ukazom)
Oglas je po odobritvi viden vsem.

US-05 Dodajanje fotografij

Sistem sliko pravilno shrani, omogoča shranjevanje več slik in izbiro naslovne. V primeru da sliko med urejanjem odstraniš, na oglasu ni več vidna.
Dodajanje slike pri tujem oglasu ni mogoče.

US-06 Oddaja oglasa v pregled

Po oddaji oglasa sistem pravilno pokaze status (v pregledu).
V primeru manjkajočih podatkov sistem ne dovoli oddaje oglasa
Oglas, ki ni odobren ni viden na domači strani za vse uporabnike


US-07- Odobritev oglasa

Po ustvarjanju računa (in seedanju z ukazom) se na strani moj racun pokaze moznost za pregled pending oglasov. Status se pravilno izpise in tudi pravilno so razvrsceni po kategorijah
Sistem pravilno prikaze podatke o oglasu
Status se pravilno spremeni

US-08
Oglas lahko zavrnem. Sistem prepreci oddajo "zavrnitve", če obrazec ni pravilno izpolnjen.
Če je oglas zavrnjen se ne prikaze na strani
Noben drug user ne more dostopati do "zavrni", če ni admin

US-09
V primeru da admin zavrne oglas, se v "moji oglasi" izpiše razlog in pa status se pravilno nastavi na zavrnjen. Oglas lahko potem uredim
in ga ponovno pošljem administratorju v pregled.
Status se po tem pravilno nastavi na "v pregledu"
če pri ponovni oddaji kaj manjka, ti sistem ne pusti oddaje.


US-10

Odpiranje seznama nepremičnin brez filtrov prikaze vse trenutno objavljene oglase
Sistem pravilno pokaže naslov, ceno, namen...
Če oglasov ni sistem pravilno napiše da "Trenutno ni objavljenih oglasov. Vrnite se kmalu ali postanite del ponudbe s svojo nepremičnino."
Sistem pravilno napiše public location, ne poda pa točnega naslova
Ko kliknem na oglas se izpišejo vsi podatki o njem, prikazejo se slike..

US-11
Pokažejo se samo oglasi, ki dejansko ustrezajo filtrom. Če nobeden ne ustreza, se izpiše da noben oglas ni ustrezal filtrom
Sistem takoj po odstranitvi pravilno povrne rezultate filtriranja
Sistem tudi ne pusti iskanja z napacnim razponom

US-12: Dodajanje termina ogleda

Sistem pravilno dodeli čas termina
Tiste ki se prekrivajo pravilno zavrne. 
Sistem tudi pravilno zavrne termine, ki so izven veljavnega razpona
Pri tujem oglasu ustvarjanje terminov ni mogoče.

US-13: Prikaz razpoložljivih terminov

Pri odpiranju oglasa se pokazejo vsi razpolozljivi termini.
Sistem, ki že ima potrjen termin, ne pusti, da bi ga potrdili še enkrat.
Če ni terminov, se pravilno to izpiše
Če oglas ni objavljen, do terminov ne moremo dostopati

US-14

Oddaja zateve deluuje pravilno, okno pa se po oddaji ne počisti in je malo težko takoj razbrati, ali je zahteva oddana ali ne. 
Za isti termin ne morem poslati 2x zahteve
Status se pravilno nastavi na pending, dokler je oglasevalec ne potrdi.
Oddaja zahteve za svoj oglas ni mogoča


US-15

Pregled zahtev za posamezen oglas deluje (mogoče bi si želel kako možnost, da bi lahko videl zahteve za vse oglase naenkrat)
Sistem ustrezno prikaze sporocilo interesenta
Odpiranje tujih zahtev ni mogoče
Status se pravilno spremeni

US-16 

Potrditev zahteve ustrezno nastavi status na potrjeno
Reezerviranje istega termina nato na glavni strani ni mogoče.
Če je več zahtev, se vse ostale avtomatsko zavrnejo.
Sistem ne dovoli upravljanja tujih zahtev

US-17

Sistem ustrezno spremeni status in pokaže zavrnjeno, po tem ko zavrneš zahtevo. Termin tudi ostane prost, drug uporabnik ga lahko rezervira.
Oglasa ne more zavrniti nihče drug, kot le lastnik

US-18

V seznamu zahtev lahko interesent vidi vse svoje zahteve, vidi tudi status. Izpišejo se vsi potrebni dodatki
Natančen naslov se pojavi šele PO tem, ko je termin potrjen
Naslov je pravilno prikazan v svojem razdelku

US-19

Status oglasa se po umiku pravilno nastavi.
Oglas po oukinitvi ni več viden na domači strani.
Vse zahteve se pravilno označijo kot canceled, nadaljne niso več mogoče.


US-20

Status se ustrezno nastavi po prodaju nepremicnine.
Aplikacija ne pusti našpačne izbire (torej sold ne moreš dati na rented nepremičnino)
Prodan oglas se umakne iz domače strani, nadaljnje pošiljanje zahtev ni možno.
Vse zahteve se isto kot pri US-19 nastavijo na cancelled.
5. Tretji uporabnik ne more zaključiti tujega oglasa.


