# Digital Mop — Piano UX integrato

## Allineamento condiviso — 18 ottobre 2026

Questa revisione integra i nove piani consegnati nello ZIP e il [mockup Figma corrente](https://www.figma.com/design/LKEJGcZxs9jXnPRx3wrBE5/cecampo?node-id=2-267). È una specifica, non una dichiarazione di implementazione del repository Windows, non disponibile in questa sessione.

- **Voce:** Telnyx AI Assistant gestisce telefonia, LLM vocale, STT/TTS e turni; il backend conserva autorizzazioni, tool, prenotazioni, attese e contabilità. GPT-Live, sideband e bridge audio verso OpenAI sono dismessi dal percorso target.
- **WhatsApp:** Business Platform tramite Telnyx; Wazzup24 non è più una dipendenza attiva. Telegram resta diretto. L'orchestratore testuale OpenAI non è automaticamente dismesso dalla migrazione voce.
- **Ruoli:** clienti in PWA/WhatsApp/Telegram; strutture tramite contatti autorizzati, anche senza account. Voce esclusiva delle strutture. Email verificata per comunicazioni di servizio; conversazioni AI via email richiedono un'integrazione distinta, non provata dal solo invio Resend.
- **Crediti:** niente Pass, abbonamenti o budget per richiesta scelto dall'utente. Bonus unico per identità; lavoro operativo distinto da garanzia, penale e quota in prestito. Le richieste accettate vengono accompagnate fino a un esito, non necessariamente a una prenotazione riuscita.
- **UX:** Prenota / Storico / Account; campi selezionabili e riordinabili nella ricerca; prezzo per campo per 90 minuti; Indoor/Outdoor. Nessuna modifica retroattiva agli snapshot.
- **Evidenza:** i runbook del 17–18 ottobre documentano chiamate Telnyx, inizializzazione dinamica e tool demo, oltre a una consegna WhatsApp reale. Non provano gate voce pre-risposta, persistenza, contabilizzazione definitiva o prenotazioni reali.

I nomi dei nove file sono conservati per compatibilità. I termini storici nei filename non indicano funzionalità da reintrodurre. Le scelte di sicurezza e dominio prevalgono sui placeholder del mockup; le discrepanze sono riportate nelle sezioni dedicate.

## Registrazione, verifica identità, canali e accesso al servizio a crediti

**Versione:** 2.0 — Telnyx, wallet e mockup del 18 ottobre 2026  
**Progetto:** Prenotazione Campi / Digital Mop  
**Stato:** Specifica funzionale UX, non ancora definitiva  
**Ambito:** Esperienza utente, raccordo con le integrazioni esistenti, interventi necessari e dipendenze.

---

# 1. Obiettivo del piano

Registrazione con Google o email/password, email verificata, passkey facoltativa, telefono OTP e identità SPID oppure CIE sono stati distinti. L'utente può navigare e preparare la ricerca senza aver già completato telefono e identità; prima dell'invio il server verifica tutti i requisiti.

Il servizio usa crediti a consumo con bonus iniziale unico per identità. Non vende periodi di accesso: Pass, trial temporali, abbonamenti, rinnovi e cambi canale programmati sono rimossi. I canali si collegano e si scelgono liberamente secondo disponibilità e autorizzazioni, senza canoni di attivazione.

SPID e CIE sono alternativi. Google e passkey non sostituiscono la verifica d'identità né l'OTP del telefono. I gestori struttura seguono il piano whitelist separato e non devono registrarsi come clienti.

# 2. Confini del documento

Inclusi: account, accesso e recupero, verifiche, navigazione, linking, autorizzazioni, stato del wallet e raccordo con Prenota/Storico/Account.

Il piano funzionale booking già incluso in questo pacchetto definisce ricerca, attese, controproposte, concorrenza, conferma e disdette. Non è più un progetto interamente da definire.

Il piano wallet e la patch completamento definiscono consumo operativo, garanzia, penali e quota piattaforma. Restano da deliberare prezzi delle ricariche, conversione economica definitiva, politica prestito, provider pagamento e dettagli fiscali. Il placeholder Ricarica non è un checkout funzionante. Nessun supporto ai gruppi WhatsApp è assunto.

# 3. Inventario dei componenti già presenti

Gli stati seguenti derivano dai documenti e collaudi consegnati, non da un'ispezione del repository attuale.

| Componente | Evidenza | Lavoro da verificare/completare |
|---|---|---|
| Resend / OTP email | Modulo demo descritto come testato | Persistenza, associazione account e recupero |
| Google e passkey | Decisione UX e schermate | Implementazione e test di autenticazione |
| Telnyx Verify | OTP SMS provato | Stato account persistente e cambio numero |
| SPID | Testenv e callback provati | Integrazione account e percorso produzione |
| CIE | Percorso disegnato | Integrazione separata, non dichiarata operativa |
| WhatsApp Telnyx | Provisioning e outbound ricevuto | Adapter, linking e gate applicativi da ricollaudare |
| Telegram | Demo funzionante | Hardening, MongoDB e conferma PWA |
| Orchestratore testuale OpenAI | Predisposto nella demo | Persistenza, tool e autorizzazioni; non sostituito automaticamente |
| Telnyx Voice AI | Inbound/outbound, init e tool demo documentati | Whitelist pre-answer, lifecycle, costi, booking reale |
| MongoDB / wallet / booking | Specifiche presenti | Implementazione reale da accertare nel repository |
| Pagamenti ricariche | Placeholder Figma | Scelte e implementazione Billing |

Non rimuovere OpenAI dal testo solo perché GPT-Live è stato dismesso dalla voce. Non equiparare una callback SPID demo all'abilitazione di produzione.

# 4. Flusso UX generale

| Fase | Percorso |
|---|---|
| Accesso | Google oppure email/password; passkey se già associata |
| Registrazione | Condizioni necessarie, email verificata da Google nei casi ammessi oppure OTP Resend |
| Passkey | Proposta facoltativa; interfaccia nativa browser/sistema |
| Telefono | OTP Telnyx; rinviabile durante la sola navigazione |
| Home | Prenota con bozza conservata, filtri e campi selezionabili |
| Primo invio | Wizard dei requisiti mancanti, telefono e SPID oppure CIE |
| Bonus | Accredito unico e idempotente per identità |
| Canali | WhatsApp/Telegram collegabili dall'Account; PWA sempre punto di gestione |
| Ammissione | Controllo crediti e garanzia, riepilogo e condizioni |
| Invio | Azione esplicita dell'utente, snapshot e deduplica |
| Continuità | Stato in Storico e notifiche sui canali autorizzati |

Non inviare automaticamente una richiesta al ritorno da login, OTP o provider identità. Non ripetere verifiche già valide senza una ragione prevista dalla policy.

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
- Account, verifiche SPID/CIE, canali, wallet, storico e bonus già assegnato rimangono gli stessi dopo il collegamento.
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

"Lo useremo per le verifiche di sicurezza e confermare il possesso del recapito; gli aggiornamenti dell’agente arrivano sui canali collegati."

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

### Unicità del bonus iniziale

Il bonus iniziale è assegnato una sola volta per persona verificata.

La stessa persona non deve poter ottenere:

- Un bonus con SPID.
- Un secondo bonus con CIE.
- Ulteriori bonus cambiando email o account.

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

# 9. Crediti iniziali e ammissione al servizio

## UX-06 — Crediti iniziali e ammissione

Nessuna selezione Pass/Abbonamento. Dopo identità verificata assegnare `INITIAL_FREE_CREDITS` una volta, con controllo atomico e ledger. Mostrare il saldo realmente registrato, non quello del mockup.

Prima di una nuova richiesta valutare disponibilità operativa e garanzia secondo i piani dedicati. Saldo insufficiente: spiegazione e accesso a ricariche quando implementate. Le richieste già accettate e la gestione delle disdette non vengono abbandonate per saldo zero.

# 10. Scelta del canale dell'agente

## UX-07 — Come ti contattiamo

Account → Come ti contattiamo mostra canali, stato del collegamento e preferenza principale. WhatsApp usa Telnyx; Telegram il bot diretto. Il nome del provider non serve nella UI ordinaria.

Il cliente usa PWA, WhatsApp e Telegram per aggiornamenti e decisioni. Email verificata è disponibile per comunicazioni di servizio; ricezione email e risposte AI non sono provate da Resend e richiedono un modulo esplicito prima di essere offerte. Nessun backup telefonico AI al cliente. Il numero OTP resta un requisito distinto.

Il cambio della preferenza ha effetto per le notifiche successive, non modifica snapshot o autorizzazioni già registrate. Non revoca altri canali, non duplica richieste e non richiede rinnovo o cambio piano. Se un canale non è raggiungibile, usare solo alternative autorizzate e mostrare la decisione nella PWA.

# 11. Collegamento dell'account al canale

## UX-08 — WhatsApp

PWA autenticata genera challenge monouso; apre chat sul numero business configurato con codice precompilato; l'utente lo invia. Il backend autentica e normalizza l'evento Telnyx, risolve il challenge, verifica conflitti e consuma il codice atomicamente. La PWA attende lo stato persistente e poi mostra collegato. Non basta aprire WhatsApp o ricevere una conferma API outbound.

Il formato breve `DM-WA-XXXXXX` è illustrativo. Applicare entropia, scadenza e controlli del piano linking. Il telefono verificato via SMS non collega automaticamente WhatsApp. Stati: non collegato, attesa, collegato, scaduto, revocato, errore/conflitto. Consentire rigenerazione e scollegamento autenticato.

## UX-09 — Telegram

Deep link → Avvia bot → stato claimed → **conferma nella PWA** → collegato. In produzione il passaggio finale non può essere saltato per imitare il prototipo. Username/nome aiutano a riconoscere l'account; l'ID numerico viene dal webhook verificato. Revoca e scadenza seguono il piano hardening.

## UX-10 — Email e ruoli

L'email deve essere verificata. La sua modifica richiede nuova verifica. Nessuna semplice email in ingresso autorizza operazioni sensibili. I contatti struttura usano binding amministrativi separati e non devono completare il linking cliente; non confondere revoca cliente con revoca struttura.

# 12. Ricariche e ripresa del percorso

## UX-11/12 — Ricariche e ritorno al percorso

Eliminati checkout Pass e subscription. Il mockup mostra «Le ricariche arrivano presto»: finché il Billing non è implementato non simulare acquisti come reali. Una futura ricarica aggiorna il wallet solo dopo esito backend verificato e idempotente, mai sulla sola pagina di ritorno.

Esito incerto o pagamento fallito non crea crediti né cancella prenotazioni. Conservare bozza e return path sicuro. Prezzi, pacchetti, ricevute e provider restano da definire.

# 13. Attivazione del servizio

## UX-13 — Stato pronto

Mostrare le verifiche completate, i canali collegati e il saldo. «Pronto per inviare una richiesta» non equivale a «campo prenotato». Nessuna attivazione commerciale temporale.

Il backend applica nuovamente requisiti e ammissione all'invio. La richiesta nasce solo dopo conferma esplicita del riepilogo; durata, orario, ambiente, lista ordinata, prezzi e condizioni vengono congelati.

# 14. Orchestratore AI condiviso

L'orchestratore testuale riceve attori già risolti da PWA, Telegram e WhatsApp Telnyx. La voce viene eseguita dall'AI Assistant Telnyx e richiama tool backend. Entrambi usano gli stessi servizi deterministici per booking, whitelist, wallet e audit.

Non creare un motore prenotazioni per ogni canale. Lo stato appartiene a richiesta e account/contatto autorizzato; le sessioni del provider non sono il database di dominio. Endpoint e modelli vanno ricavati dalla configurazione reale.

### Contratto della voce Telnyx

Usare l'assistente Single-prompt già configurato, con modalità inbound/outbound e contesto dinamico; non duplicare assistenti per sostituire le regole del backend. Gli endpoint collaudati nel runbook sono `POST /webhooks/telnyx/assistant/init` e `POST /webhooks/telnyx/assistant/tools/record-structure-response`. Il secondo raccoglie un esito demo: non equivale a confermare una prenotazione.

L'inizializzazione verifica firma Ed25519, timestamp anti-replay, assistant e canale, quindi restituisce `dynamic_variables`. Il backend genera il `call_token`, ne conserva scadenza e associazione a chiamata, ruolo, struttura e tentativo; il token non è una credenziale del cliente né un'autorizzazione generale. I Webhook Tools usano l'autenticazione dedicata configurata nel runbook; non presumere che abbiano automaticamente lo stesso contratto di firma dell'inizializzazione. Controllare segreto, token, stato, ambito e idempotenza a ogni tool. Non loggare segreti o token.

Il tool produce dati strutturati validati dal motore di dominio. La risposta HTTP positiva, l'hangup o il saluto del modello non dimostrano da soli una prenotazione confermata. Correlare gli identificativi disponibili senza confondere ID TeXML, call control, conversazione e tentativo. Gli eventi di fine chiamata e costo vanno integrati e collaudati separatamente.

**Gate inbound ancora da collaudare:** il routing diretto numero → AI Assistant del test non prova il rifiuto prima della risposta. Il webhook di inizializzazione non va considerato automaticamente un gate pre-answer. Verificare il percorso Telnyx/TeXML supportato che controlli la whitelist prima di rispondere o avviare AI; se manca questa prova, la voce pubblica resta non pronta. Nessun fallback statico o saluto deve aggirare il gate. Per outbound ricontrollare il contatto autorizzato prima di chiamare. Non ripristinare GPT-Live per risolvere il gate.

# 15. Autorizzazione all'utilizzo dell'agente

| Operazione | Controlli backend |
|---|---|
| Navigazione e bozza | Sessione quando richiesta; nessuna prenotazione implicita |
| Linking cliente | Sessione reale, proprietà account, scadenza/conflitti/rate limit |
| Nuova richiesta | Email, telefono e identità verificati, canale valido, stato account, condizioni, ammissione wallet |
| Decisione su richiesta | Identità/ruolo autorizzati, proprietà, versione e stato della decisione |
| Contatto struttura | Binding verificato, ambito e permesso; niente account cliente |
| Tool voce | Autenticazione tool, call token valido, contatto e ambito, stato e idempotenza |
| Sconosciuto | Nessuna AI/tool; eventuale istruzione statica limitata sui canali testuali |
| Revocato | Blocco delle operazioni relative all'autorizzazione revocata |

Il linking può essere preparato da un account autenticato prima di SPID/CIE; non concede permessi di prenotazione. Prima di abilitare chat AI senza identità completa definire una policy esplicita: nel frattempo solo istruzioni statiche per completare i requisiti. Mai dedurre permessi dal prompt o dallo stato grafico.

# 16. Telefonia AI riservata alle strutture

La telefonia AI è riservata alle strutture, inbound e outbound, secondo la patch whitelist. Nessun backup telefonico al cliente e nessun inoltro personale permanente.

Telnyx Verify per SMS è separato dall'AI Assistant e non autorizza telefonate al cliente. Le schermate 014/060 ancora riferite a chiamate al cliente sono residui del prototipo da correggere; non costituiscono una nuova decisione di prodotto. Il test inbound generale del runbook non modifica questa policy e non prova il gate pre-risposta.

# 17. Esperienza con il bonus iniziale

## UX-14 — Bonus iniziale

Il bonus è un accredito una tantum, non un trial di sette giorni. Mostrare saldo e movimento Bonus; nessun countdown, primo rinnovo, carta obbligatoria o addebito futuro dedotto da questa concessione. Cambiare email, SPID/CIE o canale non assegna un altro bonus.

# 18. Esperienza nel portafoglio

## UX-15 — Portafoglio e utilizzo

Il wallet sostituisce la dashboard abbonamento. Disponibile e prestito sono distinti nella card; movimenti filtrabili per consumo, garanzia, ricarica e bonus. Info «Come si usano i crediti», «La ricerca va avanti», «Garanzie e disdette» aprono spiegazioni brevi.

Prestito solo per eventuali penali: non viene consumato per cercare il campo. Garanzia, disponibilità operativa e quota sostenuta dalla piattaforma sono voci differenti. Importi e politica prestito non si deducono dai valori demo.

# 19. Revoca canale, saldo insufficiente e disdetta

## UX-16/17/18 — Revoca canale, saldo insufficiente e disdetta prenotazione

Non esistono disdetta abbonamento e scadenza Pass. Revocare un canale non cancella account o prenotazioni. Saldo insufficiente blocca nuove ammissioni secondo policy, non l'accesso allo storico o la gestione di una disdetta.

La disdetta prenotazione è un processo del Booking: conferma della richiesta, contatto struttura, eventuale recupero e riconciliazione; nessuna cancellazione immediata solo perché premuto un pulsante. Condizioni congelate e timestamp della richiesta determinano il preavviso.

# 20. Sezione Account

Struttura della reference 004/019:

| Voce | Contenuto |
|---|---|
| Crediti e ricariche | Disponibile, prestito distinto, movimenti e dettaglio |
| La tua posizione | Indirizzo abituale e raggio massimo 1–100 km |
| Come ti contattiamo | Canali collegati, scelta principale, associazione/revoca |
| Dati, sicurezza e fatturazione | Profilo, verifiche, accessi e dati fiscali |

Nessuna lista Preferiti campi nell'Account; la ricerca si precompila dall'ultima selezione compatibile. Mostrare email, telefono e identità come verifiche separate; modifica email/telefono invalida lo stato del nuovo recapito finché verificato. Conservare SPID/CIE come unico requisito alternativo, non obbligare entrambi.

Gestire Google, email/password e passkey, recupero e divieto di rimuovere l'ultimo metodo senza alternativa. Non acquisire impronte nell'app. I dati fiscali e documenti sono esposti solo se disponibili dal Billing. «Esplora il prototipo» è una funzione demo, non navigazione prodotto.

# 21. Continuità delle conversazioni

Questa funzionalità connette direttamente la UX all'orchestratore esistente.

### Obiettivo

Un utente deve essere riconosciuto come la stessa persona attraverso sessioni successive, anche dopo un riavvio del backend.

### Comportamento previsto

- WhatsApp riconosce la chat collegata.
- Telegram riconosce la chat collegata.
- Email invia notifiche al recapito verificato; conversazione in ingresso solo con integrazione e controlli specifici.
- Il backend risolve l’account cliente oppure il contatto struttura con il relativo ambito.
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

La modifica del canale preferito non deve comportare la perdita dell'identità dell'utente o delle attività precedenti.

La migrazione dei dettagli conversazionali fra canali differenti richiederà una progettazione specifica, ma il contesto applicativo deve appartenere all'account, non al provider.

---

# 22. Gestione dei consumi e utilizzo corretto

Il modello è a consumo del lavoro effettivo. Mostrare crediti e movimenti comprensibili; token e componenti provider appartengono alla reportistica tecnica. Nessun budget selezionabile.

Prima dell'ammissione controllare saldo e garanzia atomicamente. Dopo l'accettazione mantenere la continuità fino a un esito, senza consumare garanzia/prestito come risorse operative e senza portare il saldo operativo sotto zero. L'eccedenza è quota piattaforma. Attesa senza attività non produce consumo.

L'agente mantiene il proprio ambito sportivo; protezioni antiabuso e anti-loop restano nel backend. Non trasformare un errore tecnico in un esito negativo inventato.

# 23. Gestione degli errori

| Evento | Comportamento |
|---|---|
| OTP email/SMS errato o scaduto | Riprova/reinvio nei limiti server; nessuno stato verificato anticipato |
| Google/passkey annullati | Metodo alternativo e bozza conservata |
| Email già presente | Nessun merge automatico; recupero/collegamento sicuro |
| SPID/CIE annullato o fallito | Ritorno wizard, nessuna falsa verifica |
| Identità già associata | Recupero controllato, nessun nuovo bonus |
| Codice WhatsApp/link Telegram scaduto | Rigenerazione autenticata, invalidazione precedente |
| Link di altro account | Conflitto senza riassegnazione né divulgazione |
| Pagamento incerto | Riconciliazione; niente accredito ottimistico |
| Saldo insufficiente | Blocco nuove ammissioni, continuità richieste esistenti |
| Canale indisponibile | PWA e alternativa autorizzata; nessun backup telefonico cliente |
| AI o tool in errore | Stato recuperabile, nessuna conferma inventata |
| Evento duplicato | Nessun doppio bonus, link, richiesta o addebito |
| Sessione scaduta | Nuovo accesso e bozza ripresa, mai invio automatico |
| Revoca durante operazione | Ricontrollo permessi e riconciliazione dell'effetto già avviato |

# 24. Catalogo delle schermate UX

| Area Figma | Schermate e stati da integrare |
|---|---|
| 001–022 | Prenota, Indoor/Outdoor, Storico, Account, Crediti, riepilogo, attesa, stato vuoto, posizione e Admin base |
| 023–033 | Accesso, errori, sessione scaduta, Google/passkey, recupero password |
| 034–041 | Registrazione, verifica email e ritorno alla home; adattare OTP alla decisione applicativa |
| 042–056 | Telefono e identità: inserimento, OTP, errori, SPID/CIE e risultato |
| 057–066 | Profilo/sicurezza, metodi accesso, canali, linking e revoca |
| 067–079 | Ricerca, decisioni, conferma, riconciliazione e interruzione |
| 080–085 | Disdetta e recupero con esito noto o da verificare |
| 086–094 | Crediti, garanzie, saldo insufficiente, quota piattaforma |
| Admin | Login riservato, strutture, wizard e audit |

Gli ID UX storici sono conservati ove utili, ma i vecchi checkout e dashboard subscription sono sostituiti. Le numerazioni Figma sono riferimenti alla lettura del 18/10, non route applicative. La reportistica agenti rimane un modulo separato.

# 25. Interventi di miglioramento raggruppati

1. Verificare stato reale del repository e non ricostruire integrazioni funzionanti.
2. Persistenza account, verifiche e identità canonica; Google/passkey e recupero sicuro.
3. WhatsApp Telnyx con normalizzazione, firma, linking e migrazione; Telegram con conferma PWA.
4. Risoluzione attore cliente/struttura, ambiti e revoca prima di AI/tool.
5. Wallet, bonus idempotente, ammissione e quota piattaforma; nessuna subscription.
6. UI Prenota/Storico/Account e wizard riutilizzabile, ritorno alla bozza senza invio automatico.
7. Voce Telnyx esclusiva strutture con gate pre-answer collaudato e tool di dominio.
8. Billing ricariche soltanto dopo definizione dei contratti e prezzi; placeholder esplicito fino ad allora.
9. Collaudo end-to-end con provider reali e simulazioni separati.

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

### Scenario 8 — Bonus iniziale

Identità verificata: bonus unico nel ledger e saldo aggiornato. Nessun checkout da 0 €, trial, scadenza o rinnovo.

### Scenario 9 — Secondo account, stessa identità

La stessa identità non ottiene un secondo bonus aprendo un nuovo account.

### Scenario 9A — Cambio metodo di verifica

SPID dopo CIE e CIE dopo SPID non duplicano identità o bonus.

### Scenario 10 — Assenza di rinnovi

Non esiste una prova temporale da disdire. Verificare che i menu non espongano disdetta trial o rinnovo.

### Scenario 11 — Saldo insufficiente

Non esiste uno stato Pass scaduto. A saldo insufficiente bloccare nuove ammissioni mantenendo richieste accettate e gestione disdette.

### Scenario 12 — Cambio canale

Il cliente passa da WhatsApp a Telegram già collegato; preferenza aggiornata senza rinnovi, data programmata o duplicazione delle richieste.

### Scenario 13 — Persistenza

Riavvio: account, verifiche, canali, wallet, bonus e riferimenti di dominio rimangono disponibili.

### Scenario 14 — Ritorno da checkout

Il ritorno dalla ricarica riprende la bozza; nessun credito senza esito server verificato e nessun invio automatico.

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
| Cambio credenziali o recupero | Conservazione di identità, storico, canali, wallet e bonus già assegnato |
| Riavvio backend | Collegamenti Google, passkey e verifiche non vengono persi |


---

# 27. Dipendenze dai piani coordinati

Booking, wallet, completamento richieste, whitelist, linking WhatsApp, hardening Telegram, Admin e reportistica sono già descritti nei documenti di questo pacchetto. Usarli come specifiche coordinate, evitando duplicazioni.

Resta separato il piano Billing: ricariche, prezzi, pagamenti, documenti fiscali e recupero eventuale del prestito. La verifica dell'integrazione provider reale precede il rilascio; il mockup non determina credenziali, tariffe o sicurezza.

# 28. Risultato finale atteso

Un account unico conserva verifiche, canali, crediti e richieste. La navigazione iniziale è libera; l'invio richiede verifiche e ammissione. Canali liberamente selezionabili, voce solo alle strutture, nessun Pass/abbonamento. Il backend mantiene la responsabilità delle decisioni anche quando la conversazione vocale è gestita da Telnyx.

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


## Fonti di integrazione già richiamate dal piano

- [Google: verifica ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [WebAuthn](https://www.w3.org/TR/webauthn-3/)

Le regole di accesso sono preservate dal piano caricato; verificarne l'implementazione contro le versioni utilizzate, senza dedurre sicurezza dalle schermate.
