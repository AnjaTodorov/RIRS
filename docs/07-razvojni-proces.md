# Razvojni proces in nastavitve GitHub

## GitHub Flow

Veja `main` vsebuje pregledano stanje projekta. Za vsako spremembo uporabimo kratkoživo vejo, na primer `docs/ureditev-repozitorija`, `feature/iskanje-oglasov` ali `fix/potrditev-ogleda`.

```bash
git switch main
git pull --ff-only
git switch -c feature/ime-spremembe
# Uredimo datoteke in preverimo spremembe.
git add pot/do/datoteke
git commit -m "Kratek opis spremembe"
git push -u origin feature/ime-spremembe
```

Na GitHubu odpremo pull request v `main`. Opišemo problem, spremembo in opravljeno preverjanje ter povežemo pripadajoči ADR, kadar spreminjamo pomembno arhitekturno odločitev. Pred združitvijo pregledamo razliko datotek in opravimo preverjanja, primerna spremembi. Odobritev druge osebe pri tej nalogi ni potrebna. Po združitvi lahko razvojno vejo izbrišemo in lokalni `main` posodobimo z `git pull --ff-only`.

Neposrednih sprememb, prisilnega potiskanja in brisanja `main` ne uporabljamo. Datoteke `.env`, gesla in strežniški ključi ne sodijo v repozitorij. Spremembe dokumentacije preverimo tudi s pregledom povezav in prikaza slik; ob implementaciji preverjanja razširimo na gradnjo in teste poslovnih pravil.

## Zaščita veje main

V **Settings → Branches → Add branch protection rule** nastavimo vzorec `main`:

| Nastavitev | Zahtevana vrednost |
|---|---|
| Require a pull request before merging | Vključeno |
| Zahtevano število odobritev | 0; možnost Require approvals ostane izključena |
| Allow force pushes | Izključeno |
| Allow deletions | Izključeno |
| Do not allow bypassing the above settings | Vključeno, tudi za administratorja |

Tabela opisuje zahtevano konfiguracijo. Dejansko stanje preverimo v nastavitvah oziroma z GitHub API. Ne dodajamo zahtevanih statusnih preverjanj, dokler ustrezni avtomatski postopki še ne obstajajo. Pravila preverimo s pull requestom iz razvojne veje v `main`; povezava in rezultat sta vidna v zavihku Pull requests repozitorija.

Uradna navodila: [zaščitene veje](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) in [nastavitev pravila](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule).

## GitHub Education in oddaja

Lastnica računa mora osebno oddati prijavo za [GitHub Education – Student Developer Pack](https://education.github.com/pack) in potrditi študentski status. Dokumentacija repozitorija ne potrjuje aktivacije paketa; ta korak preverimo v osebnem računu GitHub Education. Zaščita veje javnega repozitorija je na voljo tudi z GitHub Free.

Na Moodle oddamo datoteko [oddaja.txt](../oddaja.txt), ki vsebuje povezavo do javnega repozitorija. Pred oddajo preverimo dostopnost povezave brez prijave. Točen rok preverimo v Moodle.
