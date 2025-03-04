# Gramatyk

**Gramatyk** to aplikacja internetowa zbudowana w `Next.js`, która pozwala pobierać i prezentować odmianę morfologiczną
słowa ze strony [morfologia.com.pl](https://www.morfologia.com.pl). Aplikacja przetwarza podane słowo, zamienia polskie
znaki diakrytyczne na określone ciągi znaków (np. "bóg" → "b_og"), generuje odpowiedni URL i pobiera stronę przez API
proxy (serverless function), aby ominąć ograniczenia CORS. Następnie aplikacja analizuje pobraną stronę, wyodrębnia
tabelę z danymi oraz prezentuje wyniki w przejrzystej tabeli z kolorowymi etykietami.

## Funkcjonalności

- **Konwersja słów:**  
  Aplikacja zamienia polskie znaki (ć, ł, ń, ś, ź, ż, ó) na określone ciągi znaków wykorzystywane przy generowaniu URL.

- **Pobieranie zawartości:**  
  Używamy wbudowanego API proxy (serverless function) umieszczonego w folderze `app/api/proxy` by pobierać HTML strony
  docelowej, omijając problemy CORS.

- **Parsowanie i analiza:**  
  Aplikacja analizuje pobraną stronę, wyodrębnia tabelę z danymi oraz przekształca ją w strukturę danych.

- **Formatowanie wyników:**  
  Wyniki (odmiana morfologiczna) są wyświetlane w tabeli, a poszczególne etykiety (część mowy, liczba) są prezentowane w
  kolorowych pudełkach, dostosowanych do wartości (np. czerwony dla "czasownik", niebieski dla "rzeczownik", fioletowy
  dla innych).

## Technologie

- **Next.js 13 (App Router):**  
- **React:**  
- **CSS:**  
- **Serverless API Proxy:**  

## Instalacja i Uruchomienie

1. **Klonowanie repozytorium:**

```bash
   git clone https://github.com/<TWOJ_GITHUB_USERNAME>/<REPO_NAME>.git
   cd <REPO_NAME>
```

2. **Instalacja zależności:**

```bash
npm install
```

3. **Uruchomienie aplikacji w trybie deweloperskim:**

```bash
    npm run dev
```

Aplikacja będzie dostępna lokalnie pod adresem http://localhost:3000.

4. **Budowanie**

* Budowanie aplikacji:
```bash
    npm run build
```

* Next.js wygeneruje infrastrukturę budowania w folderze `.next.`
5. **Deploy na Vercel**
* Umieść repozytorium na GitHub.
* Zaloguj się na Vercel i zaimportuj projekt.
* Vercel automatycznie wykryje, że masz projekt Next.js oraz API routes i wdroży go.
* Po zakończeniu deploy’u Twoja aplikacja będzie dostępna pod adresem (np. https://`STRONA`.vercel.app).

6. **Użycie**
* W polu tekstowym wpisz słowo (np. tworzyć, wysyłać, odmieniać, zgon, bóg).
* Kliknij przycisk "Pobierz tabelę" lub naciśnij Enter.
7. **Aplikacja:**
* Przetwarza słowo, zamienia polskie znaki i generuje odpowiedni URL.
* Pobiera stronę docelową przez API proxy.
* Wyodrębnia tabelę z danymi i parsuje jej zawartość.
Prezentuje wyniki w tabeli z kolorowymi etykietami (np. czerwonym dla "czasownik", niebieskim dla "rzeczownik", fioletowym dla innych).

***Uwagi***

    Jeśli wystąpią problemy z pobieraniem danych z zewnętrznej strony, sprawdź konfigurację API proxy w app/api/proxy/route.js oraz upewnij się, że serwer docelowy nie odrzuca zapytań.
    W razie potrzeby możesz dostosować reguły transformacji polskich znaków w funkcji transformPolish.

***Licencja***

Ten projekt jest udostępniany na licencji `MIT`.