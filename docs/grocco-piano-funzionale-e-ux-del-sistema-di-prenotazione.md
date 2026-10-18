# DIGITAL MOP — Piano funzionale e UX del sistema di prenotazione

## Allineamento condiviso — 18 ottobre 2026

Questa revisione integra i nove piani consegnati nello ZIP e il [mockup Figma corrente](https://www.figma.com/design/LKEJGcZxs9jXnPRx3wrBE5/cecampo?node-id=2-267). È una specifica, non una dichiarazione di implementazione del repository Windows, non disponibile in questa sessione.

- **Voce:** Telnyx AI Assistant gestisce telefonia, LLM vocale, STT/TTS e turni; il backend conserva autorizzazioni, tool, prenotazioni, attese e contabilità. GPT-Live, sideband e bridge audio verso OpenAI sono dismessi dal percorso target.
- **WhatsApp:** Business Platform tramite Telnyx; Wazzup24 non è più una dipendenza attiva. Telegram resta diretto. L'orchestratore testuale OpenAI non è automaticamente dismesso dalla migrazione voce.
- **Ruoli:** clienti in PWA/WhatsApp/Telegram; strutture tramite contatti autorizzati, anche senza account. Voce esclusiva delle strutture. Email verificata per comunicazioni di servizio; conversazioni AI via email richiedono un'integrazione distinta, non provata dal solo invio Resend.
- **Crediti:** niente Pass, abbonamenti o budget per richiesta scelto dall'utente. Bonus unico per identità; lavoro operativo distinto da garanzia, penale e quota in prestito. Le richieste accettate vengono accompagnate fino a un esito, non necessariamente a una prenotazione riuscita.
- **UX:** Prenota / Storico / Account; campi selezionabili e riordinabili nella ricerca; prezzo per campo per 90 minuti; Indoor/Outdoor. Nessuna modifica retroattiva agli snapshot.
- **Evidenza:** i runbook del 17–18 ottobre documentano chiamate Telnyx, inizializzazione dinamica e tool demo, oltre a una consegna WhatsApp reale. Non provano gate voce pre-risposta, persistenza, contabilizzazione definitiva o prenotazioni reali.

I nomi dei nove file sono conservati per compatibilità. I termini storici nei filename non indicano funzionalità da reintrodurre. Le scelte di sicurezza e dominio prevalgono sui placeholder del mockup; le discrepanze sono riportate nelle sezioni dedicate.

**Versione:** 2.0 — Specifica riallineata, 18 ottobre 2026  
**Ambito:** Prenotazione di campi sportivi, orchestrazione agente AI, gestione stati, code, disdette e recupero disponibilità  
**Destinatario:** Grocco — Analisi tecnica e successiva implementazione

---

# 1. Obiettivo del progetto

Digital Mop è un servizio che permette agli utenti di delegare a un agente AI la prenotazione di campi sportivi.

L'utente non prenota direttamente attraverso un calendario di disponibilità certificata.

L'utente specifica ciò che desidera, definisce le proprie preferenze e affida la ricerca all'agente.

L'agente contatta le strutture sportive, negozia eventuali alternative autorizzate, gestisce attese e risposte, conclude le prenotazioni e aggiorna l'utente quando è necessario.

Il principio fondamentale è:

**L'agente deve operare autonomamente all'interno dei limiti autorizzati dall'utente, chiedendo un intervento soltanto quando occorre una nuova decisione.**

Il sistema deve funzionare anche in presenza di:

- Più utenti che cercano contemporaneamente lo stesso campo.
- Strutture che non confermano immediatamente.
- Risposte tardive.
- Controproposte.
- Telefonate interrotte.
- Strutture che richiamano spontaneamente.
- Prenotazioni già confermate.
- Disdette e richieste di sostituzione.
- Tentativi falliti.
- Agenti che lavorano contemporaneamente.

Il sistema deve mantenere coerenza tra interfaccia utente, orchestratore AI, database, disponibilità conosciute e stato reale dei tentativi.

# 2. Confini della specifica

## Incluso

1. Preferenze utente.
2. Ricerca e selezione iniziale.
3. Creazione di una richiesta.
4. Gestione dei tentativi di prenotazione.
5. Interazione tra utente e agente.
6. Interazione tra agente e strutture.
7. Stati della pratica.
8. Gestione delle attese.
9. Richieste concorrenti.
10. Blocco temporaneo interno degli slot.
11. Cache delle disponibilità.
12. Conferme tardive.
13. Controproposte.
14. Disdette.
15. Recupero degli slot cancellati.
16. Notifiche.
17. Storico e dettaglio delle prenotazioni.
18. Contratti di integrazione con identità, pagamenti e canali di comunicazione.
19. Gestione degli errori.
20. Test funzionali e di concorrenza.

## Escluso, da sviluppare con piani separati

- Progettazione completa del flusso di onboarding.
- Implementazione completa di SPID e CIE.
- Progettazione definitiva della fatturazione.
- Scelta commerciale definitiva di pacchetti di ricarica.
- Implementazione interna del sistema di telefonia AI.
- Definizione di tutte le API esterne dell'orchestratore.
- Gestione amministrativa completa delle strutture sportive.

Queste componenti devono tuttavia essere considerate nella progettazione, evitando incompatibilità future.

---

# 3. Principi non negoziabili

## 3.1 Una richiesta, una prenotazione

Una richiesta può generare diversi tentativi verso strutture differenti.

Può avere più tentativi contemporaneamente pendenti.

**Non deve però produrre intenzionalmente più di una prenotazione confermata.**

Eventuali doppie conferme esterne devono essere rilevate e gestite attraverso una procedura di compensazione.

## 3.2 La richiesta è immutabile dopo l'invio

Dopo la conferma dell'utente non è possibile modificare direttamente:

- Giorno.
- Orario.
- Durata.
- Tipologia di campo.
- Ambiente Indoor/Outdoor.
- Posizione geografica di riferimento.
- Raggio di ricerca.
- Lista originale delle strutture.
- Ordine di preferenza.
- Esclusioni iniziali.

Le preferenze vengono congelate in uno snapshot associato alla richiesta.

Eventuali modifiche successive del profilo non influenzano la ricerca in corso.

L'utente può interrompere una ricerca non ancora confermata, ma non modificare liberamente la richiesta esistente.

**Eccezione funzionale:** l'utente può concedere nuove autorizzazioni quando l'agente propone alternative. Queste devono essere registrate separatamente, come estensioni esplicite della ricerca, senza sovrascrivere i criteri originali.

Se necessario, l'estensione può essere rappresentata da una nuova fase o richiesta collegata, conservando il vincolo di una sola prenotazione finale.

## 3.3 Orario esatto

L'agente cerca esclusivamente l'orario indicato.

Non può spostarlo autonomamente di 15, 30 o 60 minuti.

Qualsiasi controproposta deve essere esplicitamente accettata dall'utente.

## 3.4 Durata fissa

Tutte le prenotazioni hanno durata di **90 minuti**.

Esempio:

- Inizio: 21:00.
- Fine: 22:30.

Il sistema deve utilizzare l'intero intervallo per verificare sovrapposizioni, blocchi e disponibilità.

## 3.5 Conferma verbale

Una conferma verbale esplicita della struttura è sufficiente per considerare confermata la prenotazione.

Non è obbligatorio ricevere email, SMS o documenti dalla struttura.

Devono essere conservati i dettagli necessari a ricostruire la conferma, compatibilmente con le regole applicabili alla gestione dei dati e delle chiamate.

## 3.6 Prezzi conosciuti

Le strutture vengono registrate direttamente da Digital Mop.

Il sistema conosce i prezzi associati ai campi e alle relative tipologie.

Non è previsto chiedere sistematicamente il prezzo durante ogni telefonata.

Un'eventuale differenza tra tariffa registrata e tariffa dichiarata dalla struttura costituisce un'eccezione da gestire, non un'autorizzazione a modificare automaticamente il prezzo.

## 3.7 Blocco interno delle disponibilità

I blocchi temporanei valgono soltanto per gli utenti e gli agenti Digital Mop.

Non costituiscono una prenotazione presso la struttura.

Non impediscono alla struttura di assegnare lo stesso campo a clienti esterni.

Il sistema non deve mai presentare un blocco interno come garanzia di disponibilità reale.

---

# 4. Requisiti preliminari dell'utente

Account autenticato, email verificata, telefono verificato con OTP e identità SPID oppure CIE sono controllati dal backend prima dell'invio. Collegamento valido per richieste sui canali esterni; ammissione economica e garanzia seguono il wallet. Nessun Pass o abbonamento.

Bonus iniziale una volta per identità; condizioni di prenotazione/disdetta esplicitamente accettate. I dati fiscali richiesti e il pagamento delle ricariche dipendono dal Billing, non da un abbonamento da attivare. Il wizard riprende il percorso e conserva la bozza senza inviarla automaticamente.

# 5. Preferenze e selezione dei campi nella ricerca

## 5.1 Preferenze nella nuova ricerca

La selezione dei campi vive direttamente in Prenota. Non creare una pagina Preferiti/Preferenze campi nell'Account. Posizione abituale e raggio sono salvabili nell'Account; precompilare le altre scelte dall'ultima prenotazione/richiesta compatibile, senza ripristinare date trascorse o campi non più candidabili.

## 5.2 Inclusione e ordine

Ogni card rappresenta un campo concreto con prezzo per 90 minuti, distanza e stato «Da verificare». Checkbox per includere/escludere; pulsanti ↑ ↓ per l'ordine manuale, visibile con numero di priorità. Eventuali ordinamenti per distanza/prezzo sono aiuti prima dell'invio e non sovrascrivono silenziosamente l'ordine scelto.

## 5.3 Snapshot

L'utente può cambiare selezione e ordine fino all'invio. La lista ordinata, le esclusioni e i filtri vengono copiati nella richiesta. Modifiche successive del profilo o una nuova ricerca non aggiornano le pratiche già inviate. Un campo escluso richiede nuova autorizzazione prima del contatto; non è un fallback automatico.

# 6. Nuova prenotazione — Schermata iniziale

## 6.1 Campi del form

| Parametro | Comportamento |
|---|---|
| Tipologia | Calcio a 5, 7, 9 o 11 |
| Ambiente | Indoor oppure Outdoor, radio a scelta singola |
| Giorno e ora | Data e ora esatta di inizio; orario finale calcolato |
| Durata | 90 minuti fissi |
| Posizione | Autocomplete indirizzo e geolocalizzazione facoltativa; default Account |
| Raggio massimo | Slider 1–100 km, nessun raggio minimo |
| Campi | Selezione e ordine modificabili nelle card |

La negazione del GPS non blocca la ricerca manuale. Non inviare query per ogni carattere senza controllo: gestire caricamento, nessun risultato ed errore del geocoder. Photon/OpenStreetMap compaiono nel mockup; verificare servizio, attribuzione e limiti prima del rilascio, senza assumere disponibilità illimitata.

## 6.2 Lista delle strutture

Lista interattiva per campo: inclusione checkbox, nome struttura e campo, tipologia/superficie/ambiente, distanza, prezzo per 90 minuti, priorità e frecce ↑ ↓. Il conteggio si aggiorna con i campi inclusi. La lista non è in sola lettura. Se vuota, mostrare «Nessun campo con questi filtri» e modifica filtri; se nessun campo è selezionato impedire l'invio.

## 6.3 Prezzi

Mostrare il prezzo specifico del campo per 90 minuti (`price90MinutesCents`), separato dai crediti del servizio. Non convertire automaticamente una tariffa oraria. Prezzo assente o non valido impedisce un impegno economico non autorizzato; differenze comunicate dalla struttura richiedono nuova autorizzazione.

## 6.4 Disponibilità

La presenza di una struttura nell'elenco non garantisce che sia effettivamente disponibile.

L'agente deve ancora verificarlo.

L'interfaccia non deve mostrare disponibilità come certe se sono soltanto stime o informazioni precedentemente raccolte.

## 6.5 Invio

Pulsante principale:

**Affida la ricerca →** apre il riepilogo; **Invia richiesta** conferma dopo accettazione delle condizioni. «Invia richiesta demo» resta solo nel prototipo.

Prima dell'invio:

1. Validare tutti i parametri.
2. Verificare l'abilitazione dell'utente.
3. Verificare che esistano strutture candidabili.
4. Mostrare il riepilogo delle condizioni.
5. Evitare invii duplicati.
6. Creare lo snapshot della richiesta.

Dopo l'invio, mostrare l'avvenuta presa in carico.

Non è necessario lasciare l'utente sulla schermata in attesa della conclusione della ricerca.

---

# 7. Creazione della richiesta

Ogni invio deve generare una pratica identificata univocamente.

## 7.1 Dati logici da conservare

- Identificativo della richiesta.
- Identificativo dell'utente verificato.
- Data e ora di creazione.
- Data della partita.
- Ora di inizio.
- Ora di fine.
- Tipologia di campo.
- Ambiente Indoor/Outdoor.
- Posizione di riferimento utilizzata.
- Raggio massimo (1–100 km).
- Snapshot delle preferenze.
- Snapshot delle esclusioni.
- Lista ordinata dei candidati.
- Informazioni tariffarie rilevanti.
- Versione della politica crediti e risultato del controllo di ammissione.
- Stato della richiesta.
- Cronologia degli eventi.
- Eventuali autorizzazioni successive.

I dati devono essere sufficienti per ricostruire esattamente cosa aveva richiesto l'utente al momento dell'invio.

## 7.2 Snapshot

Le preferenze confermate nel form vengono copiate nella richiesta.

La pratica non deve dipendere da letture successive delle preferenze correnti per determinare quali campi contattare.

Una modifica effettuata nel profilo o nel form dopo l'invio non modifica le pratiche esistenti.

## 7.3 Idempotenza

Doppi clic, retry HTTP, consegne duplicate di messaggi e altri eventi ripetuti non devono generare richieste identiche indesiderate.

---

# 8. Avvio della ricerca

L'agente riceve una richiesta validata.

La ricerca deve rispettare l'ordine dei campi preferiti.

Prima di contattare una struttura, controlla:

1. Se esiste già una prenotazione Digital Mop per la stessa risorsa e un intervallo sovrapposto.
2. Se esiste un blocco temporaneo interno.
3. Se esiste un tentativo concorrente con priorità precedente.
4. Se sono note indisponibilità pertinenti e sufficientemente affidabili.
5. Se la struttura è effettivamente contattabile.

Se la struttura non è candidabile in quel momento, l'agente applica le regole di coda oppure passa alle altre possibilità, senza violare l'ordine e le autorizzazioni dell'utente.

Non è prevista una coda globale unica per tutte le prenotazioni.

La concorrenza viene coordinata rispetto alle specifiche risorse e agli intervalli coinvolti.

---

# 9. Modello dei tentativi

Una richiesta può contenere molti tentativi.

Ogni tentativo rappresenta un'interazione con una struttura per uno specifico insieme di condizioni.

## 9.1 Informazioni del tentativo

- Richiesta di appartenenza.
- Struttura.
- Risorsa o tipologia di campo.
- Priorità originale.
- Data e intervallo richiesto.
- Stato.
- Data e ora di avvio.
- Risultato dei contatti.
- Eventuale attesa concordata.
- Termine previsto per il richiamo.
- Eventuale controproposta.
- Eventuale conferma.
- Eventuale chiusura.
- Eventi e identificativi delle comunicazioni.

## 9.2 Stati tecnici proposti

| Stato | Significato |
|---|---|
| QUEUED | Tentativo in coda |
| CONTACTING | Agente in comunicazione |
| WAITING_FACILITY | In attesa della struttura |
| CALLBACK_DUE | È giunto il momento di ricontattare |
| USER_DECISION_REQUIRED | Serve una decisione dell'utente |
| REJECTED | Disponibilità negata |
| CONFIRMED_WINNER | Tentativo che ha concluso la prenotazione |
| CLOSING | Tentativo da chiudere o struttura da notificare |
| CLOSED | Tentativo concluso |
| FAILED | Errore tecnico o comunicazione non riuscita |

Questi sono stati logici proposti, non nomi obbligatori delle entità o dei campi database.

Grocco dovrà adattarli all'architettura esistente.

---

# 10. Gestione del campo che chiede di attendere

Questa logica è stata espressamente approvata e deve essere rispettata.

## 10.1 Sequenza

1. L'agente contatta il campo A.
2. La struttura comunica di non poter confermare immediatamente.
3. L'agente chiede: **«Tra quanto posso ricontattarvi?»**
4. La struttura indica un intervallo, per esempio 15 minuti.
5. L'agente memorizza il termine concordato.
6. Digital Mop applica un blocco interno allo slot interessato.
7. L'agente notifica l'utente comunicando quanto tempo occorre aspettare.
8. L'utente decide se aspettare oppure proseguire con il campo successivo.

Il tempo viene stabilito dalla struttura, non scelto arbitrariamente dall'agente.

## 10.2 Se l'utente decide di aspettare

L'agente non passa al campo successivo.

Mantiene aperto il tentativo.

Alla scadenza concordata ricontatta la struttura, a meno che questa abbia già risposto spontaneamente.

L'utente non deve essere costretto a ricordarsi di verificare manualmente la situazione.

## 10.3 Se l'utente decide di proseguire

L'agente avvia la ricerca sul campo successivo.

**Il tentativo precedente rimane pendente.**

Il relativo blocco interno rimane attivo mentre il tentativo è ancora valido.

Alla scadenza concordata l'agente può comunque ricontattare la prima struttura, salvo che la pratica sia stata già confermata altrove.

Possono quindi esistere:

- Campo A in attesa.
- Campo B in ricerca.
- Eventualmente altri tentativi precedenti ancora pendenti.

La UX deve rendere chiaro che «Passa al prossimo» significa **continuare la ricerca mantenendo aperta l'attesa precedente**, non necessariamente ritirare il tentativo.

## 10.4 Risposta anticipata

Se la struttura richiama prima del termine, l'agente deve gestire immediatamente il nuovo evento.

Il richiamo deve essere associato al tentativo corretto.

Se la richiesta è ancora aperta, si applicano le normali regole di conferma.

Se è già conclusa, l'agente informa la struttura che la disponibilità non è più necessaria.

## 10.5 Mancata risposta al richiamo

Se la struttura non risponde al momento concordato:

- Registrare il tentativo di ricontatto.
- Evitare retry illimitati.
- Informare l'utente quando è necessaria una decisione.
- Gestire l'eventuale ulteriore attesa.
- Prevedere il rilascio controllato del blocco interno.

**Non devono esistere blocchi permanenti causati da una struttura che non risponde.**

Il limite di sicurezza tecnico e le politiche di ulteriori tentativi devono essere configurabili e progettati separatamente dal tempo di attesa concordato.

Non introdurre un timeout funzionale arbitrario di 5 minuti: tale proposta è stata superata dalle decisioni successive.

---

# 11. Blocco temporaneo degli slot

## 11.1 Ambito

Il blocco vale esclusivamente per Digital Mop.

Non deve essere interpretato come una prenotazione confermata dalla struttura.

Non blocca clienti esterni, chiamate dirette o gestionali autonomi del centro sportivo.

## 11.2 Granularità

Il blocco deve essere associato alla risorsa prenotabile e all'intervallo effettivo.

Non deve necessariamente bloccare tutta la struttura.

Se una struttura possiede più campi equivalenti, il sistema deve tener conto della capacità disponibile.

Due intervalli sovrapposti devono essere trattati come potenzialmente concorrenti.

Esempio:

- 21:00–22:30.
- 21:30–23:00.

Questi intervalli sono incompatibili quando interessano la medesima risorsa fisica.

## 11.3 Acquisizione

Il blocco viene creato o aggiornato quando l'agente ha un tentativo pendente che necessita di protezione dalle richieste concorrenti.

Deve essere assegnato in modo atomico.

Due agenti non possono acquisire indipendentemente lo stesso blocco incompatibile.

## 11.4 Rilascio

Il blocco viene rilasciato quando:

- La struttura nega la disponibilità.
- Il tentativo viene definitivamente chiuso.
- La richiesta viene interrotta e le interazioni aperte sono state gestite.
- Una diversa struttura conclude la prenotazione.
- Una procedura controllata risolve un tentativo rimasto orfano.

Se la struttura conferma il campo, il blocco temporaneo viene sostituito dallo stato di prenotazione confermata o dalla corrispondente occupazione interna della capacità.

## 11.5 Ripristino dopo errori

Il sistema deve sopravvivere a:

- Riavvio del backend.
- Riavvio del container.
- Caduta della connessione.
- Chiamata telefonica interrotta.
- Webhook duplicato.
- Worker terminato improvvisamente.

Il riavvio non deve eliminare silenziosamente i tentativi ancora validi.

Serve un processo di riconciliazione che individui stati incoerenti, scadenze superate e blocchi orfani.

Prima di liberare un blocco dubbio, valutare se possa esserci ancora una conferma esterna in corso.

---

# 12. Gestione delle richieste simultanee

## 12.1 Principio di priorità

Per richieste concorrenti sulla stessa disponibilità, la precedenza iniziale spetta all'utente che ha presentato per primo la richiesta valida.

Il sistema deve utilizzare un criterio temporale deterministico e persistente.

## 12.2 Coda per risorsa e intervallo

Esempio:

- Utente A richiede lunedì alle 21:00.
- Utente B richiede lo stesso campo e intervallo.
- Utente C richiede lo stesso campo e intervallo.

A ottiene la prima possibilità di verifica.

B e C rimangono coordinati nella coda di quella disponibilità.

Non devono essere necessariamente bloccati nella ricerca presso altre strutture.

## 12.3 Campo in attesa

Se A ha un tentativo in attesa sulla struttura X:

- Lo slot resta bloccato internamente.
- B non può contattare la stessa struttura per consumare la disponibilità protetta.
- B può proseguire sulle altre strutture eleggibili.
- A mantiene la priorità finché il tentativo rimane validamente pendente.

## 12.4 Campo confermato

Quando la disponibilità viene definitivamente assegnata:

- Aggiornare lo stato interno dello slot.
- Non proporre come libera la capacità già occupata.
- Ricalcolare l'eleggibilità delle richieste concorrenti.
- Consentire agli altri utenti di proseguire con le alternative.

## 12.5 Disponibilità nuovamente libera

Quando un blocco viene rilasciato senza conferma:

- Rendere nuovamente candidabile lo slot.
- Risvegliare la coda interessata.
- Rispettare la precedenza delle richieste ancora valide.

## 12.6 Fairness

I processi tecnici devono evitare che un utente mantenga indefinitamente una priorità su uno slot senza un tentativo concretamente valido.

La politica di recupero delle attese anomale resta un dettaglio tecnico da progettare, mantenendo le decisioni funzionali già approvate.

---

# 13. Conferme concorrenti e risposte tardive

Questa è una parte critica.

## 13.1 Regola principale

**La prima conferma valida conclude la richiesta.**

L'agente deve utilizzare le preferenze originali per risolvere eventuali conferme realmente simultanee, se nessuna prenotazione è ancora consolidata.

Non può sostituire autonomamente una prenotazione già conclusa con una struttura più gradita che conferma successivamente.

## 13.2 Campo A in attesa, campo B in ricerca

Se A conferma mentre B è ancora in ricerca:

1. Consolidare la conferma di A.
2. Chiudere la richiesta.
3. Interrompere il tentativo B.
4. Notificare B che la disponibilità non serve più.
5. Chiudere o notificare tutti gli altri tentativi pendenti.
6. Comunicare all'utente la prenotazione confermata.

Questa è una decisione definitiva.

## 13.3 B conferma prima di A

Se B conferma validamente mentre A è ancora in attesa:

1. Consolidare B.
2. Considerare conclusa la richiesta.
3. Notificare A che il campo non serve più.
4. Chiudere gli altri tentativi.
5. Comunicare il risultato all'utente.

Se A richiama successivamente, non viene effettuata una seconda prenotazione.

## 13.4 Conferme simultanee

Se due risposte arrivano praticamente nello stesso momento, il sistema deve garantire una sola assegnazione interna.

Serve un'operazione atomica che impedisca a due processi di consolidare due vincitori.

Qualora entrambe le conferme siano candidate prima del consolidamento, si applica un criterio deterministico che dà precedenza alla struttura più alta nella classifica originale.

Dopo il consolidamento non si cambia automaticamente il vincitore.

## 13.5 Problema delle conferme esterne

Il controllo atomico del database non garantisce da solo che due strutture non abbiano pronunciato contemporaneamente una conferma verbale vincolante.

Occorre progettare una procedura di compensazione.

Se si verifica una doppia conferma esterna:

- Non nascondere l'incoerenza.
- Identificare quale prenotazione deve restare valida.
- Contattare rapidamente la struttura coinvolta nella conferma indesiderata.
- Chiedere la cancellazione.
- Registrare l'esito.
- Se non è risolvibile automaticamente, produrre una segnalazione operativa.

La UX non deve indicare una situazione come completamente risolta quando esistono ancora impegni esterni incompatibili.

## 13.6 Idempotenza degli eventi

Ogni conferma, richiamo, webhook e aggiornamento di stato deve essere idempotente.

Una stessa comunicazione consegnata più volte non deve generare transizioni duplicate.

---

# 14. Controproposte della struttura

La struttura può offrire un orario differente rispetto a quello richiesto.

Esempio:

«Alle 21:00 non abbiamo posto, ma alle 22:00 sì.»

L'agente non accetta autonomamente.

## 14.1 Comportamento

1. Registra la controproposta.
2. Comunica all'utente il nuovo orario.
3. Mostra gli eventuali dettagli economici e le condizioni differenti.
4. Chiede se accettare o passare oltre.
5. Attende l'autorizzazione.

## 14.2 Accettazione

Se l'utente accetta, l'agente deve verificare che la disponibilità proposta sia ancora effettivamente ottenibile.

La sola proposta della struttura non equivale a prenotazione confermata.

L'autorizzazione viene registrata come eccezione esplicita collegata alla richiesta originale.

## 14.3 Rifiuto

Se l'utente rifiuta, l'agente prosegue secondo le preferenze e le condizioni originarie, nei limiti delle strutture ancora disponibili.

---

# 15. Nessuna disponibilità tra i campi preferiti

Quando l'agente esaurisce le strutture autorizzate, non deve necessariamente chiudere subito la ricerca.

Deve informare l'utente.

Messaggio indicativo:

«Non siamo riusciti a trovare un campo disponibile alle 21:00 tra quelli che preferisci. Vuoi provare anche quelli che avevi escluso oppure valutare un'altra fascia oraria?»

## 15.1 Possibili decisioni

- Autorizzare alcuni campi precedentemente esclusi.
- Mantenere esclusi determinati campi senza eccezioni.
- Valutare un altro orario.
- Ampliare il raggio, se proposto.
- Terminare la ricerca.

## 15.2 Persistenza

Le nuove autorizzazioni non modificano automaticamente il profilo.

Non sovrascrivono lo snapshot originale.

Devono essere conservate come decisioni esplicite e tracciabili.

L'agente non può inferire che l'utente abbia autorizzato strutture o condizioni ulteriori soltanto perché desidera trovare un campo.

## 15.3 Richiesta terminata

Se l'utente non desidera continuare, la richiesta termina come ricerca senza disponibilità.

Non viene generata una prenotazione.

---

# 16. Stati visibili della pratica

L'utente non deve essere esposto ai dettagli tecnici degli orchestratori.

Gli stati visibili devono essere semplici.

| Stato UX | Significato |
|---|---|
| In coda | Richiesta registrata, attende lavorazione |
| Ricerca in corso | L'agente sta contattando le strutture |
| In attesa | Una o più strutture devono rispondere |
| Serve una risposta | L'agente necessita di una decisione dell'utente |
| Interruzione in corso | L'utente ha chiesto di fermarsi; restano operazioni da chiudere |
| Confermata | Prenotazione ottenuta |
| Nessuna disponibilità | Ricerca esaurita senza conferma |
| Interrotta | Ricerca chiusa senza prenotazione |
| Disdetta in corso | L'agente sta gestendo la cancellazione |
| Disdetta | Cancellazione conclusa e confermata dalla struttura |
| Problema da risolvere | È necessaria una riconciliazione o un intervento operativo |

## 16.1 Stati composti

Una richiesta può trovarsi simultaneamente nelle seguenti condizioni tecniche:

- Campo A in attesa.
- Campo B in contatto.
- Campo C non ancora contattato.

La schermata deve sintetizzare queste informazioni senza ridurle a uno stato fuorviante.

Esempio:

**Ricerca in corso**

«Stiamo contattando il Centro Sportivo B. Il Centro Sportivo A deve ancora darci una risposta.»

## 16.2 Richiesta di interruzione

L'utente può richiedere l'interruzione di una ricerca non ancora confermata.

Se ci sono interazioni attive, l'interruzione può richiedere la chiusura delle comunicazioni pendenti.

La UX non deve mostrare immediatamente lo stato finale finché non sono state gestite le operazioni necessarie.

Una richiesta già confermata non si interrompe con questa funzione: deve seguire il processo di disdetta.

---

# 17. Sezione «Storico»

Questa sezione è il centro di controllo delle pratiche affidate all'agente.

## 17.1 Elenco

Ogni elemento deve mostrare:

- Data.
- Ora.
- Durata.
- Tipologia campo.
- Struttura confermata, quando presente.
- Stato.
- Ultimo aggiornamento significativo.
- Eventuale azione richiesta all'utente.

## 17.2 Raggruppamento consigliato

- In corso.
- Da gestire.
- Confermate.
- Storico.

Il raggruppamento deve essere funzionale e non creare nuove categorie di stato incoerenti.

## 17.3 Dettaglio della pratica

Aprendo una richiesta, l'utente deve poter visualizzare:

- Parametri originali.
- Data e orario.
- Lista delle strutture considerate.
- Cronologia sintetica dei tentativi.
- Strutture in attesa.
- Eventuali controproposte.
- Decisioni già prese.
- Stato corrente.
- Prossimo evento previsto, se noto.
- Risultato finale.

Le informazioni tecniche sensibili e i dati degli altri utenti non devono essere esposti.

## 17.4 Timeline

Esempio:

- 18:00 — Richiesta inviata.
- 18:01 — Avviata ricerca sul campo A.
- 18:03 — Il campo A chiede 15 minuti.
- 18:04 — L'utente decide di proseguire.
- 18:05 — Avviato contatto con B.
- 18:08 — Il campo A conferma.
- 18:08 — Prenotazione conclusa.
- 18:09 — Chiusura degli altri tentativi.

Questa timeline deve essere costruita da eventi persistiti, non da testi generati liberamente senza corrispondenza con lo stato reale.

---

# 18. Notifiche e interazione con l'utente

Il sistema deve distinguere tra notifiche informative e notifiche che richiedono un'azione.

## 18.1 Notifiche informative

- Richiesta ricevuta.
- Ricerca avviata, quando utile.
- Campo in attesa.
- Ricerca proseguita su un'altra struttura.
- Prenotazione confermata.
- Nessuna disponibilità.
- Interruzione completata.
- Disdetta completata.
- Errore significativo.

Evitare notifiche eccessive per ogni singola operazione tecnica.

## 18.2 Notifiche con decisione

- Aspettare oppure proseguire.
- Accettare oppure rifiutare una controproposta.
- Autorizzare strutture precedentemente escluse.
- Considerare un nuovo orario.
- Valutare un'opportunità recuperata da una disdetta.

## 18.3 Canali

La UX deve essere pensata per poter funzionare attraverso l'applicazione e i canali conversazionali supportati dall'orchestratore.

Il cliente usa PWA, Telegram e WhatsApp Telnyx; le chiamate Telnyx AI sono riservate alle strutture. Email di servizio non implica un canale conversazionale già implementato.

Non duplicare la logica di prenotazione dentro ogni provider di comunicazione.

I canali devono trasportare eventi, messaggi e decisioni verso un sistema applicativo comune.

## 18.4 Decisioni ripetute

Se l'utente riceve una notifica duplicata e risponde due volte, il sistema deve evitare transizioni incoerenti.

Ogni decisione deve essere associata alla richiesta, alla specifica domanda e alla sua validità temporale.

Una risposta a una controproposta ormai scaduta non deve creare una prenotazione.

---

# 19. Prenotazione confermata

Una prenotazione viene considerata conclusa quando la struttura ha fornito una conferma verbale esplicita e il sistema l'ha consolidata correttamente.

## 19.1 Azioni

- Registrare la conferma.
- Associare la struttura.
- Registrare data, ora e durata.
- Conservare tariffa e condizioni applicabili.
- Aggiornare le disponibilità interne.
- Chiudere la ricerca.
- Avviare la chiusura degli altri tentativi.
- Notificare l'utente.
- Emettere l'evento di utilizzo del servizio per la fatturazione.

## 19.2 Messaggio utente

«Prenotazione confermata! Abbiamo prenotato il campo presso [struttura] per [giorno] dalle [ora] alle [ora].»

Mostrare inoltre:

- Indirizzo.
- Tipologia di campo.
- Ambiente Indoor/Outdoor.
- Prezzo della struttura.
- Eventuali condizioni utili.
- Riferimento della prenotazione, se disponibile.

## 19.3 Impatto sui pagamenti

Se l'utente utilizza il piano One Shot, il consumo economico previsto scatta alla conferma secondo il futuro contratto di fatturazione.

Se usa un pacchetto, viene consumato il credito previsto.

Se beneficia della prova gratuita, viene applicato il diritto di utilizzo corrispondente.

**La definizione tecnica di addebito, autorizzazione, contabilizzazione, errori di pagamento e rimborsi resta fuori da questo piano.**

Una prenotazione verbalmente confermata dalla struttura non può essere considerata inesistente soltanto perché un successivo addebito fallisce.

---

# 20. Disdette

La disdetta è un processo differente dall'interruzione della ricerca.

La prenotazione è già stata confermata e potrebbe comportare condizioni contrattuali con la struttura.

## 20.1 Avvio

L'utente apre la prenotazione confermata.

Seleziona **Richiedi disdetta**.

Deve indicare una motivazione.

La motivazione viene associata alla pratica.

## 20.2 Stato

La prenotazione passa a:

**Disdetta in corso**

Non deve essere mostrata come già cancellata prima della conclusione effettiva presso la struttura.

## 20.3 Decisione approvata

**Prima di comunicare la disdetta alla struttura, Digital Mop prova brevemente a trovare un sostituto.**

L'obiettivo è conservare la disponibilità occupata e offrire un'opportunità a chi in precedenza non era riuscito a prenotare.

Questa ricerca preliminare non deve però compromettere eventuali termini o scadenze di cancellazione.

## 20.4 Nessun sostituto disponibile

Quando non viene trovato un sostituto in tempo utile:

1. L'agente contatta la struttura.
2. Comunica la richiesta di disdetta.
3. Comunica la motivazione pertinente.
4. Registra la risposta della struttura.
5. Aggiorna lo stato.
6. Notifica l'utente.

---

# 21. Ricerca del sostituto

## 21.1 Candidati

Il sistema cerca utenti che avevano tentato di prenotare:

- La stessa struttura.
- Una tipologia di campo compatibile.
- Lo stesso giorno.
- Lo stesso orario oppure un orario entro 30 minuti prima o dopo.

Esempio:

Slot liberabile alle 21:00.

Potenziali richieste precedenti:

- 20:30.
- 21:00.
- 21:30.

La vicinanza dell'orario serve per individuare utenti potenzialmente interessati.

**Non equivale ad autorizzazione automatica a cambiare orario.**

## 21.2 Requisiti di eleggibilità

Prima di proporre il posto, verificare:

- Che l'utente sia ancora interessato.
- Che non abbia già una prenotazione incompatibile.
- Che possa ricevere la proposta.
- Che la struttura non sia incompatibile con le esclusioni non derogate.
- Che l'offerta non violi le condizioni economiche già autorizzate.
- Che la richiesta non sia diventata obsoleta.

Le regole esatte di adesione alla lista di recupero saranno definite nella fase di dettaglio.

## 21.3 Proposta

Messaggio indicativo:

«Si è liberata una possibilità al Centro Sportivo A per lunedì alle 21:00. Ti interessa?»

Azioni:

- Accetta.
- Rifiuta.

Non prenotare automaticamente.

## 21.4 Accettazione

Se l'utente accetta:

1. Registrare la sua disponibilità.
2. Coordinare eventuali altre ricerche ancora attive dell'utente.
3. Contattare la struttura.
4. Proporre la sostituzione.
5. Attendere la conferma della struttura.
6. Aggiornare entrambe le pratiche.

La disponibilità del sostituto non garantisce che la struttura accetti il trasferimento.

## 21.5 Priorità fra sostituti

Applicare una regola deterministica e verificabile.

La proposta iniziale è rispettare l'ordine temporale delle richieste compatibili.

Non avviare assegnazioni multiple della stessa disponibilità.

## 21.6 Risultato positivo

Se la struttura accetta la sostituzione:

- La precedente prenotazione viene chiusa secondo la modalità concordata.
- Il nuovo utente riceve la conferma.
- Gli stati delle due pratiche vengono aggiornati.
- La disponibilità rimane occupata internamente.

## 21.7 Risultato negativo

Se il sostituto rifiuta, non risponde in tempo o la struttura non accetta:

- Cercare eventualmente il candidato successivo, nei limiti temporali consentiti.
- Altrimenti procedere con la normale disdetta.

## 21.8 Salvaguardia

Il processo di recupero deve avere una finestra limitata.

Non può ritardare indefinitamente la disdetta originaria.

Il comportamento in prossimità di una scadenza della struttura deve essere particolarmente conservativo.

---

# 22. Disdette e possibili blocchi da parte delle strutture

Il progetto prevede che la struttura possa decidere di non accettare in futuro un utente responsabile di disdette considerate problematiche.

Questa decisione appartiene alla struttura.

Non deve trasformarsi automaticamente in un ban generale dalla piattaforma.

Occorre distinguere:

- Disdetta regolare.
- Disdetta tardiva.
- Mancata presentazione.
- Contestazione della struttura.
- Rifiuto della struttura di accettare nuove prenotazioni per quello specifico utente.

Il sistema deve registrare le restrizioni effettivamente comunicate e applicabili.

Eventuali contestazioni, durata dei blocchi, condizioni di rimozione e gestione dei dati richiedono una politica separata.

La motivazione della disdetta non deve essere comunicata agli utenti candidati alla sostituzione.

---

# 23. Cache delle disponibilità

Digital Mop deve valorizzare le informazioni acquisite durante le telefonate.

## 23.1 Scopo

Ridurre:

- Telefonate ripetitive.
- Richieste duplicate.
- Costi delle interazioni AI.
- Tempi di risposta.
- Concorrenza inutile.

## 23.2 Informazioni possibili

- Disponibilità non conosciuta.
- Disponibilità in verifica.
- Temporaneamente bloccata internamente.
- Segnalata come indisponibile.
- Prenotata attraverso Digital Mop.
- Disponibilità precedentemente segnalata ma non più affidabile.

## 23.3 Aggiornamento

Se una struttura comunica che uno slot è indisponibile, l'agente aggiorna la conoscenza condivisa.

I tentativi successivi devono utilizzare questa informazione.

Se uno slot viene prenotato attraverso Digital Mop, la capacità corrispondente viene occupata internamente.

Se una prenotazione viene cancellata, la disponibilità non deve necessariamente tornare immediatamente a «libera»: può essere necessario verificare se la struttura l'abbia già riassegnata.

## 23.4 Affidabilità

Le disponibilità ottenute telefonicamente possono cambiare.

La cache deve conservare informazioni quali:

- Fonte.
- Momento dell'aggiornamento.
- Stato.
- Scadenza o validità.
- Eventuale pratica associata.
- Livello di affidabilità, dove utile.

Non utilizzare indiscriminatamente informazioni vecchie per impedire nuove ricerche.

---

# 24. Anagrafica delle strutture

Poiché le strutture vengono registrate da Digital Mop, dobbiamo avere un modello dati sufficiente a supportare la ricerca.

## 24.1 Informazioni necessarie

- Identificativo della struttura.
- Nome.
- Indirizzo.
- Coordinate geografiche.
- Recapiti telefonici.
- Tipologie di campo disponibili.
- Numero o identificazione delle risorse prenotabili.
- Prezzi.
- Eventuali tariffe per 90 minuti.
- Informazioni sugli orari.
- Condizioni di prenotazione.
- Condizioni di cancellazione.
- Eventuali limitazioni note.

Non serve necessariamente sviluppare subito un pannello completo per i gestori.

Per la demo possono essere utilizzate anagrafiche amministrate internamente.

## 24.2 Relazione struttura-campo

Non assumere che una struttura equivalga a un solo campo.

Una struttura può possedere diverse risorse fisiche, anche della stessa tipologia.

Code, blocchi e prenotazioni devono poter distinguere correttamente capacità e sovrapposizioni.

## 24.3 Accuratezza dei prezzi

Le tariffe devono essere mantenute aggiornate.

Se durante un contatto emerge una discrepanza:

- Registrarla.
- Non correggere arbitrariamente il prezzo della pratica.
- Non accettare automaticamente una spesa superiore.
- Segnalare l'aggiornamento necessario dell'anagrafica.

---

# 25. Architettura logica

Senza imporre una tecnologia specifica, il dominio dovrebbe distinguere chiaramente le seguenti responsabilità.

## 25.1 Richiesta di prenotazione

Contiene il desiderio originale dell'utente e lo stato complessivo della pratica.

## 25.2 Tentativo di prenotazione

Contiene il rapporto con una specifica struttura durante la ricerca.

## 25.3 Prenotazione confermata

Rappresenta l'impegno effettivamente ottenuto presso una struttura.

## 25.4 Blocco temporaneo

Coordina l'accesso concorrente alle disponibilità all'interno di Digital Mop.

## 25.5 Disponibilità conosciute

Conserva informazioni provenienti dalle strutture, con la loro validità e affidabilità.

## 25.6 Decisioni dell'utente

Registra autorizzazioni e risposte alle richieste dell'agente.

## 25.7 Notifiche

Gestisce l'invio e lo stato delle comunicazioni verso l'utente.

## 25.8 Eventi di dominio

Registra i cambiamenti importanti con identificativi idempotenti.

## 25.9 Disdetta e sostituzione

Gestisce il ciclo di vita successivo alla conferma, senza confonderlo con i tentativi iniziali.

## 25.10 Orchestratore AI

Coordina il ragionamento conversazionale e le operazioni autorizzate.

Non deve diventare l'unica fonte dello stato della prenotazione.

Lo stato applicativo deve risiedere in componenti persistenti e verificabili.

### Regola architetturale

**L'AI decide quali azioni proporre o richiedere; il backend applicativo verifica e garantisce le regole di business.**

Non affidare esclusivamente al modello linguistico:

- Acquisizione di blocchi.
- Precedenza nelle code.
- Idempotenza.
- Consolidamento atomico.
- Gestione delle doppie conferme.
- Consumo dei crediti.
- Stato definitivo delle prenotazioni.

Queste regole devono essere applicate dal sistema.

---

# 26. Integrazione con l'orchestratore AI

Nel progetto esiste già un orchestratore sperimentale che gestisce conversazioni e canali.

La nuova UX deve potersi collegare a esso senza duplicare la logica applicativa.

## 26.1 Capacità necessarie

L'agente deve poter richiedere operazioni come:

- Ottenere i dettagli di una pratica.
- Consultare i tentativi esistenti.
- Individuare il prossimo campo candidabile.
- Richiedere l'avvio di un contatto.
- Registrare la risposta della struttura.
- Pianificare un richiamo.
- Registrare una controproposta.
- Richiedere una decisione all'utente.
- Consolidare una conferma.
- Chiudere i tentativi pendenti.
- Richiedere una disdetta.
- Proporre una sostituzione.
- Ottenere lo stato aggiornato della pratica.

Queste rappresentano capacità funzionali, non nomi definitivi di tool o endpoint.

## 26.2 Eventi asincroni

Il sistema deve essere in grado di riprendere una pratica quando:

- Scade il termine di attesa.
- Arriva una chiamata da una struttura.
- Arriva un messaggio dell'utente.
- Si libera un blocco.
- Una struttura comunica una risposta.
- Una disdetta genera una nuova opportunità.

Non affidare l'intero ciclo di vita a una singola richiesta HTTP o a una conversazione AI mantenuta indefinitamente in esecuzione.

## 26.3 Tracciabilità

Per ogni decisione importante deve essere possibile ricostruire:

- Quale evento l'ha originata.
- Quale struttura era coinvolta.
- Quale tentativo era attivo.
- Quale autorizzazione dell'utente esisteva.
- Quale transizione è stata effettuata.
- Quali notifiche sono state inviate.

---

# 27. Gestione degli errori

Progettare esplicitamente almeno questi scenari.

## 27.1 Chiamata fallita

La struttura non risponde o la comunicazione fallisce.

Registrare l'esito e applicare una strategia di retry controllata.

## 27.2 Struttura non contattabile

Se non è possibile contattare una struttura, la pratica non deve restare bloccata per sempre.

## 27.3 Utente non raggiungibile

Se serve un'autorizzazione e l'utente non risponde, l'agente non può inventarla.

La pratica resta in uno stato coerente fino alla decisione o alla scadenza dell'opportunità.

## 27.4 Notifica duplicata

Non deve produrre azioni duplicate.

## 27.5 Risposta tardiva

Deve essere verificata rispetto allo stato corrente della pratica.

## 27.6 Chiamata interrotta dopo una possibile conferma

Non assumere automaticamente né conferma né rifiuto.

Registrare uno stato da riconciliare quando l'esito è incerto.

## 27.7 Interruzione durante un contatto

Non considerare il tentativo chiuso finché non sono state eseguite o recuperate le azioni necessarie.

## 27.8 Concorrenza nella stessa struttura

Non permettere che più agenti consumino la stessa capacità interna senza coordinamento.

## 27.9 Disdetta non riuscita

Informare l'utente che la cancellazione non è stata confermata.

Non modificare falsamente lo stato della prenotazione.

## 27.10 Errore di pagamento

Gestire separatamente lo stato economico e quello della prenotazione reale.

Un problema di fatturazione non deve produrre automaticamente una falsa cancellazione.

---

# 28. UX: schermate da progettare

Grocco deve considerare come minimo queste schermate o viste funzionali.

## 28.1 Posizione abituale nell’Account

Account → La tua posizione: indirizzo e raggio abituali, autocomplete e geolocalizzazione facoltativa. Selezione e ordine dei campi rimangono nel form Prenota; nessuna sezione Preferiti separata.

## 28.2 Nuova richiesta

Home con crediti, richiesta attiva e form (data, ora, tipologia, Indoor/Outdoor, posizione e raggio massimo 1–100 km). Card selezionabili e riordinabili, barra fissa di riepilogo/azione, conferma con condizioni. La UI distingue mancata disponibilità accertata da assenza di campi corrispondenti ai filtri.

## 28.3 Richiesta presa in carico

Contenuti:

- Conferma dell'invio.
- Parametri della richiesta.
- Stato iniziale.
- Collegamento ai dettagli.

## 28.4 Storico

Contenuti:

- Richieste attive.
- Richieste che necessitano decisioni.
- Prenotazioni confermate.
- Storico.

## 28.5 Dettaglio della ricerca

Contenuti:

- Stato generale.
- Timeline.
- Tentativi.
- Strutture in attesa.
- Eventuali decisioni richieste.
- Possibilità di interrompere la ricerca.

## 28.6 Decisione di attesa

Messaggio:

«Il Centro Sportivo A ci ha chiesto 15 minuti. Vuoi aspettare oppure continuiamo a cercare?»

Azioni:

- Aspettiamo.
- Prosegui con il prossimo.

Specificare nella UX che la seconda scelta mantiene il primo tentativo pendente, se ancora valido.

## 28.7 Controproposta

Contenuti:

- Orario originale.
- Orario proposto.
- Eventuale differenza di prezzo.
- Accetta.
- Rifiuta e prosegui.

## 28.8 Nessuna disponibilità

Contenuti:

- Riepilogo dei tentativi.
- Proposta di includere campi esclusi.
- Proposta di valutare altri orari.
- Chiusura della ricerca.

## 28.9 Prenotazione confermata

Contenuti:

- Struttura.
- Data.
- Orario.
- Durata.
- Prezzo.
- Indirizzo.
- Stato.
- Dettagli della conferma.
- Richiesta di disdetta.

## 28.10 Richiesta di disdetta

Contenuti:

- Riepilogo della prenotazione.
- Condizioni eventualmente applicabili.
- Motivazione obbligatoria.
- Conferma dell'intenzione di disdire.

## 28.11 Disdetta in corso

Contenuti:

- Stato.
- Informazione sul tentativo di trovare un sostituto.
- Aggiornamenti significativi.
- Esito finale.

## 28.12 Offerta di uno slot recuperato

Contenuti:

- Struttura.
- Data e ora.
- Prezzo.
- Scadenza della proposta, se prevista.
- Accetta.
- Rifiuta.

L'accettazione avvia la verifica o la sostituzione presso la struttura; non deve essere presentata come conferma già ottenuta.

---

# 29. Criteri di accettazione e test

Devono essere previsti test automatici delle regole deterministiche e simulazioni end-to-end dei comportamenti dell'agente.

## Prenotazione standard

**TEST 01** — Utente verificato invia una richiesta valida: viene creata una sola pratica.

**TEST 02** — Utente non verificato tenta l'invio: la richiesta non parte.

**TEST 03** — Il primo campo conferma: la pratica si conclude.

**TEST 04** — Il primo campo rifiuta: viene tentato il successivo.

**TEST 05** — Un doppio clic su Invia non crea due pratiche.

## Preferenze

**TEST 06** — Le strutture vengono considerate nell'ordine configurato.

**TEST 07** — Un campo escluso non viene contattato senza autorizzazione.

**TEST 08** — Checkbox e frecce modificano la bozza; la precompilazione dalla richiesta precedente non ripristina campi inattivi o date trascorse.

**TEST 09** — La modifica del profilo successiva all'invio non cambia una pratica attiva.

**TEST 10** — I parametri originali della richiesta non sono editabili.

## Attese

**TEST 11** — Una struttura chiede 15 minuti: il termine di richiamo viene registrato.

**TEST 12** — L'utente sceglie di aspettare: l'agente non passa al campo successivo.

**TEST 13** — L'utente sceglie di proseguire: il primo tentativo resta pendente.

**TEST 14** — La struttura richiama anticipatamente: la risposta viene gestita.

**TEST 15** — La struttura non richiama: l'agente effettua il contatto al termine concordato.

**TEST 16** — Il tentativo viene chiuso: il blocco interno viene rilasciato.

## Concorrenza

**TEST 17** — Due utenti richiedono la stessa risorsa e lo stesso intervallo: non vengono acquisiti blocchi incompatibili.

**TEST 18** — Il primo utente mantiene un tentativo in attesa: il secondo non può superarlo sul medesimo slot protetto.

**TEST 19** — Il secondo utente può cercare su altre strutture.

**TEST 20** — Due fasce di 90 minuti sovrapposte vengono riconosciute come concorrenti per la stessa risorsa.

**TEST 21** — Una struttura con più campi può gestire correttamente la propria capacità.

**TEST 22** — Dopo il riavvio del backend, richieste, scadenze e blocchi rimangono riconciliabili.

## Conferme tardive

**TEST 23** — A è in attesa, B è in ricerca, A conferma: A vince e B viene chiuso.

**TEST 24** — B conferma per primo: B vince e A viene notificato.

**TEST 25** — A conferma dopo la conclusione su B: non viene generata una seconda prenotazione intenzionale.

**TEST 26** — Due conferme concorrenti non producono due vincitori interni.

**TEST 27** — Due conferme esterne reali attivano la procedura di compensazione.

**TEST 28** — Un evento duplicato non modifica nuovamente una richiesta conclusa.

## Controproposte

**TEST 29** — La struttura propone un altro orario: l'agente richiede autorizzazione.

**TEST 30** — L'utente rifiuta: non viene prenotato l'orario alternativo.

**TEST 31** — L'utente accetta ma la disponibilità scade: non viene inventata una conferma.

## Interruzione

**TEST 32** — L'utente interrompe una ricerca senza tentativi attivi.

**TEST 33** — L'utente interrompe una ricerca con una struttura in attesa.

**TEST 34** — L'interruzione non lascia tentativi attivi non gestiti.

**TEST 35** — Una prenotazione già confermata non viene cancellata mediante la semplice interruzione della ricerca.

## Disdette

**TEST 36** — Una disdetta richiede una motivazione.

**TEST 37** — Il sistema individua richieste compatibili a ±30 minuti.

**TEST 38** — Il sostituto deve accettare esplicitamente.

**TEST 39** — La struttura deve confermare la sostituzione.

**TEST 40** — Se non si trova un sostituto, si procede alla disdetta ordinaria.

**TEST 41** — Il tentativo di sostituzione non provoca il superamento incontrollato dei termini di cancellazione.

**TEST 42** — Una disdetta non confermata dalla struttura non viene presentata come conclusa.

## Informazioni economiche

**TEST 43** — Una ricerca fallita non genera automaticamente il consumo previsto per una prenotazione confermata.

**TEST 44** — Un piano One Shot attiva il relativo evento economico alla conferma.

**TEST 45** — Una differenza di tariffa non viene accettata automaticamente.

---

# 30. Demo e stress test

Prima dell'apertura pubblica sono previste sessioni di demo e stress test per stimare i costi operativi dell'AI.

La UX e l'architettura devono consentire simulazioni controllate.

## 30.1 Scenari di demo

- Prenotazione semplice.
- Ricerca su più strutture.
- Struttura in attesa.
- Richiamo anticipato.
- Richiamo pianificato.
- Controproposta.
- Nessuna disponibilità.
- Richieste simultanee.
- Conferme quasi contemporanee.
- Interruzione.
- Disdetta.
- Recupero di disponibilità.

## 30.2 Metriche da raccogliere

- Numero di richieste.
- Tentativi medi per prenotazione.
- Tentativi telefonici falliti.
- Durata media delle chiamate.
- Tempo medio fino alla conferma.
- Tempo totale trascorso in attesa.
- Numero di interventi richiesti all'utente.
- Numero di richiami.
- Percentuale di prenotazioni confermate.
- Percentuale di ricerche non concluse.
- Numero di conflitti concorrenti.
- Numero di blocchi scaduti o orfani.
- Numero di conferme duplicate o incoerenti.
- Numero di disdette recuperate.
- Costo medio AI per richiesta.
- Costo medio AI per prenotazione confermata.
- Costo medio per telefonata e canale.

Queste informazioni serviranno anche a definire il modello commerciale.

---

# 31. Piano di implementazione proposto

L'implementazione dovrebbe essere suddivisa in fasi verificabili.

## Fase 1 — Analisi dell'esistente

- Analizzare l'architettura Express, database e servizi esistenti.
- Individuare le responsabilità già implementate.
- Verificare i punti di integrazione con l'orchestratore AI.
- Verificare le integrazioni di identità e comunicazione.
- Produrre una mappa dei componenti riutilizzabili.
- Identificare le lacune tecniche.

**Output:** analisi dei gap e proposta architetturale, senza modifiche automatiche al codice.

## Fase 2 — Modello di dominio

- Richieste.
- Tentativi.
- Prenotazioni confermate.
- Preferenze e snapshot.
- Blocchi.
- Code.
- Disponibilità.
- Decisioni utente.
- Eventi.
- Disdette.
- Proposte di sostituzione.

Definire vincoli, identificativi e transizioni.

**Output:** modello dati e macchine a stati.

## Fase 3 — UX senza telefonia reale

Realizzare il flusso con eventi simulati:

- Profilo.
- Nuova richiesta.
- Invio.
- Storico.
- Timeline.
- Attese.
- Decisioni.
- Controproposte.
- Conferme.
- Interruzioni.

**Output:** percorso utente verificabile senza dipendere dalle chiamate reali.

## Fase 4 — Coordinamento delle richieste

Implementare:

- Snapshot immutabili.
- Code per disponibilità.
- Blocchi temporanei.
- Gestione delle sovrapposizioni.
- Scadenze.
- Idempotenza.
- Consolidamento atomico.
- Recupero degli stati anomali.

**Output:** motore applicativo affidabile, testabile attraverso simulazioni concorrenti.

## Fase 5 — Integrazione dell'agente

Collegare il motore applicativo all'orchestratore già esistente.

Implementare le operazioni necessarie affinché l'agente possa:

- Cercare il prossimo campo.
- Avviare tentativi.
- Registrare risposte.
- Pianificare richiami.
- Richiedere autorizzazioni.
- Confermare.
- Chiudere tentativi.

**Output:** ricerca realmente orchestrata tramite agenti e canali disponibili.

## Fase 6 — Disdette e sostituzioni

Implementare:

- Richiesta di disdetta.
- Motivazione.
- Ricerca dei candidati.
- Proposte.
- Accettazione.
- Contatto della struttura.
- Aggiornamento degli stati.
- Notifiche.

**Output:** ciclo completo successivo alla prenotazione.

## Fase 7 — Integrazione economica

Collegare gli eventi della prenotazione ai servizi di fatturazione quando questi saranno definiti.

Non incorporare regole economiche arbitrarie nel dominio delle prenotazioni.

**Output:** integrazione coerente con One Shot, crediti, pacchetti ed eventuali prove gratuite.

## Fase 8 — Stress test

Eseguire simulazioni con molte richieste concorrenti.

Verificare:

- Coerenza dei blocchi.
- Assenza di duplicazioni interne.
- Correttezza delle code.
- Recupero dopo errori.
- Resistenza ai webhook duplicati.
- Tempi operativi.
- Costi dell'agente.

**Output:** valutazione della sostenibilità e dei rischi prima del rilascio pubblico.

---

# 32. Punti non ancora deliberati

Questi punti non devono essere presentati come decisioni definitive.

Grocco deve segnalarli e proporre opzioni tecnicamente motivate.

## 32.1 Geolocalizzazione

Definire se la distanza mostrata sia:

- In linea d'aria.
- Su percorso stradale.

Definire inoltre il comportamento quando la posizione non è disponibile.

## 32.2 Strutture con più campi equivalenti

Definire come amministrare la capacità quando una struttura dichiara la disponibilità di più risorse della stessa tipologia.

## 32.3 Tempo limite di riconciliazione

Definire il comportamento tecnico quando una struttura non risponde neppure al richiamo concordato.

Il timeout tecnico deve evitare blocchi orfani, senza sostituire arbitrariamente l'attesa richiesta dalla struttura.

## 32.4 Numero di tentativi pendenti

Valutare limiti tecnici configurabili sul numero di trattative simultaneamente aperte per una singola richiesta.

Nessun limite è ancora stato approvato.

## 32.5 Prezzi per 90 minuti

Decisione consolidata: tariffa per singolo campo per 90 minuti, senza conversione automatica. Restano da gestire operativamente dati mancanti, aggiornamenti e controproposte.

## 32.6 Recupero delle richieste precedenti

Definire se gli utenti possano aderire preventivamente alle proposte per slot recuperati e per quanto tempo una precedente richiesta resti candidabile.

## 32.7 Tempo massimo di risposta a una proposta

Definire la scadenza delle proposte di sostituzione e delle controproposte non più garantite dalla struttura.

## 32.8 Politica delle disdette

Definire tempistiche, eventuali penali, riaccredito dei crediti e gestione dei casi contestati.

## 32.9 Canali di comunicazione

Definire quali notifiche e decisioni siano disponibili attraverso interfaccia web, email, Telegram, WhatsApp e altri canali.

## 32.10 Fatturazione

Restano da definire pacchetti/prezzi delle ricariche, provider pagamento, documenti fiscali, rimborsi e addebiti falliti. Modello già deciso: crediti a consumo, nessun Pass o abbonamento. Quota prestito e politica delle penali richiedono parametri approvati; i numeri del mockup non sono prezzi.

## 32.11 Prove delle conferme telefoniche

Definire come documentare una conferma verbale e come gestire eventuali contestazioni, tenendo conto delle regole applicabili al trattamento delle comunicazioni.

---

# 33. Regole di qualità della UX

L'interfaccia deve:

1. Utilizzare un linguaggio semplice.
2. Separare chiaramente ricerca, attesa e prenotazione confermata.
3. Non mostrare disponibilità certe quando non lo sono.
4. Non esporre la complessità tecnica degli agenti.
5. Evitare richieste ripetitive all'utente.
6. Richiedere autorizzazione soltanto quando necessaria.
7. Mantenere uno storico comprensibile.
8. Mostrare sempre quando una decisione è richiesta.
9. Non permettere modifiche silenziose a richieste inviate.
10. Essere utilizzabile da mobile.
11. Gestire accessibilità, errori e stati vuoti.
12. Distinguere esplicitamente costo della struttura e costo del servizio.
13. Evitare conferme ottimistiche non ancora realmente ottenute.
14. Rendere comprensibile il significato di «Passa al prossimo» e delle attese pendenti.
15. Non presentare un'interruzione o una disdetta come conclusa prima della gestione effettiva delle relative operazioni.

---

# 34. Istruzioni finali per Grocco

Utilizza questa specifica come riferimento funzionale autorevole per la progettazione della UX di prenotazione Digital Mop.

Non reinterpretare come modificabili le richieste già inviate.

Non introdurre tolleranze orarie automatiche.

Non sostituire le conferme verbali con obblighi di conferma scritta.

Non introdurre timeout fissi non approvati per l'attesa delle strutture.

Non trasformare i blocchi interni in prenotazioni garantite dalle strutture.

Non duplicare la logica di prenotazione nei singoli canali di comunicazione.

Non confondere la chiusura di un tentativo con la cancellazione di una prenotazione reale.

Non definire autonomamente regole economiche ancora aperte.

## Primo compito richiesto

Prima di implementare, esamina il progetto esistente e produci:

1. **Analisi dei componenti già presenti** e riutilizzabili.
2. **Gap analysis** tra questa specifica e il codice attuale.
3. **Modello di dominio** con entità, relazioni e vincoli.
4. **Macchine a stati** della richiesta, dei tentativi e della disdetta.
5. **Architettura proposta** per orchestratore, code, blocchi, scheduling e notifiche.
6. **Mappa delle interfacce UX** con schermate, azioni e transizioni.
7. **Contratti di integrazione** con identità, comunicazioni e fatturazione.
8. **Roadmap di implementazione**, con dipendenze e test per ogni fase.
9. **Elenco puntuale dei soli punti ancora aperti**, distinguendo decisioni di prodotto da scelte implementative.

Per ogni proposta segnala se richiede:

- Un nuovo componente.
- Una modifica a un componente esistente.
- Un nuovo modello persistente.
- Una modifica dell'orchestratore AI.
- Una modifica dell'interfaccia.
- Una decisione funzionale non ancora approvata.

Non modificare automaticamente il repository durante questa prima fase di analisi.

Non riscrivere parti già funzionanti se possono essere riutilizzate.

Fornisci indicazioni precise, verificabili e implementabili progressivamente.

L'obiettivo è costruire un sistema che mantenga la correttezza delle prenotazioni anche quando più agenti, più utenti e più strutture interagiscono contemporaneamente.

**Priorità assoluta: correttezza dello stato e degli impegni reali, poi semplicità della UX, poi ottimizzazione dei costi operativi.**
# 35. Raccordo Telnyx e reference verificata

### Contratto della voce Telnyx

Usare l'assistente Single-prompt già configurato, con modalità inbound/outbound e contesto dinamico; non duplicare assistenti per sostituire le regole del backend. Gli endpoint collaudati nel runbook sono `POST /webhooks/telnyx/assistant/init` e `POST /webhooks/telnyx/assistant/tools/record-structure-response`. Il secondo raccoglie un esito demo: non equivale a confermare una prenotazione.

L'inizializzazione verifica firma Ed25519, timestamp anti-replay, assistant e canale, quindi restituisce `dynamic_variables`. Il backend genera il `call_token`, ne conserva scadenza e associazione a chiamata, ruolo, struttura e tentativo; il token non è una credenziale del cliente né un'autorizzazione generale. I Webhook Tools usano l'autenticazione dedicata configurata nel runbook; non presumere che abbiano automaticamente lo stesso contratto di firma dell'inizializzazione. Controllare segreto, token, stato, ambito e idempotenza a ogni tool. Non loggare segreti o token.

Il tool produce dati strutturati validati dal motore di dominio. La risposta HTTP positiva, l'hangup o il saluto del modello non dimostrano da soli una prenotazione confermata. Correlare gli identificativi disponibili senza confondere ID TeXML, call control, conversazione e tentativo. Gli eventi di fine chiamata e costo vanno integrati e collaudati separatamente.

**Gate inbound ancora da collaudare:** il routing diretto numero → AI Assistant del test non prova il rifiuto prima della risposta. Il webhook di inizializzazione non va considerato automaticamente un gate pre-answer. Verificare il percorso Telnyx/TeXML supportato che controlli la whitelist prima di rispondere o avviare AI; se manca questa prova, la voce pubblica resta non pronta. Nessun fallback statico o saluto deve aggirare il gate. Per outbound ricontrollare il contatto autorizzato prima di chiamare. Non ripristinare GPT-Live per risolvere il gate.

### Reference grafica e limiti del prototipo

- Schermate 001/002 e 017: home Prenota, header compatto, crediti e richiesta in corso sopra al form; sport, ambiente a scelta singola, giorno, ora, 90 minuti fissi, posizione con autocomplete e geolocalizzazione facoltativa.
- Raggio massimo: slider a una maniglia **1–100 km**, come mostrato dalla reference corrente; nessun raggio minimo. La nota 096 «raggio da allineare» resta un residuo del prototipo: questa revisione adotta il controllo visibile più recente, da validare anche lato server.
- Card campo: checkbox di inclusione, priorità, distanza, nome struttura/campo, ambiente, prezzo per 90 minuti, «Da verificare», pulsanti ↑ e ↓. I pulsanti ai limiti sono disabilitati. Niente pagina Preferiti nel profilo; precompilare dall'ultima richiesta compatibile, poi consentire modifiche prima dell'invio. Rivalidare campi attivi, prezzi e filtri.
- Barra azione fissa «Affida la ricerca →» sopra la navigazione; padding e safe area impediscono di coprire l'ultimo contenuto. Il riepilogo precede l'invio e raccoglie l'accettazione delle condizioni.
- Navigazione principale: **Prenota / Storico / Account**. Storico: richieste in corso in alto, poi le concluse dalla più recente. Account: crediti e ricariche, posizione, comunicazioni, dati/sicurezza/fatturazione.
- Crediti: disponibile distinto dalla quota in prestito, progress bar con segmento tratteggiato e legenda testuale, info/dialog per le spiegazioni. Nessun valore demo diventa listino, soglia o saldo reale.
- Palette reference: ink `#193c32`, green `#2a533b`, lime `#d6ed99`, muted `#7c857f`, line `#e0e6d8`, bg `#f5f7f0`, white `#ffffff`, soft `#eaf1e1`, amber `#ac7931`; font Inter. Non affidare gli stati al solo colore; verificare contrasto, focus, label e ordine di lettura.
- Calcio a **5/7/9/11**: il 9 resta nel dominio anche se alcune schermate demo mostrano solo 5/7/11; l'8 nei vecchi piani è corretto in 9.
- Schermate 014/060: «Quando possiamo chiamarti?» e backup telefonico cliente sono residui **da non implementare**. Conservare preferenze di notifica sui canali abilitati; orari telefonici solo per le strutture.
- Schermata 094: limite di una ricerca attiva per cliente **non deliberato**; non usarlo come sostituto di lock, ammissione atomica e protezione dal doppio uso del saldo.
- La conferma PWA del linking Telegram in produzione resta obbligatoria anche se il prototipo semplifica la transizione. Il prototipo mostra link email: il piano aggiornato caricato nello ZIP delibera OTP Resend; conservare OTP e adattare quella schermata, senza cambiare protocollo per una differenza grafica.
- Ricariche (016) sono placeholder; CIE, Google e passkey disegnati non sono prova di integrazione. Controlli «Simula…», date, nomi, importi e indirizzi demo non entrano nei flussi reali.
