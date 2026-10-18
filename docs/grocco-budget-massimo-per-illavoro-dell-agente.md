# PATCH — Completamento garantito delle richieste e gestione interna dei consumi

## Allineamento condiviso — 18 ottobre 2026

Questa revisione integra i nove piani consegnati nello ZIP e il [mockup Figma corrente](https://www.figma.com/design/LKEJGcZxs9jXnPRx3wrBE5/cecampo?node-id=2-267). È una specifica, non una dichiarazione di implementazione del repository Windows, non disponibile in questa sessione.

- **Voce:** Telnyx AI Assistant gestisce telefonia, LLM vocale, STT/TTS e turni; il backend conserva autorizzazioni, tool, prenotazioni, attese e contabilità. GPT-Live, sideband e bridge audio verso OpenAI sono dismessi dal percorso target.
- **WhatsApp:** Business Platform tramite Telnyx; Wazzup24 non è più una dipendenza attiva. Telegram resta diretto. L'orchestratore testuale OpenAI non è automaticamente dismesso dalla migrazione voce.
- **Ruoli:** clienti in PWA/WhatsApp/Telegram; strutture tramite contatti autorizzati, anche senza account. Voce esclusiva delle strutture. Email verificata per comunicazioni di servizio; conversazioni AI via email richiedono un'integrazione distinta, non provata dal solo invio Resend.
- **Crediti:** niente Pass, abbonamenti o budget per richiesta scelto dall'utente. Bonus unico per identità; lavoro operativo distinto da garanzia, penale e quota in prestito. Le richieste accettate vengono accompagnate fino a un esito, non necessariamente a una prenotazione riuscita.
- **UX:** Prenota / Storico / Account; campi selezionabili e riordinabili nella ricerca; prezzo per campo per 90 minuti; Indoor/Outdoor. Nessuna modifica retroattiva agli snapshot.
- **Evidenza:** i runbook del 17–18 ottobre documentano chiamate Telnyx, inizializzazione dinamica e tool demo, oltre a una consegna WhatsApp reale. Non provano gate voce pre-risposta, persistenza, contabilizzazione definitiva o prenotazioni reali.

I nomi dei nove file sono conservati per compatibilità. I termini storici nei filename non indicano funzionalità da reintrodurre. Le scelte di sicurezza e dominio prevalgono sui placeholder del mockup; le discrepanze sono riportate nelle sezioni dedicate.

**Progetto:** Digital Mop / Prenotazione Campi  
**Tipo:** Patch correttiva e integrativa  
**Ambito:** UX, Credit Wallet, orchestratore AI, backend, reportistica e demo  
**Priorità:** Alta  
**Stato:** Decisione progettuale approvata

---

## 1. Obiettivo della patch

Eliminare completamente il concetto di budget massimo per richiesta configurabile dall'utente.

Digital Mop è un servizio di delegazione: quando accetta una richiesta di prenotazione deve gestirla fino a un esito conclusivo, senza interrompere arbitrariamente il lavoro perché è stato raggiunto un limite di crediti.

**Principio fondamentale:**

> L'utente delega a Digital Mop un'attività da completare, non acquista un numero di tentativi o una quantità prestabilita di lavoro AI.
>
> Digital Mop garantisce la gestione della richiesta fino a un esito terminale, non la disponibilità o la conferma di una prenotazione.

La complessità operativa e gli eventuali scostamenti rispetto alle stime di consumo sono responsabilità della piattaforma, entro il perimetro della richiesta accettata.

---

## 2. Elementi da eliminare

### Dal piano UX

Rimuovere completamente:

- Campo "Budget massimo per il lavoro dell'agente".
- Slider di configurazione del budget.
- Input numerici per limitare il consumo della richiesta.
- Autorizzazioni per superare il budget durante una ricerca.
- Alert che chiedono all'utente di aumentare il budget per proseguire.
- Stati in cui la ricerca viene sospesa esclusivamente per esaurimento dei crediti.

### Dal backend

Eliminare il concetto di budget operativo autorizzato dall'utente.

Rimuovere, se presenti:

- `CREDIT_DEFAULT_OPERATION_BUDGET` come configurazione esposta all'utente.
- `userDefinedBudget`.
- `maxCreditsPerRequest` configurabile dall'utente.
- `WAITING_FOR_BUDGET_APPROVAL`.
- Blocchi nell'orchestratore che interrompono una richiesta accettata al raggiungimento di un budget.

Eventuali controlli tecnici sui consumi restano interni al sistema e non rappresentano un budget acquistato o selezionato dall'utente.

---

## 3. Nuovo contratto funzionale della richiesta

Ogni richiesta deve attraversare tre fasi principali.

### Fase A — Ammissione

Prima di avviare una nuova richiesta, Digital Mop verifica:

1. Identità verificata.
2. Saldo crediti disponibile.
3. Eventuali garanzie già vincolate.
4. Requisiti necessari per eseguire la richiesta.
5. Sufficienza ragionevole dei crediti rispetto alla complessità stimata.
6. Eventuali limitazioni antifrode o antiabuso.

Se il saldo non è ragionevolmente sufficiente, il sistema può impedire l'avvio, spiegandone il motivo.

La valutazione deve essere calibrata sulle misurazioni reali della demo.

Il sistema non deve richiedere arbitrariamente un saldo tale da coprire il peggior caso teoricamente possibile.

### Fase B — Esecuzione

Una volta accettata la richiesta:

- L'agente avvia il flusso di prenotazione già progettato.
- Misura progressivamente le risorse utilizzate.
- Registra i consumi nel sistema di metering.
- Gestisce contatti, attese, controproposte e ricontatti previsti dal flusso.
- Non chiede aumenti del budget.
- Non interrompe il lavoro per il semplice superamento della stima.
- Non interrompe il lavoro per esaurimento del saldo disponibile.
- Continua fino a un esito terminale valido.

La continuità deve essere garantita anche in presenza di attese e operazioni asincrone già previste dal flusso.

### Fase C — Conclusione

La richiesta può concludersi con:

- Prenotazione confermata.
- Nessuna disponibilità individuata.
- Impossibilità di confermare una disponibilità dopo il completamento dei tentativi previsti.
- Rinuncia esplicita dell'utente.
- Altro esito conclusivo previsto dal flusso di prenotazione.

Un errore tecnico non costituisce automaticamente un esito conclusivo.

In caso di errore, il sistema deve prevedere ripristino, retry controllato o gestione di un'eccezione operativa, evitando di abbandonare impegni già assunti.

Non è consentito uno stato terminale equivalente a "budget esaurito".

---

## 4. Nuova politica di addebito

Il costo operativo continua a dipendere dal lavoro effettivamente svolto.

La stima iniziale è informativa e non rappresenta un limite che determina l'interruzione della richiesta.

### Caso ordinario

Saldo iniziale: 500 crediti.

Consumo effettivo: 75 crediti.

Saldo finale: 425 crediti.

### Caso di scostamento superiore al saldo

Saldo disponibile all'avvio: 100 crediti.

Consumo operativo effettivo: 125 crediti.

Addebito massimo all'utente: 100 crediti.

Differenza sostenuta da Digital Mop: 25 crediti equivalenti.

Saldo finale: 0 crediti.

### Regole

- Il saldo disponibile non può diventare negativo a causa di uno scostamento operativo.
- Non vengono generati debiti automatici per differenze rispetto alle stime.
- I crediti già vincolati come garanzia non possono essere consumati per coprire lo scostamento operativo.
- Digital Mop registra l'intero costo effettivo, anche quando non viene integralmente addebitato.
- Le differenze sostenute dalla piattaforma devono essere misurabili nella reportistica.
- Eventuali nuove richieste sono soggette a un nuovo controllo di ammissione.

La politica vale per il perimetro della richiesta originariamente accettata.

Nuove attività autonome richieste successivamente dall'utente possono costituire nuove richieste e richiedere una verifica preventiva del saldo.

Non è consentito riclassificare artificiosamente un passaggio necessario come nuova richiesta per aggirare l'impegno al completamento.

---

## 5. Distinzione tra limite operativo e completamento

Il completamento della richiesta non significa che l'agente debba effettuare un numero illimitato di tentativi.

Il backend deve mantenere controlli interni per prevenire:

- Chiamate duplicate.
- Retry infiniti.
- Loop dell'orchestratore.
- Ripetizione di richieste già risolte.
- Contatti inutili verso strutture che hanno già fornito un esito definitivo.
- Consumi anomali causati da malfunzionamenti.
- Abusi intenzionali del servizio.

Questi controlli devono determinare comportamenti funzionali coerenti con il flusso già definito.

Un tentativo può essere evitato perché inutile, ripetitivo, non autorizzato o estraneo alla richiesta.

Non deve essere evitato soltanto perché l'agente ha raggiunto una soglia economica, lasciando incompleta un'attività già accettata.

Se si verifica un'anomalia che rende impossibile proseguire automaticamente, il sistema deve conservare stato e impegni, attivare una gestione dell'eccezione e comunicare correttamente all'utente la situazione.

---

## 6. Stima indicativa dei crediti

Mantenere la stima, ma modificarne la funzione.

La stima serve a informare l'utente sul consumo presumibile, non a definire un budget.

### UX

Mostrare, quando esistono dati affidabili:

- Saldo disponibile.
- Stima indicativa del consumo della ricerca.
- Indicazione che il consumo reale può variare.
- Crediti effettivamente consumati al termine.

Non mostrare una cifra arbitraria se il sistema non dispone ancora di dati sufficienti.

### Calibrazione della stima

Utilizzare i dati della reportistica agenti per analizzare:

- Ricerche con una sola struttura.
- Ricerche con più strutture.
- Telefonate e messaggistica.
- Controproposte.
- Attese e ricontatti.
- Prenotazioni non concluse.
- Cancellazioni e successive attività.
- Distribuzione dei costi effettivi.
- Casi estremi e scostamenti.

La stima può evolvere in un intervallo indicativo ricavato dai casi osservati.

Non deve essere presentata come un importo garantito.

---

## 7. Aggiornamento del Credit Wallet

Separare contabilmente:

1. Saldo disponibile.
2. Crediti vincolati per garanzie.
3. Consumo operativo effettivo.
4. Crediti realmente addebitati.
5. Differenza operativa sostenuta da Digital Mop.

Il Credit Ledger registra esclusivamente i movimenti effettivi dei crediti dell'utente.

Il servizio di metering registra invece anche i costi non addebitati.

### Esempio di evento di rendicontazione

```json
{
  "requestId": "req_123",
  "actualUsageCredits": 125,
  "chargedCredits": 100,
  "platformAbsorbedCredits": 25,
  "status": "COMPLETED"
}
```

Valori puramente illustrativi.

Il consumo non addebitato non deve essere registrato come saldo negativo.

Per la riconciliazione economica, mantenere anche gli importi reali fatturati dai provider e la versione delle regole di conversione.

### Concorrenza

Una richiesta già accettata deve conservare la propria autorizzazione al completamento.

Nuove richieste contemporanee non devono poter consumare gli stessi crediti come se fossero disponibili più volte.

Prevedere prenotazioni contabili interne o meccanismi equivalenti per coordinare le operazioni concorrenti, senza trasformarli in budget configurabili dall'utente.

Le garanzie delle prenotazioni rimangono sempre contabilmente separate.

---

## 8. Aggiornamento dell'orchestratore AI

Aggiungere una distinzione esplicita tra:

- Richiesta non ancora accettata.
- Richiesta accettata e in esecuzione.
- Richiesta in attesa di un evento esterno.
- Richiesta in gestione di un'eccezione.
- Richiesta conclusa.

### Regole di comportamento

L'orchestratore deve:

- Conoscere lo stato di ammissione della richiesta.
- Portare avanti le richieste accettate.
- Rispettare le decisioni dell'utente e le regole di prenotazione.
- Delegare la contabilità ai servizi backend.
- Evitare tentativi privi di utilità funzionale.
- Conservare il contesto durante attese e ricontatti.
- Terminare soltanto in presenza di un esito valido.
- Non inventare esiti per chiudere una richiesta costosa.

Il superamento della stima di consumo non è un evento che autorizza l'orchestratore a terminare la richiesta.

Il sistema deve comunque permettere all'utente di annullare volontariamente una ricerca, distinguendo questo evento dalla cancellazione di una prenotazione già confermata.

Le cancellazioni di prenotazioni e le comunicazioni necessarie a gestire impegni già assunti non devono essere bloccate da un controllo di ammissione destinato alle nuove ricerche.

---

## 9. Aggiornamento dei mockup UX

### Rimuovere

Nella schermata di prenotazione eliminare:

**Budget massimo per il lavoro dell'agente**

Eliminare i relativi slider, input, descrizioni e meccanismi di approvazione degli sforamenti.

### Mantenere

Nell'area crediti:

- Saldo corrente.
- Progress bar dei crediti.
- Evidenza cromatica dei crediti eventualmente vincolati.
- Storico dei consumi.
- Eventuali penali.
- Stima indicativa, quando disponibile.

### Nuovo testo informativo suggerito

**Consumo della ricerca**

"I crediti vengono utilizzati in base al lavoro effettivamente svolto dall'assistente. Una volta avviata, la richiesta sarà gestita fino a un esito, anche se richiederà più tentativi del previsto."

Eventuale descrizione secondaria:

"La stima è indicativa. La disponibilità del campo e la conferma della prenotazione dipendono dalle strutture."

Non aggiungere nuove interazioni UX per configurare limiti di consumo.

---

## 10. Aggiornamento della reportistica agenti

Estendere il modulo di reportistica precedentemente progettato.

Per ogni richiesta registrare:

- Stima iniziale.
- Costo effettivo.
- Crediti addebitati.
- Crediti equivalenti assorbiti dalla piattaforma.
- Scostamento tra stima e consumo.
- Numero di strutture contattate.
- Numero di chiamate e messaggi.
- Tentativi e retry.
- Durata del lavoro attivo.
- Tempo trascorso in attesa.
- Stato conclusivo.
- Motivi delle eventuali anomalie.

### KPI aggiuntivi

- Accuratezza delle stime.
- Percentuale di richieste con costo superiore alla stima.
- Percentuale di richieste con costo superiore al saldo disponibile.
- Costo medio degli sforamenti sostenuti da Digital Mop.
- Incidenza degli sforamenti sul costo complessivo.
- Richieste interrotte da problemi tecnici.
- Richieste recuperate dopo un errore.
- Richieste rimaste senza esito conclusivo.

Quest'ultimo indicatore deve essere particolarmente importante: non devono esistere richieste dimenticate in stati intermedi.

---

## 11. Feature flag e configurazioni

### Rimuovere

`CREDIT_DEFAULT_OPERATION_BUDGET`

come concetto di budget selezionabile dall'utente.

### Mantenere

- `INITIAL_FREE_CREDITS`
- `CREDITS_ENABLED`
- `CREDIT_METERING_ENABLED`
- `CREDIT_CHARGING_ENABLED`
- `BOOKING_GUARANTEE_ENABLED`
- `CREDIT_PENALTIES_ENABLED`
- `CREDIT_LOW_BALANCE_THRESHOLD`

### Introdurre

`CREDIT_ADMISSION_CHECK_ENABLED`

Abilita il controllo di sufficienza dei crediti prima di accettare nuove richieste.

`CREDIT_PLATFORM_OVERAGE_ENABLED`

Abilita la gestione degli scostamenti operativi sostenuti dalla piattaforma per richieste già accettate.

`CREDIT_ESTIMATION_ENABLED`

Abilita la visualizzazione delle stime soltanto quando il meccanismo è stato calibrato.

`REQUEST_COMPLETION_MONITORING_ENABLED`

Abilita il monitoraggio delle richieste accettate che non hanno raggiunto un esito conclusivo.

I limiti tecnici e le protezioni anti-loop possono essere configurati separatamente nel backend.

Nessuna di queste configurazioni deve introdurre implicitamente un budget massimo modificabile dall'utente.

---

## 12. Casi di test aggiuntivi

### Ammissione

- [ ] Saldo ragionevolmente sufficiente: richiesta accettata.
- [ ] Saldo insufficiente: nuova richiesta non avviata, con spiegazione.
- [ ] Crediti vincolati: esclusi dal disponibile.
- [ ] Richieste concorrenti: nessuna doppia disponibilità contabile.

### Esecuzione

- [ ] Consumo inferiore alla stima.
- [ ] Consumo superiore alla stima.
- [ ] Saldo esaurito durante una richiesta.
- [ ] Richiesta conclusa anche dopo esaurimento del saldo.
- [ ] Nessuna richiesta di aumento del budget.
- [ ] Nessuna interruzione esclusivamente economica.
- [ ] Nessun consumo operativo negativo sul portafoglio.
- [ ] Garanzie non intaccate dagli sforamenti.

### Affidabilità

- [ ] Recupero corretto dopo riavvio del backend.
- [ ] Ripresa dopo errore temporaneo del provider.
- [ ] Nessun retry infinito.
- [ ] Nessuna duplicazione delle chiamate dopo un retry.
- [ ] Richieste in attesa conservate correttamente.
- [ ] Monitoraggio delle richieste bloccate.
- [ ] Corretta gestione della rinuncia esplicita dell'utente.
- [ ] Nessuna prenotazione erroneamente dichiarata confermata.

### Contabilità

- [ ] Registrazione completa del costo effettivo.
- [ ] Addebito limitato ai crediti operativi disponibili.
- [ ] Registrazione della differenza sostenuta da Digital Mop.
- [ ] Nessuna doppia contabilizzazione.
- [ ] Corretto collegamento alla richiesta di origine.

---

## 13. Modifiche alle fasi di implementazione

### Fase 2 — Misurazione operativa

Aggiungere la registrazione dei costi effettivi anche quando il portafoglio non dispone di crediti sufficienti per coprirli.

### Fase 3 — Calibrazione

Aggiungere il calcolo delle soglie di ammissione per nuove richieste sulla base della distribuzione dei consumi osservati.

### Fase 4 — Addebito operativo

Sostituire il precedente obiettivo:

"Implementare budget autorizzato per richiesta."

Con:

"Implementare il controllo di ammissione, la continuità delle richieste accettate e la gestione degli scostamenti operativi a carico della piattaforma."

Rimuovere:

- Richiesta di autorizzazione per superamento del budget.
- Stop dell'agente al raggiungimento del limite crediti.
- Budget personalizzato dall'utente.

Aggiungere:

- [ ] Controllo preventivo di ammissione.
- [ ] Stato persistente della richiesta accettata.
- [ ] Completamento non condizionato dal saldo residuo.
- [ ] Rendicontazione degli scostamenti.
- [ ] Gestione delle eccezioni.
- [ ] Monitoraggio di richieste non concluse.
- [ ] Test di continuità con saldo esaurito.

---

## 14. Criteri finali di accettazione della patch

La patch è completata quando:

1. Nessun mockup espone il budget massimo dell'agente.
2. Nessun endpoint permette all'utente di configurare un limite economico per la singola ricerca.
3. Il sistema verifica preventivamente la possibilità di accettare una nuova richiesta.
4. Una richiesta accettata non viene interrotta per il semplice esaurimento del saldo.
5. L'orchestratore prosegue fino a un esito conclusivo valido.
6. Eventuali anomalie vengono gestite senza abbandonare gli impegni.
7. I costi reali vengono registrati integralmente.
8. Gli eventuali sforamenti sono contabilizzati come costo della piattaforma.
9. Il saldo operativo non diventa negativo.
10. I crediti vincolati per le garanzie rimangono protetti.
11. Le stime sono puramente informative e calibrate sui dati effettivi.
12. La reportistica permette di individuare richieste inconcluse e consumi anomali.

---

## 15. Integrazione nei piani precedenti

**Piano UX:** eliminare il controllo del budget e sostituirlo con saldo disponibile e stima informativa.

**Piano Credit Wallet:** introdurre la distinzione tra consumo reale e consumo addebitato, con sforamento assorbito da Digital Mop.

**Piano orchestratore AI:** rendere il completamento funzionale della richiesta indipendente dall'esaurimento dei crediti.

**Piano prenotazione:** conservare il flusso già definito; integrare soltanto ammissione e garanzia di continuità.

**Piano reportistica:** aggiungere analisi degli scostamenti, degli sforamenti e delle richieste non concluse.

**Piano garanzie e penali:** nessuna modifica alle condizioni di applicazione; mantenere la separazione contabile dei crediti vincolati.

**Piano fatturazione:** nessuna nuova autorizzazione economica durante una richiesta accettata; conservare gli sforamenti operativi come costo interno della piattaforma.

---

**Decisione architetturale conclusiva**

Digital Mop deve valutare preventivamente se accettare una richiesta, ma dopo averla accettata deve assumersi la responsabilità di gestirla fino al completamento funzionale.

Il saldo crediti determina l'accesso a nuove attività, non l'abbandono di quelle già accettate.

Il consumo resta proporzionale al lavoro effettivo dell'AI, mentre gli scostamenti non coperti dal saldo sono un rischio operativo interno da misurare, calibrare e controllare attraverso la reportistica.

**La semplicità della delega deve rimanere una responsabilità di Digital Mop, non diventare un problema da amministrare per l'utente.**
## 16. Applicazione con Telnyx e wallet del mockup

Le protezioni Telnyx (concorrenza, durata massima, limiti di spesa) sono limiti tecnici del provider, non budget assegnati dal cliente. Una chiamata terminata per un limite richiede riconciliazione, pianificazione della prosecuzione o escalation: non chiudere automaticamente la richiesta come fallita per saldo esaurito. Nessuna promessa di riuscita della prenotazione o di disponibilità continua dei provider.

Misurare il costo Telnyx Voice AI e WhatsApp secondo le componenti effettivamente fatturate, insieme ai consumi dell'orchestratore testuale se ancora in uso. Non contare GPT-Live o Wazzup per il lavoro successivo alla migrazione; conservare eventuali voci storiche con provider e periodo originali.

La quota in prestito è solo per eventuali penali; non sostiene il consumo operativo né rappresenta la quota piattaforma. Mostrare saldo e info «La ricerca va avanti»; il dettaglio può separare lavoro effettivo, addebito utente e quota Digital Mop. I valori 125/100/25 del mockup sono esempi, non configurazione. La progress bar distingue disponibile e prestito con legenda e tratteggio; garanzia e prestito restano contabilmente distinti.

La schermata 094 non introduce un limite definitivo di una richiesta per utente. Le richieste concorrenti devono rispettare disponibilità atomica e garanzie senza doppio utilizzo. Non chiedere di aumentare un budget e non aggiungere un blocco di sola UI in sostituzione dei controlli backend.
