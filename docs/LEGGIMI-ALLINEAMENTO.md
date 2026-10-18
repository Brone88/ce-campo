# C’è Campo — Documenti riallineati al 18 ottobre 2026

## Come applicare

La cartella `docs` contiene tutti i nove Markdown, con gli stessi nomi dello ZIP ricevuto. Sostituire i corrispondenti file in `C:\Users\brone\personal-projects\ce-campo\docs`, dopo avere conservato la versione precedente nel proprio sistema di versionamento.

Questa consegna aggiorna le specifiche. Non modifica codice, configurazioni provider, file sul PC Windows o il mockup Figma.

## Modifiche principali

| Documento | Intervento |
|---|---|
| Budget massimo | Confermata eliminazione del budget utente; limiti Telnyx separati dalla conclusione della pratica; prestito e quota piattaforma distinti |
| Whitelist strutture | WhatsApp Telnyx; ruoli senza account cliente; evidenza richiesta per il gate voce pre-risposta |
| Linking WhatsApp | Contratti riscritti per Telnyx, firma, identità di servizio, feed WABA/Profilo, outbox, migrazione e vincoli di invio |
| Admin strutture | Wizard in sei passi, Indoor/Outdoor obbligatorio anche nello schema, tipologie 5/7/9/11, binding e revoche |
| Funzionale/UX | Prenota/Storico/Account, selezione e ordine nelle card, raggio massimo 1–100 km, prezzi per 90 minuti e snapshot |
| Credit wallet | Rimosse le istruzioni residue di budget; ammissione e quota piattaforma; prestito solo per eventuali penali |
| Reportistica | Costi Telnyx, nessun doppio conteggio, correlazione eventi, dati mancanti espliciti e limiti della telemetria vocale |
| Registrazione | Sostituiti Pass/trial/abbonamenti con wallet e bonus; preservate verifiche Google/passkey/OTP/SPID/CIE e recupero |
| Telegram hardening | Preservata conferma PWA; binding struttura separati, scope bot e continuità con orchestratore testuale |

## Discrepanze del mockup trattate esplicitamente

- **Telefonate al cliente (014/060):** non implementare; contraddicono la decisione di telefonia riservata alle strutture.
- **Una ricerca attiva (094):** la nota Figma la indica come regola da confermare. Non introdotta come vincolo definitivo.
- **Link email:** il file più recente caricato nello ZIP sceglie OTP Resend. Conservato OTP; la schermata grafica va adattata.
- **Telegram:** produzione richiede conferma PWA anche se il prototipo la semplifica.
- **Calcio a 9:** resta previsto. Corretto il vecchio 8 nel piano booking; la demo con 5/7/11 non restringe il dominio.
- **Raggio:** adottato il controllo più recente visibile 1–100 km a una maniglia, esplicitando la vecchia nota di allineamento.
- **Importi e ricariche:** esempi e placeholder non diventano listino o pagamenti reali. Politica del prestito ancora da completare.

## Architettura e prove

Telnyx sostituisce GPT-Live nella voce e Wazzup24 nel trasporto WhatsApp. Non sostituisce automaticamente l’orchestratore testuale OpenAI, il backend, i tool di dominio o Telegram.

I runbook disponibili documentano telefonia Telnyx, inizializzazione dinamica, tool demo e consegna WhatsApp reale. Non documentano il gate whitelist prima della risposta, la persistenza completa, i costi definitivi o prenotazioni reali: questi punti restano criteri di implementazione/collaudo, non risultati già ottenuti.

## Fonti

- ZIP dei nove documenti fornito in questa conversazione.
- [Figma C’è Campo, pagina 2:267](https://www.figma.com/design/LKEJGcZxs9jXnPRx3wrBE5/cecampo?node-id=2-267), lettura di testi/note e verifica visiva della home il 18 ottobre 2026.
- `Blueprint_Telnyx_Voice_AI_Digital_Mop_Configurazione_Operativa.md`, contenuto corrente letto il 18 ottobre.
- `Telnyx_WhatsApp_Runbook_Solo_Configurazioni_Esterne.md`, contenuto corrente letto il 18 ottobre.
- [Telnyx WhatsApp Quickstart](https://developers.telnyx.com/docs/messaging/whatsapp/quickstart).
- [Telnyx eventi Coexistence](https://developers.telnyx.com/docs/messaging/whatsapp/coexistence/webhooks).
- [Telnyx Dynamic Variables](https://developers.telnyx.com/docs/inference/ai-assistants/dynamic-variables).

## Verifica della consegna

Controllati: presenza di tutti i nove filename originali, modifiche a ogni documento, delimitatori dei blocchi di codice, numerazione delle sezioni principali, riferimenti al vecchio webhook e istruzioni residue di budget, coerenza dei principali vincoli tra piani. Nessun test applicativo dichiarato: il repository non è stato eseguito.
