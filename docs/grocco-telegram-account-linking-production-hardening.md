# PATCH — Telegram Account Linking: Production Hardening

**Progetto:** Digital Mop / Prenotazione Campi  
**Tipo:** Patch incrementale, esclusivamente produzione  
**Stato:** Piano di implementazione  
**Priorità:** Necessaria prima del rilascio pubblico

---

## 1. Obiettivo e perimetro

Convertire il collegamento Telegram utilizzato nella demo in un sistema adatto alla produzione, preservando l'architettura multicanale esistente.

### Obiettivi

- Collegare un account Telegram a un utente Digital Mop autenticato.
- Evitare associazioni non autorizzate e account takeover.
- Richiedere una conferma esplicita all'interno della PWA.
- Salvare permanentemente i collegamenti in MongoDB.
- Garantire unicità, scadenza e consumo monouso dei token.
- Gestire richieste concorrenti e webhook duplicati.
- Permettere di scollegare e ricollegare Telegram.
- Riutilizzare l'orchestratore AI condiviso senza introdurne uno specifico per Telegram.
- Rendere lo stato del collegamento consultabile dalla PWA.

### Vincoli

1. Non alterare gli endpoint `/demo/telegram/*`.
2. Non cambiare la procedura di collegamento già funzionante in demo.
3. Non sostituire l'attuale autenticazione con quella di Telegram.
4. Non considerare il numero telefonico sufficiente a identificare un account Telegram.
5. Non duplicare la logica AI, le regole di prenotazione o la gestione dei crediti.
6. Non introdurre subscription o costi fissi per il canale Telegram.
7. Non consentire operazioni di prenotazione a utenti la cui identità Digital Mop non sia verificata, secondo le regole generali già definite.

## 2. Architettura proposta

Mantenere due implementazioni del collegamento che rispettino un contratto applicativo comune.

**Demo**

- Autenticazione tramite `X-Demo-Secret`.
- `userId` esplicito in Postman.
- Stato in memoria attraverso `Map`.
- Collegamento completato alla ricezione di `/start TOKEN`.
- Nessuna conferma aggiuntiva.

**Produzione**

- Autenticazione tramite sessione reale della PWA.
- Identificativo utente derivato dalla sessione.
- Token e associazioni persistiti in MongoDB.
- `/start TOKEN` registra soltanto la richiesta di collegamento.
- Conferma definitiva nella PWA.
- Revoca e ricollegamento supportati.
- Operazioni critiche atomiche e idempotenti.

### Separazione dei componenti

Organizzazione logica suggerita:

```text
services/
  telegram-link.js
  telegram-link-demo.js
  telegram-link-production.js

routes/
  demo-telegram.js
  telegram-account.js

webhooks/
  telegram.js
```

I nomi sono indicativi e andranno adattati alla struttura effettiva del repository.

Il webhook Telegram resta unico:

`POST /webhooks/telegram`

Solo la gestione del collegamento viene delegata al servizio specifico dell'ambiente.

La selezione demo/produzione deve essere esplicita in configurazione. Non deve esistere un fallback automatico alla modalità demo in caso di errore MongoDB o autenticazione.

## 3. Modello dati MongoDB

### 3.1 Collection `channel_links`

Memorizza le associazioni fra account Digital Mop e provider esterni.

Esempio:

```json
{
  "provider": "telegram",
  "userId": "digitalmop_user_123",
  "externalUserId": "123456789",
  "chatId": "123456789",
  "status": "active",
  "linkedAt": "2026-10-10T10:00:00.000Z",
  "updatedAt": "2026-10-10T10:00:00.000Z"
}
```

Requisiti:

- Identificativi Telegram trattati come stringhe.
- `userId` riferito all'identità interna Digital Mop.
- Stato dell'associazione esplicito.
- Nessun numero di telefono necessario.
- I dati anagrafici rimangono nella collection utenti.

Vincoli di unicità per le associazioni attive:

- `(provider, userId)` univoco.
- `(provider, externalUserId)` univoco.

Utilizzare indici univoci parziali filtrati su `status: "active"`.

Questo impedisce che un account Telegram sia associato contemporaneamente a due utenti Digital Mop e che un utente abbia due collegamenti Telegram attivi.

I collegamenti storici possono essere disattivati senza perdere le informazioni necessarie per audit.

### 3.2 Collection `telegram_link_requests`

Gestisce il processo temporaneo di collegamento.

```json
{
  "userId": "digitalmop_user_123",
  "tokenHash": "SHA256_DEL_TOKEN",
  "status": "pending",
  "telegramUserId": null,
  "telegramChatId": null,
  "expiresAt": "2026-10-10T10:10:00.000Z",
  "createdAt": "2026-10-10T10:00:00.000Z",
  "claimedAt": null,
  "completedAt": null
}
```

Stati previsti:

| Stato | Significato |
|---|---|
| `pending` | Link generato, in attesa di Telegram |
| `claimed` | Telegram identificato, in attesa della PWA |
| `completed` | Associazione confermata |
| `expired` | Richiesta scaduta |
| `cancelled` | Richiesta annullata |

Regole:

- Una sola richiesta utilizzabile per utente alla volta.
- Nuova richiesta: invalidazione delle precedenti.
- Token utilizzabile una sola volta per l'associazione.
- Conservare soltanto l'hash del token.
- Scadenza configurabile, inizialmente 10 minuti.
- Controllare la scadenza applicativamente anche se il record non è ancora stato eliminato.
- Pulizia automatica mediante TTL index, conservando eventualmente gli eventi di audit separatamente.

### 3.3 Collection `telegram_updates`

Per l'idempotenza dei webhook.

Campi essenziali:

- `updateId`
- `status`
- `receivedAt`
- `processedAt`
- `attempts`
- `lastError`

Indice univoco su `(botId, updateId)`, così da supportare eventualmente più bot e impedire che un aggiornamento venga elaborato due volte per errore di consegna.

## 4. Flusso di collegamento definitivo

### Fase A — Richiesta dalla PWA

L'utente accede normalmente al proprio account Digital Mop.

Nella sezione dei canali seleziona **Collega Telegram**.

Il frontend chiama:

`POST /api/me/channels/telegram/link`

Il backend:

1. Verifica la sessione autenticata.
2. Ricava internamente `userId`.
3. Controlla che non esista un collegamento già attivo.
4. Invalida eventuali richieste precedenti.
5. Genera un token casuale crittograficamente sicuro.
6. Memorizza soltanto l'hash.
7. Restituisce l'URL del bot e la scadenza.

Esempio di risposta:

```json
{
  "status": "pending",
  "url": "https://t.me/DigitalMopBot?start=TOKEN",
  "expiresInSeconds": 600
}
```

Il token deve rispettare il limite dei parametri deep link previsto da Telegram.

### Fase B — Identificazione Telegram

L'utente apre il collegamento e preme Avvia.

Telegram invia:

`/start TOKEN`

Il webhook:

1. Verifica il secret Telegram.
2. Accetta il comando soltanto in una chat privata.
3. Estrae l'ID Telegram da `message.from.id`.
4. Calcola l'hash del token ricevuto.
5. Cerca una richiesta valida non scaduta.
6. Controlla che l'account Telegram non sia già associato ad altri utenti.
7. Registra Telegram ID e chat ID.
8. Porta la richiesta nello stato `claimed`.

**Non crea ancora l'associazione definitiva.**

Risposta del bot:

"Richiesta ricevuta! Torna su Digital Mop per confermare il collegamento."

Il comando `/start TOKEN` viene intercettato prima dell'orchestratore e non viene interpretato come messaggio dell'utente.

### Fase C — Conferma nella PWA

La PWA consulta lo stato:

`GET /api/me/channels/telegram/link`

Quando lo stato diventa `claimed`, mostra una conferma.

Testo suggerito:

**Collega questo account Telegram?**

Account rilevato: `@username` oppure nome pubblico Telegram.

Pulsanti:

- Conferma collegamento
- Annulla

L'utente conferma tramite:

`POST /api/me/channels/telegram/link/confirm`

Il backend:

1. Verifica nuovamente la sessione.
2. Recupera la richiesta dell'utente autenticato.
3. Controlla stato, scadenza e corrispondenza dei dati.
4. Verifica che non esistano associazioni incompatibili.
5. Crea il collegamento definitivo.
6. Marca la richiesta come completata.
7. Registra l'evento di audit.
8. Restituisce lo stato aggiornato.

L'intera transizione critica deve essere gestita in una transazione MongoDB, senza chiamate esterne all'interno della transazione.

In caso di conflitto, l'operazione deve fallire senza creare associazioni parziali.

### Fase D — Attivazione

La PWA visualizza:

**Telegram collegato**

Il backend può inviare un messaggio Telegram:

"Telegram è collegato al tuo account Digital Mop. Puoi iniziare a parlarmi!"

Da questo momento il provider Telegram identifica l'utente Digital Mop e passa le richieste allo stesso orchestratore AI.

La conferma dell'associazione non deve dipendere dal successo dell'invio del messaggio di benvenuto.

## 5. Sicurezza del collegamento

### 5.1 Autenticazione

Gli endpoint di produzione devono richiedere autenticazione reale.

Il backend non deve accettare `userId` forniti dal frontend per stabilire il proprietario della richiesta.

L'identità proviene esclusivamente dal contesto autenticato.

Applicare i controlli CSRF appropriati se la sessione utilizza cookie.

L'identità verificata tramite SPID/CIE resta quella di Digital Mop. Il collegamento Telegram non sostituisce la verifica di identità.

### 5.2 Protezione dei token

- Generazione tramite `crypto.randomBytes(32)`.
- Codifica Base64URL.
- Memorizzazione dell'hash SHA-256.
- Scadenza dopo 10 minuti.
- Nessun token nei log applicativi.
- Nessun token restituito dagli endpoint di stato.
- Invalidazione dopo conferma, annullamento o nuova richiesta.
- Rate limiting alla generazione e alle richieste di collegamento.

Il token presente nell'URL va considerato una credenziale temporanea.

### 5.3 Protezione contro collegamenti fraudolenti

Scenario: un soggetto ottiene il link prima dell'utente legittimo.

Con il meccanismo proposto può iniziare la richiesta su Telegram, ma non completare autonomamente l'associazione.

La conferma richiede una sessione autenticata Digital Mop.

La PWA deve mostrare quale account Telegram sta per essere collegato, senza confermare automaticamente.

Se l'utente non riconosce il profilo, può annullare e generare un nuovo link.

### 5.4 Concorrenza

Prevedere espressamente:

- Due richieste di generazione simultanee.
- Due account Telegram che utilizzano lo stesso link.
- Doppio clic sulla conferma.
- Webhook Telegram duplicati.
- Conferma contemporanea alla scadenza.
- Ricollegamento durante una richiesta precedente.
- Tentativo di associare un Telegram ID già in uso.

Utilizzare aggiornamenti condizionali, indici univoci e transazioni per impedire risultati incoerenti.

La creazione di una nuova richiesta deve invalidare atomicamente la precedente, usando un controllo di versione o una transazione.

### 5.5 Sicurezza del webhook

Conservare:

`POST /webhooks/telegram`

Requisiti:

- Solo HTTPS.
- Verifica header `X-Telegram-Bot-Api-Secret-Token`.
- Validazione del payload.
- Nessuna fiducia in ID account dichiarati nel testo del messaggio.
- Deduplicazione per `update_id`.
- Rate limiting dove applicabile, senza perdere gli aggiornamenti legittimi.
- Segreti esclusivamente tramite environment o secret manager.
- Nessuna esposizione di stack trace o token nelle risposte pubbliche.

## 6. Disconnessione Telegram

Aggiungere:

`DELETE /api/me/channels/telegram`

L'endpoint richiede una sessione Digital Mop autenticata.

Prima della revoca, richiedere una conferma utente nella PWA.

Operazioni:

1. Identificare il collegamento attivo.
2. Disattivarlo in MongoDB.
3. Invalidare eventuali richieste di collegamento pendenti.
4. Registrare l'evento di audit.
5. Impedire nuovi messaggi Telegram autenticati con quella associazione.

La revoca non elimina l'account Digital Mop.

Non cancella automaticamente prenotazioni, crediti, storico o altre associazioni di canale.

Il bot potrà eventualmente continuare a ricevere messaggi Telegram, ma non li elaborerà come utente autorizzato finché non verrà creato un nuovo collegamento.

### Ricollegamento

È consentito ripetere il flusso dopo la revoca.

Un account Telegram già collegato a un altro utente Digital Mop non può essere trasferito direttamente tramite un nuovo deep link.

Per il trasferimento è necessaria una revoca autorizzata o una procedura di recupero identità separata.

## 7. Integrazione con l'orchestratore AI

Preservare l'attuale contratto:

```javascript
handle({
  channel,
  userId,
  conversationId,
  text
});
```

In produzione, il webhook Telegram esegue la risoluzione:

`telegramUserId → channel_links → digitalMopUserId`

Solo se esiste un'associazione attiva, inoltra il messaggio all'orchestratore.

Esempio:

```javascript
{
  channel: "telegram",
  userId: "digitalmop_user_123",
  conversationId: "telegram:123456789",
  text: "Vorrei prenotare un campo domani"
}
```

L'orchestratore continua a essere indipendente dal provider.

### Conversazioni persistenti

Sostituire progressivamente la `Map` utilizzata per associare i conversation ID OpenAI con una persistenza condivisa MongoDB, limitatamente alla configurazione production.

Requisiti:

- Chiave composta da provider e ID conversazione.
- Associazione all'utente Digital Mop.
- Recupero dopo riavvio del backend.
- Nessuna duplicazione indesiderata in caso di richieste concorrenti.
- Serializzazione dei turni anche in presenza di più processi Node.
- Conversazioni dello stesso utente su canali diversi mantenute distinte.

Lo stato conversazionale non deve essere perso alla disconnessione Telegram salvo eventuale politica di conservazione definita separatamente.

Il consumo di crediti deve riferirsi all'utente Digital Mop identificato dal collegamento, non all'ID Telegram.

## 8. Affidabilità e idempotenza dei webhook

L'attuale elaborazione in memoria dopo `res.sendStatus(200)` è sufficiente per i test, ma non garantisce il recupero dopo un crash.

In produzione utilizzare una coda persistente oppure una inbox MongoDB con worker.

Flusso:

1. Verificare la richiesta Telegram.
2. Inserire l'aggiornamento in modo idempotente.
3. Confermare HTTP 200 dopo la persistenza.
4. Far elaborare l'aggiornamento a un worker.
5. Registrare esito e tentativi.
6. Riprovare gli errori transitori.
7. Isolare gli aggiornamenti definitivamente falliti.

Il consumo di token, la conferma e le modifiche di stato devono essere idempotenti.

Per i messaggi in uscita è necessario riconoscere che l'API Telegram non offre una chiave di idempotenza applicativa equivalente a quella di alcune altre API: dopo un timeout può essere impossibile sapere con certezza se il messaggio sia stato recapitato.

Predisporre quindi tracciamento degli invii e politiche di retry controllate, senza promettere un'exactly-once delivery non garantibile.

## 9. UX minima nella PWA

Non occorre riprogettare la registrazione o il profilo.

Aggiungere alla gestione dei canali la sezione Telegram con questi stati:

| Stato | Interfaccia |
|---|---|
| Non collegato | Collega Telegram |
| In attesa di Telegram | Apri Telegram / Annulla |
| In attesa di conferma | Conferma / Annulla |
| Collegato | Account collegato / Scollega |
| Collegamento scaduto | Riprova |
| Errore | Messaggio e nuova richiesta |

Il frontend può interrogare periodicamente l'endpoint di stato durante il collegamento, interrompendo il polling quando la schermata viene chiusa o il collegamento termina.

SSE o WebSocket non sono necessari per questa patch.

Non mostrare mai il token completo nella schermata di conferma.

## 10. Separazione produzione/demo

La modalità production deve essere determinata da una configurazione esplicita e validata all'avvio.

Regole:

- Demo: continua a utilizzare `Map` e `X-Demo-Secret`.
- Produzione: utilizza MongoDB e sessione autenticata.
- Gli endpoint `/demo/telegram/*` non devono essere montati in produzione.
- I servizi demo non devono costituire fallback dei servizi production.
- Nessuna conversione automatica dei collegamenti demo in collegamenti reali.
- Il bot demo e il bot produzione devono idealmente avere credenziali distinte.
- Le collection di test non devono contaminare quelle reali.

Se MongoDB non è disponibile, il collegamento in produzione deve fallire esplicitamente.

Non utilizzare memoria volatile come sostituzione automatica.

## 11. Test obbligatori

### Test funzionali

- [ ] Utente autenticato genera un link.
- [ ] Il bot riceve `/start TOKEN`.
- [ ] La PWA rileva lo stato `claimed`.
- [ ] La conferma crea il collegamento.
- [ ] Telegram risponde tramite l'orchestratore AI.
- [ ] Il collegamento sopravvive al riavvio di Express.
- [ ] L'utente può scollegare Telegram.
- [ ] L'utente può ricollegarlo.

### Test di sicurezza

- [ ] Utente anonimo non può generare collegamenti.
- [ ] Non è possibile specificare arbitrariamente un altro `userId`.
- [ ] Token scaduto rifiutato.
- [ ] Token già consumato rifiutato.
- [ ] Token inesistente rifiutato.
- [ ] Link sottratto non consente il collegamento senza conferma PWA.
- [ ] Account Telegram già collegato non può essere associato a un altro utente.
- [ ] Webhook con secret errato rifiutato.
- [ ] Messaggi di account non collegati non raggiungono l'AI.
- [ ] Endpoint demo inaccessibili nell'ambiente production.

### Test di concorrenza

- [ ] Due conferme simultanee producono una sola associazione.
- [ ] Due Telegram ID concorrenti non possono utilizzare entrambi lo stesso token.
- [ ] Due richieste di collegamento contemporanee non lasciano più token utilizzabili.
- [ ] Una richiesta scaduta non viene confermata.
- [ ] Webhook duplicati non provocano duplicazioni di stato.
- [ ] Due istanze backend rispettano i vincoli di unicità.

### Test di resilienza

- [ ] Riavvio backend con associazioni già attive.
- [ ] MongoDB temporaneamente indisponibile.
- [ ] Telegram API temporaneamente indisponibile.
- [ ] Processo interrotto durante il webhook.
- [ ] Retry di un aggiornamento già registrato.
- [ ] Utente che blocca il bot dopo il collegamento.

## 12. Osservabilità e privacy

Registrare eventi tecnici quali:

- `telegram.link.created`
- `telegram.link.claimed`
- `telegram.link.confirmed`
- `telegram.link.expired`
- `telegram.link.cancelled`
- `telegram.link.revoked`
- `telegram.link.conflict`
- `telegram.webhook.failed`

Non registrare token completi, session cookie, credenziali o dati identificativi non necessari.

Gli eventi potranno confluire nel modulo di reportistica degli agenti già previsto, mantenendo distinta la telemetria tecnica dal contenuto delle conversazioni.

Definire retention limitate per richieste temporanee, webhook e log operativi.

## 13. Configurazione

Variabili suggerite:

```dotenv
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=...
TELEGRAM_WEBHOOK_SECRET=...

TELEGRAM_LINK_MODE=production
TELEGRAM_LINK_TTL_SECONDS=600
TELEGRAM_LINK_REQUIRE_CONFIRMATION=true

TELEGRAM_LINK_RATE_LIMIT_ENABLED=true
```

In produzione, validare le variabili obbligatorie all'avvio.

Non usare valori predefiniti insicuri per secret e credenziali.

La connessione MongoDB e l'autenticazione PWA devono utilizzare la configurazione condivisa del progetto, non connessioni parallele create appositamente per Telegram.

## 14. Ordine di implementazione

### Patch 1 — Persistence

- Modelli MongoDB.
- Indici e vincoli di unicità.
- Servizio di collegamento production.
- Gestione token e scadenze.

### Patch 2 — Authentication & Confirmation

- Endpoint autenticati.
- Gestione della conferma dalla PWA.
- Separazione delle modalità demo e produzione.
- Controlli di autorizzazione.

### Patch 3 — Webhook Integration

- Gestione degli stati `pending` e `claimed`.
- Risoluzione dell'account Digital Mop.
- Integrazione con l'orchestratore esistente.
- Deduplicazione e persistenza degli aggiornamenti.

### Patch 4 — Account Management

- Stato del canale nella PWA.
- Scollegamento e ricollegamento.
- Gestione conflitti.
- Messaggi di errore e scadenza.

### Patch 5 — Reliability & Release

- Persistenza delle conversazioni OpenAI.
- Elaborazione webhook tramite worker.
- Test concorrenti e di resilienza.
- Audit e monitoraggio.
- Rilascio controllato.

## 15. Criteri di accettazione

La patch sarà considerata completa quando:

1. Un utente Digital Mop autenticato potrà collegare Telegram senza fornire manualmente il proprio numero.
2. Nessun account Telegram potrà essere associato senza conferma autenticata dalla PWA.
3. Ogni Telegram ID avrà al massimo un collegamento attivo.
4. Token e richieste di collegamento saranno monouso e soggetti a scadenza.
5. Le associazioni sopravvivranno al riavvio e funzioneranno con più istanze backend.
6. Lo scollegamento revocherà immediatamente l'autorizzazione applicativa ai nuovi messaggi.
7. Gli utenti non collegati non potranno accedere alle funzionalità dell'orchestratore riservate agli utenti.
8. La logica AI resterà condivisa con gli altri canali.
9. La demo esistente continuerà a funzionare senza modifiche al suo flusso.
10. Gli endpoint e i dati temporanei della demo saranno isolati dalla produzione.

**Fuori perimetro:** gestione gruppi Telegram, redesign della registrazione, modifica del modello crediti, nuove funzionalità di prenotazione, sincronizzazione delle disponibilità dei campi e revisione della fatturazione.
