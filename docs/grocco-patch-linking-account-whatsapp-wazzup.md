# Digital Mop / Prenotazione Campi

# Piano patch — Collegamento account Digital Mop ↔ WhatsApp (Wazzup)

**Stato:** piano di implementazione, non ancora applicato  
**Ambito:** autenticazione/autorizzazione del canale WhatsApp e collegamento all'account Digital Mop  
**Priorità:** necessaria prima di consentire l'utilizzo pubblico dell'agente via WhatsApp  
**Dipendenze:** account utenti Digital Mop, identificazione SPID/CIE per le funzioni che la richiedono, webhook Wazzup già funzionante  
**Esclusioni:** booking engine, fatturazione, tariffazione crediti, configurazione iniziale del canale Wazzup  
**Principio di riferimento:** stesso modello di linking già introdotto per Telegram

---

## 1. Contesto e problema da risolvere

La demo ha già verificato il percorso tecnico:

```text
WhatsApp dell'utente
        |
        v
Numero WhatsApp del progetto (numero Telnyx)
        |
        v
Wazzup24
        |
        v
POST /webhooks/wazzup
        |
        v
Express -> OpenAI -> risposta tramite Wazzup
```

Il webhook riceve i messaggi in ingresso, distingue i messaggi ricevuti dai messaggi in uscita (`isEcho`) e riceve anche notifiche di stato separate (`statuses`). Il canale è pertanto operativo a livello di trasporto.

**Problema:** allo stato attuale, chiunque conosca il numero del servizio può inviare un messaggio che raggiunge l'agente AI. Questo comporta accesso non autorizzato, consumo incontrollato delle risorse e impossibilità di attribuire in modo affidabile operazioni, crediti, richieste e prenotazioni a un account Digital Mop.

**Obiettivo della patch:** introdurre un controllo di autorizzazione *prima* dell'orchestratore AI. Solo un mittente WhatsApp associato a un account Digital Mop attivo può utilizzare l'agente. Il numero WhatsApp resta pubblico e può tecnicamente ricevere messaggi da chiunque: il backend decide quali messaggi possono proseguire.

### 1.1 Distinzioni fondamentali

- **Identità:** persona/utente identificato e gestito da Digital Mop, secondo il flusso account e SPID/CIE.
- **Autenticazione PWA:** sessione con cui l'utente entra nel proprio account Digital Mop.
- **Possesso del canale:** capacità di scrivere dal proprio account WhatsApp al numero Digital Mop.
- **Linking:** associazione verificata del canale WhatsApp a uno specifico `userId`.
- **Autorizzazione all'agente:** controllo del link valido e dello stato dell'account prima di ogni messaggio processato dall'AI.

Il codice di linking **non sostituisce SPID/CIE**, non verifica anagraficamente l'utente e non dà automaticamente diritto di prenotare se l'account non soddisfa gli altri requisiti di piattaforma.

---

## 2. Decisioni di prodotto e vincoli

1. Il linking WhatsApp deve essere esplicito, avviato da un utente autenticato nella PWA Digital Mop.
2. Per il flusso di produzione previsto, la generazione del linking è riservata a un account con gli stati di autenticazione e verifica richiesti dall'onboarding Digital Mop. L'eventuale test senza SPID/CIE è una deroga **solo demo**, mai utilizzabile in produzione.
3. Ogni canale riconosciuto porta a un `userId` interno. Il numero di telefono, il `chatId` e il nome mostrato da WhatsApp **non** diventano identificativi utente Digital Mop.
4. Telegram e WhatsApp condividono lo stesso modello concettuale di autorizzazione e attribuzione di crediti/attività.
5. Un'identità WhatsApp attiva non può essere collegata a due account Digital Mop contemporaneamente.
6. Nella prima versione un account Digital Mop può avere **al massimo un collegamento WhatsApp attivo**; la futura gestione di più numeri è un'estensione separata.
7. Un utente non collegato non deve raggiungere OpenAI, i tool di prenotazione o i servizi che consumano crediti.
8. Il trasferimento di un collegamento da un utente a un altro non deve essere automatico: richiede uno scollegamento/una procedura esplicita.
9. L'utente deve poter scollegare WhatsApp dalla PWA. La revoca deve avere effetto sui successivi messaggi.
10. I messaggi tecnici del webhook (`test`, `statuses`, `isEcho`) non devono mai attivare l'agente.

### 2.1 Cosa significa «non può scrivere chiunque»

Non possiamo impedire che una persona invii fisicamente un messaggio WhatsApp al numero pubblico. Possiamo invece garantire che un mittente sconosciuto:

- non venga trattato come utente registrato;
- non abbia conversazioni con il modello;
- non possa avviare richieste o prenotazioni;
- non consumi crediti;
- riceva al più un breve messaggio statico di istruzioni, soggetto a limiti anti-abuso.

---

## 3. Architettura di riferimento

```text
                         PWA Digital Mop
                               |
                       utente autenticato
                               |
                     crea challenge di link
                               |
                               v
                       ExternalLinkChallenge
                               ^
                               |
Utente WhatsApp --> Wazzup --> webhook Express
                               |
                      normalizzazione evento
                               |
                filtro inbound / no echo / testo
                               |
                     controllo challenge/link
                       /                     \
                NON collegato            COLLEGATO
                    |                        |
          valida codice monouso      risolvi userId interno
                    |                        |
          completa associazione     autorizzazioni / crediti
                    |                        |
          conferma statica           orchestratore AI
                    |                        |
                    +---------> Wazzup <-----+
                                 |
                          risposta WhatsApp
```

La gestione della connessione WhatsApp va tenuta separata dall'orchestratore. L'orchestratore riceve un'**identità interna già risolta e autorizzata**, non prova a dedurla dal prompt o dal numero di telefono.

**Nota voce:** il forwarding telefonico Telnyx è indipendente dal collegamento WhatsApp. La patch non richiede modifiche alla configurazione inbound voce.

---

## 4. Identità esterna Wazzup: chiavi e normalizzazione

Il webhook già osservato fornisce campi del tipo:

```json
{
  "channelId": "<wazzup-channel-id>",
  "chatType": "whatsapp",
  "chatId": "39XXXXXXXXXX",
  "contact": {
    "phone": "39XXXXXXXXXX"
  },
  "type": "text",
  "text": "ciao",
  "status": "inbound",
  "isEcho": false
}
```

Per il provider WhatsApp l'identità esterna è rappresentata da:

```text
provider = "whatsapp"
channelId = ID del canale Wazzup autorizzato
externalUserId = message.chatId
```

Il `contact.phone` può essere memorizzato come dato informativo, se necessario, **non come prova autonoma d'identità**. Anche il nome e l'avatar non partecipano all'autorizzazione.

Il backend deve verificare che:

- `chatType` sia `whatsapp`;
- `channelId` appartenga all'elenco dei canali Wazzup effettivamente configurati per Digital Mop;
- `chatId` sia presente e in formato atteso;
- il messaggio provenga da un evento in ingresso utilizzabile;
- il collegamento non sia stato revocato.

Il solo possesso di un `channelId` nel JSON **non autentica** il webhook: l'attendibilità della chiamata in ingresso va gestita separatamente (sezione Sicurezza).

---

## 5. Modello dati di produzione

### 5.1 `ExternalAccountLink`

Preferire un concetto condivisibile con Telegram, evitando di associare le conversazioni direttamente ai numeri esterni.

```js
{
  _id,
  userId,
  provider: "whatsapp", // oppure "telegram"
  channelId: "...",      // WhatsApp/Wazzup; null per Telegram
  externalUserId: "39XXXXXXXXXX", // chatId WhatsApp
  status: "active",      // active | revoked
  linkedAt,
  lastSeenAt,
  revokedAt: null,
  createdAt,
  updatedAt
}
```

**Vincoli applicativi e DB:**

- Unicità dei link **attivi** per `(provider, channelId, externalUserId)`.
- Unicità dei link **attivi** per `(userId, provider)` nella prima versione.
- `userId` fa sempre riferimento a un utente esistente.
- Il revocato resta eventualmente nello storico, ma non supera mai un controllo di autorizzazione.
- Gli indici Mongo devono implementare le unicità, non solo le verifiche fatte in JavaScript.

Per conservare storico e usare indici univoci parziali, definire esplicitamente la condizione `status: "active"`; oppure mantenere uno storico separato da una collection dei link correnti. Evitare indici che impediscano un nuovo collegamento legittimo dopo una revoca.

### 5.2 `ExternalLinkChallenge`

Contiene una richiesta temporanea di associazione creata dalla PWA:

```js
{
  _id,
  userId,
  provider: "whatsapp",
  codeHash,
  status: "pending",   // pending | used | expired | revoked
  createdAt,
  expiresAt,
  consumedAt: null,
  consumedBy: null,     // channelId + externalUserId, se completata
  attemptCount: 0
}
```

**Scelte:**

- Durata proposta: **10 minuti**.
- Codice monouso generato con RNG crittograficamente sicuro (`crypto.randomBytes` o equivalente).
- Lunghezza/entropia adeguate all'uso su un canale pubblico: preferire per esempio un codice di **16 caratteri casuali Base32**, raggruppato visivamente, piuttosto che sei caratteri facilmente enumerabili.
- Memorizzare `codeHash` e non il codice in chiaro. Un HMAC del codice con segreto server-side è una possibilità se si vuole evitare enumerazione offline su codici con entropia ridotta.
- Creare un nuovo codice invalida i challenge precedenti ancora pendenti per lo stesso utente/provider.
- Il backend deve sempre controllare `expiresAt` in modo esplicito. Un eventuale indice TTL Mongo serve alla pulizia, **non** costituisce il controllo di scadenza.

### 5.3 Audit minimo

Registrare solo gli eventi utili alla diagnosi e alla sicurezza:

- challenge creato/scaduto/revocato/consumato;
- tentativo di associazione riuscito o respinto e motivo tecnico sintetico;
- linking/scollegamento e data;
- identificativi interni e identificativo esterno trattato come dato personale;
- blocchi per rate limit.

**Non registrare i codici in chiaro nei log** e non duplicare sistematicamente il contenuto dei messaggi WhatsApp. La console usata per il test attuale, che stampa il payload integrale, va sostituita o limitata prima della produzione.

---

## 6. Contratti API della PWA

Gli endpoint seguenti sono **proposti**, non esistono ancora e possono essere armonizzati con la struttura già utilizzata per Telegram.

### 6.1 Generazione challenge

```http
POST /api/account/external-links/whatsapp/challenges
Authorization: <sessione Digital Mop>
```

Precondizioni:

- utente autenticato;
- account abilitato al linking secondo le regole di onboarding/verifica;
- assenza di un link WhatsApp attivo incompatibile;
- rispetto dei limiti sulla rigenerazione dei codici.

Risposta concettuale:

```json
{
  "code": "DM-WA-ABCD-EFGH-JKLM-NPQR",
  "expiresAt": "<timestamp ISO>",
  "displayPhone": "+39...",
  "waMeUrl": "<link WhatsApp con testo precompilato>"
}
```

Il prefisso `DM-WA-` e il raggruppamento servono a riconoscere il comando; la sicurezza dipende dalla parte casuale. L'URL va costruito sul numero reale configurato e con query correttamente codificata.

### 6.2 Lettura stato link

```http
GET /api/account/external-links/whatsapp
```

Restituisce stato `not_linked | pending | linked`, date e numero mascherato/identificativo visualizzabile quando opportuno. Mai restituire il codice dopo il momento in cui viene generato, salvo esplicita scelta di UX e protezione equivalente.

### 6.3 Revoca link

```http
DELETE /api/account/external-links/whatsapp
```

Deve:

- richiedere una sessione autenticata;
- identificare il link **dell'utente corrente**, non accettare liberamente un `userId` nel body;
- revocare il link in modo atomico;
- invalidare eventuali challenge pendenti;
- impedire ai messaggi successivi di raggiungere l'agente;
- registrare un evento audit e comunicare l'esito alla PWA.

### 6.4 Futuro pannello PWA

Percorso UX suggerito:

```text
Account > Canali collegati > WhatsApp
```

Stati della schermata:

1. **Non collegato** — CTA «Collega WhatsApp».
2. **In attesa** — codice, scadenza, link «Apri WhatsApp», possibilità di annullare e rigenerare con limiti.
3. **Collegato** — identificativo mascherato, data collegamento, CTA «Scollega».
4. **Errore** — challenge scaduto, account già collegato, riprova in sicurezza.

La UI non è inclusa nella simulazione preliminare.

---

## 7. Flusso di linking completo

### 7.1 Generazione

1. L'utente entra nella PWA con una sessione valida.
2. Seleziona «Collega WhatsApp».
3. Il backend verifica i requisiti dell'account.
4. Crea un challenge di 10 minuti, revocando gli eventuali challenge pendenti equivalenti.
5. Restituisce il codice **una sola volta**, la scadenza e il deep link WhatsApp.
6. La PWA mostra istruzioni semplici, senza presentare il codice come verifica d'identità personale.

### 7.2 Invio dal WhatsApp da collegare

L'utente apre il numero del servizio e invia **esattamente il codice**. Il sistema non deve accettare un codice nascosto in un messaggio arbitrario del tipo «ciao il codice è ...», per evitare interpretazioni ambigue e falsi positivi.

### 7.3 Completamento server-side

Il webhook riceve il messaggio e, **prima dell'AI**:

1. verifica tipo e autenticità del contesto webhook;
2. controlla se il testo corrisponde al formato di un comando di linking;
3. ricerca il relativo challenge valido tramite hash del codice;
4. controlla scadenza, stato `pending` e utente associato;
5. controlla conflitti con altri link attivi per quella chat e per quell'utente;
6. crea il link e consuma il challenge con logica **atomica/idempotente**;
7. risponde con conferma statica via Wazzup;
8. rende lo stato `linked` visibile alla PWA (polling leggero o aggiornamento push futuro).

**Importante:** la transizione challenge → link deve resistere a webhook duplicati e richieste simultanee. Usare una transazione Mongo quando appropriato, oppure un protocollo di scrittura con vincoli univoci e gestione esplicita dei conflitti; un semplice `find()` seguito da `create()` non basta.

### 7.4 Messaggi di servizio

**Successo**

> ✅ WhatsApp collegato al tuo account Digital Mop. Ora puoi utilizzare l'assistente tramite questa chat.

**Numero non collegato / testo ordinario**

> Per utilizzare l'assistente Digital Mop, accedi al tuo account e collega WhatsApp dalla sezione «Canali collegati».

**Codice non valido o scaduto**

> Il codice di collegamento non è valido o è scaduto. Generane uno nuovo dal tuo account Digital Mop.

Non rivelare dettagli dell'account associato a una chat in conflitto. Gli errori specifici possono essere mostrati nella PWA al proprietario autenticato quando appropriato.

---

## 8. Trattamento dei messaggi inbound nel webhook

Il webhook già usato nella demo rimane:

```http
POST /webhooks/wazzup
```

### 8.1 Ordine corretto dei controlli

```text
1. Ricezione webhook
2. Verifica ingresso e provenienza, validazione payload
3. Ack rapido al provider dopo accettazione durabile dell'evento
4. Se test/status/isEcho -> nessun agente
5. Se non WhatsApp/text/inbound -> nessun agente in questo MVP
6. Idempotenza: messaggio già elaborato? -> ignora
7. È un comando di linking? -> completa/respinge, mai LLM
8. Link attivo associato a (channelId, chatId)?
       NO -> eventuale istruzione statica, rate limited
       SÌ -> risolvi userId
9. Verifica stato utente e permessi Digital Mop
10. Invoca orchestratore con userId autorizzato
11. Invia risposta tramite Wazzup
```

Il comando di linking va riconosciuto **anche quando il mittente risulta già collegato**, così un codice eventualmente inviato non finisce nel prompt AI.

### 8.2 Pseudocodice

```js
async function handleInboundWhatsApp(message) {
  if (!isEligibleInboundMessage(message)) return;
  if (!isOurWazzupChannel(message.channelId)) return;
  if (await alreadyProcessed(message.channelId, message.messageId)) return;

  if (isLinkCommand(message.text)) {
    await completeWhatsAppLink({
      code: message.text,
      channelId: message.channelId,
      chatId: message.chatId,
      messageId: message.messageId
    });
    return;
  }

  const user = await findUserByWhatsApp({
    channelId: message.channelId,
    chatId: message.chatId
  });

  if (!user || !userCanUseAgent(user)) {
    await maybeSendStaticLinkInstructions(message);
    return;
  }

  await bookingAgent.handle({
    userId: user.id,
    channel: "whatsapp",
    externalChatId: message.chatId,
    text: message.text
  });
}
```

Questo è **pseudocodice architetturale**, non una patch pronta da incollare. In produzione il processamento va serializzato per chat e gestito con una coda affidabile: più messaggi ravvicinati non devono avviare risposte AI fuori ordine.

### 8.3 Webhook e affidabilità

Nella demo possiamo inviare subito `200 OK` e proseguire in processo. **In produzione**, prima del `200`, l'evento deve essere almeno registrato in una coda/job storage durabile; altrimenti il crash del processo dopo l'ack comporta la perdita del messaggio senza retry utile. I messaggi con lo stesso `messageId` devono essere idempotenti (chiave deduplica comprensiva del canale/provider).

### 8.4 Risposta outbound

La funzione di invio Wazzup già verificata resta separata dalla logica di autorizzazione. Per ridurre invii duplicati, associare a ciascuna risposta un identificativo stabile/idempotente ove supportato dal provider e verificare la semantica effettiva del campo `crmMessageId`.

---

## 9. Continuità con Telegram e orchestratore AI

**Obiettivo condiviso:**

```text
Telegram chatId -----------\
                            > ExternalAccountLink -> userId Digital Mop
WhatsApp channelId+chatId --/
                                        |
                                        v
                               autorizzazioni/crediti
                                        |
                                        v
                                  orchestratore
                                        |
                                        v
                            richieste e prenotazioni
```

L'interfaccia orchestratore dovrebbe ricevere almeno:

```js
{
  userId: "<internal-user-id>",
  channel: "whatsapp",
  externalChatId: "<wazzup-chat-id>",
  text: "Vorrei un campo domani sera"
}
```

Lo stesso `userId` permette di attribuire correttamente a un unico utente prenotazioni, crediti, penalità e storico indipendentemente da dove scrive.

**Distinguere identità e conversazione:** non è necessario condividere automaticamente una *singola* conversazione OpenAI tra Telegram, WhatsApp e PWA. In futuro conviene ancorare lo stato funzionale a `userId + requestId/sessionId`, con regole esplicite per la continuità cross-channel, evitando contaminazioni tra richieste diverse. La `Map<chatId, conversationId>` della demo è transitoria.

### 9.1 Servizi suggeriti

```text
routes/
  telegram.js              (già esistente; mantenere comportamento)
  wazzup.js                (webhook + normalizzazione)
  account-external-links.js (API protette PWA, nome indicativo)

services/
  telegram-link.js         (già esistente)
  whatsapp-link.js         (nuovo, prima fase)
  external-account-link.js (eventuale servizio comune, seconda fase)
  ai-orchestrator.js       (riuso del servizio attuale)
```

Interfacce indicative del servizio WhatsApp:

```js
createWhatsAppLinkChallenge(userId)
completeWhatsAppLink({ code, channelId, chatId, messageId })
findUserByWhatsApp({ channelId, chatId })
revokeWhatsAppLink(userId)
getWhatsAppLinkStatus(userId)
```

**Scelta pragmatica:** non rifattorizzare subito Telegram. Allineare prima i contratti, testare WhatsApp e solo dopo estrarre la parte comune senza rompere un flusso che già funziona.

---

## 10. Sicurezza e privacy

### 10.1 Autorizzazione

- Il controllo di linking avviene server-side e **prima** delle chiamate AI.
- Nessuna istruzione al modello è considerata meccanismo di sicurezza.
- Il messaggio WhatsApp, il `chatId` e i campi `contact` sono dati non affidabili per determinare da soli un account.
- L'accesso alle funzioni sensibili richiede **anche** il normale controllo dei permessi e dello stato dell'account Digital Mop, non solo un link presente.

### 10.2 Autenticità webhook

Proteggere l'endpoint pubblico secondo i meccanismi **effettivamente supportati da Wazzup**: verificare nella documentazione del provider eventuali firme, header di autenticazione o altre garanzie disponibili e usarle se previste. Se non esiste una firma verificabile, predisporre un percorso con segreto non indovinabile e controlli compensativi (regole Cloudflare/rate limit, validazione rigorosa, monitoraggio, rotazione), esplicitando che tali misure non equivalgono a una firma crittografica del payload.

Il solo `channelId` nel body, il dominio Cloudflare o il fatto che la route riceva un `POST` **non dimostrano che la chiamata provenga da Wazzup**.

### 10.3 Protezione codici

- Entropia elevata; `crypto.randomBytes`.
- Scadenza breve, uso singolo, hash/HMAC a riposo.
- Rate limit su generazione challenge e tentativi di completamento, anche per chat/canale e per destinazione.
- Evitare di loggare token, URL precompilati completi e payload integrali.
- Consumare il challenge in maniera atomica; deduplicare gli eventi.
- Reinvio del medesimo messaggio non crea duplicati né sposta link esistenti.

### 10.4 Protezione da costi e spam

- Un mittente sconosciuto non deve avviare LLM, prenotazioni o costi AI.
- La risposta statica agli sconosciuti deve essere *throttled* (es. una volta per finestra temporale per chat), oppure soppressa dopo tentativi ripetuti.
- Anche risposte statiche/outbound Wazzup possono avere costi e limiti di servizio: non rispondere automaticamente all'infinito.
- Limitare concurrency e numero di tentativi per account/canale.

### 10.5 Privacy

- `chatId`, numero e `userId` sono dati personali trattati secondo finalità definite.
- Minimizzare conservazione e accessi ai log.
- Non copiare nei log di reportistica le conversazioni utente se non previsto dal relativo piano privacy.
- Separare audit di collegamento dai contenuti conversazionali.
- Prevedere modalità di disattivazione/scollegamento e retention coerenti con il futuro piano dati.

### 10.6 Canale WhatsApp della demo vs produzione

Il canale Wazzup collegato all'app WhatsApp Business tramite QR è utile per il prototipo. Prima del rilascio pubblico verificare limiti, condizioni d'uso e opportunità di migrare a una soluzione WhatsApp Business Platform ufficiale. Questa scelta di trasporto **non cambia** il modello di autorizzazione disegnato dalla patch.

---

## 11. Conflitti, edge case e comportamenti attesi

| Caso | Esito previsto |
| --- | --- |
| Messaggio da numero non collegato | Non chiamare AI; al più istruzione statica limitata |
| Codice corretto, non scaduto, chat non collegata | Collegamento e conferma |
| Codice scaduto | Rifiuto senza chiamare AI |
| Codice già consumato | Nessun secondo collegamento |
| Due webhook identici | Un solo effetto; una sola conferma se possibile |
| Chat già associata allo stesso utente | Non duplicare link; restituzione idempotente/«già collegato» |
| Chat già associata a un altro utente | Non trasferire; rifiuto senza identificare l'altro utente |
| Account ha già un altro WhatsApp attivo | Richiedere scollegamento precedente; niente sostituzione implicita |
| Token per user B inviato dalla chat associata a user A | Non riassegnare automaticamente; rifiuto |
| Scollegamento dalla PWA | Revoca immediata per i messaggi successivi |
| Messaggi concorrenti durante la revoca | Ricontrollo autorizzazione prima delle operazioni sensibili; gestione race |
| Stato Wazzup `read` / `delivered` | Nessuna chiamata AI |
| Messaggio `isEcho: true` | Ignorato |
| Payload di test `{ "test": true }` | ACK e nessun effetto |
| Messaggio non testuale/media | Ignorato o risposta predefinita futura; non inviato all'AI in questo MVP |
| Cambia telefono ma conserva stesso WhatsApp/chat ID | Il link resta valido salvo revoca; non inferire identità dal dispositivo |
| Cambia numero WhatsApp/chat ID | Nuovo linking dopo scollegamento |
| Riavvio Express | Collegamenti e challenge persistono in produzione, non nella demo in `Map` |
| Reinstallazione o riconnessione Wazzup | Verificare se `channelId` cambia e definire una migrazione controllata dei link |
| Errore temporaneo Wazzup/OpenAI | Retry controllato e idempotente; nessun loop automatico |

---

## 12. Sequenza di implementazione raccomandata

### Fase A — Preparazione e allineamento con Telegram

- [ ] Esaminare il contratto attuale di `telegram-link` e la chiamata all'orchestratore.
- [ ] Stabilire il mapping comune tra `provider`, identità esterna e `userId`.
- [ ] Definire cardinalità dei link e policy di scollegamento.
- [ ] Definire il formato dei challenge e i requisiti di autorizzazione account.

**Output:** interfacce chiare, senza alterare il Telegram funzionante.

### Fase B — Core linking WhatsApp

- [ ] Implementare modello `ExternalAccountLink`.
- [ ] Implementare `ExternalLinkChallenge` e indici.
- [ ] Generare token robusti e hash/HMAC.
- [ ] Completare il link in modo atomico.
- [ ] Implementare lookup e revoca.
- [ ] Gestire conflitti, idempotenza e scadenze.

**Output:** servizio indipendente dal trasporto e dall'AI.

### Fase C — Integrazione con Wazzup

- [ ] Mantenere il webhook già operativo.
- [ ] Autenticare/proteggere il webhook secondo le possibilità reali del provider.
- [ ] Filtrare `test`, `statuses`, `isEcho` e tipologie non supportate.
- [ ] Inserire gate di linking e risoluzione utente *prima* dell'orchestratore.
- [ ] Gestire comando di link senza chiamare AI.
- [ ] Limitare i messaggi statici agli sconosciuti.
- [ ] Aggiungere deduplica/coda per la gestione di produzione.

**Output:** utenti sconosciuti esclusi dall'agente.

### Fase D — API account e PWA

- [ ] Esporre endpoint autenticati di creazione, stato e revoca.
- [ ] Integrare stato «Canali collegati» nell'account.
- [ ] Realizzare UI codice + deep link WhatsApp + scadenza.
- [ ] Gestire successo, scadenza, conflitto e rigenerazione.
- [ ] Verificare che l'utente abbia completato i requisiti SPID/CIE richiesti.

**Output:** linking autonomo per l'utente finale.

### Fase E — Integrazione identità e operazioni

- [ ] Passare all'orchestratore il `userId` Digital Mop, non il `chatId` come user ID.
- [ ] Applicare controlli permessi/stato account anche alle azioni sensibili.
- [ ] Associare richieste, crediti, penali e storico all'account corretto.
- [ ] Separare trasporto del messaggio da sessione/richiesta di prenotazione.

**Output:** WhatsApp diventa un canale autorizzato dello stesso account usato dalla PWA e da Telegram.

### Fase F — Test e rilascio

- [ ] Verificare casi positivi, negativi e simultanei.
- [ ] Provare restart, duplicate webhook e revoca durante elaborazione.
- [ ] Controllare log, privacy, rate limit e costo outbound.
- [ ] Verificare migrazione del canale WhatsApp/Wazzup se necessario.
- [ ] Abilitare gradualmente l'accesso all'agente via WhatsApp.

---

## 13. Piano separato — Simulazione senza DB e senza UI

**Questa fase verrà eseguita successivamente, non è richiesta per completare il documento.** L'obiettivo è imitare quanto già testato con Telegram, dimostrando il flusso di autorizzazione end-to-end prima di aggiungere Mongo e PWA.

### 13.1 Che cosa simuleremo

```text
Postman (test account USER_DEMO_1)
      |
      v
endpoint demo protetto -> genera challenge
      |
      v
Map in memoria: codeHash -> USER_DEMO_1
      |
      v
WhatsApp personale invia codice
      |
      v
Wazzup webhook
      |
      v
completeLink() -> Map (channelId, chatId) -> USER_DEMO_1
      |
      v
WhatsApp invia "ciao"
      |
      v
link valido? -> sì -> orchestratore OpenAI
      |
      v
risposta via Wazzup
```

### 13.2 Struttura demo minima

- `pendingLinks = new Map()` per i challenge temporanei.
- `linkedWhatsApp = new Map()` per le associazioni.
- `processedMessageIds = new Set()` per una deduplica essenziale (con limite/TTL per non crescere indefinitamente).
- Un endpoint locale **solo development**, protetto da segreto e non pubblicato sul tunnel Cloudflare, per simulare la generazione del codice per `USER_DEMO_1`.
- Un handler webhook che riconosce codice, risolve il link e blocca gli sconosciuti.
- L'orchestratore OpenAI esistente, invocato solo dopo il link.

### 13.3 Importanti limiti della demo

- Niente Mongo: tutti i link si perdono al riavvio.
- Niente PWA e autenticazione reale: l'utente demo è controllato manualmente.
- L'endpoint che simula `userId` **non può essere esposto pubblicamente**: altrimenti consentirebbe a chiunque di attribuirsi un account.
- Nessun permesso di prenotazione reale viene concesso dalla sola simulazione.
- Nessuna pretesa di sicurezza production-ready: lo scopo è capire e validare il protocollo.

### 13.4 Sequenza di test demo, un passo alla volta

1. **Bloccare gli sconosciuti:** scrivere su WhatsApp e verificare che non venga invocata OpenAI.
2. **Generare il challenge da Postman:** osservare codice e scadenza nel backend.
3. **Completare dal WhatsApp reale:** inviare codice e verificare `USER_DEMO_1 ↔ chatId`.
4. **Conversare:** inviare testo ordinario e verificare che ora raggiunga l'AI.
5. **Testare abusi:** codice sbagliato, scaduto, già usato e riuso webhook.
6. **Simulare unlink:** revocare la `Map` e confermare il blocco dell'AI.
7. **Riavviare:** vedere esplicitamente la perdita dello stato in memoria.

**Regola di lavoro:** procedere a micro-step verificando l'output in console/Postman, senza introdurre contemporaneamente DB, UI e nuove funzionalità di prenotazione.

---

## 14. Criteri di accettazione della patch di produzione

- [ ] Solo gli account Digital Mop abilitati possono creare un challenge WhatsApp.
- [ ] L'associazione viene completata solo da chi può inviare il codice dal canale WhatsApp interessato.
- [ ] Token monouso, scadenza, entropia, hash e limite tentativi verificati.
- [ ] Un solo link attivo per chat WhatsApp e, nell'MVP, per account/provider.
- [ ] Un mittente non collegato non raggiunge OpenAI né le operazioni di prenotazione.
- [ ] Il numero verificato nell'account Digital Mop non viene confuso con il `chatId` autorizzato.
- [ ] Ogni messaggio autorizzato viene attribuito al `userId` interno corretto.
- [ ] I crediti e lo storico usano il `userId`, non il numero telefonico.
- [ ] Telegram continua a funzionare invariato.
- [ ] Echo, aggiornamenti di stato e messaggi duplicati non causano chiamate AI o azioni duplicate.
- [ ] I challenge non vengono esposti nei log e non sono riutilizzabili.
- [ ] Scollegare WhatsApp revoca la possibilità di avviare nuove interazioni AI.
- [ ] Conflitti e tentativi di trasferimento tra account sono respinti.
- [ ] Il webhook dispone di protezioni d'origine appropriate e i controlli non si basano sul solo `channelId`.
- [ ] I messaggi accettati non vengono persi silenziosamente in caso di crash dopo l'ack Wazzup.
- [ ] La UI consente collegamento, stato e scollegamento senza supporto manuale.
- [ ] I test demo in `Map` vengono sostituiti da persistenza e autenticazione reali prima del rilascio pubblico.

---

## 15. Questioni aperte da risolvere prima della produzione

1. **Fonte autorizzazione linking:** SPID/CIE deve essere completato prima del linking o soltanto prima della prima prenotazione? La policy Digital Mop vigente richiede comunque un account verificato per prenotare; scegliere esplicitamente la soglia per l'accesso alla chat AI.
2. **Canali multipli:** mantenere massimo un numero WhatsApp per utente nell'MVP; definire se e quando supportare più numeri.
3. **Recupero accesso:** come scollegare un numero WhatsApp perso quando l'utente non lo controlla più ma può entrare nella PWA.
4. **Origine webhook Wazzup:** quali autenticazioni/verifiche sono effettivamente disponibili per il canale e l'account scelti.
5. **Coda eventi:** dove effettuare ack durabile, deduplica e serializzazione per chat nell'architettura Docker prevista.
6. **Conversazioni cross-channel:** definire una policy separata per la continuità richiesta tra WhatsApp, Telegram e PWA, senza condividere impropriamente sessioni di richieste differenti.
7. **Piattaforma WhatsApp in produzione:** valutare in modo distinto se mantenere Wazzup collegato all'app oppure passare a WhatsApp Business Platform/API ufficiale.

Questi punti **non impediscono la simulazione tecnica** del linking, ma devono avere una decisione esplicita prima che la patch sia considerata pronta per il pubblico.

---

## 16. Definizione di completamento

La patch è conclusa quando **WhatsApp è un canale di trasporto autenticato e autorizzato**, equivalente a Telegram sul piano del collegamento account, senza duplicare l'identità Digital Mop e senza consentire agli sconosciuti di consumare risorse dell'agente.

**Prossimo task concordato (separato da questo documento):** riprodurre il linking con **Postman + Map in memoria + webhook Wazzup**, un passaggio per volta e senza database né interfaccia grafica.
