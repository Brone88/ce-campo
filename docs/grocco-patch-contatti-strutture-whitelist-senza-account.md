# Digital Mop — Patch: contatti strutture autorizzati senza account

**Destinatario:** Grocco  
**Data:** 10 ottobre 2026  
**Revisione:** 2 — telefonia riservata alle strutture  
**Tipo:** integrazione funzionale e tecnica dei piani esistenti  
**Ambito:** Telegram, WhatsApp/Wazzup, telefonia, amministrazione strutture, orchestratore e reportistica.

## 1. Problema e risultato richiesto

Gli utenti che delegano una prenotazione e i gestori delle strutture hanno requisiti di accesso differenti.

L'utente deve soddisfare i requisiti di account, verifica d'identità, collegamento del canale e diritto di utilizzo previsti dai piani. Il gestore deve poter rispondere all'agente, scrivergli spontaneamente o richiamarlo senza registrarsi, effettuare SPID/CIE, attivare un piano o entrare anche una sola volta nella piattaforma.

Digital Mop censisce le strutture e verifica i recapiti durante le visite porta a porta. Questi contatti possono essere precaricati e autorizzati dall'amministrazione. La struttura non deve diventare un cliente fittizio per superare il gate dei bot.

**Regola centrale:** un mittente può accedere al flusso strutture tramite un contatto autorizzato della struttura, oppure al flusso clienti tramite un account collegato e abilitato. Essere autorizzati come struttura non concede i permessi del cliente o dell'admin.

**Telefonia:** gli utenti clienti non parlano con il bot al telefono, né in ingresso né tramite chiamate AI al cliente. Usano webapp, WhatsApp e Telegram. Solo i contatti struttura censiti, verificati e autorizzati per il canale telefonico possono conversare con l’agente al telefono. Un contatto con entrambi i ruoli accede al telefono esclusivamente come struttura.

L'assenza di login alla piattaforma non elimina il riconoscimento del contatto, la verifica del canale e i controlli applicativi.

## 2. Verifica dei piani e precedenza della patch

Sono stati controllati i seguenti documenti:

| Documento | Copertura attuale | Integrazione necessaria |
|---|---|---|
| `grocco-piano-di-implementazione-del-modulo-admin-gestione-strutture.md` | Contatti, validazione, autorizzazione all'utilizzo, priorità e reperibilità | Autorizzazione in ingresso, whitelist, onboarding sul posto e seed |
| `grocco-registrazione-verifica-identità-SPID-CIE-attivazione-agente-canali-di-comunicazione-e-gestione-piani.md` | Accesso conversazionale basato sull'account cliente | Rendere esplicito che i requisiti cliente non si applicano ai contatti struttura |
| `patch-linking-account-whatsapp-wazzup.md` | Solo mittenti collegati a un account possono raggiungere l'agente | Sostituire il gate esclusivamente cliente con risoluzione del soggetto e permessi distinti |
| `grocco-piano-funzionale-e-ux-del-sistema-di-prenotazione.md` | Interazioni con strutture, attese e risposte anticipate | Riconoscere il contatto struttura e correlare ogni risposta al tentativo corretto |

Questa patch prevale sulle formulazioni generiche secondo cui ogni interlocutore debba avere un `userId`, un account verificato o un abbonamento attivo. Tali requisiti restano validi per le operazioni del cliente secondo i piani dedicati.

In particolare, nel piano Wazzup aggiornare obiettivo, decisioni di prodotto, modello d'identità, pipeline webhook, pseudocodice e criteri di accettazione. La frase «un mittente non collegato non raggiunge l'AI» diventa «un mittente privo di un'autorizzazione valida come cliente o contatto struttura non raggiunge l'AI».

La telefonia cliente eventualmente prevista nei piani precedenti è superata da questa revisione: eliminare opzioni per essere chiamati dall’agente, finestre di richiamo del cliente e fallback telefonici verso il cliente. Conservare la telefonia verso le strutture e i loro richiami. La verifica telefonica tramite OTP/SMS resta distinta e non implica una conversazione vocale con il bot.

La whitelist deve essere una regola applicativa effettiva. Non è sufficiente aggiungere istruzioni al prompt.

## 3. Matrice di accesso

| Soggetto | Requisito | Operazioni |
|---|---|---|
| Cliente | Account, canale collegato e requisiti dell'operazione | Delegare e gestire le proprie richieste |
| Contatto struttura | Binding di canale verificato e autorizzazione operativa valida | Interagire per le strutture e i campi assegnati |
| Sconosciuto | Nessuna autorizzazione | Indicazioni statiche limitate, nessuna chiamata AI o tool operativo |
| Contatto revocato | Autorizzazione non più valida | Nessuna operazione struttura; eventuale percorso statico di assistenza |
| Contatto con ruolo cliente e struttura | Entrambe le autorizzazioni, valutate separatamente | Solo operazioni del ruolo selezionato per quella interazione |

Il mittente non può scegliere di diventare gestore scrivendo «sono il campo X». Nome visualizzato, username e dichiarazioni nel messaggio non conferiscono autorizzazioni.

## 4. Modello dati: estendere i contatti già previsti

Riutilizzare `structures`, `fields` e `structure_contacts`. Introdurre binding o entità aggiuntive solo quando lo richiede l'architettura esistente.

Separare tre informazioni:

1. **Recapito:** dove contattare il gestore.
2. **Identità del canale verificata:** da quale identità esterna accettiamo comunicazioni operative.
3. **Autorizzazione:** per quali strutture/campi e operazioni quel contatto può agire.

Un recapito utile per un contatto in uscita non è automaticamente una whitelist per messaggi in ingresso.

### 4.1 Campi logici suggeriti

| Gruppo | Campi indicativi |
|---|---|
| Contatto | `contactId`, nome referente facoltativo, uno o più ambiti struttura |
| Binding | `bindingId`, `provider`, `serviceChannelId`, `externalActorId`, destinazione conversazione |
| Verifica | `verificationStatus`, `verifiedAt`, `verifiedBy`, metodo di verifica |
| Autorizzazione | `authorizationStatus`, `structureIds`, eventuali `fieldIds`, permessi |
| Operatività | `inboundEnabled`, `outboundEnabled`, reperibilità e priorità già previste |
| Provenienza | `source`, riferimento visita/importazione, date creazione e aggiornamento |
| Revoca | `revokedAt`, autore e motivazione sintetica |

Nomi e schema sono indicativi: adattarli al repository. La verifica del recapito e l'autorizzazione a usarlo sono stati differenti; evitare un solo booleano che confonda tutto.

Per WhatsApp la chiave deve includere il canale di servizio Wazzup e l'identità esterna ottenuta dal webhook attendibile. Normalizzare i numeri per confrontarli con l'anagrafica, rispettando il formato del provider già usato. Non autorizzare una chat soltanto perché il payload contiene un `contact.phone` coincidente.

Per Telegram usare l'identificativo numerico del mittente; conservare separatamente la destinazione chat. Uno username o un numero telefonico censito non basta. Prima versione: conversazioni private; gruppi richiedono un'esplicita gestione di chat e permessi del singolo mittente.

Un binding può avere più ambiti struttura se un referente gestisce più centri. In questo caso il backend deve conservare l'elenco autorizzato e risolvere l'ambito prima di eseguire azioni. Impedire duplicazioni incoerenti della stessa identità esterna.

## 5. Onboarding porta a porta e seed

### 5.1 Durante la visita

1. Censire struttura e campi.
2. Raccogliere i recapiti e identificare i referenti autorizzati.
3. Registrare canali utilizzabili, priorità e reperibilità.
4. Verificare il contatto con una prova sul canale e registrare l'esito.
5. Associare il binding alla struttura e abilitare i permessi necessari.
6. Provare un messaggio in ingresso e una risposta dell'agente senza accesso alla piattaforma.

Più referenti della stessa struttura devono poter essere autorizzati separatamente e revocati individualmente.

### 5.2 Telegram

Un bot Telegram non può iniziare una conversazione privata con una persona che non lo abbia prima avviato o contattato. Fonte: https://core.telegram.org/bots

Durante la visita mostrare un QR/link del bot con un token di associazione dedicato alla struttura, emesso dall'operatore autorizzato. Il gestore apre Telegram e avvia il bot; il backend riceve l'identificativo reale del mittente e completa l'associazione al contatto previsto.

Questo è un collegamento del canale alla struttura, non un login o una registrazione alla piattaforma.

Il token deve essere monouso, a scadenza, non prevedibile, conservato tramite hash e consumato atomicamente. Prima del completamento controllare contatto destinatario, ambito, revoche e conflitti. Il token non deve finire nel prompt o nei log in chiaro. Un identificativo Telegram già verificato può essere seedato; l'id da solo non garantisce che il bot possa già inviare messaggi.

### 5.3 WhatsApp/Wazzup

Precaricare il numero raccolto e verificato sul posto. Una prova sul canale deve consentire di associare correttamente l'identità esterna usata da Wazzup.

Quando il binding è valido, il gestore può scrivere e rispondere senza linking cliente. L'agente può contattarlo attraverso l'integrazione configurata, rispettando reperibilità e vincoli effettivi del provider. La whitelist non supera limiti tecnici o condizioni del canale.

### 5.4 Regole per gli script di seed/importazione

- Usare identificativi stabili e upsert idempotenti.
- Supportare anteprima delle modifiche, validazione e riepilogo errori.
- Importare come autorizzati solo contatti verificati e approvati dall'operatore; gli altri restano pendenti.
- Non creare clienti, wallet, abbonamenti o identità SPID/CIE fittizie.
- Non riattivare contatti revocati a ogni esecuzione del seed.
- Non sovrascrivere modifiche amministrative senza una scelta esplicita.
- Rilevare collisioni di binding e associazioni ambigue.
- Conservare provenienza e autore dell'importazione.

## 6. Pipeline comune di riconoscimento e routing

Inserire la risoluzione del soggetto prima dell'orchestratore, sia nel webhook Telegram sia in quello Wazzup.

Sequenza richiesta:

1. Verificare l'attendibilità dell'evento usando i controlli disponibili per il provider.
2. Filtrare test, status, echo, eventi in uscita e messaggi non supportati secondo gli adapter esistenti.
3. Deduplicare l'evento con identificativi adeguati al provider/canale.
4. Gestire comandi di linking cliente e associazione struttura fuori dal modello, anche per mittenti già riconosciuti.
5. Risolvere le autorizzazioni valide del mittente: cliente, struttura, entrambe oppure nessuna.
6. Determinare il ruolo e l'ambito della conversazione attraverso contesto attendibile; chiedere una scelta quando necessario.
7. Per la struttura, correlare l'evento alla pratica o al tentativo pertinente; se ambiguo, chiarire prima di aggiornare lo stato.
8. Invocare il flusso corretto con il contesto costruito dal backend.
9. Controllare i permessi anche all'esecuzione di ogni tool e transizione sensibile.
10. Inviare la risposta sul canale appropriato e registrare gli eventi tecnici necessari.

Non applicare una precedenza globale «struttura prima del cliente» quando lo stesso contatto ha entrambi i ruoli. Il contesto di una risposta a un messaggio dell'agente può disambiguare; una nuova conversazione senza contesto può richiedere la scelta del ruolo. Tale scelta seleziona permessi già posseduti e non ne crea di nuovi.

Contratto concettuale per il flusso strutture:

```json
{
  "actorType": "structure_contact",
  "contactId": "contact_123",
  "bindingId": "binding_123",
  "structureId": "structure_123",
  "channel": "whatsapp",
  "conversationId": "conversation_123",
  "attemptId": "attempt_123",
  "requestId": "request_123"
}
```

Identificativi ed eventuali assenze devono essere gestiti esplicitamente. Non inventare `attemptId` o `requestId` per messaggi spontanei. Il ruolo, l'ambito e gli identificativi operativi non devono essere accettati come attendibili dal testo del messaggio.

Separare le sessioni conversazionali per ruolo e ambito/pratica. Una semplice mappa per chat non deve mescolare conversazioni cliente, gestione struttura e pratiche simultanee.

## 7. Permessi del flusso strutture

Il gestore autorizzato può:

- Rispondere a richieste di disponibilità per i propri campi.
- Confermare o negare una disponibilità/prenotazione secondo il motore esistente.
- Proporre alternative, senza sostituirsi all'autorizzazione dell'utente.
- Chiedere attesa e concordare il ricontatto.
- Comunicare anticipatamente l'esito dell'attesa.
- Gestire le comunicazioni di disdetta riferite alle proprie prenotazioni.
- Segnalare variazioni e indisponibilità della propria struttura.

Non può leggere pratiche di altre strutture, impartire istruzioni per altri clienti, modificare wallet/piani/penali o ottenere permessi admin. Può vedere solo i dati della prenotazione necessari all'operazione.

Le variazioni anagrafiche, dei referenti e delle autorizzazioni passano attraverso il processo amministrativo. Una richiesta del gestore di aggiungere un numero può essere raccolta come segnalazione, senza renderlo automaticamente autorizzato.

Una whitelist identifica l'interlocutore: non rende automaticamente vera o applicabile ogni sua affermazione. Verificare sempre risorsa, data, orario, stato e permessi dell'operazione.

## 8. Messaggi spontanei, più pratiche e risposte tardive

Non limitare l'accesso della struttura alla sola risposta immediata a un outbound. Un contatto autorizzato può iniziare una comunicazione operativa.

Se dice «confermo» e sono aperti più tentativi, chiedere quale prenotazione intende. Usare riferimenti provider alla risposta quando disponibili e affidabili, identificativi di pratica e dettagli di data/ora/campo, sempre limitati all'ambito autorizzato. Non scegliere automaticamente la pratica più recente.

Se non esiste una pratica, raccogliere la richiesta o segnalazione nel flusso strutture, senza generare una prenotazione cliente né un consenso utente inesistente.

Preservare le regole del piano booking:

- Una risposta prima della scadenza dell'attesa deve aggiornare il tentativo corretto e rendere non più necessario il richiamo pendente.
- Le conferme devono attraversare i controlli atomici del motore prenotazioni.
- Una conferma tardiva dopo la chiusura della richiesta non crea una seconda prenotazione.
- L'attesa blocca lo slot solo dentro Digital Mop.
- Il calendario si aggiorna sulle informazioni raccolte; gli slot sconosciuti restano sconosciuti.

Idempotenza e controllo dello stato devono valere anche per eventi ricevuti attraverso canali diversi.

## 9. Telefonia esclusivamente per strutture: controllo prima della risposta

### 9.1 Decisione definitiva

Il numero Telnyx di servizio deve terminare sull'applicazione che gestisce l'agente, senza inoltro al numero personale dell'operatore. Non eliminare il numero Telnyx di servizio e non confondere una destinazione di forwarding con l'identità del chiamante.

Il bot risponde solo se il numero chiamante corrisponde a un contatto struttura verificato, non revocato e abilitato alla telefonia in ingresso. La sola presenza in una rubrica generica non basta: il seed deve registrare anche questa autorizzazione.

| Chiamante | Comportamento telefonico |
|---|---|
| Contatto struttura autorizzato | Risposta dell'agente nel ruolo struttura |
| Cliente verificato e collegato, senza ruolo struttura | Rifiuto prima della risposta |
| Numero sconosciuto, nascosto o non interpretabile | Rifiuto prima della risposta |
| Contatto struttura pendente, revocato o inbound disabilitato | Rifiuto prima della risposta |
| Numero associato a cliente e struttura autorizzata | Accesso esclusivamente nel ruolo struttura |
| Whitelist non consultabile per errore | Nessuna risposta dell'agente; rifiuto/chiusura controllata |

Nessun saluto, messaggio vocale, IVR, richiesta di autenticazione, trasferimento al numero personale o sessione AI per chiamanti non autorizzati. Il chiamante può sentire un tono di rete determinato dal rifiuto e dal proprio operatore: non promettere silenzio assoluto o un tono identico su tutte le reti.

### 9.2 Ordine tecnico richiesto

Per Voice API / Call Control:

1. Ricevere e verificare il webhook `call.initiated` e la direzione entrante.
2. Verificare che numero chiamato e connessione appartengano al servizio configurato.
3. Deduplicare l'evento e normalizzare il chiamante in formato E.164; numero assente, privato o invalido significa accesso negato.
4. Cercare il numero nella whitelist telefonica delle strutture e controllare verifica, ambito, revoca e `inboundEnabled`.
5. Se non autorizzato, eseguire il comando Telnyx di rifiuto prima di `answer` e terminare il flusso.
6. Solo se autorizzato, conservare il contesto struttura della chiamata, rispondere e avviare media/AI usando il percorso esistente.
7. Correlare la pratica; se il referente gestisce più strutture o più tentativi, chiedere quale intenda solo dopo l'autorizzazione.
8. Ricontrollare i permessi prima delle operazioni sensibili e gestire chiusura, duplicati e revoche.

Nessun `answer`, streaming, bridge, registrazione o sessione OpenAI deve precedere il controllo. Un HTTP 200 al webhook conferma la ricezione dell'evento, non equivale a rispondere alla telefonata o a rifiutarla: il rifiuto richiede l'azione provider appropriata.

Telnyx documenta il comando Voice API `/v2/calls/:call_control_id/actions/reject`. Se l'app usa TeXML, applicare il controllo nell'endpoint che genera il documento e usare `<Reject>` come primo verbo per chiamanti non autorizzati. Non migrare alla cieca tra Call Control, TeXML e SIP: prima identificare il tipo di connessione realmente usato. Disabilitare eventuali percorsi che rispondono automaticamente o inoltrano prima del gate; controllare anche fallback e timeout, che non devono aggirarlo.

Fonti tecniche:

- https://developers.telnyx.com/docs/voice/programmable-voice/voice-api-commands-and-resources
- https://developers.telnyx.com/docs/voice/programmable-voice/texml-verbs/reject

Il risultato richiesto è nessuna risposta applicativa e nessun consumo AI per i rifiutati. Non generalizzare garanzie tariffarie tra i diversi tipi di connessione; verificare i costi sulla configurazione effettiva.

### 9.3 Limite del numero chiamante

Il confronto con la whitelist è il gate operativo richiesto, ma il caller ID non è una prova forte contro spoofing. Usare gli eventuali segnali di attendibilità disponibili e mantenere i controlli su ambito e transizioni. Non dare accesso admin o a dati estranei in base al solo numero. Il possesso di un account cliente non sblocca la telefonia.

Una struttura che chiama con numero nascosto o da un altro recapito non viene accettata: il nuovo recapito deve essere verificato e autorizzato dall'operatore attraverso i canali amministrativi, senza registrazione alla piattaforma e senza eccezioni vocali automatiche.

### 9.4 Chiamate in uscita e continuità

Conservare telefonate AI alle strutture per ricerca, conferme, attese e disdette. Il contesto outbound deve contenere contatto, struttura e tentativo. Non trasformare i webhook outbound in nuove chiamate inbound da filtrare tramite il numero di servizio.

Una struttura sospesa dalle nuove ricerche può continuare a gestire pratiche esistenti se il contatto è ancora autorizzato; sospensione e revoca restano separate.

### 9.5 Prova reale dopo rimozione dell'inoltro personale

La rimozione riguarda l'inoltro/destinazione personale se questa è la configurazione presente; verificare prima il routing effettivo. Non cancellare impostazioni non correlate o credenziali outbound senza motivo.

1. Identificare numero Telnyx, applicazione/connessione associata, webhook o endpoint TeXML, inoltri e fallback attuali.
2. Preparare il gate e verificare l'accessibilità dell'endpoint prima di cambiare routing.
3. Rimuovere l'inoltro al cellulare personale e instradare il numero di servizio verso l'app dell'agente.
4. Chiamare dal proprio cellulare senza seed struttura: la chiamata deve essere rifiutata senza risposta dell'agente.
5. Seedare quel cellulare come contatto autorizzato di una struttura demo, separato dal proprio eventuale account cliente.
6. Chiamare di nuovo il numero Telnyx: deve rispondere direttamente l'agente nel ruolo struttura, senza far squillare un secondo inoltro al cellulare.
7. Revocare il contatto demo e ripetere: rifiuto prima della risposta.
8. Verificare sessioni AI create solo nel caso autorizzato, eventi di chiamata e assenza di regressioni outbound.

Registrare il numero personale come referente della struttura demo è una fixture esplicita, non un bypass personale permanente. Non effettuare prove verso gestori reali per verificare questa configurazione.

## 10. Admin, revoca e continuità operativa

Integrare nella scheda struttura una sezione per contatti autorizzati con:

- Canale, referente e ambiti assegnati.
- Stato del recapito, del binding e dell'autorizzazione.
- Provenienza e data dell'ultima verifica.
- Abilitazione in ingresso e uscita.
- Associazione Telegram tramite link/QR.
- Revoca e sostituzione del contatto.
- Riepilogo conflitti e dati incompleti.

Gli orari di reperibilità regolano i contatti in uscita. Non scartare una risposta ricevuta fuori fascia: acquisirla e gestirla secondo lo stato della pratica. Definire separatamente le regole per le risposte automatiche e le successive comunicazioni in uscita, distinguendo la risposta a una conversazione avviata dal gestore dai ricontatti proattivi.

La sospensione di una struttura dalle nuove ricerche non equivale alla revoca dei referenti: le pratiche esistenti devono poter essere gestite secondo il piano admin. Un contatto revocato perde invece immediatamente i permessi, anche se la conversazione AI è ancora aperta. Invalidare le cache o ricontrollare l'autorizzazione prima dei tool.

## 11. Crediti e reportistica

Il gestore non deve avere un wallet o acquistare crediti per interagire.

Una risposta della struttura collegata a una pratica produce attività tecnica attribuibile a quella pratica, al contatto e alla struttura. L'eventuale attribuzione commerciale al cliente segue esclusivamente il piano crediti/billing: il ruolo struttura non determina da solo un addebito.

Per comunicazioni spontanee senza pratica, registrare il costo tecnico come attività operativa non attribuita a un cliente finché non esista un'associazione valida. Non scegliere un utente arbitrario per contabilizzarla.

Integrare la reportistica con ruolo, contatto, binding, struttura, pratica/tentativo quando presenti, esito del routing, azioni eseguite e consumo tecnico. Rispettare minimizzazione e retention del piano reportistica; non introdurre registrazione integrale dei messaggi o delle chiamate come effetto collaterale della whitelist. Anche i testi dell'agente possono contenere dati personali e devono seguire le regole già previste.

## 12. Demo senza UI e database

È possibile verificare questo pezzo del puzzle con repository in memoria, mantenendo le stesse interfacce previste per la persistenza futura.

Preparare fixture separate per cliente collegato, contatto struttura autorizzato, contatto revocato e sconosciuto. Non aggiungere un flag che disabiliti il controllo di autorizzazione. I binding vanno creati tramite seed verificato o associazione dietro le quinte.

Sequenza demo:

1. Seedare una struttura e un binding WhatsApp reale verificato.
2. Scrivere dal contatto struttura senza completare alcun linking cliente.
3. Verificare routing struttura e assenza di `userId` fittizio.
4. Avviare Telegram e associare il contatto tramite token struttura.
5. Ripetere la prova con il bot Telegram.
6. Simulare due tentativi aperti e una risposta ambigua.
7. Revocare il binding e verificare il blocco delle operazioni.
8. Verificare che il cliente collegato mantenga il flusso messaggistica già funzionante.
9. Eseguire la prova telefonica descritta nella sezione 9.5: sconosciuto rifiutato, contatto struttura demo accettato, contatto revocato rifiutato.

Con le Map i binding runtime si perdono al riavvio; solo le fixture seedate si ricreano. Rendere questo limite esplicito. Le fixture non devono sovrascrivere dati reali quando si passa al database.

## 13. Criteri di accettazione

| Scenario | Risultato atteso |
|---|---|
| Struttura WhatsApp autorizzata senza account | Conversazione struttura consentita |
| Struttura Telegram associata senza account | Conversazione struttura consentita |
| Telegram con solo username o telefono censito | Nessuna falsa autorizzazione o promessa di contatto outbound |
| Sconosciuto dichiara di essere gestore | Nessun accesso AI/tool tramite sola dichiarazione |
| Cliente collegato | Flusso cliente preservato |
| Stesso mittente con entrambi i ruoli | Contesto distinto; chiarimento quando ambiguo |
| Gestore autorizzato per A chiede dati di B | Operazione respinta |
| Più pratiche e messaggio «confermo» | Chiarimento prima di qualsiasi conferma |
| Risposta anticipata durante attesa | Tentativo aggiornato e richiamo non più necessario |
| Risposta tardiva dopo conferma altrove | Nessuna seconda prenotazione |
| Webhook duplicato o echo outbound | Nessuna doppia azione o loop |
| Revoca durante conversazione | Tool successivi bloccati |
| Seed ripetuto | Nessun duplicato, revoca preservata |
| Gestore scrive fuori reperibilità | Evento acquisito, nessuno scarto silenzioso |
| Struttura sospesa con prenotazione esistente | Gestione della pratica preservata se autorizzata |
| Comunicazione senza pratica | Nessun addebito cliente arbitrario |
| Richiamata riconosciuta | Accesso al flusso struttura senza piattaforma |
| Numero nascosto/non riconosciuto | Rifiuto prima della risposta, senza voce o AI |
| Cliente riconosciuto, senza ruolo struttura | Rifiuto prima della risposta anche se verificato e abbonato |
| Numero struttura condiviso tra più centri | Gate positivo, poi chiarimento dell’ambito senza operazioni premature |
| Whitelist non disponibile | Nessuna risposta AI; gestione chiusa in sicurezza |
| Cellulare personale usato come struttura demo | Risposta solo quando seedato e autorizzato, nessun inoltro al cellulare |
| Cliente vuole essere chiamato | Nessuna chiamata AI; comunicazioni su webapp/WhatsApp/Telegram |

## 14. Stato della demo e istruzioni operative per Grocco

L’utente dichiara completato il giro WhatsApp nell’altra chat. Questo è un aggiornamento sullo stato della demo, non una verifica del codice né la prova che tutti i requisiti della whitelist strutture siano già implementati. Ispezionare il codice corrente e riutilizzare i componenti funzionanti; non ricominciare automaticamente l’integrazione WhatsApp.

1. Analizza adapter Telegram, webhook Wazzup, linking cliente, orchestratore, contatti struttura e telefonia già presenti.
2. Identifica i gate che presumono obbligatoriamente un account cliente.
3. Integra questa patch nei piani e correggi i requisiti contraddittori elencati sopra.
4. Progetta un servizio comune di risoluzione del soggetto, binding e permessi, con adapter specifici per provider.
5. Se stai lavorando al codice, implementa prima routing e prova in memoria; collega poi persistenza e admin rispettando l'architettura esistente.
6. Mantieni distinti trasporto, riconoscimento, autorizzazione, conversazione e motore prenotazioni.
7. Verifica i casi della matrice di accettazione con particolare attenzione alle regressioni del linking cliente.
8. Riepiloga modifiche, verifiche e limiti effettivi, distinguendo bot funzionanti, telefonia simulata e telefonia realmente integrata.
9. Aggiorna i piani e la UX che propongono conversazioni telefoniche con il cliente: l’agente parla al telefono esclusivamente con strutture autorizzate.
10. Per la prova Telnyx, prepara prima gate e endpoint, poi modifica il routing effettivo e documenta i risultati senza dichiarare eseguite operazioni non verificate.

Le decisioni di prodotto sono definitive: strutture senza account/login/SPID/CIE/piano, contatti verificati e autorizzati, onboarding porta a porta e seed possibile; telefonia esclusiva delle strutture, rifiuto pre-risposta per tutti gli altri, nessuna conversazione telefonica cliente e nessun inoltro al cellulare personale. Le scelte di schema, organizzazione del codice e integrazione provider vanno adattate al progetto, senza introdurre nuovi obblighi di accesso per il gestore.
