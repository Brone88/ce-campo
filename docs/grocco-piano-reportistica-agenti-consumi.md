# Digital Mop — Piano del modulo reportistica agenti e consumi

Versione 1.0 · 9 ottobre 2026 · Ambito: demo, stress test e produzione

## 1. Obiettivo e stato delle decisioni

Il modulo deve rendere osservabile il lavoro degli agenti, permettere di migliorare il servizio e misurare i consumi necessari a definire e verificare il modello a crediti. Deve essere introdotto prima degli stress test, così che i risultati della demo siano confrontabili con quelli della produzione.

Il presente documento è un piano di realizzazione, non una descrizione di funzionalità già implementate. I nomi tecnici sono proposte di contratto, da adattare al progetto quando verrà integrato il codice.

### Decisioni confermate

- Registrare le attività degli agenti e gli esiti effettivi delle operazioni.
- Non conservare nella reportistica le registrazioni audio o i messaggi integrali degli interlocutori, sia clienti sia gestori delle strutture.
- Conservare ciò che l’agente comunica solo dopo minimizzazione e rimozione dei dati personali non necessari.
- Raccogliere consumi tecnici anche senza conservare il contenuto delle conversazioni.
- Distinguere costo Digital Mop, crediti calcolati e crediti effettivamente addebitati.
- Usare la stessa logica di misurazione in demo e produzione, con dati e addebiti separati.
- Calcolare consumi e crediti nel backend; l’LLM non decide il proprio consumo.
- Mantenere separati consumi operativi, crediti gratuiti, acquisti, rettifiche e penali.

### Vincoli del progetto da rispettare

Il modello commerciale prevede crediti iniziali gratuiti configurabili via ambiente, nessuna subscription e libertà di scelta dei canali. Il consumo deve riflettere il lavoro effettivo degli agenti. Tariffe, pesi e arrotondamenti richiedono calibrazione attraverso demo e stress test.

Il flusso di prenotazione è già stato definito: questo modulo lo osserva e non lo riprogetta. Quando la struttura chiede un’attesa, l’agente concorda quando ricontattarla, informa l’utente e gli chiede se aspettare o continuare la ricerca. Il blocco temporaneo vale solo dentro Digital Mop. Il calendario interno raccoglie informazioni acquisite e prenotazioni gestite: uno slot sconosciuto non equivale a uno slot libero.

Il termine di disdetta gratuita è configurato sulla struttura, per esempio tramite `cancellationFreeWindowMinutes`. Le eventuali penali in crediti sono un deterrente a tutela della fiducia delle strutture, non un rimborso economico al gestore. La reportistica non deve introdurre importi o percentuali di penale economica nella scheda struttura.

## 2. Confini e responsabilità

| Componente | Responsabilità |
| --- | --- |
| Orchestratore | Segnalare fasi, decisioni operative osservabili e richieste ai tool |
| Adattatori di canale | Segnalare invio, consegna, chiamata, interruzione ed esito disponibili |
| Tool di dominio | Segnalare effetti realmente prodotti su prenotazioni e disponibilità |
| Raccolta eventi | Validare, minimizzare, deduplicare e conservare gli eventi |
| Motore costi | Valorizzare le unità misurate usando tariffe versionate |
| Motore crediti | Applicare la regola commerciale versionata |
| Registro crediti | Registrare addebiti e rettifiche senza duplicazioni |
| Reportistica | Aggregare, filtrare, mostrare anomalie e supportare analisi |
| Modulo privacy | Governare accessi, conservazione, cancellazioni ed esportazioni |

La reportistica non conferma prenotazioni, non cambia disponibilità e non autorizza penali. Riceve eventi dai moduli competenti. Il flusso fiscale e di fatturazione resta un piano separato: qui si definiscono solo misure e riferimenti necessari all’integrazione.

## 3. Tre livelli di informazione

### 3.1 Dati operativi necessari al servizio

Nome, recapiti, dati della prenotazione e contesto temporaneo necessari per svolgere l’incarico appartengono ai moduli operativi. Non vanno copiati automaticamente nella reportistica. La memoria temporanea dell’agente richiede una propria politica di durata, isolamento e cancellazione.

### 3.2 Eventi e misure

Sono il nucleo obbligatorio: identificativi pseudonimi, azioni, esiti, tempi, unità consumate, errori classificati, versioni. Devono bastare a ricostruire l’esecuzione tecnica e a calcolare i consumi senza leggere la conversazione.

### 3.3 Testo dell’agente per miglioramento qualitativo

È una raccolta distinta, più limitata nel tempo e nell’accesso. Deve contenere esclusivamente testo minimizzato. Se non è possibile bonificarlo in modo affidabile, si conserva il tipo di messaggio e si omette il testo.

“Tutto ciò che fa l’agente” significa tutte le azioni applicative osservabili e i loro esiti. Non implica registrare ragionamenti interni del modello, prompt completi, credenziali, payload integrali o flussi audio grezzi.

## 4. Privacy fin dalla raccolta

### 4.1 Regole di esclusione

Non salvare nella reportistica:

- audio dell’interlocutore o registrazioni miste della chiamata;
- trascrizioni e messaggi integrali in ingresso;
- immagini, allegati e documenti di identità;
- OTP, token, cookie, credenziali, intestazioni di autenticazione;
- payload SPID/CIE o informazioni di fatturazione;
- dump integrali di richieste e risposte dei provider;
- riassunti liberi dell’interlocutore che aggirino il divieto di conservare il contenuto;
- stack trace o URL contenenti dati personali non ripuliti.

Per comprendere l’esito usare categorie controllate: `availability_unavailable`, `callback_requested`, `user_chose_wait`, `booking_confirmed`. Anche queste informazioni, se collegate a una persona, possono restare dati personali e devono essere protette.

### 4.2 Bonifica del testo in uscita

Pipeline proposta:

1. Acquisire il messaggio dell’agente nella memoria del processo che lo invia.
2. Rimuovere i dati noti presenti nel contesto operativo: nomi, telefoni, email, riferimenti identificativi e altri campi non necessari.
3. Applicare controlli aggiuntivi su testo libero, citazioni e dettagli potenzialmente identificativi.
4. Salvare solo la versione bonificata, con versione della procedura e stato della bonifica.
5. Se il controllo fallisce o rimane incerto, omettere il testo e conservare un codice di motivo.

La bonifica va eseguita prima di code persistenti, log applicativi, tracciamento errori ed esportazioni. Non basta mascherare i dati nella dashboard. Evitare di inviare il testo grezzo a un ulteriore servizio di bonifica senza valutare quel trattamento.

Esempio: “Prenoto per Mario Rossi, telefono …” diventa “Richiesta prenotazione per [UTENTE], contatto [OMESSO]”. Se l’agente ripete una confidenza o un dato delicato, può essere necessario omettere l’intera frase.

Per le chiamate salvare il testo bonificato dell’uscita vocale quando disponibile. Separare testo generato, inviato al sintetizzatore e riprodotto: una risposta interrotta non può risultare pronunciata interamente. Se il provider non permette di conoscere la porzione riprodotta, indicare “riproduzione non verificabile”.

### 4.3 Accessi e conservazione

Ruoli proposti:

| Ruolo | Accesso |
| --- | --- |
| Analista consumi | Aggregati, costi e unità; nessun testo |
| Revisore qualità | Eventi e testi bonificati delle richieste autorizzate |
| Amministratore consumi | Configurazioni, riconciliazioni e rettifiche tracciate |
| Responsabile privacy | Gestione delle richieste sui dati e verifica delle cancellazioni |

Autorizzazioni applicate sul backend e separazione tra ambienti. Registrare accessi ai dettagli, esportazioni e modifiche amministrative. Cifrare trasmissione e archiviazione, limitando l’accesso alle chiavi.

Durate iniziali proposte, da approvare prima di usare dati reali:

- testo bonificato: finestra breve, per esempio 14–30 giorni;
- eventi dettagliati: finestra operativa, per esempio 90 giorni;
- aggregati realmente anonimi: durata maggiore motivata dalle analisi;
- registro crediti e riferimenti economici: durata definita separatamente in funzione della finalità e degli obblighi applicabili.

Questi intervalli sono ipotesi progettuali, non termini di legge. Prevedere eliminazione automatica, trattamento dei backup e riapplicazione delle cancellazioni dopo un ripristino. Gli aggregati di piccoli gruppi possono consentire reidentificazione: evitare di considerarli anonimi per il solo fatto di essere aggregati.

Prima della produzione vanno validate base giuridica e informative per ciascuna finalità, ruoli dei fornitori, impostazioni di conservazione e trasferimenti applicabili. “Non salvato da Digital Mop” non significa “non conservato dal provider o dal canale”. Le stesse precauzioni valgono in demo quando partecipano persone reali.

## 5. Modello degli identificativi e degli eventi

### 5.1 Identificativi

| Campo | Significato |
| --- | --- |
| `requestId` | Incarico dell’utente, anche su più canali |
| `runId` | Singola esecuzione o ripresa dell’orchestratore |
| `operationId` | Operazione logica, per esempio contattare una struttura |
| `attemptId` | Tentativo concreto della stessa operazione |
| `eventId` | Evento univoco per deduplicazione |
| `parentEventId` | Causa o evento precedente pertinente |
| `providerOperationId` | Riferimento tecnico del provider, protetto |
| `subjectRef` | Riferimento pseudonimo al cliente |
| `facilityRef` | Riferimento alla struttura, quando necessario |
| `bookingRef` | Collegamento operativo alla prenotazione |

Il collegamento all’anagrafica resta protetto e separato. Usare identificativi casuali, non email o telefoni trasformati con un semplice hash. Il passaggio da Telegram a una chiamata non deve spezzare l’incarico né duplicare i consumi.

### 5.2 Campi comuni

Ogni evento contiene: versione dello schema, ambiente, identificativi pertinenti, tipo, servizio emittente, timestamp dell’accadimento e della ricezione, canale, stato, codice di motivo, versioni di modello/istruzioni/tool e indicatori di qualità dei dati. Timestamp in UTC; visualizzazione in Europe/Rome. Per le durate locali usare un orologio monotono, evitando problemi da aggiornamento dell’orologio di sistema.

Payload a schema chiuso: accettare solo campi previsti, con limiti di lunghezza. Non usare un campo generico che possa diventare un deposito di conversazioni.

### 5.3 Catalogo minimo

| Famiglia | Eventi indicativi |
| --- | --- |
| Incarico | `request.started`, `request.completed`, `request.cancelled`, `request.failed` |
| Esecuzione | `run.started`, `run.paused`, `run.resumed`, `run.ended` |
| Modello | `model.call_started`, `model.call_completed`, `model.call_failed` |
| Tool | `tool.requested`, `tool.started`, `tool.succeeded`, `tool.failed` |
| Comunicazione | `message.generated`, `message.sent`, `message.delivered`, `message.failed` |
| Chiamata | `call.started`, `call.answered`, `call.ended`, `call.failed` |
| Attesa | `wait.agreed`, `wait.accepted`, `wait.declined`, `callback.scheduled`, `callback.executed` |
| Calendario | `internal_hold.created`, `internal_hold.released`, `availability.observed` |
| Prenotazione | `booking.confirmed`, `cancellation.requested`, `cancellation.completed` |
| Consumi | `usage.observed`, `usage.reconciled`, `usage.missing` |
| Crediti | `credits.simulated`, `credits.posted`, `credits.adjusted` |
| Controlli | `content.omitted`, `telemetry.degraded`, `reconciliation.mismatch` |

Gli eventi di dominio devono provenire dal modulo responsabile. Una frase come “ho prenotato” è un messaggio, non una prova dell’avvenuta prenotazione. Registrare separatamente fatti verificati, segnalazioni della struttura e classificazioni del modello, indicando la fonte e senza promuovere una classificazione a fatto.

## 6. Misurazione del lavoro

### 6.1 Unità raccolte

| Area | Unità e dettagli |
| --- | --- |
| Modelli testuali | Token di ingresso/uscita e categorie aggiuntive esposte dal provider |
| Cache | Token o unità con tariffa specifica, distinguendo sottoinsiemi e totali |
| Voce | Unità audio ricevute/generate, secondi o token secondo il servizio |
| Telefonia | Durata connessa, durata fatturata, scatti, eventuali componenti aggiuntive |
| Messaggistica | Messaggi, segmenti o altre unità effettivamente fatturabili |
| Tool a pagamento | Numero di operazioni e unità specifiche |
| Esecuzione | Tempo attivo, durata totale della pratica, attese e numero di tentativi |
| Infrastruttura | Eventuale quota attribuita, esplicitamente stimata e separata |

L’adattatore di ciascun provider deve documentare quali campi si sovrappongono: non sommare token audio già inclusi nei totali o token cache già compresi nell’ingresso. Non aggiungere un costo separato di sintesi vocale se è già incluso nella tariffa del servizio usato.

### 6.2 Durata non equivale a consumo

- Trenta minuti in attesa del ricontatto non sono trenta minuti di lavoro attivo.
- Una chiamata connessa in attesa può comunque generare costi di telefonia.
- Due agenti attivi in parallelo producono due consumi, ma non raddoppiano la durata trascorsa per l’utente.
- Il tempo dell’API include anche latenza; non rappresenta automaticamente lavoro fatturabile.
- I tentativi falliti possono produrre costi reali, senza essere necessariamente addebitabili all’utente.

Mostrare quindi durata della pratica, somma delle attività e unità fatturate come grandezze diverse. Se la politica commerciale usa il tempo, definirne precisamente la misura e non ricavarlo sottraendo soltanto apertura e chiusura della richiesta.

### 6.3 Attendibilità della misura

Ogni consumo ha stato `estimated`, `reported` oppure `reconciled`. Un dato mancante vale “non disponibile”, mai zero. Associare fonte, momento di acquisizione e copertura delle misure. I report devono indicare quanto del costo è completo e quanto ancora stimato.

## 7. Valorizzazione dei costi

Mantenere un catalogo versionato per provider, servizio/modello, tipo di unità, valuta, intervallo di validità, prezzo unitario, minimo fatturabile e arrotondamenti.

Formula generale: costo dell’operazione = somma delle quantità fatturabili per la rispettiva tariffa, con le regole di minimo e arrotondamento applicabili. Le quantità grezze devono restare disponibili per ricalcolare una stima senza alterare lo storico originale.

Memorizzare importi con numeri decimali esatti o unità monetarie intere di precisione adeguata. Conservare valuta originale; per i confronti in euro usare un cambio datato e dichiarato. Distinguere stima operativa, costo riconciliato e trattamento fiscale, che appartiene al piano di fatturazione.

Separare costo variabile diretto, costo di infrastruttura attribuito e totale stimato. Il costo del logging o della valutazione qualitativa è un costo interno: non va trasferito automaticamente ai crediti dell’utente.

Se manca una tariffa, mostrare consumo misurato e costo incompleto. Non applicare silenziosamente una tariffa di un altro modello.

## 8. Motore crediti e registro movimenti

### 8.1 Tre valori distinti

1. Costo sostenuto da Digital Mop, indipendente dal saldo dell’utente.
2. Crediti calcolati dalla regola commerciale scelta.
3. Crediti effettivamente addebitati o restituiti.

Un credito gratuito consumato non elimina il costo sostenuto. La provenienza dei crediti, gratuiti o acquistati, deve restare distinguibile se serve all’analisi economica.

### 8.2 Regole versionate

Ogni versione specifica unità addebitabili, pesi, eventuali soglie, arrotondamenti, gestione dei tentativi, esclusioni, data di efficacia e precisione. La libertà di scegliere il canale resta invariata; eventuali differenze di consumo devono essere spiegabili attraverso il lavoro e la regola commerciale.

Per la prima versione si propone di fissare la politica all’apertura dell’incarico: una modifica amministrativa non cambia retroattivamente il trattamento di una richiesta in corso. La scelta va confermata nel piano commerciale.

Proposta da validare: errori interni, tentativi duplicati causati dal sistema e attività esclusivamente diagnostiche non vengono addebitati all’utente. I relativi costi rimangono visibili a Digital Mop.

### 8.3 Affidabilità del registro

- Chiave di idempotenza per ogni movimento, distinta dagli identificativi dei tentativi reali.
- Scrittura atomica del movimento e dell’aggiornamento del saldo, oppure meccanismo equivalente verificabile.
- Movimenti non sovrascritti per correggere importi: aggiungere rettifiche collegate all’originale.
- Separazione fra stima, eventuale prenotazione di crediti e addebito definitivo.
- Riconciliazione di eventi tardivi e rettifiche provider secondo una politica esplicita, senza addebiti retroattivi arbitrari.
- Calcoli riproducibili indicando unità, regola, versione e arrotondamento.

Il registro non deve dipendere dalla disponibilità del testo dell’agente. Una cancellazione dei testi non deve impedire di spiegare il calcolo con le sole misure necessarie.

### 8.4 Penali

Usare una categoria separata `cancellation_penalty`, con collegamento alla decisione del modulo competente, versione della politica ed eventuale revoca. I report mostrano separatamente lavoro necessario a gestire la disdetta e penale deterrente. Il mancato recupero dello slot non deve generare una penale per semplice inferenza di un report.

Il valore applicabile di preavviso deve essere riferito alla regola associata alla prenotazione, evitando che una modifica successiva della scheda struttura alteri retroattivamente l’analisi.

## 9. Demo, simulazione e stress test

La demo usa lo stesso schema eventi e motore costi, ma un registro crediti simulato separato. La scelta dell’ambiente e la possibilità di addebitare sono controlli server, non un parametro modificabile dal client.

Distinguere test completamente simulati, test sintetici su provider reali e prove con partecipanti reali. Anche in demo possono esserci costi veri: mostrare “costo provider reale, crediti simulati” quando appropriato.

Salvare per ogni sessione: scenario, versione del dataset sintetico, configurazione, concorrenza, provider reali o simulati, esito atteso, esito osservato e completezza dei consumi.

Scenari minimi:

1. Richiesta breve via messaggio con disponibilità immediata.
2. Chiamata con conferma rapida.
3. Più strutture senza disponibilità prima del successo.
4. Struttura che chiede attesa; utente che accetta e ricontatto alla scadenza.
5. Attesa rifiutata e ricerca che prosegue.
6. Risposta anticipata della struttura e annullamento del ricontatto previsto.
7. Chiamata senza risposta, interrotta o con lungo silenzio.
8. Passaggio di canale mantenendo lo stesso incarico.
9. Errore provider, retry reale e webhook duplicato.
10. Disdetta nei termini, fuori termine e tentativo di recupero dello slot.
11. Riavvio durante un’operazione e ripresa senza doppio addebito.
12. Più incarichi concorrenti e controlli sui blocchi interni.
13. Testo dell’agente che ripete dati personali; bonifica o omissione.
14. Consumi ricevuti in ritardo o parzialmente mancanti.

Simulare più politiche crediti sullo stesso insieme di consumi, senza modificare i movimenti reali. Ogni simulazione ha identificativo, versione della regola, data ed elenco dei dati inclusi. Presentare numerosità del campione e limiti di rappresentatività: gli stress test non equivalgono automaticamente all’uso quotidiano.

## 10. Dashboard amministrativa

### 10.1 Panoramica

Filtri comuni: intervallo temporale, ambiente, tipo di test, canale, modello, versione delle istruzioni, fase, esito e stato di completezza. Ambiente sempre visibile; default produzione per uso operativo e demo per pagina test.

Indicatori principali:

- incarichi avviati, completati, falliti, abbandonati e ancora aperti;
- costo totale diretto e quota ancora stimata;
- crediti simulati, calcolati, addebitati e restituiti;
- costo medio, mediano, p90/p95 e numerosità;
- numero di contatti e tentativi per incarico;
- tempo attivo, tempo trascorso e attese;
- errori, retry, consumi mancanti e riconciliazioni aperte.

Specificare sempre il denominatore dei tassi: prenotazioni riuscite sul totale degli incarichi eleggibili, distinguendo pratiche ancora aperte. Per il costo per prenotazione ottenuta mostrare anche il costo di tutte le ricerche fallite nel periodo, non soltanto il costo delle richieste riuscite.

### 10.2 Elenco incarichi

Tabella con riferimento pseudonimo, ambiente, apertura, esito, canali, costo, crediti, tentativi e anomalie. Filtri e paginazione lato server. Accesso all’identità solo attraverso il modulo operativo e con permesso specifico.

### 10.3 Dettaglio incarico

Cronologia di fasi e azioni, stati effettivi, eventi mancanti, contributi di costo e crediti. Scheda separata per il testo bonificato, con stato della bonifica e indicazione “generato/inviato/consegnato” quando disponibile. Nessuna dicitura che faccia credere di avere una trascrizione completa della conversazione.

La scheda consumi permette di risalire da un totale alle singole misure, tariffe e regole. Evidenziare differenze tra costo sostenuto e crediti addebitati con motivi codificati.

### 10.4 Qualità dell’agente

Revisione per chiarezza, ripetizioni, promesse prive di conferma, mancati ricontatti e aderenza alle fasi. Il revisore può assegnare categorie e brevi note, senza riportare dati personali nei commenti.

Senza il contenuto dell’interlocutore non è sempre possibile giudicare appropriatezza, comprensione e tono contestuale. Usare “non valutabile” quando necessario. Le valutazioni automatiche sono segnalazioni da verificare, non fatti. Per analisi conversazionali complete utilizzare scenari sintetici.

### 10.5 Confronti ed esportazioni

Confrontare versioni su scenari simili, stessa completezza dei dati e stesso criterio di costo. Separare effetto del cambio tariffa dall’effetto del comportamento dell’agente. Non attribuire causalità a una semplice differenza fra periodi con traffico diverso.

Esportazione CSV dei dati tabellari minimizzati e JSON degli eventi autorizzati. Nessun contenuto grezzo; esportazioni tracciate, con scadenza e controlli di accesso. Prevenire formule eseguibili nei CSV quando presenti testi.

## 11. Architettura tecnica proposta

Per il primo rilascio mantenere il modulo nel backend esistente come componenti separati, senza imporre subito microservizi o una piattaforma analitica dedicata.

Percorso: orchestratore/adattatori → normalizzazione e bonifica → persistenza eventi → elaborazione consumi/costi → motore crediti → viste aggregate → API amministrative.

Usare un meccanismo di outbox o equivalente per gli eventi che devono essere coerenti con una modifica di dominio. Il worker elabora con semantica almeno-una-volta e operazioni idempotenti. La bonifica precede la persistenza dell’outbox.

La raccolta qualitativa non deve bloccare una prenotazione se fallisce. I dati necessari al saldo richiedono invece una coda durevole e recuperabile: se non è possibile garantire la registrazione delle operazioni a consumo, sospendere l’avvio di nuovo lavoro a pagamento secondo una politica controllata. Gestire in sicurezza le operazioni già partite senza lasciarle in uno stato ambiguo.

Gestire eventi fuori ordine attraverso timestamp, relazioni causali e stato della riconciliazione. Un timeout non prova che un’operazione esterna sia fallita: prima di ripetere una prenotazione verificarne l’esito con il modulo competente.

### Entità indicative

| Entità | Contenuto |
| --- | --- |
| `agent_requests` | Riferimenti e riepilogo incarico |
| `agent_runs` | Esecuzioni e versioni |
| `agent_events` | Eventi minimizzati |
| `agent_output_logs` | Testi bonificati con scadenza separata |
| `usage_records` | Quantità, unità, fonte e stato |
| `provider_price_versions` | Tariffe e validità |
| `cost_records` | Valorizzazioni stimate e riconciliate |
| `credit_policy_versions` | Regole commerciali |
| `credit_simulations` | Calcoli demo e confronti |
| `credit_ledger` | Movimenti effettivi e rettifiche |
| `reconciliation_issues` | Scarti da risolvere |
| `admin_audit_events` | Accessi e operazioni amministrative |

### API amministrative indicative

- `GET /admin/reports/overview`: indicatori aggregati.
- `GET /admin/reports/requests`: elenco filtrabile.
- `GET /admin/reports/requests/:id`: dettaglio autorizzato.
- `GET /admin/reports/requests/:id/events`: cronologia.
- `GET /admin/reports/requests/:id/usage`: misure e valorizzazioni.
- `POST /admin/reports/simulations`: simulazione su dati selezionati.
- `GET /admin/reports/reconciliation`: anomalie di completezza/costo.
- `POST /admin/reports/exports`: esportazione autorizzata e tracciata.

Le modifiche alle tariffe e alle regole producono nuove versioni e richiedono permessi specifici. La dashboard non deve esporre endpoint generici per alterare il saldo senza una causale e un movimento di rettifica.

## 12. Configurazione

| Configurazione proposta | Scopo |
| --- | --- |
| `REPORTING_ENABLED` | Abilitare la reportistica; non disabilita il registro necessario agli addebiti |
| `AGENT_OUTPUT_LOGGING_ENABLED` | Controllare la raccolta dei testi bonificati |
| `AGENT_OUTPUT_RETENTION_DAYS` | Durata dei testi |
| `AGENT_EVENT_RETENTION_DAYS` | Durata degli eventi dettagliati |
| `CREDIT_MODE` | `simulation` o `live`, validato all’avvio |
| `CREDIT_POLICY_VERSION` | Regola attiva per i nuovi incarichi |
| `INITIAL_FREE_CREDITS` | Dotazione gratuita, nel modulo crediti |
| `REPORTING_TIMEZONE` | Fuso di visualizzazione |

Valori economici e versioni devono essere persistiti insieme ai calcoli: l’ambiente da solo non basta a ricostruire lo storico. In produzione impedire configurazioni incoerenti, come addebiti reali senza un registro affidabile.

## 13. Controlli automatici e riconciliazione

Allarmi iniziali su aumento degli errori, numero eccessivo di tentativi, costo anomalo, operazioni senza consumo terminale, mancato ricontatto, ritardo della coda, errori di bonifica e scarti rispetto ai dati provider. Soglie configurabili e tarate sui test, evitando valori arbitrari presentati come già definitivi.

La riconciliazione associa le operazioni alle misure definitive disponibili presso il provider. Confronta quantità e costi, classifica gli scarti e mantiene un riferimento verificabile. Quando non esiste un dettaglio provider per singola operazione, riconciliare al livello disponibile e indicare l’eventuale quota allocata come stima.

Una modifica della stima di costo non implica automaticamente una modifica dei crediti già addebitati. Le due decisioni seguono regole diverse.

## 14. Piano di implementazione progressivo

| Fase | Lavoro | Risultato verificabile |
| --- | --- | --- |
| 1 — Contratti | Identificativi, catalogo eventi, classificazione dati, regole di esclusione | Esempi di eventi validi e vietati |
| 2 — Raccolta demo | Strumentazione orchestratore e canali disponibili, bonifica, persistenza | Cronologia completa di un incarico demo |
| 3 — Misurazione | Adattatori usage, tempi, tentativi e dati mancanti | Consumi spiegabili senza leggere il dialogo |
| 4 — Costi | Catalogo tariffe, stime, riconciliazione | Totale riproducibile dalle unità |
| 5 — Crediti simulati | Politiche versionate e confronto scenari | Diverse ipotesi confrontabili senza addebiti |
| 6 — Dashboard | Panoramica, elenco, dettaglio e anomalie | Analisi degli stress test dall’interfaccia |
| 7 — Qualità | Testi bonificati e revisione controllata | Errori comportamentali classificabili |
| 8 — Produzione | Registro reale, idempotenza, accessi, conservazione e recovery | Criteri di rilascio soddisfatti |
| 9 — Evoluzione | Confronti longitudinali, ulteriori aggregati e ottimizzazioni | Miglioramenti misurati su dati omogenei |

Le fasi non comportano una stima temporale: durata e sforzo dipendono dal database, dai provider e dallo stato effettivo dei moduli. Il piano è pensato per integrazione progressiva, senza richiedere la riscrittura dell’orchestratore.

## 15. Test e criteri di accettazione

### Privacy

- Un interlocutore pronuncia o scrive un telefono: il contenuto non compare nei log di reportistica.
- L’agente ripete un nome, un recapito o un dato delicato: viene bonificato o il testo è omesso.
- Un errore del provider contiene il prompt: il dettaglio non entra nei log.
- La bonifica è indisponibile: gli eventi strutturati continuano, il testo non viene persistito.
- Un ruolo senza accesso ai testi non riesce a recuperarli via API o export.
- La scadenza elimina i testi anche dai percorsi secondari previsti dalla politica.

### Consumi e crediti

- Lo stesso webhook ricevuto due volte produce una sola registrazione del relativo consumo e un solo addebito.
- Due tentativi realmente distinti restano due consumi, anche se riguardano la stessa operazione.
- Un’attesa di trenta minuti non diventa tempo attivo addebitato.
- Cache e audio non vengono contati due volte.
- Il consumo mancante appare incompleto e non azzera il costo.
- Il cambio tariffa o politica non altera lo storico già consolidato.
- Una rettifica è collegata al movimento originario e lascia ricostruibile il saldo.
- La demo non può modificare il registro reale, neppure manipolando parametri client.
- Un riavvio recupera gli eventi pendenti senza duplicare movimenti.

### Flusso e qualità

- Un messaggio “prenotato” senza evento di conferma non appare come successo verificato.
- Lo slot sconosciuto resta sconosciuto nei report; il blocco viene indicato come interno a Digital Mop.
- Risposta anticipata della struttura e ricontatto programmato non causano contatti duplicati.
- Le penali restano fuori dal costo operativo e dal consumo dell’agente.
- Testo vocale generato ma interrotto non è presentato come interamente pronunciato.
- I report mostrano campione, denominatori, ambiente e grado di completezza.

### Condizioni per il rilascio

Prima degli stress test: raccolta eventi, minimizzazione, misure tecniche e costi stimati devono funzionare. Prima degli addebiti reali: registro idempotente, riconciliazione, regola crediti approvata, gestione dei dati mancanti, controlli di accesso e recovery devono essere verificati. Prima dell’uso pubblico: completare la validazione delle finalità privacy, informative, conservazione e configurazioni dei fornitori.

## 16. Decisioni ancora da chiudere

| Decisione | Quando chiuderla | Evidenza necessaria |
| --- | --- | --- |
| Unità commerciale del credito e pesi | Dopo i primi stress test | Costi e distribuzione del lavoro reale |
| Arrotondamento e frequenza degli addebiti | Prima del registro live | Simulazioni e chiarezza del saldo |
| Trattamento commerciale dei fallimenti | Prima degli addebiti | Distinzione errori interni/esiti esterni |
| Gestione del credito insufficiente durante un incarico | Integrazione con piano crediti | Regole operative e tutela delle azioni già avviate |
| Regola fissata all’apertura dell’incarico | Prima della produzione | Decisione commerciale esplicita |
| Durata di testi, eventi e movimenti | Prima di dati reali | Finalità e valutazione applicabile |
| Necessità di conservare anche audio dell’agente | Eventuale fase successiva | Caso d’uso specifico; escluso dal primo rilascio |
| Tariffe e sorgenti di riconciliazione | Integrazione di ogni provider | Contratto e dati disponibili |
| Politica delle penali | Piano commerciale dedicato | Criteri del deterrente già concordati |
| Flusso fiscale e fatturazione | Piano dedicato | Requisiti amministrativi e fiscali |

Non sono decisioni da riaprire: assenza di subscription, canali liberi, flusso di prenotazione già definito, natura interna del blocco durante l’attesa e assenza di risarcimento della struttura tramite penali Digital Mop.

## 17. Riferimenti privacy

Riferimenti consultati nella discussione da cui nasce questo piano, utilizzati per i principi generali e non come attestazione di conformità del progetto:

- [Regolamento UE 2016/679 — EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj): definizioni, principi e basi del trattamento.
- [Commissione europea — Data protection explained](https://commission.europa.eu/law/law-topic/data-protection/data-protection-explained_en): i dati pseudonimizzati possono restare dati personali.
- [Commissione europea — Principles of personal data processing under the GDPR](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en): minimizzazione, limitazione della conservazione e protezione fin dalla progettazione.

Le scelte architetturali, i nomi dei campi e gli intervalli di conservazione proposti nel documento sono raccomandazioni progettuali da validare, non requisiti attribuiti alle fonti.
