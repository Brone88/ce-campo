# Digital Mop — Collegamento account ↔ WhatsApp tramite Telnyx

## Allineamento condiviso — 18 ottobre 2026

Questa revisione integra i nove piani consegnati nello ZIP e il [mockup Figma corrente](https://www.figma.com/design/LKEJGcZxs9jXnPRx3wrBE5/cecampo?node-id=2-267). È una specifica, non una dichiarazione di implementazione del repository Windows, non disponibile in questa sessione.

- **Voce:** Telnyx AI Assistant gestisce telefonia, LLM vocale, STT/TTS e turni; il backend conserva autorizzazioni, tool, prenotazioni, attese e contabilità. GPT-Live, sideband e bridge audio verso OpenAI sono dismessi dal percorso target.
- **WhatsApp:** Business Platform tramite Telnyx; Wazzup24 non è più una dipendenza attiva. Telegram resta diretto. L'orchestratore testuale OpenAI non è automaticamente dismesso dalla migrazione voce.
- **Ruoli:** clienti in PWA/WhatsApp/Telegram; strutture tramite contatti autorizzati, anche senza account. Voce esclusiva delle strutture. Email verificata per comunicazioni di servizio; conversazioni AI via email richiedono un'integrazione distinta, non provata dal solo invio Resend.
- **Crediti:** niente Pass, abbonamenti o budget per richiesta scelto dall'utente. Bonus unico per identità; lavoro operativo distinto da garanzia, penale e quota in prestito. Le richieste accettate vengono accompagnate fino a un esito, non necessariamente a una prenotazione riuscita.
- **UX:** Prenota / Storico / Account; campi selezionabili e riordinabili nella ricerca; prezzo per campo per 90 minuti; Indoor/Outdoor. Nessuna modifica retroattiva agli snapshot.
- **Evidenza:** i runbook del 17–18 ottobre documentano chiamate Telnyx, inizializzazione dinamica e tool demo, oltre a una consegna WhatsApp reale. Non provano gate voce pre-risposta, persistenza, contabilizzazione definitiva o prenotazioni reali.

I nomi dei nove file sono conservati per compatibilità. I termini storici nei filename non indicano funzionalità da reintrodurre. Le scelte di sicurezza e dominio prevalgono sui placeholder del mockup; le discrepanze sono riportate nelle sezioni dedicate.

**Revisione:** 18 ottobre 2026. Il filename storico è conservato; Wazzup24 è dismesso dal percorso target. Specifica applicativa, non attestazione di implementazione.

## 1. Contesto e obiettivo

Il trasporto WhatsApp è Business Platform tramite Telnyx, con configurazione Coexistence descritta nel runbook esterno. È documentata una consegna outbound reale; questo non prova che linking, inbox durevole, gate utenti e whitelist siano già migrati nel codice.

Percorso: messaggio WhatsApp → Telnyx → webhook backend autenticato → adapter normalizzato → linking/risoluzione attore → autorizzazioni → orchestratore testuale → invio Telnyx. L'orchestratore OpenAI può restare; non sostituirlo implicitamente con l'AI Assistant vocale.

Solo clienti con link valido e requisiti dell'operazione, oppure contatti struttura autorizzati, raggiungono il flusso AI pertinente. Un gestore non deve registrarsi come cliente. Uno sconosciuto riceve al massimo indicazioni statiche limitate, mai accesso ai tool.

## 2. Decisioni e confini

- Account, email, telefono OTP, SPID/CIE e possesso del canale sono verifiche distinte.
- Il challenge appartiene all'utente autenticato; nessun `userId` client decide la proprietà.
- Il linking non richiede di acquistare un piano e non conferisce automaticamente permessi di prenotazione.
- Un link cliente attivo per utente/canale nell'MVP; nessun trasferimento implicito tra account.
- Il telefono verificato nell'account non è prova che quella chat WhatsApp sia collegata.
- Comandi linking e token struttura sono processati fuori dall'LLM, anche per mittenti già riconosciuti.
- Solo chat individuali nel perimetro; niente automazione gruppi né WhatsApp Calling implicita.
- Provisioning WABA, numero e profilo rimane nel runbook esterno; qui si definisce il raccordo applicativo.

## 3. Architettura e separazione dei contratti

Gli adapter Telnyx e Telegram condividono servizi di identità, autorizzazione e dominio. La normalizzazione converte il payload del provider in un contratto interno; non far passare ai servizi business un payload Wazzup rinominato.

Proposta route `POST /webhooks/telnyx/whatsapp`, da verificare sul repository e coordinare con gli URL WABA e Messaging Profile. Non dichiararla già esistente. Voce init/tool hanno percorsi distinti; Telnyx Verify è un servizio distinto. Conservare eventuali due URL messaggistica se necessari alla configurazione, convergendo su una inbox e deduplica comuni.

Nomi logici: adapter WhatsApp Telnyx, inbox eventi, servizio link, resolver cliente/struttura, orchestratore testuale, outbox invii. Nessun nuovo microservizio è necessario per questa separazione.

## 4. Identità esterna e normalizzazione

Contratto **interno proposto**, non payload API Telnyx:

```json
{
  "provider": "whatsapp",
  "transportProvider": "telnyx",
  "serviceChannelId": "<binding-interno-del-numero-business>",
  "externalUserId": "<mittente-autenticato-normalizzato>",
  "externalChatId": "<destinazione-chat>",
  "eventId": "<id-evento-provider>",
  "providerMessageId": "<id-messaggio-telnyx>",
  "metaMessageId": "<wamid-se-disponibile>",
  "eventKind": "inbound_text",
  "text": "<testo>"
}
```

`serviceChannelId` identifica una configurazione server del numero business con organization/account Telnyx, WABA, Phone Number ID, numero E.164 e Messaging Profile verificati. Non è il `channelId` Wazzup e non è il profilo comune usato come unica identità del numero. Controllare destinatario, profilo e tenant autorizzati prima di risolvere il mittente.

L'adapter del feed Messaging Profile legge envelope `data` e payload effettivo; quello WABA ha un proprio schema. Estrarre il mittente autenticato dal campo previsto da quel feed, conservando ID provider opachi e normalizzazione telefonica quando applicabile. Nome, avatar e dati dichiarati nel testo non autorizzano. Se un identificativo non è interpretabile come telefono non inventare E.164; gestire il caso esplicitamente.

Normalizzare separatamente messaggio ricevuto, echo, stato consegna e lifecycle. Il vecchio contratto `chatId/channelId/isEcho/statuses/crmMessageId` non va assunto valido per Telnyx.

## 5. Modello dati di produzione

### 5.1 `ExternalAccountLink`

Campi: `userId`, `provider: whatsapp`, `transportProvider: telnyx`, `serviceChannelId`, `externalUserId`, destinazione chat, stato active/revoked, `linkedAt`, `lastSeenAt`, `revokedAt`, date e provenienza della verifica.

Indici univoci parziali sui link attivi: `(provider, serviceChannelId, externalUserId)` e `(userId, provider)` nell'MVP. Conservare storico revoche senza impedire un ricollegamento legittimo. `userId` deve esistere. Il binding struttura è separato dal link cliente, con ambiti e permessi del piano whitelist; può coesistere per lo stesso mittente.

### 5.2 `ExternalLinkChallenge`

Contiene una richiesta temporanea di associazione creata dalla PWA:

```js
{
  _id,
  userId,
  provider: "whatsapp",
  serviceChannelId: "<binding-numero-business>",
  purpose: "customer_link",
  codeHash,
  status: "pending",   // pending | used | expired | revoked
  createdAt,
  expiresAt,
  consumedAt: null,
  consumedBy: null,     // serviceChannelId + externalUserId, se completata
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

### 6.4 Account → Come ti contattiamo

Schermate 061–065: Collega WhatsApp, apri chat, attesa del messaggio, codice scaduto/rigenera, collegato e scelta come principale. Revoca con conferma autenticata. Il codice corto del mockup è un placeholder; usare l'entropia definita sopra. Apertura chat e polling non conferiscono autorizzazioni. Interrompere polling alla chiusura della vista o allo stato terminale.

## 7. Flusso completo

1. PWA autenticata chiede challenge; il server applica rate limit, controlla stato account e conflitti, invalida i precedenti e restituisce il codice una sola volta.
2. L'utente apre `wa.me` sul numero business configurato e invia il testo precompilato. L'apertura del link non completa il processo.
3. Il backend autentica evento Telnyx, verifica numero/ambito e deduplica; intercetta il codice prima dell'AI.
4. Verifica hash, finalità, destinatario di servizio, scadenza, stato e account; codice struttura non può creare link cliente e viceversa.
5. Transazione o protocollo atomico con indici univoci crea link e consuma challenge. I retry restituiscono lo stesso esito, senza nuovi link.
6. Lo stato persistente alimenta la PWA; inviare conferma statica tramite outbox. Un errore della conferma outbound non annulla il link completato.
7. Nei messaggi successivi risolvere attore e permessi, non soltanto il possesso del codice.

I messaggi possono contenere credenziali temporanee: non inviare codici all'AI, ai log o alla reportistica. Se l'utente rigenera il codice mentre arriva il vecchio, solo la challenge corrente può essere consumata.

## 8. Pipeline webhook e invio

### 8.1 Ingresso

1. Verificare firma Ed25519 sul raw body con chiave pubblica Telnyx e header `telnyx-signature-ed25519`/`telnyx-timestamp`; controllo anti-replay e schema. Nessun fallback pubblico privo di autenticazione.
2. Validare organizzazione/numero/contesto, classificare il feed e normalizzare.
3. Accettare durevolmente l'evento nell'inbox prima dell'ACK; elaborazione lunga al worker. La coda ha retention minimizzata e redazione dei segreti, non è un archivio dei payload.
4. Deduplicare evento e messaggio logico. WABA `whatsapp.messages` e profilo `message.received` possono descrivere lo stesso messaggio: eventId diversi non giustificano due risposte. Correlare ID Telnyx/Meta e numero business; se mapping incerto usare un feed autorevole verificato, senza deduplica euristica sul solo testo.
5. Echo, stati e lifecycle non avviano l'AI. Edit/revoke sono eventi di controllo: non modificano silenziosamente richieste già inviate; una correzione operativa richiede il normale flusso di autorizzazione.
6. Comandi linking/associazione fuori AI. Risoluzione cliente, struttura, entrambi o sconosciuto; scegliere ambito affidabile o chiedere chiarimento senza creare nuovi permessi.
7. Autorizzare l'operazione; serializzare la conversazione per canale/attore/ruolo/pratica e ricontrollare prima dei tool.
8. Registrare esito applicativo e invio in outbox senza doppio addebito.

### 8.2 Coexistence

`message.echo` è un messaggio manuale della Business app: non alimenta autoresponder né linking cliente. Gestire lifecycle `whatsapp.account.update` per lo stato del trasporto; una riconnessione non trasferisce automaticamente l'identità a un altro account. Una modifica/revoca di messaggio non è una cancellazione di prenotazione.

### 8.3 Outbound

Usare `POST https://api.telnyx.com/v2/messages/whatsapp` con `from`, `to`, `type: WHATSAPP`, `messaging_profile_id` esplicito e `whatsapp_message` secondo il contratto verificato nel runbook. API key solo server. Nessun `crmMessageId` inventato come garanzia di idempotenza.

Outbox con identificativo applicativo stabile, stato invio e ID provider; dopo timeout riconciliare prima di reinviare. `queued` non prova consegna. Registrare delivered/failed quando ricevuti senza avviare AI e senza ricontare il messaggio.

Rispettare finestra di assistenza di 24 ore e template/consensi applicabili fuori finestra. Se non esiste un invio consentito, rendere la decisione disponibile nella PWA o usare altro canale autorizzato: non bloccare il booking in attesa di un invio impossibile. La whitelist non aggira questi vincoli. Un echo della Business app non riapre la finestra Cloud API.

## 9. Continuità con Telegram e dominio

Il resolver passa un attore interno: `actorType: customer` con userId, oppure `structure_contact` con contactId/bindingId e ambiti. requestId e attemptId provengono dal backend; possono essere assenti per una comunicazione spontanea.

Non imporre un userId fittizio al gestore. Se esistono entrambi i ruoli, separarli; il solo mittente non seleziona una pratica fra più tentativi. Stato booking condiviso, conversazioni LLM separate e correttamente contestualizzate. Cambiare canale non duplica la richiesta né perde snapshot, crediti o consensi.

## 10. Sicurezza e privacy

- Sessione PWA, CSRF quando necessario, rate limit su generazione/verifica e nessuna enumerazione di altri account.
- Challenge con hash, entropia e scadenza effettiva; TTL solo per pulizia. Segreto di demo escluso dalla produzione.
- Firma webhook prima di qualsiasi effetto e controllo del contesto anche su eventi firmati.
- Controllo revoche prima dell'AI e dei tool; non fidarsi della cache se invalida.
- Nessun log completo di messaggi, token, numeri o credenziali. Metadati minimizzati e testo agente bonificato secondo reportistica.
- Statiche agli sconosciuti limitate: anche inviare risposte consuma risorse e può avere costo.
- Il link non sostituisce identità SPID/CIE, OTP telefono o accettazione delle condizioni.

## 11. Casi limite

| Caso | Esito |
|---|---|
| Sconosciuto senza challenge | Nessuna AI, eventuale istruzione statica limitata |
| Gestore con binding valido ma senza account | Flusso struttura consentito nell'ambito autorizzato |
| Codice scaduto/usato/di altro servizio | Rifiuto, nessun link o AI |
| Link già attivo stesso utente | Esito idempotente |
| Link di altro utente | Conflitto, nessuna riassegnazione |
| Due challenge concorrenti | Una sola corrente e consumabile |
| Duplicato WABA/Profilo | Un messaggio logico, un effetto |
| Echo/manuale o stato consegna | Nessuna risposta AI |
| Revoca durante tool | Permessi ricontrollati, effetto già avviato riconciliato |
| Cambio numero/identità canale | Nuovo linking autorizzato; nessun trasferimento implicito |
| Provider disconnesso | Stato trasporto indisponibile distinto da link revocato |
| Crash dopo ACK | Worker riparte dall'inbox durevole |
| Timeout invio | Esito incerto e riconciliazione, non retry cieco |
| Finestra chiusa senza template utilizzabile | PWA/alternativa consentita, nessun invio libero forzato |

## 12. Migrazione dal vecchio trasporto

1. Inventariare route, variabili, adapter, link, seed e ID legacy; conservare storico e rollback controllato.
2. Configurare Telnyx secondo runbook e provare payload autenticati inbound/outbound/stato sul numero corretto.
3. Realizzare adapter e contratto canonico; provare firma negativa, duplicati e isolamento ruoli.
4. Migrare link solo se esiste una corrispondenza verificata fra identità legacy e nuova identità/canale; altrimenti nuovo linking. Mai sostituire il nome provider dentro un vecchio channelId.
5. Coordinare il cutover per evitare due consumer AI attivi sullo stesso messaggio. I feed Telnyx possono coesistere solo con deduplica provata.
6. Collaudare revoca, riavvio, costi, consegna e messaggi fuori finestra.
7. Disattivare webhook, job e credenziali Wazzup non più usati solo dopo il cutover verificato; mantenere le voci storiche contabili.
8. Rimuovere dal codice le dipendenze obsolete dopo ricerca dei riferimenti. Non eliminare la configurazione voce Telnyx o l'API OpenAI del testo.

## 13. Demo senza database e UI

È consentito usare Postman, segreto demo e Map per provare generazione challenge, messaggio reale Telnyx, link, testo e revoca. Endpoint demo isolati e non montati in produzione; nessun fallback a Map dopo errore del database. I record demo non diventano automaticamente link reali.

Sequenza: sconosciuto bloccato → challenge valido → linking → messaggio autorizzato → duplicato → codice scaduto → conflitto → revoca → restart. Aggiungere contatto struttura separato senza userId cliente. Distinguere successo del trasporto, del linking e delle operazioni di booking; la demo non conferma prenotazioni reali.

## 14. Accettazione produzione

- [ ] Firma, timestamp, schema e contesto rifiutano gli eventi non attendibili.
- [ ] Nessuna autorizzazione basata sul solo numero dichiarato nel body o nel testo.
- [ ] Link e challenge atomici, persistenti e con unicità attiva.
- [ ] Revoca, rigenerazione, scadenza, conflitti e race verificati.
- [ ] Cliente e struttura correttamente separati; sconosciuti senza AI.
- [ ] Duplicati tra feed, echo, lifecycle, edit/revoke e stati senza effetti duplicati.
- [ ] Coda e outbox recuperabili dopo crash, retry controllati.
- [ ] Token esclusi da prompt, report e log.
- [ ] Template/finestra e consegna effettiva verificati.
- [ ] UI attesa/collegato/errore corretta e Telegram invariato.
- [ ] Migrazione identificativi verificata e consumer legacy spento al cutover.
- [ ] Crediti associati alla richiesta autorizzata, mai arbitrariamente al gestore.

## 15. Punti ancora da verificare

Payload reali dei feed attivi e mapping ID; URL effettivi nel repository; stato del linking sul nuovo trasporto; infrastruttura inbox/outbox; template approvati e consensi necessari; recupero account/numero perso; policy per chat AI prima dell'identità completa; continuità conversazionale cross-channel. Non riaprire la scelta del provider: Telnyx è la decisione corrente.

## 16. Fonti e completamento

Fonti di progetto lette: `Telnyx_WhatsApp_Runbook_Solo_Configurazioni_Esterne.md` e `Blueprint_Telnyx_Voice_AI_Digital_Mop_Configurazione_Operativa.md`. Documentazione verificata il 18 ottobre 2026: [Telnyx WhatsApp Quickstart](https://developers.telnyx.com/docs/messaging/whatsapp/quickstart), [eventi Coexistence](https://developers.telnyx.com/docs/messaging/whatsapp/coexistence/webhooks).

Il lavoro applicativo è concluso solo dopo i test sopra, non perché il numero compare Connected o un messaggio di prova è arrivato. Il presente documento è il piano aggiornato, non un verbale di tali test.
