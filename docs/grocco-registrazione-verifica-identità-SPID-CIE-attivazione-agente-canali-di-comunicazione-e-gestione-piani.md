# Digital Mop — Piano UX integrato
## Registrazione, verifica identità SPID/CIE, attivazione agente, canali di comunicazione e gestione piani

**Versione:** 1.3 — Accesso Google e passkey integrati nel percorso di verifica (11 ottobre 2026)  
**Progetto:** Prenotazione Campi / Digital Mop  
**Stato:** Specifica funzionale UX, non ancora definitiva  
**Ambito:** Esperienza utente, raccordo con le integrazioni esistenti, interventi necessari e dipendenze.

---

# 1. Obiettivo del piano

Definire un'esperienza coerente attraverso la quale un utente possa:

1. Registrarsi alla piattaforma Digital Mop con Google oppure email e password; attivare facoltativamente una passkey per gli accessi successivi.
2. Verificare il proprio indirizzo email.
3. Verificare facoltativamente il telefono durante l'onboarding.
4. Navigare liberamente senza completare subito tutte le verifiche.
5. Completare telefono e verifica d'identità tramite **SPID oppure CIE** quando desidera utilizzare le funzionalità di prenotazione.
6. Scegliere un Pass temporaneo oppure un abbonamento mensile.
7. Selezionare Email, WhatsApp o Telegram come canale principale.
8. Collegare il canale al proprio account.
9. Utilizzare l'agente AI esclusivamente nei limiti del diritto di accesso acquistato.
10. Gestire rinnovi, preferenze di contatto, scadenze e disdette dalla sezione Account.

Il sistema deve riutilizzare le integrazioni già sperimentate senza duplicare la logica di identificazione, autorizzazione e gestione dell'agente.

**Principio generale:** Digital Mop vende un periodo di accesso a un agente AI specializzato nell'organizzazione di prenotazioni sportive, non un numero predeterminato di messaggi, telefonate o prenotazioni.

**Principio di identità:** SPID e CIE sono alternativi. È sufficiente completare correttamente uno dei due percorsi, con un livello di autenticazione adeguato ai requisiti del servizio. Non sono richiesti entrambi.

---

# 2. Confini del documento

## 2.1 Funzionalità comprese

- Registrazione con Google oppure email e password.
- Verifica dell’email tramite Google nei casi affidabili oppure OTP Resend.
- Accesso con passkey, gestione e recupero dei metodi di accesso.
- Verifica OTP telefonica.
- Verifica identità tramite SPID.
- Verifica identità tramite Carta di Identità Elettronica (CIE).
- Onboarding iniziale e wizard di verifica riutilizzabile.
- Accesso alle offerte e selezione del piano.
- Pass temporaneo.
- Prova gratuita di sette giorni.
- Abbonamento mensile e rinnovo.
- Selezione del canale di comunicazione.
- Collegamento WhatsApp e Telegram.
- Accesso autorizzato all'agente AI.
- Chiamate telefoniche di backup verso il cliente.
- Gestione del piano dalla sezione Account.
- Scadenza, disdetta e modifica del canale.
- Interfacce di stato, errori, conferme e recupero.

## 2.2 ESCLUSIONE — ❓❓❓ Flusso effettivo di prenotazione

**STATO: NON PROGETTATO IN QUESTO PIANO.**

È già stabilito che l'utente potrà scegliere preferenze come location, data e orario e che dovrà completare i requisiti di accesso prima di avanzare nelle operazioni riservate.

Resta però completamente aperto il funzionamento operativo della prenotazione.

Non sono ancora definiti in questa specifica:

- Come vengono trovate e selezionate le strutture sportive.
- Come vengono espresse preferenze, alternative e flessibilità.
- Come l'agente interpreta una richiesta.
- Quando e attraverso quali strumenti contatta le strutture.
- Come tratta risposte, disponibilità, controproposte e rifiuti.
- Come richiede decisioni o conferme all'utente.
- Come gestisce le prenotazioni simultanee.
- Come si stabilisce che una richiesta è conclusa.
- Come funziona la cancellazione di una prenotazione.
- Come interagiscono eventuali partite organizzate tramite gruppi WhatsApp.
- Come viene confermata una prenotazione definitiva.

**Dipendenza futura:** Piano dedicato al Booking Flow e al ciclo di vita delle richieste.

Questo documento stabilisce esclusivamente quando un utente può accedere al servizio e come riprendere il suo percorso dopo verifiche e attivazione.

## 2.3 ESCLUSIONE — ❓❓❓ Flusso di fatturazione e pagamenti

**STATO: NON PROGETTATO IN QUESTO PIANO.**

Sono definite le informazioni che devono essere comprensibili all'utente e le azioni UX necessarie, ma non il funzionamento effettivo del sistema di billing.

Restano aperti:

- Provider di pagamento.
- Modello di subscription e ciclo contabile.
- Prezzi effettivi dei tre canali.
- Valore economico e durata definitiva dei Pass.
- Gestione degli addebiti automatici.
- Gestione di carte e metodi di pagamento.
- Autorizzazioni e autenticazioni dei pagamenti.
- Fatture, ricevute e dati fiscali.
- Fiscalità e imposte applicabili.
- Rimborsi.
- Gestione tecnica dei pagamenti falliti.
- Tentativi di recupero degli addebiti.
- Proroghe, insoluti e sospensioni.
- Regole di proratazione o cambio piano.
- Diritto di recesso e relative condizioni.
- Eventuali codici promozionali.

**Dipendenza futura:** Piano dedicato a Billing, Subscription Management e Payments.

La UX descritta qui dovrà interfacciarsi con tale sistema, senza anticiparne le scelte implementative.

---

# 3. Inventario dei componenti già presenti

Legenda:

- **TESTATO:** componente provato con successo nella demo.
- **PARZIALE:** esiste una parte dell'integrazione, ma manca il collegamento al percorso prodotto.
- **DA REALIZZARE:** funzionalità non ancora integrata.
- **DA PROGETTARE:** comportamento ancora da definire.

| Componente | Stato | Evidenza attuale | Miglioramento necessario |
|---|---|---|---|
| Resend | TESTATO | Invio email reale dal dominio demo.brugno.it | Collegamento ad account e verifiche persistenti |
| OTP email | TESTATO come modulo | Codici monouso e controlli antiabuso provati | Persistenza e integrazione nella verifica email condizionale |
| Accesso Google | DA REALIZZARE | Decisione UX approvata | Validazione lato server, verifica email condizionale e collegamento account |
| Passkey | DA REALIZZARE | Decisione UX approvata | Registrazione e accesso WebAuthn, gestione credenziali e recupero |
| Telnyx Verify | TESTATO | Invio e verifica OTP SMS reali funzionanti | Integrazione con utenti e numero verificato |
| SPID | TESTATO in ambiente demo | Autenticazione e ritorno dei dati identificativi tramite adapter | Associazione permanente all'account applicativo |
| CIE | DA REALIZZARE | Non ancora integrata o testata nel progetto | Integrazione Entra con CIE, callback e associazione all'identità applicativa |
| Backend Docker | TESTATO | Backend e ambiente SPID comunicano sulla rete Docker | Configurazione integrata e separazione demo/produzione |
| MongoDB / account applicativo | DA COMPLETARE | Previsto nell'architettura | Schema utente, verifiche, collegamenti e stati di accesso |
| Wazzup | TESTATO a livello trasporto | Invio WhatsApp e ricezione webhook | Associazione account, autorizzazione, gestione conversazioni |
| Telegram | PARZIALE | Router/webhook e collegamento all'orchestratore impostati | Associazione utente, autorizzazione e test end-to-end |
| Orchestratore OpenAI | PARZIALE | Gestione conversazioni e chiamate ai tool predisposta | Persistenza, strumenti applicativi e controllo accessi |
| GPT-Live / Telnyx voce | TESTATO in demo | Chiamate AI e delegazione sperimentate | Collegamento al contesto utente e alle chiamate di backup |
| Piani e trial | DA REALIZZARE | Requisiti UX definiti | Stati commerciali e relativo controllo degli accessi |
| Pagamenti | DA PROGETTARE | Nessuna integrazione definitiva assunta | Piano Billing separato |
| Prenotazioni operative | DA PROGETTARE | Agente attualmente limitato alla conversazione demo | Piano Booking separato |

**Osservazione architetturale:** i singoli strumenti dimostrano che buona parte dell'infrastruttura necessaria è disponibile. Il lavoro principale sarà integrarli intorno a un account persistente, identificato e autorizzato.

SPID e CIE dovranno convergere sullo stesso concetto applicativo di **identità verificata**, indipendentemente dal metodo utilizzato.

L'adapter SPID già sperimentato non deve essere considerato automaticamente compatibile con CIE: l'integrazione CIE richiede una verifica tecnica separata.

---

# 4. Flusso UX generale

| Fase | Percorso e condizioni |
|---|---|
| Registrazione | Continua con Google oppure Continua con email (username, email e password) |
| Email verificata | Google nei casi della sezione 5; negli altri casi OTP Resend |
| Accesso rapido facoltativo | Proposta di creare una passkey dopo il primo accesso e la verifica email; è possibile saltare |
| Telefono facoltativo | Verifica OTP Telnyx oppure passaggio diretto alla home |
| Navigazione | Libera, senza obbligo immediato di SPID/CIE |
| Intenzione di utilizzare l’agente | Controllo dei requisiti mancanti: email, telefono e identità |
| Identità | SPID oppure CIE; Google e passkey non soddisfano questo requisito |
| Diritto di accesso | Se valido, si prosegue; altrimenti scelta Pass/Abbonamento, canale, collegamento e checkout |
| Attivazione | Accesso all’agente autorizzato; Booking e Billing restano nei piani dedicati |
| Accessi successivi | Google, passkey o email/password già associati allo stesso account; ripresa dello stato persistente |


La piattaforma non deve obbligare l'utente a percorrere tutti questi passaggi ogni volta.

Ogni ingresso nel flusso verifica lo stato esistente e propone esclusivamente le operazioni mancanti.

Una verifica tramite SPID e una tramite CIE devono produrre lo stesso risultato funzionale per il resto del percorso.

---

# 5. Registrazione e accesso all’account

## 5.1 Distinzione fra accesso e verifiche

| Concetto | Cosa attesta | Come viene ottenuto |
|---|---|---|
| Accesso autenticato | Possesso di una credenziale associata all’account Digital Mop | Google, email/password oppure passkey |
| Email verificata | Controllo dell’indirizzo email di contatto | Google nei casi indicati sotto oppure OTP Resend |
| Telefono verificato | Controllo del numero di contatto | OTP Telnyx |
| Identità verificata | Identità personale richiesta per le prenotazioni | SPID oppure CIE |

Google e passkey velocizzano l’accesso, ma non conferiscono lo stato di identità verificata. Non sostituiscono neppure la verifica del telefono. Gli stati rimangono separati e persistenti sullo stesso account.

## UX-01 — Creazione account

La schermata propone **“Continua con Google”** e **“Continua con email”**.

### Percorso email

- Username, email, password e accettazione delle condizioni necessarie.
- Creazione dell’account con email da verificare.
- Invio del codice OTP tramite Resend e apertura di UX-02.
- Recupero password disponibile per gli account che possiedono questo metodo.

### Percorso Google

1. L’utente seleziona “Continua con Google” e sceglie il proprio account Google.
2. Il backend verifica la risposta di Google prima di riconoscere l’accesso.
3. Se l’account Google è già collegato, si apre la sessione dell’account Digital Mop esistente.
4. Se è nuovo, si completano le condizioni necessarie e l’eventuale username mancante. Non è richiesta la creazione di una password Digital Mop.
5. Si determina se l’email può essere considerata verificata da Google; solo se necessario si richiede l’OTP Resend.
6. Si riprende l’onboarding, proponendo facoltativamente una passkey e la verifica del telefono.

Nome e immagine ricevuti da Google sono dati di profilo: non sono una verifica anagrafica SPID/CIE.

### Quando ci affidiamo a Google per l’email

La decisione usa esclusivamente dati di una risposta Google validata dal backend.

| Account Google | Trattamento dell’email |
|---|---|
| Indirizzo Gmail | Email verificata tramite Google; nessun OTP aggiuntivo |
| Google Workspace con email verificata e dominio Workspace attestato nel campo `hd` | Email verificata tramite Google; nessun OTP aggiuntivo |
| Email esterna, per esempio Outlook, senza attestazione Workspace | OTP Resend anche se Google indica una verifica email avvenuta in passato |
| Dati insufficienti a stabilire la verifica dell’email | Verifica diretta via Resend |
| Risposta Google non valida o scaduta | Nessuna sessione creata; nuovo tentativo di accesso |

Non basta che l’indirizzo abbia un dominio aziendale: deve essere Google ad attestare il dominio Workspace. Non si invia un OTP a ogni successivo accesso quando l’indirizzo è già stato verificato direttamente e non è cambiato.

### Collegamento a un account esistente

- Una stessa email non deve produrre duplicati o una fusione automatica non verificata.
- Se esiste già un account con quell’email ma Google non è collegato, si richiede di accedere all’account esistente con un metodo già abilitato o di completarne il recupero; poi si autorizza il collegamento Google.
- L’identificatore stabile Google, non la sola email, identifica il collegamento con il provider.
- Account, verifiche SPID/CIE, canali, piano, storico e diritto alla prova rimangono gli stessi dopo il collegamento.
- Un cambio email proveniente dal provider non deve sovrascrivere automaticamente l’indirizzo di contatto verificato di Digital Mop.

## UX-02 — Verifica email tramite OTP Resend

Questa schermata compare soltanto quando l’email necessita di verifica diretta.

**“Verifica il tuo indirizzo email”**

“Abbiamo inviato un codice a [email]. Inseriscilo per continuare.”

Azioni: inserisci codice, conferma, reinvia, correggi indirizzo, torna all’accesso.

La scelta aggiornata è riutilizzare il codice OTP già sperimentato, sostituendo in questo piano la precedente previsione di un link di verifica email.

Caratteristiche già provate nel modulo demo:

- Codice di sei cifre.
- Scadenza di dieci minuti.
- Massimo cinque tentativi.
- Attesa di sessanta secondi fra reinvii.
- Utilizzo singolo.

Da completare nel prodotto:

- Associazione sicura fra codice, account, indirizzo e finalità della verifica.
- Persistenza adeguata: la memoria del processo della demo non è il meccanismo definitivo.
- Invalidazione dei codici precedenti in caso di reinvio o correzione dell’indirizzo.
- Gestione di codice errato, scaduto o già utilizzato e limiti antiabuso.
- Salvataggio dello stato e della provenienza della verifica email.
- Ripresa dell’onboarding senza perdere le informazioni già inserite.

Dopo il successo: **“Email verificata correttamente”**. Si propone l’accesso rapido facoltativo, poi la verifica facoltativa del telefono. L’email verificata da Google raggiunge direttamente lo stesso punto.

## UX-01A — Attivazione facoltativa della passkey

Dopo il primo accesso e la verifica email, proporre:

**“Accedi più velocemente”**

“Usa una passkey con impronta, riconoscimento facciale o PIN del dispositivo.”

Azioni: **“Attiva passkey”** e **“Più tardi”**. La proposta non deve bloccare l’onboarding né ricomparire a ogni visita dopo essere stata rimandata. Resta disponibile in Account → Identità e sicurezza.

- Il dispositivo mostra il proprio dialog di creazione della passkey.
- Il backend valida la registrazione e associa la credenziale all’account autenticato.
- La conferma appare soltanto dopo il salvataggio riuscito.
- Annullamento o mancato supporto permettono di proseguire normalmente.
- Impronta e dati del volto restano sul dispositivo; Digital Mop non li riceve né li conserva.
- Non si promette esclusivamente l’impronta: il metodo locale disponibile può essere volto, PIN o altro metodo supportato.
- Una passkey non verifica l’email e non conferisce l’identità SPID/CIE.

## UX-01B — Accessi successivi

L’utente può accedere con Google, con una passkey già registrata oppure con email/password se configurate. Nessun obbligo di usare Google prima della passkey.

Dopo l’accesso si ritrovano lo stesso account e le verifiche già completate. Non si richiedono nuovamente OTP email o SPID/CIE come passaggi ordinari di ogni accesso o prenotazione.

Se la passkey non è disponibile sul dispositivo corrente, l’utente può usare un altro metodo collegato. Disponibilità su più dispositivi e sincronizzazione dipendono dal gestore di passkey utilizzato: non vanno promesse come universali.

## UX-01C — Gestione e recupero dei metodi di accesso

In Account → Identità e sicurezza mostrare:

- Google collegato o non collegato, con azioni di collegamento e scollegamento.
- Passkey registrate, con nome comprensibile, data di creazione e ultimo utilizzo se disponibile.
- Azioni per aggiungere o rimuovere una passkey.
- Disponibilità del metodo email/password e relativo recupero.

Collegamenti, rimozioni e modifiche sensibili richiedono una conferma dell’accesso con un metodo già affidabile. Non consentire di rimuovere l’ultimo metodo senza predisporre un’alternativa utilizzabile.

Per chi nasce con Google, non mostrare una password inesistente: l’eventuale attivazione di email/password avviene in un percorso esplicito, dopo conferma del controllo dell’account e dell’email di contatto.

Il recupero deve ricondurre allo stesso account, senza creare nuove identità o nuovi diritti alla prova gratuita. Se tutti i metodi sono indisponibili, prevedere un percorso assistito di recupero la cui procedura operativa resta da definire; non autorizzare collegamenti sulla sola dichiarazione dell’indirizzo email.

### Requisiti di integrazione da realizzare

- Validazione server dell’accesso Google, della destinazione del token, della sua validità e del legame con il tentativo avviato.
- Collegamento univoco fra identificativo Google e account interno.
- Registrazione e autenticazione passkey tramite WebAuthn, con verifica della challenge, dell’origine, del servizio destinatario e della verifica locale dell’utente.
- Persistenza delle credenziali pubbliche e dei collegamenti; nessuna raccolta di dati biometrici.
- Stati separati per autenticazione, email, telefono, identità e diritto di utilizzo.
- Gestione coerente delle sessioni e conservazione del percorso interrotto.

Questi sono requisiti del piano: Google e passkey restano funzionalità da implementare e testare.

---

# 6. Verifica del numero di telefono

## UX-03 — Inserimento numero

Schermata:

**"Aggiungi il tuo numero di telefono"**

Testo:

"Lo useremo per le verifiche di sicurezza e per permettere all'agente di contattarti quando è necessaria una risposta urgente."

Elementi:

- Prefisso internazionale.
- Numero di telefono.
- Pulsante "Invia codice".
- Azione secondaria "Lo farò più tardi".

### Integrazione esistente

Telnyx Verify è stato testato con invio e verifica di un codice SMS reale verso un numero italiano.

La demo dispone già della configurazione di verifica, compreso il profilo Telnyx dedicato.

### UX-04 — Dialog OTP

Dopo l'invio del codice:

- Apertura dialog dedicato.
- Inserimento OTP.
- Conferma.
- Eventuale reinvio.
- Gestione errori e scadenza.
- Possibilità di cambiare numero.

Dopo la verifica:

**"Numero verificato"**

L'utente torna al percorso originale.

### Comportamento facoltativo

Durante il primo onboarding il passaggio è facoltativo.

Se viene saltato:

- L'utente raggiunge la home.
- Può navigare.
- Può consultare offerte e campi.
- Non può utilizzare le funzionalità riservate alle prenotazioni.

### Indipendenza dalla verifica d'identità

L'OTP telefonico rimane necessario anche se l'utente ha effettuato correttamente una verifica tramite SPID o CIE.

I due requisiti hanno scopi differenti:

- L'OTP conferma il controllo del numero telefonico destinato alle comunicazioni.
- SPID/CIE conferma l'identità personale.

La presenza di un secondo fattore telefonico nell'autenticazione SPID o CIE non sostituisce automaticamente la verifica Telnyx del numero registrato su Digital Mop.

### Da migliorare

- Collegare lo stato `phoneVerified` all'account.
- Salvare il numero nel formato internazionale normalizzato.
- Distinguere numero inserito da numero effettivamente verificato.
- Applicare limiti ai tentativi di invio e verifica.
- Gestire numero già associato ad altri account.
- Gestire il cambio del numero con nuova verifica.
- Non considerare verificato il telefono soltanto perché Telnyx ha accettato l'invio dell'SMS.
- Rendere il dialog OTP riutilizzabile in onboarding e Account.

---

# 7. Verifica identità tramite SPID o CIE

## UX-05 — Verifica identità

La verifica d'identità non viene richiesta durante la normale registrazione.

Può essere avviata da:

1. Account → Verifica identità.
2. Wizard richiesto prima dell'utilizzo delle funzionalità di prenotazione.

Il componente UX deve essere lo stesso.

### Esperienza prevista

Schermata:

**"Verifica la tua identità"**

Testo:

"Per utilizzare Digital Mop nelle richieste di prenotazione è necessario verificare la tua identità. Puoi farlo con SPID oppure con la Carta di Identità Elettronica (CIE)."

L'utente visualizza due opzioni equivalenti:

**Verifica con SPID**

Accedi utilizzando il tuo provider di identità SPID.

**Verifica con CIE**

Accedi utilizzando la tua Carta di Identità Elettronica e le credenziali CIE abilitate.

Le due opzioni conducono a percorsi differenti ma producono lo stesso stato applicativo.

Non è previsto l'obbligo di completarli entrambi.

## 7.1 Percorso SPID

### Integrazione esistente

La demo ha già verificato il percorso tecnico di autenticazione SPID nell'ambiente di test.

Sono stati sperimentati:

- Adapter Express dedicato.
- Identity Provider di test.
- Infrastruttura Docker.
- Redis.
- Comunicazione adapter/backend.
- Callback di autenticazione.
- Scambio tramite token temporaneo e monouso.
- Recupero degli attributi identificativi essenziali.
- Derivazione di un identificatore interno dall'identità verificata.

Gli attributi utilizzati nella prova includono nome, cognome e codice fiscale.

### Comportamento UX

1. L'utente seleziona "Verifica con SPID".
2. Viene indirizzato al percorso di autenticazione.
3. Completa l'autenticazione presso il provider.
4. Ritorna a Digital Mop.
5. Il backend verifica l'esito e collega l'identità all'account.
6. Il wizard visualizza "Identità verificata".
7. L'utente riprende il percorso precedente.

## 7.2 Percorso CIE

### Stato attuale

**DA REALIZZARE E TESTARE.**

La CIE non è ancora stata integrata nel progetto.

L'integrazione dovrà utilizzare lo schema ufficiale "Entra con CIE" e il relativo livello di autenticazione appropriato.

### Comportamento UX

1. L'utente seleziona "Verifica con CIE".
2. Viene indirizzato al percorso ufficiale di autenticazione CIE.
3. Completa l'accesso tramite una modalità supportata dal servizio.
4. Ritorna a Digital Mop.
5. Il backend verifica l'esito dell'autenticazione.
6. I dati identificativi necessari vengono associati all'account.
7. Il wizard visualizza "Identità verificata".
8. L'utente riprende il percorso precedente.

### Esperienza CIE desktop e mobile

L'interfaccia Digital Mop non deve presumere che tutti gli utenti possiedano un lettore NFC.

Le modalità disponibili possono comprendere, secondo il livello richiesto:

- Accesso con credenziali CIE e secondo fattore.
- Conferma tramite app CieID.
- Scansione di QR code.
- Lettura della carta CIE tramite smartphone NFC.
- Lettura della carta tramite lettore compatibile su computer.

Digital Mop non deve replicare l'interfaccia ufficiale del sistema CIE.

Deve soltanto presentare un'introduzione comprensibile, avviare il percorso di autenticazione appropriato e gestire correttamente il ritorno.

**Decisione tecnica aperta:** stabilire il livello minimo di autenticazione CIE accettato da Digital Mop. Il flusso UX deve restare utilizzabile anche se il livello richiesto cambia.

### Stati UX CIE

- Verifica non iniziata.
- Reindirizzamento all'autenticazione.
- Autenticazione in corso.
- Verifica completata.
- Autenticazione annullata.
- Autenticazione fallita.
- Sessione scaduta.
- Identità già associata a un altro account.

### Miglioramenti necessari per CIE

- Integrare lo schema Entra con CIE.
- Predisporre configurazione e callback dedicate.
- Gestire le sessioni di autenticazione.
- Validare correttamente le risposte del provider.
- Estrarre esclusivamente gli attributi identificativi necessari.
- Associare l'identità all'account Digital Mop.
- Gestire gli errori e l'annullamento.
- Garantire il ritorno al wizard.
- Validare l'integrazione in ambiente di test prima della produzione.
- Non assumere che il modulo SPID esistente supporti automaticamente CIE.

## 7.3 Stato di identità unificato

Il backend non deve mantenere due permessi separati che richiedono contemporaneamente la verifica SPID e CIE.

Deve esistere uno stato applicativo comune:

`identityVerified`

Al completamento di uno dei due percorsi, devono essere disponibili almeno le informazioni necessarie a stabilire:

- Account associato.
- Identità verificata.
- Metodo di verifica utilizzato.
- Data della verifica.
- Eventuali riferimenti necessari alla validazione e tracciabilità del processo.

Il metodo utilizzato può essere memorizzato come `SPID` oppure `CIE`.

Tuttavia, il metodo non deve modificare il diritto di accesso ai servizi commerciali se il livello di autenticazione soddisfa i requisiti previsti.

### Unicità della persona

Un utente che completa la verifica con SPID e successivamente utilizza CIE non deve essere considerato una seconda persona.

I due metodi devono ricondurre alla stessa identità applicativa quando gli attributi verificati permettono di stabilire tale corrispondenza.

Il codice fiscale verificato può costituire un elemento di raccordo, adottando una gestione protetta e coerente con i principi di minimizzazione dei dati.

Non devono essere utilizzati come identificativi permanenti gli ID transitori delle singole sessioni.

### Verifica della prova gratuita

La prova gratuita è consentita una sola volta per persona verificata.

La stessa persona non deve poter ottenere:

- Una prova con SPID.
- Una seconda prova con CIE.
- Ulteriori prove cambiando email o account.

Il controllo di unicità deve quindi essere indipendente dal metodo di autenticazione scelto.

## 7.4 Miglioramenti comuni a SPID e CIE

- Associare l'identità all'account MongoDB autenticato.
- Impedire collegamenti incoerenti fra account e identità.
- Usare un identificatore applicativo interno stabile e protetto.
- Non esporre dati identificativi inutilmente al frontend.
- Non conservare attributi non necessari.
- Evitare informazioni personali nei log applicativi.
- Gestire ritorno, annullamento e sessione scaduta.
- Conservare il contesto di navigazione.
- Distinguere autenticazione esterna riuscita da verifica applicativa effettivamente completata.
- Definire procedure di recupero per eventuali associazioni errate.
- Stabilire livelli di sicurezza e criteri di validità accettati per entrambi i metodi.

---

# 8. Wizard di verifica condiviso

Il wizard deve essere un componente applicativo riutilizzabile.

### Ingresso dalla registrazione

```text
Email -> Telefono facoltativo -> Home
```

### Ingresso dall'Account

```text
Account
  -> Verifiche
  -> Mostra verifiche mancanti
  -> Telefono, se necessario
  -> Identità tramite SPID oppure CIE
  -> Ritorna ad Account
```

### Ingresso da una prenotazione

```text
Preferenze già selezionate
  -> Controllo requisiti
  -> Verifiche mancanti
  -> Telefono, se necessario
  -> SPID oppure CIE, se necessario
  -> Riprendi percorso
```

### Stati mostrati

- Email verificata.
- Telefono verificato / da verificare.
- Identità verificata / da verificare.

Per l'identità verificata può essere mostrato il metodo utilizzato, SPID o CIE, come informazione di dettaglio.

Non devono essere presentati due requisiti obbligatori distinti per SPID e CIE.

### Regole

- Non ripetere verifiche già completate.
- Non richiedere nuovamente SPID o CIE per ogni prenotazione.
- Non perdere lo stato dell'operazione che ha aperto il wizard.
- Consentire all'utente di interrompere il wizard e tornare alla navigazione.
- Non permettere di superare il controllo dei requisiti quando si vuole effettivamente utilizzare l'agente per prenotazioni.
- Mostrare chiaramente ciò che manca.
- Consentire la scelta tra SPID e CIE.
- Consentire di tornare alla scelta del metodo se una procedura viene annullata.
- Non richiedere CIE a chi ha già verificato correttamente l'identità con SPID, né viceversa.

**Da migliorare:** centralizzare il controllo dei requisiti, evitando che ogni schermata o canale implementi condizioni differenti.

---

# 9. Selezione del piano di utilizzo

## UX-06 — Scegli come utilizzare Digital Mop

Il piano può essere scelto da:

- Sezione Account.
- Pagina delle offerte.
- Percorso avviato quando l'utente desidera procedere con una prenotazione.

### Modalità A — Pass temporaneo

**Durata provvisoria: 48 ore.**

- Pagamento una tantum.
- Nessun rinnovo.
- Accesso all'agente per il periodo acquistato.
- Nessun numero prestabilito di prenotazioni.
- Nessun contatore di messaggi o conversazioni visibile.
- Accesso soggetto alle condizioni di utilizzo corretto.

La durata di 48 ore rimane una proposta da validare.

### Modalità B — Abbonamento mensile

- Periodo di prova di sette giorni per gli aventi diritto.
- Prezzo iniziale pari a 0 €.
- Dati di fatturazione richiesti.
- Metodo di pagamento richiesto.
- Rinnovo automatico al termine della prova, salvo disdetta.
- Costo mensile dipendente dal canale.
- Accesso all'agente per il periodo di abbonamento attivo.
- Una sola prova gratuita per identità verificata.

### Se la prova gratuita è già stata usata

L'utente vede direttamente la proposta di abbonamento mensile a pagamento.

Non viene offerta una seconda prova tramite cambio email, username, canale, account Google, passkey oppure metodo di verifica tra SPID e CIE.

### Da migliorare

- Introdurre stati persistenti dei diritti di accesso.
- Distinguere piano selezionato da piano effettivamente attivo.
- Evitare acquisti duplicati involontari.
- Gestire utenti che possiedono già un piano.
- Conservare le scelte quando l'utente passa alle verifiche.
- Rendere esplicito che il servizio è legato al tempo di accesso.
- Non presentare il Pass come una singola prenotazione.

**Nota commerciale:** i prezzi saranno definiti soltanto dopo le sessioni di demo e stress test sui consumi reali.

---

# 10. Scelta del canale dell'agente

## UX-07 — Dove vuoi comunicare con Digital Mop?

Tre opzioni.

### Email + backup telefonico

L'agente comunica attraverso la posta elettronica.

Il numero verificato rimane disponibile per chiamate operative urgenti.

**Integrazione esistente:** Resend.

**Miglioramento necessario:** Resend è già stato provato per l'invio di email, ma questo non equivale ad avere un canale di conversazione bidirezionale.

Se l'utente deve poter rispondere alle email dell'agente, occorre gestire anche:

- Ricezione delle risposte.
- Riconoscimento dell'utente.
- Associazione della risposta alla conversazione.
- Continuità del contesto.
- Messaggi duplicati e risposte a thread precedenti.

Questa parte non va considerata completata soltanto perché funzionano le email di verifica.

### WhatsApp + backup telefonico

L'agente comunica tramite WhatsApp.

**Integrazione esistente:** Wazzup.

Sono stati verificati l'invio di messaggi e la ricezione di webhook reali.

**Miglioramenti necessari:**

- Collegamento sicuro della chat all'account.
- Autorizzazione basata sul piano attivo.
- Associazione del mittente alla conversazione corretta.
- Gestione delle risposte.
- Deduplicazione dei messaggi ricevuti.
- Gestione dei messaggi inviati dal nostro stesso account.
- Gestione errori del provider.
- Rispetto delle regole di comunicazione WhatsApp.
- Valutazione della soluzione definitiva per la produzione.

Wazzup resta il provider della demo; nell'interfaccia l'utente vede soltanto **WhatsApp**.

L'eventuale organizzazione di partite tramite gruppi WhatsApp è un'estensione futura, distinta dal canale privato del cliente.

### Telegram + backup telefonico

L'agente comunica tramite il bot Telegram ufficiale.

**Integrazione esistente:** webhook/router Telegram e orchestrazione condivisa già impostati.

**Miglioramenti necessari:**

- Collegare `chatId` e utente Digital Mop.
- Verificare che il collegamento venga autorizzato dall'utente autenticato.
- Impedire l'accesso alle funzioni riservate a chat sconosciute.
- Gestire cambio account Telegram.
- Gestire messaggi duplicati.
- Verificare il funzionamento end-to-end del flusso.
- Uniformare gli stati della conversazione agli altri canali.

### Regola trasversale

Ogni canale presenta:

- Descrizione.
- Prezzo esatto del piano scelto.
- Frequenza del pagamento.
- Necessità di collegamento, se applicabile.
- Disponibilità del backup telefonico.

Il canale viene scelto prima del checkout e deve risultare utilizzabile prima dell'attivazione del servizio.

---

# 11. Collegamento dell'account al canale

## UX-08 — Associazione WhatsApp

L'utente ha già un account autenticato.

Il sistema propone:

1. Apertura della chat Digital Mop.
2. Invio di un messaggio temporaneo di associazione.
3. Verifica dell'associazione.
4. Conferma del collegamento.
5. Ritorno al wizard.

Su mobile viene aperta l'app WhatsApp.

Su desktop vengono proposti un QR code e l'apertura della chat attraverso WhatsApp Web.

### Sicurezza

Il solo possesso del numero telefonico non è sufficiente a garantire l'accesso ai servizi dell'agente.

Occorre collegare la chat alla sessione dell'utente autenticato tramite una procedura temporanea e verificabile.

Una chat precedentemente associata ad altri account non deve poter essere sottratta senza una procedura sicura.

## UX-09 — Associazione Telegram

Procedura analoga:

1. Apertura del bot.
2. Avvio tramite un collegamento temporaneo.
3. Conferma dell'identità della chat.
4. Associazione all'account.
5. Ritorno al wizard.

Non devono essere richiesti all'utente identificativi tecnici come `chatId`.

## UX-10 — Email

Il canale utilizza l'indirizzo email già verificato.

Non serve una seconda verifica se l'indirizzo non è cambiato.

Rimane da completare l'effettiva gestione delle risposte email.

### Stati comuni di associazione

- Non collegato.
- Collegamento in corso.
- Collegato.
- Collegamento scaduto.
- Collegamento fallito.
- Collegamento da verificare nuovamente.

### Da migliorare

L'associazione deve essere una caratteristica persistente dell'account.

Deve essere distinta sia dalla verifica dell'identità sia dallo stato del piano commerciale.

Un canale può essere correttamente collegato ma temporaneamente non autorizzato a gestire nuove richieste perché il piano è scaduto.

---

# 12. Checkout e attivazione

## UX-11 — Riepilogo Pass

Il checkout deve mostrare:

- Tipologia Pass.
- Durata.
- Canale selezionato.
- Prezzo finale.
- Assenza di rinnovo automatico.
- Data e ora di inizio accesso.
- Regole di scadenza.
- Comunicazioni telefoniche di backup incluse.

La validità parte soltanto quando l'attivazione viene confermata.

## UX-12 — Riepilogo abbonamento

Il checkout deve mostrare:

- Abbonamento mensile.
- Canale selezionato.
- Prova di sette giorni, se disponibile.
- Importo oggi: 0 € durante la prova.
- Prezzo mensile successivo.
- Data esatta del primo addebito.
- Rinnovo automatico.
- Modalità di disdetta.
- Dati di fatturazione.
- Metodo di pagamento.

La conferma deve rendere evidente che il pagamento futuro avverrà automaticamente se l'utente non disdice nei termini previsti.

### Integrazione futura

**❓ Sistema Billing non ancora progettato.**

Il frontend dovrà ricevere e mostrare l'esito effettivo dell'attivazione, non dedurlo dal semplice completamento della schermata di checkout.

Stati UX minimi richiesti:

- Checkout non iniziato.
- Checkout in corso.
- In attesa di conferma.
- Attivazione riuscita.
- Attivazione fallita.
- Attivazione da verificare.

### Da migliorare

- Evitare addebiti duplicati dovuti a ripetuti click.
- Evitare che l'interfaccia dichiari attivo un piano non ancora confermato.
- Ripristinare il percorso in caso di pagamento fallito.
- Distinguere chiaramente importo immediato e importi futuri.
- Conservare una traccia comprensibile delle condizioni economiche confermate.
- Non lasciare l'utente senza canale operativo dopo l'attivazione.

Le regole di pagamento, fatturazione e recupero delle transazioni saranno fornite dal piano Billing.

---

# 13. Attivazione del servizio

## UX-13 — Conferma

Dopo l'attivazione viene mostrata una schermata di successo.

### Pass

"Il tuo Pass Digital Mop è attivo."

Informazioni:

- Canale.
- Data e ora di scadenza.
- Accesso disponibile.
- Nessun rinnovo.

### Prova gratuita

"La tua prova gratuita è attiva."

Informazioni:

- Canale.
- Data e ora di fine prova.
- Prezzo del futuro abbonamento.
- Data del primo pagamento.
- Collegamento per gestire il rinnovo.

### Abbonamento

"Il tuo abbonamento Digital Mop è attivo."

Informazioni:

- Canale.
- Prezzo mensile.
- Prossimo rinnovo.
- Accesso all'agente.

### Navigazione successiva

Se il percorso era partito da una prenotazione, il pulsante principale consente di riprendere il contesto precedente.

Se era partito dalla sezione Account, vengono mostrate le azioni per iniziare a utilizzare l'agente oppure tornare alla home.

**❓ Il punto esatto del Booking Flow in cui avviene questa ripresa rimane da definire nel relativo piano.**

---

# 14. Orchestratore AI condiviso

## Componente esistente

Digital Mop dispone già di un orchestratore OpenAI impostato per ricevere richieste provenienti da canali differenti.

L'architettura prevede un ingresso normalizzato contenente:

- Canale.
- Utente.
- Conversazione.
- Messaggio.

Sono presenti la gestione delle conversazioni OpenAI e il ciclo di esecuzione delle chiamate ai tool.

La demo è intenzionalmente limitata: non effettua verifiche reali di disponibilità e non conferma prenotazioni.

Il registro degli strumenti applicativi è attualmente vuoto.

### Obiettivo

Non sviluppare tre agenti distinti.

WhatsApp, Telegram ed Email devono convergere verso lo stesso sistema di orchestrazione, che mantiene una logica comune di autorizzazione e comportamento.

```text
WHATSAPP --- Wazzup --------+
                            |
TELEGRAM ---- Bot API ------+--> Identificazione utente
                            |         |
EMAIL ------- Adapter ------+         v
                                 Autorizzazione
                                       |
                                       v
                                 Orchestratore AI
                                       |
                                       v
                             Strumenti applicativi
                                       |
                                       v
                         [BOOKING: DA DEFINIRE]
```

### Da migliorare

- Non usare l'identificativo della chat come sostituto dell'identità applicativa.
- Risolvere l'utente prima di autorizzare l'uso dell'agente.
- Centralizzare le condizioni di accesso.
- Persistenza dei collegamenti utente/canale.
- Persistenza delle conversazioni.
- Evitare che il contesto sparisca al riavvio di Node.js.
- Gestire duplicazione e concorrenza dei webhook.
- Separare i messaggi di sistema da quelli dell'utente.
- Impedire che un modello AI decida autonomamente se un pagamento o una verifica sono validi.
- Prevedere errori temporanei e tentativi di elaborazione ripetuti.
- Collegare gli strumenti applicativi soltanto quando sarà definito il Booking Flow.

Attualmente alcune informazioni sulle conversazioni vengono conservate in una `Map` di processo: questo comportamento è accettabile nella demo, ma non deve essere considerato definitivo.

### Regola fondamentale

**La verifica dell'autorizzazione avviene nel backend prima di permettere operazioni riservate, non soltanto nelle istruzioni del modello AI.**

L'agente può interpretare richieste e conversazioni, ma gli effetti applicativi devono rimanere controllati dal sistema.

---

# 15. Autorizzazione all'utilizzo dell'agente

Ogni messaggio proveniente da WhatsApp, Telegram o Email deve attraversare un controllo coerente.

### Stati principali

| Condizione | Operazioni consentite |
|---|---|
| Mittente sconosciuto | Informazioni generali e istruzioni di registrazione |
| Utente non autenticato o non collegato | Collegamento all'account |
| Identità non verificata tramite SPID/CIE | Invito alla verifica d'identità |
| Telefono non verificato | Invito alla verifica telefonica |
| Identità verificata con SPID o CIE, senza piano | Informazioni sulle offerte |
| Prova attiva | Utilizzo del servizio |
| Pass attivo | Utilizzo fino alla scadenza |
| Abbonamento attivo | Utilizzo continuativo |
| Rinnovo disattivato ma periodo valido | Utilizzo fino alla scadenza |
| Piano scaduto | Nessuna nuova richiesta; supporto alle attività già avviate |
| Account sospeso | Nessun utilizzo riservato |

### Distinzione importante

Un utente registrato non è automaticamente un utente abbonato.

Un utente verificato tramite SPID o CIE non è automaticamente autorizzato a utilizzare gratuitamente l'agente.

Un utente con canale collegato non possiede necessariamente un diritto di accesso attivo.

Questi stati devono restare indipendenti.

### Da migliorare

- Introdurre un controllo unico e verificabile del diritto di accesso.
- Accettare la verifica d'identità tramite SPID oppure CIE.
- Distinguere accesso a nuove attività da comunicazioni su attività precedenti.
- Rendere coerenti le risposte di blocco sui tre canali.
- Evitare controlli solamente lato frontend.
- Non permettere ai webhook di richiamare direttamente gli strumenti riservati senza autorizzazione.

---

# 16. Telefonate AI e backup telefonico

## Integrazione esistente

Sono già state sperimentate chiamate con Telnyx e OpenAI Live, insieme alla delegazione verso il modello destinato alla gestione applicativa.

È stata anche affrontata la gestione semantica della conclusione della chiamata: l'obiettivo è che l'AI utilizzi un'azione esplicita di chiusura, senza dipendere dal confronto testuale con le parole pronunciate.

Sono state valutate anche le telefonate in ingresso e il comportamento dell'agente in caso di chiamata ricevuta.

### Ruolo nel piano UX

Il backup telefonico è disponibile in tutti i canali commerciali:

- Email + telefono.
- WhatsApp + telefono.
- Telegram + telefono.

L'utente non seleziona separatamente il backup.

Il suo numero verificato rappresenta il riferimento telefonico per le comunicazioni operative.

### Situazioni previste

- Necessità di chiarimenti urgenti.
- Mancata risposta sul canale principale.
- Comunicazioni operative sensibili al tempo.
- Richiesta di decisione rapida da parte del cliente.

### Da migliorare

- Associare ogni chiamata all'utente e al contesto corretto.
- Stabilire quando è opportuno chiamare.
- Evitare chiamate duplicate.
- Rispettare orari e preferenze ragionevoli di contattabilità.
- Collegare la conversazione vocale all'orchestratore.
- Gestire correttamente la conclusione semantica delle chiamate.
- Distinguere chiamate al cliente da chiamate verso le strutture sportive.
- Tracciare i consumi tecnici senza mostrarli come crediti all'utente.
- Definire il comportamento delle telefonate in ingresso.

**Dipendenza:** le regole operative relative alle chiamate verso le strutture e alle eventuali risposte dei centri saranno descritte nel Booking Flow.

---

# 17. Esperienza durante la prova gratuita

## UX-14 — Prova attiva

La sezione Account deve mostrare:

- Piano e canale selezionati.
- Stato "Prova gratuita".
- Data e ora di scadenza.
- Giorni rimanenti.
- Importo del primo futuro addebito.
- Data del primo rinnovo.
- Azione "Gestisci abbonamento".
- Azione "Disdici".

### Comportamento

La prova dura sette giorni dalla conferma dell'attivazione.

L'utente può utilizzare l'agente durante l'intero periodo.

Non esiste un contatore visibile di richieste o conversazioni.

L'idoneità alla prova è legata alla persona verificata, indipendentemente dall'utilizzo di SPID o CIE.

### Modifica canale durante la prova

Il cliente può richiedere di cambiare canale.

Se il nuovo canale non è ancora collegato, deve completare l'associazione.

Il nuovo prezzo mensile futuro viene mostrato prima della conferma.

Il cambio durante la prova non deve generare automaticamente un pagamento immediato.

### Disdetta durante la prova

La disdetta:

- Disattiva il rinnovo.
- Evita il futuro addebito programmato.
- Non interrompe anticipatamente il periodo gratuito.
- Viene confermata nell'Account e tramite email.

### Comunicazioni

Sono previste:

- Conferma di attivazione.
- Promemoria prima della scadenza, per esempio circa 48 ore prima.
- Conferma di disdetta, se richiesta.
- Conferma dell'eventuale passaggio all'abbonamento.

L'utente non deve essere disturbato continuamente da solleciti commerciali.

---

# 18. Esperienza durante l'abbonamento

## UX-15 — Abbonamento attivo

La dashboard Account mostra:

- Canale attivo.
- Prezzo mensile.
- Periodo corrente.
- Prossimo rinnovo.
- Stato dei pagamenti.
- Eventuale cambio canale programmato.
- Possibilità di disdetta.

### Cambio canale

Dopo l'inizio del periodo a pagamento il cambio entra in vigore dal ciclo di fatturazione successivo.

L'utente può selezionare un nuovo canale in qualunque momento.

Il sistema mostra:

- Canale attuale.
- Nuovo canale.
- Prezzo futuro.
- Data di attivazione del nuovo canale.

Se necessario, l'utente deve completare l'associazione del nuovo canale.

Fino alla decorrenza del cambio rimane utilizzabile quello attualmente attivo.

### Da migliorare

- Distinguere canale attuale da canale programmato.
- Evitare modifiche di prezzo non confermate.
- Consentire di annullare un cambio programmato.
- Gestire collegamenti non riusciti.
- Non lasciare l'utente senza un canale utilizzabile alla data di rinnovo.
- Ricevere dal sistema Billing gli stati economici effettivi.

**❓ La gestione finanziaria del cambio piano è demandata al piano Billing.**

---

# 19. Disdetta e scadenza

## UX-16 — Disdetta abbonamento

Percorso:

Account → Piano e comunicazioni → Gestisci abbonamento → Disdici.

La schermata mostra:

- Piano attuale.
- Data di fine accesso.
- Assenza di ulteriori rinnovi.
- Conseguenze sulle nuove richieste.
- Continuità delle attività già avviate.

Non devono esserci ostacoli artificiali alla disdetta.

## UX-17 — Scadenza del Pass

Il Pass termina automaticamente.

L'utente non deve richiederne la cancellazione.

La dashboard mostra la scadenza e propone un nuovo Pass o un abbonamento.

## UX-18 — Piano scaduto

L'utente può:

- Continuare a navigare.
- Consultare il proprio Account.
- Consultare lo storico.
- Ricevere aggiornamenti sulle attività precedentemente avviate.
- Fornire chiarimenti necessari a concludere attività già prese in carico.
- Acquistare un nuovo periodo di accesso.

Non può iniziare nuove attività riservate senza un piano valido.

### Punto di raccordo ancora aperto

**❓ La definizione di "attività già avviata" dipende dal futuro Booking Flow.**

Il piano UX stabilisce il principio di continuità, ma non inventa le condizioni tecniche o funzionali con cui una richiesta viene identificata come ancora aperta, conclusa oppure nuova.

---

# 20. Sezione Account

La sezione Account deve comprendere almeno quattro aree.

## 20.1 Profilo

- Username.
- Email.
- Numero di telefono.
- Dati personali necessari.
- Gestione delle credenziali.

## 20.2 Identità e sicurezza

- Metodi di accesso: Google, email/password e passkey, con gestione e recupero secondo la sezione 5.
- Stato verifica email e provenienza della verifica.
- Stato verifica telefono.
- Stato verifica identità SPID/CIE.
- Metodo di identità utilizzato, se già verificato.
- Azioni per completare le verifiche mancanti.
- Procedura sicura per modificare i dati verificati.

### Visualizzazione identità

Se l'identità non è stata verificata:

**"Identità non verificata"**

Azioni:

- Verifica con SPID.
- Verifica con CIE.

Se è stata verificata:

**"Identità verificata"**

Dettaglio:

- Metodo utilizzato: SPID oppure CIE.
- Eventuale data di verifica.

Non deve essere richiesto di completare l'altro metodo.

L'eventuale collegamento di un secondo metodo di identità è una funzionalità distinta e non necessaria nel primo rilascio.

## 20.3 Piano e comunicazioni

- Tipo di piano.
- Stato del piano.
- Canale attivo.
- Stato di associazione del canale.
- Periodo di validità.
- Prezzo e prossimo rinnovo, se applicabili.
- Cambio canale.
- Disdetta.

## 20.4 Pagamenti e fatturazione

L'Account deve offrire un punto di accesso a:

- Metodo di pagamento.
- Storico addebiti.
- Documenti di fatturazione disponibili.
- Dati di fatturazione.
- Eventuali pagamenti in sospeso.

**❓ I dettagli effettivi di questa sezione saranno definiti dal Piano Billing.**

La struttura Account non deve anticipare formati di fattura, procedure fiscali o provider specifici.

---

# 21. Continuità delle conversazioni

Questa funzionalità connette direttamente la UX all'orchestratore esistente.

### Obiettivo

Un utente deve essere riconosciuto come la stessa persona attraverso sessioni successive, anche dopo un riavvio del backend.

### Comportamento previsto

- WhatsApp riconosce la chat collegata.
- Telegram riconosce la chat collegata.
- Email riconosce il mittente e la conversazione associata.
- Il backend risolve sempre l'account applicativo.
- Le verifiche già completate rimangono disponibili.
- Il diritto di accesso viene verificato ogni volta che è necessario autorizzare nuove operazioni.
- Il metodo di verifica SPID o CIE non influenza la continuità della conversazione.

### Da migliorare

L'orchestratore non deve dipendere unicamente dalla memoria locale del processo.

Occorre rendere persistenti almeno:

- Relazione fra account e canali.
- Identificativi delle conversazioni.
- Stato necessario alla continuità.
- Identificativi dei messaggi già elaborati.
- Riferimenti alle attività applicative.

Questo non significa memorizzare indiscriminatamente ogni dato: la politica di conservazione andrà definita separatamente.

### Cambio canale

La modifica del canale commerciale non deve comportare la perdita dell'identità dell'utente o delle attività precedenti.

La migrazione dei dettagli conversazionali fra canali differenti richiederà una progettazione specifica, ma il contesto applicativo deve appartenere all'account, non al provider.

---

# 22. Gestione dei consumi e utilizzo corretto

Il modello è forfettario e temporale.

Non è previsto un limite commerciale visibile sul numero di richieste.

### Regole UX

- Nessun contatore di messaggi.
- Nessun saldo di token.
- Nessun cronometro della conversazione.
- Nessuna tariffazione del tempo passato a parlare con il bot.
- Nessuna distinzione economica fra richiesta semplice e complessa all'interno del periodo.

### Protezioni interne

Il sistema potrà misurare:

- Messaggi elaborati.
- Token dei modelli.
- Durata delle telefonate.
- Utilizzo dei provider.
- Frequenza delle richieste.
- Eventuali comportamenti abusivi.

Queste misure servono per analisi, capacità operativa, costi e tutela del servizio.

### Comportamento dell'agente

L'agente deve poter sostenere conversazioni naturali legate allo sport e all'organizzazione delle partite.

Se una conversazione diventa prolungata e completamente estranea al servizio, l'agente può ricondurla cortesemente al proprio ambito.

Non è necessario inventare un confine artificiale fra conversazioni o richieste al fine di conteggiarle.

La formulazione commerciale dell'accesso dovrà comunque essere coerente con le effettive condizioni di utilizzo corretto.

---

# 23. Gestione degli errori

| Evento | Comportamento UX richiesto |
|---|---|
| Email non ricevuta | Reinvio e correzione indirizzo |
| OTP email scaduto o errato | Nuovo tentativo nei limiti consentiti o reinvio |
| OTP email già usato | Nessun riutilizzo; indicazione di verifica già completata se pertinente |
| Google annullato o non disponibile | Ritorno alla scelta del metodo senza perdere il percorso |
| Google con email esterna non attestata | Verifica OTP Resend se l’indirizzo non è già verificato |
| Email già presente, Google non collegato | Accesso o recupero dell’account esistente prima del collegamento |
| Passkey annullata o indisponibile | Accesso alternativo; nessuna perdita del percorso |
| Rimozione dell’ultimo metodo di accesso | Richiesta di predisporre prima un’alternativa |
| OTP SMS scaduto | Possibilità di richiedere un nuovo codice |
| Numero già associato | Blocco o procedura di recupero sicura |
| SPID annullato | Ritorno al wizard senza perdere il percorso |
| CIE annullata | Ritorno al wizard senza perdere il percorso |
| SPID/CIE con sessione scaduta | Nuovo tentativo e possibilità di scegliere il metodo |
| SPID/CIE verificato ma account non aggiornato | Errore recuperabile, senza mostrare successo falso |
| Identità già associata | Blocco o recupero dell'account esistente |
| Utente cambia metodo SPID/CIE durante il tentativo | Nuovo percorso di verifica, con invalidazione sicura di quello precedente |
| Chat WhatsApp non collegata | Procedura di associazione |
| Chat associata ad altro account | Percorso sicuro di risoluzione |
| Bot Telegram sconosciuto | Invito a collegare l'account |
| Checkout abbandonato | Nessun piano attivo; selezioni conservate |
| Checkout con esito incerto | Attesa e verifica dello stato |
| Pagamento fallito | Percorso di recupero previsto dal Billing |
| Prova già utilizzata, anche con altro metodo SPID/CIE | Offerta senza nuova prova gratuita |
| Abbonamento scaduto | Blocco di nuove richieste e possibilità di riattivazione |
| Webhook duplicato | Nessuna doppia elaborazione visibile |
| AI temporaneamente indisponibile | Messaggio di servizio non disponibile, senza fingere una risposta reale |
| Canale non disponibile | Informazione chiara e alternativa autorizzata |
| Scadenza durante un'attività | Continuità delle operazioni già autorizzate secondo il futuro Booking Flow |

---

# 24. Catalogo delle schermate UX

| ID | Schermata | Componenti coinvolti |
|---|---|---|
| UX-01 | Creazione account con Google o email | Google Identity, backend, account MongoDB |
| UX-01A | Attivazione passkey facoltativa | WebAuthn, backend e interfaccia del dispositivo |
| UX-01B | Accesso con metodi già collegati | Google, passkey, email/password |
| UX-01C | Gestione e recupero accessi | Account, collegamenti e credenziali |
| UX-02 | Verifica email condizionale tramite OTP | Resend; saltabile quando attestata da Google |
| UX-03 | Inserimento telefono | Telnyx Verify |
| UX-04 | Dialog OTP | Telnyx Verify |
| UX-05 | Identità SPID/CIE | Wizard condiviso, adapter SPID, futura integrazione CIE |
| UX-05A | Autenticazione SPID | Adapter SPID |
| UX-05B | Autenticazione CIE | Entra con CIE, da integrare |
| UX-06 | Scelta Pass/Abbonamento | Sistema piani |
| UX-07 | Selezione canale | Catalogo canali |
| UX-08 | Collega WhatsApp | Wazzup |
| UX-09 | Collega Telegram | Telegram Bot |
| UX-10 | Conferma Email | Account verificato |
| UX-11 | Checkout Pass | Billing da definire |
| UX-12 | Checkout subscription | Billing da definire |
| UX-13 | Attivazione completata | Piano e autorizzazioni |
| UX-14 | Dashboard prova gratuita | Stato trial |
| UX-15 | Dashboard abbonamento | Stato subscription |
| UX-16 | Dialog disdetta | Piano e Billing |
| UX-17 | Pass in scadenza | Stato temporale |
| UX-18 | Accesso scaduto | Stato piano e agente |
| UX-19 | Verifiche Account | Wizard condiviso SPID/CIE |
| UX-20 | Gestione canale | Associazioni e cambi programmati |
| UX-21 | Metodi di pagamento | Billing da definire |
| UX-22 | Fatture e pagamenti | Billing da definire |
| UX-23 | Accesso negato al bot | Orchestratore e autorizzazioni |
| UX-24 | Ripresa percorso precedente | Navigazione applicativa |

---

# 25. Interventi di miglioramento raggruppati

## Priorità A — Collegamento dell'identità

Obiettivo: trasformare i test isolati in un sistema account coerente.

- [ ] Modello utente persistente.
- [ ] Registrazione e autenticazione applicativa.
- [ ] Verifica email tramite OTP Resend solo quando necessaria.
- [ ] Accesso Google e validazione lato server.
- [ ] Distinzione Gmail/Workspace ed email esterne nella verifica email.
- [ ] Collegamento sicuro Google agli account esistenti.
- [ ] Registrazione e accesso con passkey.
- [ ] Gestione e recupero dei metodi di accesso senza duplicare account.
- [ ] Ripresa delle verifiche persistenti dopo accesso Google o passkey.
- [ ] Persistenza dello stato di verifica email.
- [ ] Telnyx Verify collegato all'account.
- [ ] Persistenza del numero verificato.
- [ ] SPID collegato all'account.
- [ ] Integrazione CIE.
- [ ] Verifica e validazione dell'autenticazione CIE.
- [ ] Stato di identità verificata condiviso tra SPID e CIE.
- [ ] Vincolo di unicità dell'identità verificata indipendente dal metodo.
- [ ] Gestione di eventuali identità già associate.
- [ ] Wizard unico per onboarding e Account.
- [ ] Gestione uniforme degli errori e dei ritorni SPID/CIE.

## Priorità B — Collegamento dei canali

Obiettivo: assicurare che ogni comunicazione sia riconducibile a un utente reale.

- [ ] Associazione WhatsApp.
- [ ] Associazione Telegram.
- [ ] Gestione delle risposte Email.
- [ ] Persistenza delle associazioni.
- [ ] Normalizzazione dell'identità del mittente.
- [ ] Protezione, verifica e deduplicazione dei webhook.
- [ ] Gestione disconnessioni e ricollegamenti.

## Priorità C — Piani e diritti di accesso

Obiettivo: distinguere il possesso del canale dal diritto di utilizzo.

- [ ] Modello Pass temporaneo.
- [ ] Stato prova gratuita.
- [ ] Unicità della prova per identità verificata.
- [ ] Impossibilità di ripetere la prova passando da SPID a CIE o viceversa.
- [ ] Stato abbonamento.
- [ ] Scadenza temporale.
- [ ] Autorizzazione centralizzata.
- [ ] Cambio canale programmato.
- [ ] Disdetta.
- [ ] Gestione delle attività precedenti alla scadenza.

Le transizioni economiche dipenderanno dal Piano Billing.

## Priorità D — Orchestratore condiviso

Obiettivo: garantire comportamento coerente su tutti i canali.

- [ ] Persistenza delle conversazioni.
- [ ] Gestione idempotente dei messaggi.
- [ ] Controllo accessi prima dell'utilizzo dei tool.
- [ ] Collegamento fra conversazioni e account.
- [ ] Contesto condiviso indipendente dal provider.
- [ ] Gestione degli errori dei canali.
- [ ] Verifica end-to-end dell'agente su WhatsApp e Telegram.
- [ ] Integrazione delle chiamate di backup.
- [ ] Chiusura semantica delle chiamate.

Gli strumenti di prenotazione saranno sviluppati nel Piano Booking.

## Priorità E — UX commerciale

Obiettivo: rendere il servizio comprensibile e utilizzabile.

- [ ] Schermata scelta modalità.
- [ ] Schermata selezione canale.
- [ ] Wizard di associazione.
- [ ] Riepilogo Pass.
- [ ] Riepilogo subscription con trial.
- [ ] Conferma attivazione.
- [ ] Dashboard Account.
- [ ] Modifica canale.
- [ ] Disdetta.
- [ ] Gestione scadenza.
- [ ] Gestione degli errori e ritorni dai provider.

---

# 26. Test di accettazione UX

Il piano può essere considerato funzionalmente integrato quando sono verificati almeno questi scenari.

### Scenario 1 — Registrazione completa

Un nuovo utente si registra, riceve la mail Resend, verifica l'email tramite OTP, completa OTP Telnyx e raggiunge la home.

### Scenario 2 — Registrazione con telefono saltato

Un nuovo utente verifica l'email, salta il telefono, raggiunge la home e naviga senza errori.

### Scenario 3 — Verifiche da Account con SPID

Un utente già registrato accede ad Account, verifica il telefono, completa SPID e vede aggiornati gli stati senza ripetere verifiche già superate.

### Scenario 3A — Verifiche da Account con CIE

Un utente già registrato accede ad Account, verifica il telefono, completa CIE e vede aggiornato lo stesso stato di identità verificata previsto per SPID.

### Scenario 3B — Identità già verificata

Un utente già verificato con SPID non deve completare CIE per utilizzare Digital Mop e viceversa.

### Scenario 4 — Verifica richiesta durante il percorso

Un utente sceglie preferenze di gioco, viene indirizzato alle verifiche mancanti, seleziona SPID oppure CIE, completa la procedura e ritorna al percorso originale.

### Scenario 5 — Collegamento WhatsApp

Un utente autenticato collega la propria chat WhatsApp e viene riconosciuto correttamente nei messaggi successivi.

### Scenario 6 — WhatsApp non autorizzato

Un numero sconosciuto scrive al bot, ma non può invocare le funzioni riservate.

### Scenario 7 — Telegram autorizzato

Un utente collega Telegram, dispone di accesso valido e può utilizzare l'agente.

### Scenario 8 — Prova gratuita

Un utente verificato tramite SPID o CIE attiva la prova, seleziona un canale, completa il checkout da 0 € e vede scadenza e rinnovo futuro.

### Scenario 9 — Secondo account, stessa identità

Una persona che ha già utilizzato la prova gratuita non può ottenerne un'altra creando un nuovo account.

### Scenario 9A — Cambio metodo di verifica

Una persona che ha già utilizzato la prova tramite SPID non può ottenere una seconda prova utilizzando CIE. Deve valere anche il caso inverso.

### Scenario 10 — Disdetta prova

L'utente disdice prima del primo pagamento, mantiene l'accesso fino alla scadenza e non ha un rinnovo programmato.

### Scenario 11 — Pass scaduto

L'agente non accetta nuove attività riservate, ma mantiene le comunicazioni necessarie alle attività già avviate.

### Scenario 12 — Cambio canale

Un abbonato passa da WhatsApp a Telegram, collega Telegram e visualizza la data del cambio programmato.

### Scenario 13 — Persistenza

Dopo il riavvio del backend non vengono persi l'account, le verifiche, il metodo di verifica SPID/CIE, le associazioni dei canali, il piano e i riferimenti persistenti alle conversazioni.

### Scenario 14 — Ritorno da checkout

L'utente che proveniva da un percorso di prenotazione torna alle sue preferenze precedenti senza ricominciare da zero.

La prosecuzione effettiva della prenotazione resta oggetto del Piano Booking.

### Scenario 15 — CIE annullata o fallita

L'utente annulla l'autenticazione CIE o incontra un errore, ritorna al wizard e può riprovare con CIE oppure selezionare SPID senza perdere i dati già inseriti.

### Scenario 16 — Unicità dell'identità tra provider

Un utente che si presenta tramite SPID e successivamente tramite CIE viene riconosciuto come la stessa persona, evitando doppie identità applicative e duplicazione dei benefici commerciali.

### Scenari aggiuntivi — Google e passkey

| Scenario | Esito atteso |
|---|---|
| Nuovo account Gmail | Accesso Google validato; email verificata senza OTP; telefono e identità restano separati |
| Workspace attestato | Email verificata senza OTP solo con email verificata e dominio Workspace attestato |
| Google con email esterna | OTP Resend al primo bisogno di verifica; nessuna ripetizione ordinaria se la stessa email è già verificata |
| Token Google non valido | Nessuna sessione o verifica attribuita; possibilità di riprovare |
| Email già registrata | Nessun duplicato e nessuna fusione sulla sola coincidenza dell’email; collegamento dopo conferma dell’account esistente |
| Creazione passkey | Proposta facoltativa; conferma solo dopo registrazione persistente riuscita |
| Passkey saltata o annullata | Onboarding prosegue senza blocchi |
| Accesso con passkey | Stesso account e stessi stati; nessun nuovo OTP o SPID/CIE richiesto ordinariamente |
| Passkey assente sul dispositivo | Possibilità di usare Google o email/password già abilitati |
| Solo Google o passkey, senza SPID/CIE | Navigazione consentita ma funzioni di prenotazione ancora bloccate |
| Telefono non verificato | Google e passkey non sostituiscono l’OTP telefonico richiesto prima dell’uso riservato |
| Rimozione ultimo metodo | Richiesta di predisporre un’alternativa prima di rimuoverlo |
| Cambio credenziali o recupero | Conservazione di identità, storico, canali, piano e prova già utilizzata |
| Riavvio backend | Collegamenti Google, passkey e verifiche non vengono persi |


---

# 27. Dipendenze dai due piani futuri

## ❓❓❓ PIANO BOOKING — BLOCCO FUNZIONALE APERTO

**Da produrre separatamente.**

Questo piano dovrà definire:

- Modello delle richieste sportive.
- Flusso di selezione e ricerca.
- Stati e ciclo di vita di una richiesta.
- Attività dell'agente.
- Interazione con i centri sportivi.
- Gestione delle risposte.
- Conferme e cancellazioni.
- Criteri per distinguere attività nuove da attività già avviate.
- Comportamento durante e dopo la scadenza dell'accesso.
- Strumenti applicativi effettivamente invocabili dall'orchestratore.

**Contratto richiesto a questo piano:** poter sapere quando un utente intende avviare una nuova attività e quando sta proseguendo un'attività già autorizzata, senza introdurre un sistema di crediti per prenotazione.

## ❓❓❓ PIANO BILLING — BLOCCO FUNZIONALE APERTO

**Da produrre separatamente.**

Questo piano dovrà definire:

- Catalogo commerciale definitivo.
- Prezzi per canale.
- Durata definitiva dei Pass.
- Attivazione e gestione degli abbonamenti.
- Prova gratuita.
- Autorizzazioni di pagamento.
- Rinnovi.
- Scadenze.
- Pagamenti falliti.
- Cambi di prezzo e piano.
- Fatturazione.
- Documenti fiscali.
- Rimborsi e recesso.
- Comunicazioni economiche.
- Regole di sospensione e riattivazione.

**Contratto richiesto a questo piano:** fornire uno stato affidabile e aggiornato del diritto di utilizzo dell'utente, con le relative date, condizioni economiche e informazioni presentabili nell'interfaccia.

---

# 28. Risultato finale atteso

Digital Mop dovrà offrire un'esperienza nella quale:

- La registrazione è semplice, con Google oppure email.
- La verifica email viene richiesta soltanto quando necessaria.
- Le passkey rendono rapido l’accesso successivo e rimangono facoltative.
- Il metodo di accesso non sostituisce l’identità SPID/CIE né la verifica telefonica.
- La verifica iniziale del telefono non blocca la navigazione.
- La verifica d'identità viene richiesta solo quando necessaria per le funzioni riservate.
- L'utente può scegliere liberamente SPID oppure CIE.
- I due metodi di identificazione garantiscono lo stesso accesso funzionale quando soddisfano i requisiti di sicurezza.
- Le verifiche vengono completate una volta e riutilizzate.
- La stessa persona viene riconosciuta indipendentemente dal provider utilizzato.
- Il cliente conosce i costi prima dell'attivazione.
- Può scegliere accesso temporaneo o mensile.
- La prova gratuita è limitata a una per identità verificata, non una per metodo SPID/CIE.
- Il canale di comunicazione è effettivamente collegato all'account.
- WhatsApp, Telegram ed Email utilizzano lo stesso agente.
- Nessun utente sconosciuto può utilizzare gratuitamente le operazioni riservate.
- Il backup telefonico è parte integrante del servizio.
- Il consumo è basato sul periodo di accesso, non sul numero di messaggi o prenotazioni.
- L'utente può gestire e disdire il piano autonomamente.
- Le operazioni già prese in carico non vengono interrotte arbitrariamente alla scadenza.
- L'infrastruttura sperimentata nella demo diventa parte di un sistema coerente e persistente.

**Il presente piano definisce l'ingresso, l'identificazione tramite SPID o CIE, l'abilitazione commerciale, la comunicazione e la gestione dell'accesso all'agente Digital Mop. Non definisce il motore di prenotazione né quello di fatturazione.**


## Riferimenti per l’integrazione Google e passkey

- [Google — Verifica dell’ID token lato server](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token): verifica della risposta e distinzione fra email Gmail, Workspace ed email esterne.
- [Google — Introduzione all’implementazione server delle passkey](https://developers.google.com/identity/passkeys/developer-guides/server-introduction).
- [W3C — Web Authentication](https://www.w3.org/TR/webauthn/): credenziali a chiave pubblica e verifica biometrica locale.
