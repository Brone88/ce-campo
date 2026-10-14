# DIGITAL MOP — Piano integrativo: Credit Wallet, consumi AI e affidabilità delle prenotazioni

**Stato:** Specifica funzionale e tecnica per integrazione nei piani esistenti  
**Ambito:** Registrazione, UX, orchestratore AI, gestione strutture, prenotazioni, cancellazioni, crediti e reputazione  
**Obiettivo:** Sostituire il modello subscription con un sistema a consumo e introdurre garanzie comportamentali per proteggere l'affidabilità della piattaforma.

---

## 1. Obiettivi e principi

Digital Mop adotta un modello commerciale basato su un portafoglio di crediti.

I crediti svolgono due funzioni distinte:

1. **Consumo operativo:** misurano le risorse utilizzate dagli agenti AI per eseguire le richieste degli utenti.
2. **Garanzia comportamentale:** disincentivano prenotazioni superficiali, cancellazioni tardive e mancata presentazione agli appuntamenti.

Il secondo meccanismo non ha finalità risarcitorie verso le strutture.

Digital Mop non paga indennizzi ai gestori e non si assume le loro eventuali penali economiche.

La garanzia serve a tutelare la reputazione della piattaforma, evitando che la facilità di delegare un'attività a un assistente AI elimini il senso di responsabilità dell'utente.

### Principi inderogabili

- Nessun abbonamento obbligatorio.
- Nessun rinnovo periodico delle preferenze.
- Nessuna tariffa fissa per abilitare un canale.
- Consumo proporzionale al lavoro effettivo dell'agente.
- Nessun costo operativo per il semplice trascorrere del tempo.
- Nessuna presunzione di disponibilità degli slot sconosciuti.
- Nessuna prenotazione senza identità verificata.
- Nessuna penale applicata senza condizioni preventivamente accettate.
- Nessuna garanzia che Digital Mop possa recuperare un campo cancellato.
- Nessun risarcimento economico alle strutture.

---

## 2. Sostituzione del modello subscription

Eliminare dal piano UX precedente:

- Selezione del piano subscription.
- Quote periodiche di minuti, messaggi o richieste.
- Rinnovo delle subscription.
- Vincoli temporali per cambiare canale.
- Tariffe di attivazione dei singoli canali.
- Logiche di upgrade/downgrade fra abbonamenti.

Sostituire queste funzionalità con:

- Portafoglio crediti personale.
- Bonus iniziale gratuito.
- Consumo operativo misurato.
- Acquisto di ulteriori crediti.
- Preferenze dei canali modificabili liberamente.
- Storico di utilizzo.
- Gestione delle garanzie sulle prenotazioni.

Le preferenze definiscono come l'utente desidera essere contattato, non il suo livello di abbonamento.

I canali disponibili restano soggetti alle rispettive verifiche tecniche e autorizzazioni.

### Compatibilità con l'onboarding esistente

Conservare:

- Verifica email mediante Resend.
- Verifica cellulare mediante Telnyx.
- Identificazione SPID o CIE.
- Raccolta dei dati di fatturazione.
- Associazione persistente dell'identità verificata all'account.

Il flusso di prenotazione già progettato nell'altra conversazione resta valido e costituisce una dipendenza di questo piano.

---

## 3. Crediti gratuiti iniziali

Al completamento dell'identificazione l'utente riceve un ammontare configurabile di crediti gratuiti.

Configurazione iniziale:

`INITIAL_FREE_CREDITS`

Il valore deve essere configurabile tramite variabile d'ambiente per la demo.

### Regole

- I crediti iniziali vengono assegnati una sola volta per identità verificata.
- Cambiare email, telefono o canale non genera un nuovo bonus.
- La verifica mediante SPID e CIE deve identificare la stessa persona quando applicabile.
- Il credito gratuito viene registrato come transazione specifica.
- La modifica della configurazione non deve alterare i saldi già assegnati.
- Non prevedere accrediti gratuiti periodici automatici.
- I crediti gratuiti possono essere usati sia per attività operative sia per costituire garanzie, salvo successive regole antifrode.

### Implementazione

Introdurre un'identità canonica verificata, condivisa tra SPID e CIE, evitando di esporre identificativi personali nei log.

Usare un identificatore derivato e protetto per controllare l'unicità dell'assegnazione.

Il backend deve impedire accrediti duplicati anche in presenza di richieste simultanee.

### Test

- Prima identificazione: accredito corretto.
- Seconda identificazione: nessun nuovo accredito.
- Cambio email: nessun nuovo accredito.
- Accesso tramite CIE dopo SPID: nessun doppio bonus.
- Retry del backend: nessuna duplicazione.
- Cambio configurazione: nessuna modifica retroattiva.

---

## 4. Credit Wallet

Ogni utente verificato possiede un portafoglio.

### Informazioni necessarie

- Crediti totali.
- Crediti disponibili.
- Crediti vincolati come garanzia.
- Crediti gratuiti e acquistati, tracciati per origine.
- Storico degli accrediti.
- Storico dei consumi operativi.
- Storico delle garanzie.
- Penali applicate.
- Eventuali rettifiche e rimborsi.

### Operazioni previste

| Operazione | Effetto |
|---|---|
| Accredito iniziale | Aumenta il saldo |
| Ricarica | Aumenta il saldo |
| Consumo operativo | Riduce il disponibile |
| Vincolo garanzia | Sposta crediti dal disponibile al vincolato |
| Svincolo garanzia | Ripristina il disponibile |
| Applicazione penale | Consuma crediti precedentemente vincolati |
| Rettifica | Compensa contabilmente una transazione precedente |

Il saldo non deve essere modificato direttamente dall'orchestratore.

Tutte le operazioni devono passare attraverso un servizio centralizzato.

### Credit Ledger

Realizzare un registro persistente e verificabile di tutte le transazioni.

Ogni movimento deve indicare almeno:

- Identificativo univoco.
- Utente.
- Tipologia.
- Quantità di crediti.
- Richiesta o prenotazione di riferimento.
- Causa del movimento.
- Data e ora.
- Identificativo di idempotenza.
- Versione delle regole utilizzate.

Il registro deve essere append-only: eventuali errori vengono compensati con nuove transazioni, non cancellando lo storico.

Le operazioni sul saldo devono essere atomiche, proteggendo il sistema da consumi simultanei e doppi addebiti.

---

## 5. Misurazione del lavoro dell'AI

I crediti operativi rappresentano il costo del lavoro realmente eseguito, indipendentemente dall'esito finale della prenotazione.

### Risorse da misurare

**Orchestratore AI**

- Token di input.
- Token di output.
- Eventuali token di ragionamento fatturati.
- Chiamate agli strumenti.
- Delegazioni ad altri modelli.

**Agente telefonico**

- Consumo dei modelli audio.
- Durata fatturata delle chiamate.
- Costi del provider telefonico.
- Eventuali tentativi non riusciti fatturati dal provider.

**Messaggistica**

- Elaborazione dei messaggi Telegram.
- Elaborazione dei messaggi WhatsApp.
- Costi effettivi dei provider.
- Eventuali notifiche e comunicazioni generate dall'agente.

**Email**

- Eventuale elaborazione AI del contenuto.
- Costi effettivamente sostenuti per l'invio, quando rilevanti.

### Regola fondamentale

L'utente non acquista una prenotazione, ma utilizza un servizio di delegazione.

Una prenotazione semplice può consumare pochi crediti.

Una ricerca che coinvolge più strutture, chiamate, attese, controproposte e cambi di programma può consumarne molti di più.

Un tentativo senza prenotazione confermata può comunque comportare un consumo operativo.

Non addebitare automaticamente all'utente lavoro ripetuto a causa di errori interni, retry non necessari o duplicazioni.

### Conversione costi → crediti

Separare tre elementi:

1. Costo reale del provider.
2. Regola di conversione del costo in crediti.
3. Crediti addebitati all'utente.

Le regole devono essere indipendenti dall'orchestratore, configurabili e versionate.

Non stabilire ancora il rapporto economico definitivo.

La conversione sarà calibrata tramite test di utilizzo e stress test su diversi scenari.

Non introdurre costi arbitrari per singolo canale: le differenze di consumo devono derivare dalle risorse effettivamente utilizzate.

### Attenzione

I crediti operativi vengono conteggiati per singola attività e aggregati per richiesta o prenotazione.

Non devono essere addebitati tutti i token accumulati nella conversazione senza distinguere ciò che appartiene all'operazione corrente.

L'eventuale riutilizzo di contesto deve essere contabilizzato secondo i consumi effettivamente fatturati dal provider.

---

## 6. Stima preventiva dei consumi

La UX deve comunicare una stima indicativa quando sufficientemente attendibile.

La stima non rappresenta un prezzo fisso né una garanzia di costo.

### Requisiti

- Usare dati raccolti nelle sessioni di test.
- Distinguere richieste semplici e complesse.
- Considerare le modalità di contatto necessarie.
- Considerare eventuali chiamate telefoniche.
- Aggiornare la stima quando il perimetro della richiesta cambia significativamente.
- Non presentare stime inventate in assenza di dati sufficienti.

L'utente deve poter conoscere il consumo progressivo.

### Controllo del budget

Introdurre un limite operativo per richiesta.

L'agente deve:

1. Controllare il credito disponibile.
2. Verificare che il budget autorizzato consenta di procedere.
3. Misurare progressivamente il consumo.
4. Avvisare quando si avvicina al limite.
5. Richiedere autorizzazione prima di proseguire oltre il limite.

Non deve essere consentito consumare indiscriminatamente tutto il saldo in una singola ricerca.

I crediti vincolati come garanzia non possono essere utilizzati per sostenere nuovi costi operativi.

---

## 7. Garanzia comportamentale sulle prenotazioni

Introdurre un sistema di crediti vincolati sulle prenotazioni effettivamente confermate.

La finalità è responsabilizzare l'utente.

### Problema da prevenire

La delegazione a un assistente AI riduce drasticamente l'impegno necessario per prenotare e cancellare.

Questo può favorire comportamenti superficiali:

- Prenotazioni effettuate senza reale intenzione di giocare.
- Cancellazioni tardive.
- Cambi di programma ripetuti.
- Prenotazioni multiple incompatibili.
- Mancata presentazione senza avviso.

Le strutture potrebbero associare questi comportamenti direttamente a Digital Mop e smettere di considerare affidabili le prenotazioni provenienti dalla piattaforma.

### Obiettivo

La garanzia deve rendere concretamente impegnativa una prenotazione confermata, senza scoraggiare gli utenti che si comportano correttamente.

### Regole generali

- La garanzia riguarda l'impegno dell'utente a rispettare una prenotazione.
- L'importo in crediti viene comunicato prima della conferma.
- L'utente deve accettare esplicitamente le condizioni.
- I crediti vengono vincolati, non immediatamente consumati.
- La garanzia viene restituita al verificarsi delle condizioni previste.
- La penale può consumare parte o tutta la garanzia, entro il massimo accettato.
- Nessuna penale economica viene corrisposta alla struttura da Digital Mop.
- La garanzia non sostituisce eventuali obblighi economici direttamente esistenti fra utente e gestore.

### Quando vincolare i crediti

La verifica della disponibilità economica della garanzia deve precedere l'impegno definitivo con la struttura.

Il vincolo deve essere gestito in modo coerente con il flusso di conferma già progettato.

L'agente non deve confermare una prenotazione in nome dell'utente se la garanzia richiesta non può essere costituita.

Le garanzie temporanee relative a tentativi non confermati devono essere automaticamente svincolate.

### Prenotazioni contemporanee

Ogni prenotazione possiede la propria garanzia.

Il sistema deve impedire di utilizzare gli stessi crediti per garantire più prenotazioni contemporaneamente.

---

## 8. Configurazione delle strutture

Mantenere la decisione amministrativa precedentemente assunta.

Nella scheda di ciascuna struttura viene configurato il termine di preavviso per la cancellazione gratuita:

`cancellationFreeWindowMinutes`

Il valore è definito a livello struttura e applicato ai suoi campi.

### Importante

Non aggiungere alla scheda della struttura:

- Percentuale di penale Digital Mop.
- Importo economico della penale.
- Importo di risarcimento a carico di Digital Mop.

La politica di garanzia in crediti appartiene alla piattaforma e deve essere gestita centralmente, non dal gestore del campo.

L'entità delle garanzie e delle penali interne sarà stabilita attraverso una politica versionata di Digital Mop.

Eventuali penali economiche richieste direttamente dalle strutture rimangono separate e riguardano il rapporto tra utente e gestore.

---

## 9. Politica delle cancellazioni

Distinguere quattro situazioni.

### Caso A — Cancellazione entro il termine gratuito

L'utente chiede la cancellazione rispettando il preavviso configurato dalla struttura.

Comportamento:

1. L'agente gestisce la cancellazione secondo il flusso già definito.
2. Nessuna penale in crediti.
3. La garanzia viene svincolata quando la cancellazione è correttamente registrata.
4. Le operazioni AI effettivamente eseguite possono consumare crediti operativi.

Per valutare il rispetto del termine, utilizzare l'orario della richiesta dell'utente, non il momento in cui l'agente riesce materialmente a contattare la struttura.

Un ritardo imputabile a Digital Mop non deve trasformare una cancellazione tempestiva in una cancellazione tardiva.

### Caso B — Cancellazione tardiva con slot recuperato

L'utente cancella oltre il termine gratuito.

L'agente comunica la cancellazione e tenta, ove possibile, di contribuire al recupero dello slot.

Se lo slot viene effettivamente recuperato:

- Nessuna penale reputazionale in crediti.
- Garanzia restituita.
- Consumo dei soli crediti operativi applicabili.

Il recupero può avvenire attraverso Digital Mop oppure tramite i canali diretti della struttura.

### Caso C — Cancellazione tardiva senza recupero

L'utente cancella oltre il termine gratuito.

La struttura non riesce a recuperare lo slot e Digital Mop non riesce a contribuire efficacemente al recupero.

Quando l'esito è sufficientemente verificato:

- Applicazione della penale prevista.
- Consumo dei crediti vincolati interessati.
- Registrazione dell'evento nello storico di affidabilità.
- Notifica all'utente con motivazione e dettagli.
- Possibilità di contestazione.

I normali consumi operativi restano separati dalla penale.

### Caso D — Mancata presentazione

L'utente non si presenta alla prenotazione confermata e non ha comunicato una cancellazione valida.

Prevedere:

- Verifica dell'evento tramite informazioni della struttura.
- Applicazione della politica prevista per i no-show.
- Possibile penale più severa rispetto alla cancellazione tardiva.
- Registrazione nello storico di affidabilità.
- Possibili misure progressive per comportamenti ripetuti.

La mancata presentazione non può essere presunta soltanto perché l'utente non ha risposto a un messaggio.

---

## 10. Recupero di uno slot cancellato

Il recupero non deve essere considerato automatico.

### Vincolo architetturale

Il calendario interno di Digital Mop non è sincronizzato con gli inventari delle strutture.

Contiene soltanto le informazioni raccolte attraverso prenotazioni e comunicazioni specifiche.

Uno slot sconosciuto non è automaticamente disponibile.

Una cancellazione non autorizza Digital Mop a rimettere autonomamente in vendita lo slot.

### Flusso di recupero

1. L'utente comunica la volontà di cancellare.
2. L'agente registra data e ora della richiesta.
3. Verifica se la cancellazione è tempestiva o tardiva.
4. Comunica la richiesta alla struttura.
5. Verifica se la struttura ha già recuperato lo slot.
6. Se è possibile e autorizzato, tenta il recupero tramite i meccanismi effettivamente disponibili.
7. Registra le risposte ricevute.
8. Alla chiusura della finestra di recupero determina l'esito.
9. Trasmette l'esito al sistema di garanzia.

L'agente può cercare un sostituto soltanto attraverso capacità realmente implementate.

Non assumere l'esistenza di una lista d'attesa, di un marketplace interno o della disponibilità di altri utenti senza che tali funzioni siano state progettate.

### Stati da prevedere

- `RECOVERY_NOT_REQUIRED`
- `RECOVERY_PENDING`
- `RECOVERY_SUCCEEDED`
- `RECOVERY_FAILED`
- `RECOVERY_UNKNOWN`

Lo stato `RECOVERY_UNKNOWN` è importante.

Se la struttura non risponde o le informazioni sono inconcludenti, Digital Mop non deve inventare un esito negativo.

In questi casi la penale non deve essere applicata automaticamente sulla base della sola assenza di conferma di recupero.

Prevedere una regola di chiusura e un eventuale intervento amministrativo.

### Vincolo sulle attese

Resta valida la regola già definita: i blocchi temporanei operano soltanto all'interno di Digital Mop.

Non modificano l'inventario della struttura.

Il semplice trascorrere dell'attesa non consuma crediti.

---

## 11. Lifecycle della garanzia

La garanzia deve avere un ciclo di vita autonomo rispetto al consumo operativo.

Stati suggeriti:

- `PENDING`
- `HELD`
- `RELEASE_PENDING`
- `RELEASED`
- `FORFEITED`
- `DISPUTED`
- `EXPIRED`

### Vincolo iniziale

Alla costituzione della garanzia, i crediti vengono spostati dal saldo disponibile a quello vincolato.

### Prenotazione rispettata

Dopo aver verificato che non esistono contestazioni o no-show, la garanzia viene restituita.

Non assumere che il semplice superamento dell'orario di inizio dimostri automaticamente la partecipazione.

### Cancellazione gratuita

La garanzia viene liberata alla corretta registrazione della cancellazione.

### Cancellazione tardiva

La garanzia rimane temporaneamente vincolata fino alla determinazione dell'esito del recupero, entro una finestra massima definita.

### Penale

La quota applicabile viene consumata attraverso una transazione specifica.

L'eventuale parte non utilizzata viene svincolata.

### Contestazione

Il sistema deve poter sospendere la chiusura di una garanzia quando esiste una contestazione fondata.

Prevedere comunque termini massimi: nessun credito deve rimanere bloccato indefinitamente.

Le rettifiche successive devono essere tracciate.

---

## 12. Sistema interno di affidabilità

L'identità verificata permette di collegare le prenotazioni allo stesso utente, rendendo più difficile eludere le conseguenze di comportamenti ripetuti.

Prevedere uno storico interno degli eventi di affidabilità.

### Eventi da registrare

- Prenotazione confermata.
- Prenotazione rispettata, quando verificabile.
- Cancellazione tempestiva.
- Cancellazione tardiva.
- Recupero riuscito.
- Recupero fallito.
- No-show verificato.
- Penale applicata.
- Penale contestata o annullata.
- Eventuali sospensioni.

### Prima implementazione

Non introdurre necessariamente un punteggio numerico.

Partire da eventi oggettivi e verificabili.

Non classificare automaticamente come inaffidabile un utente per una singola cancellazione.

### Possibili misure successive

In presenza di comportamenti ripetuti e accertati:

- Avvertimenti.
- Maggiori garanzie sulle future prenotazioni.
- Limiti alle prenotazioni contemporanee.
- Sospensioni temporanee.
- Revisione amministrativa dei casi più gravi.

Tali conseguenze devono essere regolate da criteri preventivi, proporzionati e contestabili.

Non lasciare al modello AI la possibilità di inventare autonomamente sanzioni.

---

## 13. Responsabilità dell'orchestratore AI

L'orchestratore svolge attività operative, ma non deve avere controllo diretto sulla contabilità.

### Responsabilità consentite

- Interpretare le richieste.
- Verificare lo stato delle prenotazioni attraverso i servizi autorizzati.
- Richiedere stime.
- Informare l'utente sulle garanzie.
- Acquisire le conferme previste.
- Avviare cancellazioni.
- Gestire le comunicazioni con le strutture.
- Avviare tentativi di recupero.
- Segnalare eventi rilevanti.
- Presentare gli esiti prodotti dal backend.

### Responsabilità da escludere

L'AI non deve:

- Modificare direttamente il saldo.
- Decidere arbitrariamente l'importo di una penale.
- Applicare sanzioni sulla base di supposizioni.
- Considerare libero uno slot sconosciuto.
- Confermare una prenotazione senza i controlli richiesti.
- Annullare una penalità già applicata senza un'operazione autorizzata.
- Inventare conferme o risposte ricevute dalle strutture.

### Servizi backend necessari

Separare almeno le seguenti responsabilità:

- `wallet-service`: gestione saldi e garanzie.
- `usage-metering-service`: acquisizione dei consumi.
- `credit-pricing-service`: conversione consumi/crediti.
- `guarantee-service`: condizioni e vincoli sulle prenotazioni.
- `cancellation-service`: processo di cancellazione.
- `recovery-service`: tentativi ed esiti di recupero.
- `reliability-service`: storico e regole di affidabilità.

Sono separazioni logiche: nella demo possono essere moduli dello stesso backend Express, senza introdurre microservizi.

---

## 14. Modello dati MongoDB

Prevedere le seguenti entità logiche.

| Entità | Responsabilità |
|---|---|
| `wallets` | Saldi e crediti vincolati |
| `credit_transactions` | Registro dei movimenti |
| `usage_events` | Consumi misurati |
| `credit_pricing_policies` | Regole di conversione versionate |
| `booking_guarantees` | Garanzie associate alle prenotazioni |
| `cancellation_events` | Richieste e condizioni delle cancellazioni |
| `recovery_attempts` | Attività di recupero e risultati |
| `reliability_events` | Storico dell'affidabilità |
| `credit_policy_versions` | Politiche di garanzia e penale |

Le prenotazioni esistenti devono essere collegate a queste entità, evitando di duplicare il loro modello.

### Requisiti tecnici

- Crediti rappresentati come quantità intere.
- Identificativi univoci e indici appropriati.
- Protezione contro doppie operazioni.
- Transazioni atomiche sulle modifiche correlate.
- Validazione degli stati prima delle transizioni.
- Versionamento delle politiche.
- Audit amministrativo.
- Gestione sicura dei retry.
- Riconciliazione fra consumi registrati e consumi fatturati dai provider.

---

## 15. UX del sistema a crediti

### Area portafoglio

Visualizzare:

- Saldo totale.
- Crediti disponibili.
- Crediti vincolati.
- Storico consumi.
- Dettaglio per richiesta.
- Eventuali penali.
- Ricariche effettuate.

### Prima della prenotazione

L'utente deve conoscere:

- Stima indicativa del lavoro dell'agente, quando disponibile.
- Eventuale limite di spesa autorizzato.
- Garanzia richiesta.
- Termine per la cancellazione gratuita.
- Condizioni di possibile perdita della garanzia.
- Eventuali condizioni economiche proprie della struttura, tenute distinte da quelle Digital Mop.

La conferma della prenotazione deve comprendere l'accettazione delle condizioni applicabili.

### Durante la richiesta

L'utente può:

- Consultare il consumo.
- Interrompere la ricerca.
- Autorizzare un aumento del budget.
- Modificare le preferenze di contatto.

### Al momento della cancellazione

L'agente deve:

1. Verificare se il termine gratuito è scaduto.
2. Informare l'utente delle possibili conseguenze.
3. Chiedere conferma della cancellazione.
4. Procedere secondo il flusso definito.
5. Comunicare se la garanzia viene rilasciata oppure rimane temporaneamente vincolata.
6. Notificare successivamente l'esito definitivo.

Le conseguenze devono essere comunicate senza pressioni ingiustificate.

### In presenza di una penale

Mostrare:

- Prenotazione interessata.
- Data della richiesta di cancellazione.
- Termine gratuito applicabile.
- Esito del recupero.
- Crediti trattenuti.
- Condizione contrattuale applicata.
- Possibilità di contestazione.

---

## 16. Sicurezza, abusi e casi eccezionali

### Crediti insufficienti

L'agente non deve assumere impegni che richiedono garanzie non disponibili.

Deve poter completare la messa in sicurezza di operazioni già avviate senza produrre addebiti incontrollati.

### Utenti con più prenotazioni

Tutte le garanzie devono essere indipendenti.

Impedire il doppio utilizzo degli stessi crediti.

### Cancellazione della struttura

Nessuna penale a carico dell'utente quando è la struttura a cancellare.

Rilasciare le garanzie secondo le condizioni applicabili.

### Errori Digital Mop

Nessuna penalizzazione dell'utente per:

- Errori dell'orchestratore.
- Comunicazioni non inviate per problemi tecnici.
- Prenotazioni duplicate.
- Cancellazioni eseguite in ritardo dalla piattaforma.
- Informazioni errate comunicate dal sistema.

Prevedere rettifiche dei crediti operativi erroneamente addebitati.

### Circostanze eccezionali

Prevedere la possibilità di valutare e contestare eventi straordinari o impedimenti documentabili.

Non affidare questa valutazione esclusivamente a un modello AI.

### Cancellazione dell'account

Evitare che l'eliminazione o ricreazione dell'account permetta di duplicare crediti gratuiti o aggirare automaticamente sospensioni legittime.

La gestione dei dati personali e dei tempi di conservazione dovrà rispettare gli obblighi privacy applicabili.

---

## 17. Configurazione e feature flag

### Configurazione demo

Prevedere almeno:

- `INITIAL_FREE_CREDITS`
- `CREDITS_ENABLED`
- `CREDIT_METERING_ENABLED`
- `CREDIT_CHARGING_ENABLED`
- `BOOKING_GUARANTEE_ENABLED`
- `CREDIT_PENALTIES_ENABLED`
- `CREDIT_LOW_BALANCE_THRESHOLD`
- `CREDIT_DEFAULT_OPERATION_BUDGET`

I nomi possono essere adattati alle convenzioni attuali.

I valori economici e le politiche delle penali non devono essere definiti arbitrariamente in questa fase.

Per la demo possono essere configurazioni statiche.

In prospettiva, le politiche operative dovrebbero essere versionate e modificabili attraverso strumenti amministrativi controllati.

Conservare per ogni operazione la versione effettivamente applicata.

---

## 18. Piano di implementazione

### Fase 1 — Fondazione del portafoglio

- [ ] Rimuovere la logica subscription dal nuovo onboarding.
- [ ] Definire il modello dati del portafoglio.
- [ ] Implementare accredito iniziale via configurazione.
- [ ] Garantire unicità per identità SPID/CIE.
- [ ] Implementare Credit Ledger.
- [ ] Esporre lettura del saldo e dello storico.
- [ ] Verificare atomicità e idempotenza.

**Risultato:** portafoglio persistente funzionante, ancora senza addebito reale.

### Fase 2 — Misurazione operativa

- [ ] Collegare eventi di utilizzo all'orchestratore.
- [ ] Registrare i token dei modelli delegati.
- [ ] Registrare i consumi GPT-Live.
- [ ] Raccogliere costi telefonici.
- [ ] Raccogliere i costi dei provider messaggistica.
- [ ] Collegare gli eventi alle richieste.
- [ ] Implementare servizio di conversione in crediti.
- [ ] Registrare le transazioni senza modificarne ancora il saldo reale.

**Risultato:** misurazione completa in modalità osservazione.

### Fase 3 — Calibrazione

- [ ] Simulare prenotazioni semplici.
- [ ] Simulare prenotazioni con molte strutture.
- [ ] Simulare controproposte.
- [ ] Simulare attese e ricontatti.
- [ ] Simulare cancellazioni.
- [ ] Simulare ricerche senza esito.
- [ ] Analizzare i consumi reali.
- [ ] Definire il rapporto costi/crediti.
- [ ] Definire un modello di stima indicativa.
- [ ] Verificare sostenibilità economica e margini.

**Risultato:** prima politica crediti basata su dati, non su supposizioni.

### Fase 4 — Addebito operativo

- [ ] Abilitare consumo reale dei crediti demo.
- [ ] Implementare budget autorizzato per richiesta.
- [ ] Gestire credito insufficiente.
- [ ] Implementare soglie di avviso.
- [ ] Impedire consumi oltre i limiti.
- [ ] Visualizzare lo storico operativo.

**Risultato:** sistema a consumo funzionante.

### Fase 5 — Garanzie prenotazioni

- [ ] Definire la politica iniziale delle garanzie.
- [ ] Implementare vincolo dei crediti.
- [ ] Collegare le garanzie alle prenotazioni esistenti.
- [ ] Implementare svincolo.
- [ ] Gestire tentativi non confermati.
- [ ] Gestire prenotazioni concorrenti.
- [ ] Comunicare le condizioni all'utente.
- [ ] Registrare l'accettazione.

**Risultato:** prenotazioni confermate associate a garanzie tracciabili.

### Fase 6 — Cancellazioni e recupero

- [ ] Integrare `cancellationFreeWindowMinutes`.
- [ ] Riconoscere cancellazioni tempestive e tardive.
- [ ] Salvare l'orario effettivo della richiesta utente.
- [ ] Implementare stati di recupero.
- [ ] Integrare il recupero con i flussi di comunicazione già definiti.
- [ ] Verificare gli esiti con la struttura.
- [ ] Gestire esiti sconosciuti.
- [ ] Definire limiti temporali e operativi.
- [ ] Preparare il calcolo delle eventuali penali.

**Risultato:** gestione completa della cancellazione e del recupero.

### Fase 7 — Penali e affidabilità

- [ ] Definire importi in crediti e massimali.
- [ ] Stabilire condizioni contrattuali e criteri di proporzionalità.
- [ ] Verificare gli aspetti legali e privacy.
- [ ] Implementare le penali.
- [ ] Gestire no-show verificati.
- [ ] Introdurre storico di affidabilità.
- [ ] Implementare contestazioni.
- [ ] Gestire eventuali sospensioni.
- [ ] Aggiungere strumenti di rettifica amministrativa.

**Risultato:** sistema di tutela reputazionale utilizzabile nella demo avanzata.

### Fase 8 — Pagamenti e produzione

- [ ] Integrare ricariche a pagamento.
- [ ] Collegare pagamenti e accrediti.
- [ ] Gestire rimborsi e contestazioni di pagamento.
- [ ] Definire trattamento fiscale e documenti di fatturazione.
- [ ] Definire eventuale scadenza dei crediti.
- [ ] Definire condizioni dei crediti gratuiti e acquistati.
- [ ] Verificare riconciliazione economica.
- [ ] Eseguire stress test e test di concorrenza.
- [ ] Verificare il sistema prima dell'accesso pubblico.

**Risultato:** preparazione al rilascio produttivo.

La progettazione completa del pagamento e della fatturazione resta nel piano dedicato.

---

## 19. Scenari di test obbligatori

### Crediti

- [ ] Bonus assegnato una sola volta.
- [ ] SPID e CIE riconducono alla stessa identità.
- [ ] Nessun doppio addebito per retry.
- [ ] Nessun saldo disponibile negativo.
- [ ] Nessun doppio utilizzo delle garanzie.
- [ ] Riconciliazione dei costi provider.
- [ ] Stop corretto al raggiungimento del budget.

### Prenotazioni

- [ ] Prenotazione confermata e rispettata.
- [ ] Prenotazione non confermata.
- [ ] Modifica della prenotazione con garanzia già vincolata.
- [ ] Più prenotazioni contemporanee.
- [ ] Cancellazione gratuita.
- [ ] Cancellazione tardiva recuperata.
- [ ] Cancellazione tardiva non recuperata.
- [ ] Recupero con esito sconosciuto.
- [ ] No-show verificato.
- [ ] Contestazione di un no-show.
- [ ] Cancellazione da parte della struttura.
- [ ] Errore di comunicazione dell'agente.
- [ ] Credito insufficiente durante un'operazione.

### Affidabilità

- [ ] Nessuna penalizzazione per disdetta tempestiva.
- [ ] Nessuna penalizzazione per errore Digital Mop.
- [ ] Penale applicata secondo versione corretta della politica.
- [ ] Annullamento della penale tramite rettifica.
- [ ] Riconoscimento di comportamenti ripetuti.
- [ ] Protezione contro duplicazioni di identità.

---

## 20. Indicatori da monitorare

### Economia operativa

- Costo medio delle richieste.
- Costo medio delle prenotazioni concluse.
- Distribuzione dei consumi per complessità.
- Consumo dei modelli AI.
- Costo telefonico e messaggistica.
- Rapporto tra ricavi da crediti e costi operativi.
- Frequenza di esaurimento dei budget.

### Affidabilità

- Prenotazioni confermate.
- Prenotazioni rispettate, quando verificabili.
- Cancellazioni tempestive.
- Cancellazioni tardive.
- Percentuale di recuperi confermati.
- No-show verificati.
- Frequenza di cancellazioni ripetute per utente.
- Contestazioni delle penali.
- Segnalazioni negative da parte delle strutture.
- Strutture che interrompono la collaborazione per problemi di affidabilità.

L'obiettivo delle penali non è massimizzare i crediti trattenuti.

**L'indicatore di successo è la riduzione dei comportamenti dannosi e il mantenimento della fiducia delle strutture.**

---

## 21. Decisioni da definire con i test

| Argomento | Stato |
|---|---|
| Modello a crediti senza subscription | Definito |
| Bonus iniziale configurabile | Definito |
| Un solo bonus per identità | Definito |
| Canali liberamente modificabili | Definito |
| Consumo per lavoro effettivo | Definito |
| Nessun risarcimento alle strutture | Definito |
| Penali come deterrente reputazionale | Definito come principio |
| Finestra gratuita a livello struttura | Definito |
| Flusso di prenotazione | Già definito nel piano dedicato |
| Rapporto fra consumi e crediti | Da calibrare |
| Quantità iniziale di crediti gratuiti | Da calibrare |
| Stima preventiva dei consumi | Da calibrare |
| Importo e massimale delle garanzie | Da definire |
| Entità delle penali | Da definire |
| Gestione dettagliata dei no-show | Da completare |
| Tempo massimo di vincolo | Da definire |
| Politica dei comportamenti ripetuti | Da definire |
| Pacchetti di ricarica | Da definire |
| Eventuale scadenza dei crediti | Da definire |
| Flusso pagamenti e fatturazione | Piano dedicato |

---

## 22. Collocazione nei piani precedenti

**Piano UX registrazione e onboarding**

Rimuovere la sezione subscription e sostituirla con attivazione del portafoglio e assegnazione dei crediti gratuiti.

Conservare integralmente i sistemi di verifica dell'identità e dei contatti.

**Piano orchestratore AI**

Aggiungere strumenti per controllare saldo, budget, garanzie, consumi e condizioni di cancellazione.

Il modello AI non deve avere accesso diretto alle scritture contabili.

**Piano prenotazione**

Integrare controlli sui crediti e sulle garanzie nei punti di conferma già previsti.

Non ridisegnare il processo di ricerca, contatto, attesa e conferma esistente.

**Piano amministrazione strutture**

Conservare la configurazione del termine di disdetta gratuita.

Non aggiungere importi economici di penale alle schede delle strutture.

**Piano calendario interno**

Mantenere disponibilità sconosciuta per gli slot non verificati.

La gestione delle cancellazioni e dei recuperi deve rispettare la natura non sincronizzata del calendario.

**Piano fatturazione**

Collegare successivamente l'acquisto dei crediti, i pagamenti, le ricariche e la relativa documentazione fiscale.

Non confondere le penali interne in crediti con i pagamenti dovuti alle strutture.

---

## 23. Criterio finale di accettazione

L'aggiornamento sarà funzionalmente completo quando Digital Mop sarà in grado di:

1. Identificare un utente e assegnare una sola volta i crediti gratuiti.
2. Misurare e addebitare il lavoro effettivo degli agenti.
3. Consentire la modifica libera dei canali.
4. Mostrare saldo, consumi e garanzie.
5. Verificare e vincolare i crediti necessari prima di una prenotazione confermata.
6. Restituire la garanzia sulle prenotazioni rispettate.
7. Gestire cancellazioni tempestive senza penalità.
8. Gestire cancellazioni tardive e tentativi di recupero senza presumere disponibilità.
9. Applicare eventuali penali soltanto secondo condizioni accettate ed esiti verificati.
10. Registrare gli eventi di affidabilità.
11. Consentire contestazioni e rettifiche.
12. Conservare l'intera tracciabilità contabile e operativa.

**Principio conclusivo**

Digital Mop rende estremamente semplice delegare una prenotazione, ma non deve rendere irrilevante l'impegno assunto dall'utente.

Il sistema a crediti deve remunerare il lavoro dell'AI e, contemporaneamente, proteggere la fiducia delle strutture che accettano prenotazioni attraverso Digital Mop.

Le penali rappresentano uno strumento di prevenzione e responsabilizzazione, non una fonte di risarcimento per i gestori né un obiettivo di ricavo da massimizzare.