# Digital Mop — Piano di implementazione del modulo Admin / Gestione Strutture

**Stato:** Piano funzionale e tecnico  
**Ambito:** Amministrazione interna Digital Mop  
**Obiettivo:** Consentire agli amministratori di censire e gestire le strutture sportive e fornire agli agenti AI tutte le informazioni operative necessarie per le prenotazioni.

---

# 1. Obiettivi e responsabilità

Il modulo Admin costituisce il punto centrale di configurazione delle strutture sportive utilizzate da Digital Mop.

Deve consentire di:

1. Autenticare un amministratore autorizzato.
2. Creare, modificare, sospendere e archiviare strutture sportive.
3. Registrare indirizzi e dati geografici delle strutture.
4. Gestire uno o più campi appartenenti a ogni struttura.
5. Configurare la tipologia e il prezzo per 90 minuti di ciascun campo.
6. Registrare i recapiti delle strutture.
7. Stabilire l'ordine di preferenza dei canali di contatto.
8. Definire le fasce orarie nelle quali ciascun canale può essere utilizzato.
9. Configurare il termine minimo di preavviso per una disdetta gratuita.
10. Rendere i dati accessibili all'orchestratore AI attraverso servizi backend controllati.
11. Visualizzare le informazioni sulle disponibilità raccolte progressivamente dagli agenti.
12. Conservare lo storico delle modifiche amministrative.

Il modulo non deve diventare un secondo sistema di prenotazione.

**Separazione delle responsabilità**

- **Admin:** definisce quali strutture e campi esistono e le relative regole operative.
- **Orchestratore AI:** utilizza queste informazioni per interagire con utenti e strutture.
- **Motore prenotazioni:** gestisce il flusso di prenotazione già stabilito nel progetto.
- **Calendario interno:** conserva le disponibilità rilevate e le prenotazioni gestite da Digital Mop.
- **Sistema crediti:** gestisce consumi, garanzie ed eventuali penali in crediti.

Queste responsabilità devono rimanere separate anche nel codice.

# 2. Architettura generale

## 2.1 Componenti già presenti nel progetto

L'implementazione dovrà integrarsi nell'architettura esistente:

- Node.js ed Express per le API.
- MongoDB per la persistenza.
- Docker per l'ambiente applicativo.
- Orchestratore AI centralizzato.
- Adapter Telegram.
- Integrazione WhatsApp attraverso Wazzup.
- Telnyx per telefonia e servizi SMS.
- Resend per email.
- Flusso di verifica dell'identità mediante SPID/CIE per gli utenti ordinari.

Non è necessario creare un secondo backend amministrativo.

## 2.2 Organizzazione applicativa proposta

Aggiungere al backend esistente i seguenti moduli logici:

- `admin-auth`: autenticazione, sessioni e permessi.
- `structures`: anagrafica delle strutture.
- `fields`: gestione dei singoli campi.
- `structure-contacts`: recapiti, priorità e reperibilità.
- `structure-policies`: condizioni operative e cancellazioni.
- `admin-audit`: tracciamento modifiche.
- `structure-directory`: accesso controllato alle informazioni utilizzabili dagli agenti.

Questi moduli potranno essere organizzati in cartelle dedicate all'interno del progetto esistente.

L'orchestratore AI non dovrà accedere direttamente alle collection MongoDB, ma utilizzare servizi applicativi che restituiscano dati già validati.

## 2.3 Interfaccia amministrativa

Prevedere un'interfaccia web riservata, separata dall'interfaccia utilizzata dagli utenti.

Percorso indicativo:

`/admin`

L'interfaccia dialoga con le API protette `/admin/api/...`.

La tecnologia frontend potrà essere scelta in base allo stack del repository: non è necessario introdurre un framework aggiuntivo soltanto per questa funzionalità.

---

# 3. Autenticazione amministrativa

## 3.1 Accesso

Flusso:

1. L'amministratore apre `/admin`.
2. Se non autenticato, viene mostrata la schermata di login.
3. Inserisce email e password.
4. Il backend verifica le credenziali.
5. Se configurato, viene richiesto il secondo fattore.
6. Il backend crea una sessione amministrativa.
7. L'utente viene indirizzato alla dashboard.

Per la demo il primo account può essere creato tramite uno script di inizializzazione.

Non deve esistere una registrazione pubblica degli amministratori.

## 3.2 Autorizzazioni

Introdurre il ruolo `admin`, distinto dal normale utente Digital Mop.

Le verifiche devono essere eseguite dal backend e non soltanto dall'interfaccia.

Un utente verificato con SPID o CIE non acquisisce automaticamente permessi amministrativi.

## 3.3 Sicurezza

Implementare:

- Password memorizzate esclusivamente mediante hashing sicuro.
- Sessioni revocabili.
- Cookie `HttpOnly`, `Secure` in HTTPS e politica `SameSite` appropriata.
- Protezione CSRF per le operazioni autenticate con cookie.
- Rate limiting sul login.
- Scadenza delle sessioni inattive.
- Logout effettivo lato server.
- Blocco temporaneo o rallentamento dei tentativi ripetuti.
- Controllo dei permessi su ogni endpoint.
- Nessuna credenziale hardcoded nel repository.
- Secondo fattore TOTP, preferibilmente già dalla demo.

Le credenziali e i token amministrativi non devono mai essere passati all'orchestratore AI.

## 3.4 Account amministrativi

Collection proposta: `admin_users`.

Campi principali:

- `id`
- `email`
- `passwordHash`
- `role`
- `status`
- `mfaEnabled`
- `createdAt`
- `updatedAt`
- `lastLoginAt`

Per la prima versione è sufficiente il ruolo `admin`; la struttura deve comunque permettere in futuro l'aggiunta di operatori con permessi ridotti.

---

# 4. Dashboard amministrativa

## 4.1 Schermata principale

Dopo il login, l'amministratore visualizza:

- Numero totale delle strutture.
- Numero delle strutture attive.
- Numero delle strutture sospese.
- Numero totale dei campi.
- Strutture prive di configurazione completa.
- Strutture senza recapiti utilizzabili.
- Ultime strutture create o modificate.

L'elenco principale deve avere:

- Nome struttura.
- Comune.
- Indirizzo.
- Numero di campi.
- Tipologie disponibili.
- Stato.
- Data dell'ultima modifica.
- Azioni rapide.

## 4.2 Ricerca e filtri

Ricerca per nome, comune e indirizzo.

Filtri per:

- Stato struttura.
- Tipologia di campo: 5, 7, 9, 11.
- Strutture con canali di contatto mancanti.
- Strutture con configurazione incompleta.

Possibilità di ordinare per nome, data di creazione e ultimo aggiornamento.

## 4.3 Operazioni disponibili

Dalla dashboard:

- Creare una struttura.
- Aprire una struttura esistente.
- Modificarla.
- Duplicare eventualmente una configurazione in una fase successiva.
- Sospenderla.
- Riattivarla.
- Archiviarla.

L'archiviazione non deve eliminare prenotazioni storiche o informazioni necessarie per audit e contabilità.

---

# 5. Flusso di creazione struttura

La creazione avverrà tramite una procedura guidata.

**Passaggi:**

1. Anagrafica.
2. Campi.
3. Contatti.
4. Preferenze e orari di reperibilità.
5. Condizioni di disdetta.
6. Riepilogo e attivazione.

La procedura deve permettere di salvare una bozza incompleta e riprendere la compilazione successivamente.

## 5.1 Stati della struttura

Prevedere quattro stati:

**Bozza**

La struttura è in fase di configurazione. Non può essere utilizzata dagli agenti per nuove prenotazioni.

**Attiva**

La struttura è correttamente configurata e può partecipare alle ricerche di nuovi campi.

**Sospesa**

La struttura è temporaneamente esclusa da nuove richieste. Le prenotazioni esistenti restano consultabili e gestibili.

**Archiviata**

La struttura non è più operativa. Il sistema conserva lo storico.

## 5.2 Condizioni per l'attivazione

Una struttura può essere attivata soltanto quando:

- Ha un nome valido.
- Ha un indirizzo sufficiente a identificarla.
- Ha almeno un campo attivo.
- Ogni campo attivo ha tipologia e prezzo validi.
- Ha almeno un canale di contatto abilitato e tecnicamente utilizzabile.
- Per tale canale sono configurati recapito, priorità e orari consentiti.
- È configurato il termine di disdetta gratuita.
- È stata registrata l'autorizzazione operativa all'utilizzo dei canali previsti.

Una struttura salvata in bozza non deve essere visibile come prenotabile agli utenti.

---

# 6. Anagrafica struttura

Collection: `structures`.

## 6.1 Dati obbligatori

- Identificativo interno.
- Nome struttura.
- Indirizzo.
- Numero civico, se applicabile.
- Comune.
- Provincia.
- CAP.
- Paese.
- Stato amministrativo.
- Termine di disdetta gratuita.

## 6.2 Dati geografici

Memorizzare separatamente:

- Latitudine.
- Longitudine.
- Provenienza delle coordinate, se disponibile.
- Indicazione di geolocalizzazione verificata.

Le coordinate possono essere ricavate mediante un servizio di geocoding, ma devono essere modificabili o verificabili dall'amministratore.

Sono importanti per permettere al motore di ricerca di identificare strutture coerenti con il raggio geografico richiesto dagli utenti.

Se la geolocalizzazione è assente o incerta, il sistema non deve inventare distanze.

## 6.3 Dati facoltativi

- Descrizione.
- Sito web.
- Indicazioni per raggiungere il centro.
- Note operative interne.
- Informazioni sui parcheggi.
- Eventuali servizi disponibili.

Le note interne non devono essere automaticamente comunicate agli utenti.

## 6.4 Modifica dei dati

L'amministratore può modificare i dati anche dopo l'attivazione.

Le modifiche diventano disponibili per le nuove operazioni dell'agente.

Le prenotazioni già confermate conservano le informazioni storiche necessarie, comprese le condizioni economiche e di cancellazione applicabili.

---

# 7. Gestione dei campi

Ogni struttura può possedere più campi.

Un campo è un'entità autonoma, collegata alla struttura tramite `structureId`.

Collection proposta: `fields`.

## 7.1 Dati obbligatori del campo

- `id`
- `structureId`
- `name`
- `footballType`
- `price90MinutesCents`
- `currency`
- `status`

### Tipologie ammesse

- Calcio a 5.
- Calcio a 7.
- Calcio a 9.
- Calcio a 11.

Internamente si possono rappresentare mediante valori numerici `5`, `7`, `9`, `11`.

## 7.2 Prezzo del campo

Il prezzo deve essere configurato **per ciascun campo**, mai come prezzo generico della struttura.

Esempio:

| Campo | Tipologia | Prezzo per 90 minuti |
|---|---|---|
| Campo A | Calcio a 5 | €65 |
| Campo B | Calcio a 5 | €75 |
| Campo C | Calcio a 7 | €100 |
| Campo D | Calcio a 11 | €180 |

Il prezzo viene memorizzato in centesimi interi, ad esempio `6500`, per evitare problemi di arrotondamento.

La valuta iniziale è EUR.

La durata standard delle prenotazioni Digital Mop è di **90 minuti fissi**, come stabilito nel progetto.

## 7.3 Dati facoltativi del campo

- Descrizione.
- Tipo di superficie.
- Coperto o scoperto.
- Illuminazione.
- Note operative.

Queste informazioni sono utili, ma non devono bloccare la prima implementazione.

## 7.4 Stato del campo

Prevedere:

- Attivo.
- Temporaneamente non utilizzabile.
- Disattivato.

Disattivare un campo lo esclude dalle nuove ricerche senza cancellare le prenotazioni storiche.

## 7.5 Modifica dei prezzi

Il cambio di prezzo influisce sulle nuove richieste.

Le prenotazioni già confermate devono mantenere uno snapshot del prezzo applicato.

Se il prezzo cambia mentre una richiesta è in corso e l'utente aveva già autorizzato un prezzo differente, il backend non deve procedere silenziosamente: si applicano le regole del flusso di prenotazione sulla nuova autorizzazione.

## 7.6 Vincoli

- Ogni campo deve appartenere a una struttura valida.
- Il nome deve essere distinguibile dagli altri campi della stessa struttura.
- La tipologia deve appartenere all'insieme supportato.
- Il prezzo deve essere numerico, non negativo e validato.
- Non è ammesso modificare il `structureId` di un campo con operazioni storiche senza una procedura esplicita di migrazione.
- Nessuna cancellazione fisica dei campi con prenotazioni collegate.

---

# 8. Contatti delle strutture

I recapiti devono essere separati dall'anagrafica principale.

Collection proposta: `structure_contacts`.

Ogni record rappresenta un metodo di contatto configurato per una specifica struttura.

## 8.1 Canali previsti

- Telefonata.
- WhatsApp.
- SMS.
- Email.
- Telegram, se la struttura ha predisposto un contatto effettivamente utilizzabile.

Non tutti i canali saranno necessariamente operativi fin dalla prima versione. La disponibilità di un recapito non implica che Digital Mop disponga già dell'integrazione tecnica per utilizzarlo.

## 8.2 Dati per metodo di contatto

- Identificativo.
- Identificativo struttura.
- Canale.
- Recapito o identificativo tecnico.
- Priorità.
- Abilitato/disabilitato.
- Orari consentiti.
- Eventuali eccezioni.
- Stato di validazione del recapito.
- Stato dell'autorizzazione all'utilizzo.
- Note interne.
- Data di creazione e aggiornamento.

Per Telegram, ad esempio, non basta conoscere uno username se il bot non è autorizzato a contattare la struttura.

## 8.3 Più recapiti per la stessa struttura

Una struttura può avere:

- Un telefono fisso.
- Un cellulare.
- Un numero WhatsApp.
- Una casella email.

Lo stesso numero telefonico può essere associato a più metodi di contatto, con regole differenti.

Esempio: telefonate autorizzate solo fino alle 19:00, SMS consentiti fino alle 21:00.

## 8.4 Priorità dei canali

La struttura può scegliere un ordine di preferenza.

Esempio:

1. Telefonata.
2. WhatsApp.
3. SMS.
4. Email.

L'ordine deve essere configurabile dalla UI, preferibilmente mediante trascinamento o controlli per spostare i canali.

Non devono essere presenti priorità duplicate tra i canali attivi della stessa struttura.

## 8.5 Regola fondamentale

**Il canale preferito non è necessariamente quello da utilizzare in ogni momento.**

L'agente deve scegliere il primo metodo che risulta contemporaneamente:

- Abilitato.
- Autorizzato.
- Supportato tecnicamente.
- Utilizzabile nell'istante corrente.
- Compatibile con l'operazione da eseguire.

Se nessun metodo soddisfa queste condizioni, il contatto non può partire.

---

# 9. Orari di reperibilità per canale

Questa configurazione appartiene al metodo di contatto, non genericamente alla struttura.

## 9.1 Organizzazione settimanale

Per ogni canale l'admin deve poter indicare le fasce orarie consentite in ciascun giorno della settimana.

Esempio telefonata:

| Giorno | Fasce consentite |
|---|---|
| Lunedì | 09:00–12:30, 15:00–19:00 |
| Martedì | 09:00–12:30, 15:00–19:00 |
| Mercoledì | 09:00–12:30, 15:00–19:00 |
| Giovedì | 09:00–12:30, 15:00–19:00 |
| Venerdì | 09:00–12:30, 15:00–19:00 |
| Sabato | 09:00–12:00 |
| Domenica | Non contattare |

WhatsApp potrebbe avere fasce differenti.

## 9.2 Funzionalità della UI

La configurazione degli orari deve permettere di:

- Abilitare o disabilitare ciascun giorno.
- Inserire più intervalli nella stessa giornata.
- Copiare gli orari da un giorno agli altri.
- Configurare esplicitamente la reperibilità continuativa, se autorizzata.
- Visualizzare un riepilogo settimanale.
- Segnalare intervalli sovrapposti o invalidi.
- Definire eccezioni per date specifiche.

## 9.3 Eccezioni

Prevedere le seguenti categorie:

- Chiusura straordinaria.
- Reperibilità ridotta.
- Orario speciale.
- Indisponibilità temporanea di un canale.

Le eccezioni riferite a date specifiche prevalgono sulla configurazione settimanale.

Per la demo è sufficiente un editor semplice di eccezioni per data.

## 9.4 Gestione del fuso orario

La struttura utilizza inizialmente `Europe/Rome`.

Il sistema deve valutare gli orari secondo il fuso della struttura, comprese le variazioni tra ora solare e ora legale.

I timestamp operativi devono essere salvati in UTC.

## 9.5 Regole di sicurezza operativa

In assenza di una configurazione valida, il contatto non è consentito.

Il backend non deve interpretare una fascia mancante come disponibilità 24 ore su 24.

Anche un messaggio asincrono, come email o WhatsApp, deve rispettare gli orari autorizzati per quel canale.

## 9.6 Orari di apertura e orari di contatto

Sono concetti separati.

Una struttura potrebbe essere aperta fino alle 23:00 e accettare telefonate soltanto fino alle 18:30.

In questa prima fase si configurano gli orari di contattabilità; non si deve dedurre da questi la disponibilità dei campi o gli orari effettivi di gioco.

---

# 10. Termine di disdetta gratuita

La sezione delle cancellazioni deve essere volutamente semplice.

## 10.1 Unico parametro amministrativo

Nome proposto:

`cancellationFreeWindowMinutes`

È un valore numerico non negativo, espresso in minuti.

Esempi:

- 720 = 12 ore.
- 1440 = 24 ore.
- 2880 = 48 ore.
- 4320 = 72 ore.

La UI può permettere l'inserimento in ore o giorni e convertire il valore in minuti.

## 10.2 Ambito della configurazione

Il valore viene impostato sulla struttura e applicato a tutti i campi appartenenti a essa.

Non introduciamo inizialmente condizioni diverse per singolo campo.

## 10.3 Significato della soglia

Il parametro rappresenta il preavviso minimo richiesto per cancellare gratuitamente.

Esempio:

Partita sabato alle 20:00. Preavviso gratuito 24 ore.

La soglia è venerdì alle 20:00.

Le richieste entro la soglia, inclusa, non attivano la logica di penale Digital Mop.

Le richieste successive sono considerate tardive e passano al sistema centrale che determina se applicare una penale in crediti.

## 10.4 Esclusioni esplicite

L'amministrazione delle strutture **non deve prevedere**:

- Importo monetario della penale.
- Percentuale di penale.
- Risarcimento a favore della struttura.
- Quantità di crediti da addebitare.
- Configurazione locale delle formule di penalizzazione.

Eventuali penali economiche applicate dalla struttura sono una questione tra gestore e utente.

Digital Mop utilizza esclusivamente le proprie regole centrali per le penali in crediti, con finalità di deterrenza e tutela della fiducia dei gestori.

## 10.5 Integrazione con il flusso di disdetta

La gestione effettiva della disdetta appartiene al flusso già definito nel progetto.

Tra le decisioni da preservare:

- Acquisizione della motivazione della disdetta.
- Tentativo dell'agente di trovare una soluzione sostitutiva quando applicabile.
- Accettazione esplicita della soluzione sostitutiva.
- Conferma della struttura.
- Applicazione delle regole centrali dei crediti in base all'esito.

Il modulo Admin fornisce unicamente il termine temporale.

## 10.6 Snapshot nella prenotazione

Alla conferma di una prenotazione occorre memorizzare:

- Identificativo struttura.
- Identificativo campo.
- Inizio prenotazione.
- Durata.
- Prezzo confermato.
- `cancellationFreeWindowMinutes` applicabile.

La modifica successiva delle condizioni della struttura non deve cambiare retroattivamente le prenotazioni confermate.

---

# 11. Integrazione con il calendario delle disponibilità

## 11.1 Principio fondamentale

Digital Mop non conosce anticipatamente la disponibilità effettiva dei campi.

Il semplice inserimento di un campo nel catalogo amministrativo non significa che quel campo sia libero.

Non esiste, in questa fase, una sincronizzazione con i sistemi di prenotazione delle strutture.

Il calendario interno viene costruito progressivamente tramite:

1. Informazioni raccolte dagli agenti quando contattano le strutture.
2. Prenotazioni effettivamente confermate attraverso Digital Mop.
3. Aggiornamenti e cancellazioni delle prenotazioni gestite dal servizio.

## 11.2 Informazioni raccolte durante una verifica

Quando una struttura comunica che un campo è libero oppure occupato per uno specifico orario, registriamo:

- Struttura.
- Campo.
- Data.
- Ora di inizio.
- Ora di fine.
- Esito della verifica.
- Data e ora della risposta.
- Provenienza dell'informazione.
- Identificativo dell'interazione agente, quando disponibile.
- Eventuali note pertinenti.

La finestra standard di ricerca e prenotazione resta di 90 minuti.

Le risposte che riguardano soltanto una parte della finestra devono essere trattate senza dedurre una disponibilità per l'intero intervallo.

## 11.3 Stati logici

Distinguere almeno:

**Sconosciuto**

Non possediamo dati sufficienti per determinare la disponibilità.

**Libero verificato**

La struttura ha dichiarato libero quello slot in un determinato momento.

**Occupato rilevato**

La struttura ha dichiarato lo slot occupato.

**In attesa Digital Mop**

Una richiesta è in corso di verifica ed è soggetta a un blocco temporaneo interno.

**Prenotato Digital Mop**

Esiste una prenotazione confermata attraverso la piattaforma.

**Prenotazione annullata**

È un evento dello storico della prenotazione, non la prova che lo slot sia nuovamente libero.

## 11.4 Regole di aggiornamento

- Nessuno slot sconosciuto può essere considerato libero per default.
- Un'informazione di disponibilità deve essere associata a una verifica reale.
- Una disponibilità verificata può diventare obsoleta.
- Le prenotazioni confermate prevalgono sulle precedenti osservazioni di disponibilità.
- Un'osservazione precedente non può annullare una conferma successiva.
- La cancellazione di una prenotazione non implica automaticamente che il campo sia tornato disponibile.
- Le informazioni storiche non devono essere eliminate quando cambia lo stato corrente.

Si suggerisce di mantenere distinti gli eventi di verifica dalle prenotazioni, ricavando poi la situazione attuale.

## 11.5 Visualizzazione nell'Admin

Aggiungere nella scheda struttura una sezione **Disponibilità rilevate**.

La sezione deve permettere di consultare:

- Campo.
- Giorno.
- Orario.
- Ultimo stato conosciuto.
- Momento dell'ultima verifica.
- Origine del dato.
- Eventuale prenotazione Digital Mop collegata.
- Eventuale richiesta in attesa.

Le informazioni devono essere presentate come dati conosciuti da Digital Mop, non come disponibilità garantite.

Nella prima versione questa schermata è di consultazione: l'admin non inserisce arbitrariamente disponibilità libere.

---

# 12. Gestione delle prenotazioni in attesa

L'integrazione deve rispettare il flusso di attesa già approvato.

Quando una struttura non può confermare immediatamente:

1. L'agente concorda con essa quando ricontattarla.
2. Il backend registra il momento previsto.
3. L'agente informa l'utente.
4. L'utente può scegliere se attendere oppure proseguire la ricerca.
5. Durante l'attesa, lo slot è temporaneamente bloccato per gli altri utenti/agenti Digital Mop.
6. Il blocco non modifica il calendario reale della struttura.
7. L'agente ricontatta la struttura al momento concordato, salvo che abbia già ricevuto una risposta.
8. Il servizio applica le regole di coordinamento già definite per evitare prenotazioni duplicate.

Il blocco deve avere un identificativo, un proprietario, uno stato e una scadenza gestita dal backend.

Il modulo contatti fornisce le regole per eseguire il ricontatto.

Se l'orario concordato è incompatibile con le fasce di reperibilità registrate, l'agente deve gestire il conflitto con la struttura, non aggirare il controllo.

## 12.1 Coerenza con più richieste

Va mantenuta la regola già stabilita: se una prima struttura risponde positivamente mentre l'agente sta valutando una seconda alternativa, il sistema deve coordinare gli esiti e garantire una sola prenotazione finale.

Le operazioni concorrenti devono essere protette lato backend, non affidate soltanto alle istruzioni del modello AI.

---

# 13. Integrazione con l'orchestratore AI

## 13.1 Obiettivo

Consentire all'agente di ottenere le informazioni sulle strutture senza esporre operazioni amministrative.

L'agente può leggere i dati operativi necessari, ma non modificare autonomamente:

- Prezzi.
- Tipologie dei campi.
- Indirizzi.
- Canali autorizzati.
- Priorità.
- Fasce di reperibilità.
- Termini di disdetta gratuita.

## 13.2 Servizi applicativi necessari

Prevedere almeno le seguenti funzioni interne:

**Ricerca strutture**

Riceve criteri geografici e tipologia richiesta.

Restituisce soltanto strutture e campi utilizzabili per nuove richieste.

**Dettaglio campo**

Restituisce informazioni sul campo, prezzo per 90 minuti e condizioni applicabili.

**Contatti utilizzabili**

Valuta i canali configurati, le priorità e gli orari consentiti.

**Verifica prima del contatto**

Controlla nuovamente le condizioni immediatamente prima della telefonata o dell'invio.

**Registrazione esito**

Memorizza il risultato della conversazione con la struttura e le informazioni di disponibilità effettivamente comunicate.

## 13.3 Selezione del canale

Flusso operativo:

1. L'agente determina la struttura da contattare.
2. Richiede al backend i metodi disponibili.
3. Il backend ordina i metodi per priorità.
4. Elimina quelli disabilitati o non autorizzati.
5. Verifica compatibilità tecnica e reperibilità.
6. Seleziona il primo metodo ammissibile.
7. Il servizio del canale verifica nuovamente le regole.
8. Viene effettuato il contatto.
9. L'esito viene registrato.

Se nessun canale è utilizzabile, non deve partire alcun contatto.

Il backend può individuare il primo momento consentito per un tentativo futuro oppure consentire all'orchestratore di valutare altre strutture nel flusso già previsto.

## 13.4 Fallback tra canali

Il passaggio al canale successivo può avvenire quando:

- Il canale principale è fuori fascia.
- È disabilitato.
- L'integrazione non è disponibile.
- Il tentativo fallisce.
- Si verifica una condizione operativa prevista dalle regole di contatto.

Non è sufficiente l'assenza di una risposta immediata per inviare automaticamente lo stesso messaggio su tutti i canali.

Il servizio deve prevenire duplicazioni e tentativi eccessivi.

## 13.5 Controllo deterministico

Il modello AI può decidere che serve contattare una struttura.

Non può però decidere autonomamente di aggirare gli orari o di utilizzare un recapito non autorizzato.

I controlli vanno implementati nel backend.

Devono rimanere validi anche quando una chiamata viene avviata in seguito a un ricontatto programmato.

## 13.6 Rispetto del flusso prenotazioni

L'orchestratore continuerà a utilizzare il flusso già definito:

- Richiesta per 90 minuti.
- Orario esatto.
- Preferenze, raggio, campi e ordine delle alternative congelati all'invio.
- Modifiche sostanziali subordinate a nuova autorizzazione.
- Conferma esplicita della prenotazione, anche verbale quando applicabile.
- Coordinamento delle attese.
- Garanzia di una sola prenotazione finale.

Il modulo Admin non deve introdurre una logica parallela per questi aspetti.

---

# 14. Modello dati MongoDB

## 14.1 Collection principali

**`admin_users`**

Identità e permessi amministrativi.

**`admin_sessions`**

Sessioni amministrative revocabili, se gestite con persistenza database.

**`structures`**

Anagrafica e condizioni generali delle strutture.

**`fields`**

Singoli campi, tipologie e prezzi.

**`structure_contacts`**

Metodi di contatto, recapiti, priorità e reperibilità.

**`admin_audit_logs`**

Storico delle operazioni amministrative.

Il modulo si integra inoltre con le collection utilizzate dai servizi prenotazioni e calendario.

## 14.2 Schema logico di una struttura

Esempio illustrativo:

```json
{
  "_id": "structure_001",
  "name": "Centro Sportivo Demo",
  "status": "active",
  "address": {
    "street": "Via dello Sport",
    "number": "12",
    "city": "Roma",
    "province": "RM",
    "postalCode": "00100",
    "country": "IT"
  },
  "location": {
    "type": "Point",
    "coordinates": [12.5, 41.9]
  },
  "timezone": "Europe/Rome",
  "cancellationFreeWindowMinutes": 1440,
  "createdAt": "...",
  "updatedAt": "..."
}
```

Coordinate e dati sono puramente esemplificativi.

## 14.3 Schema logico di un campo

```json
{
  "_id": "field_001",
  "structureId": "structure_001",
  "name": "Campo A",
  "footballType": 7,
  "price90MinutesCents": 10000,
  "currency": "EUR",
  "status": "active"
}
```

## 14.4 Schema logico di un metodo di contatto

```json
{
  "_id": "contact_001",
  "structureId": "structure_001",
  "channel": "phone",
  "destination": "+39...",
  "priority": 1,
  "enabled": true,
  "authorized": true,
  "weeklyWindows": [
    {
      "dayOfWeek": 1,
      "start": "09:00",
      "end": "12:30"
    },
    {
      "dayOfWeek": 1,
      "start": "15:00",
      "end": "19:00"
    }
  ],
  "exceptions": []
}
```

Le autorizzazioni dovranno essere registrate con informazioni sufficienti a documentarne la provenienza.

## 14.5 Indici MongoDB

Prevedere indici su:

- Email amministrativa univoca.
- `structures.status`.
- `structures.name` per ricerca.
- Coordinate geografiche con indice `2dsphere`.
- `fields.structureId`.
- `fields.footballType`.
- `fields.status`.
- `structure_contacts.structureId`.
- `admin_audit_logs.entityId`.
- `admin_audit_logs.createdAt`.

Valutare indici composti sulle query effettivamente utilizzate.

## 14.6 Integrità applicativa

MongoDB non impedisce automaticamente l'esistenza di riferimenti non validi tra collection.

Il livello service dovrà garantire:

- Impossibilità di creare campi per strutture inesistenti.
- Impossibilità di attivare strutture incomplete.
- Verifica dell'appartenenza dei campi alla struttura.
- Validazione delle priorità dei contatti.
- Controllo degli intervalli orari.
- Preservazione delle referenze storiche.
- Gestione coerente di modifiche concorrenti.

Per le operazioni che modificano più documenti e richiedono atomicità, usare transazioni MongoDB dove supportate e necessarie.

---

# 15. API amministrative

Le API saranno protette da autenticazione e autorizzazione.

Prefisso indicativo: `/admin/api`.

## 15.1 Autenticazione

- `POST /admin/api/auth/login`
- `POST /admin/api/auth/logout`
- `GET /admin/api/auth/me`
- Endpoint per la verifica del secondo fattore.

## 15.2 Strutture

- `GET /admin/api/structures`
- `POST /admin/api/structures`
- `GET /admin/api/structures/:id`
- `PATCH /admin/api/structures/:id`
- `POST /admin/api/structures/:id/activate`
- `POST /admin/api/structures/:id/suspend`
- `POST /admin/api/structures/:id/archive`

## 15.3 Campi

- `GET /admin/api/structures/:id/fields`
- `POST /admin/api/structures/:id/fields`
- `GET /admin/api/fields/:fieldId`
- `PATCH /admin/api/fields/:fieldId`
- `POST /admin/api/fields/:fieldId/deactivate`

## 15.4 Contatti

- `GET /admin/api/structures/:id/contacts`
- `POST /admin/api/structures/:id/contacts`
- `PATCH /admin/api/contacts/:contactId`
- `DELETE /admin/api/contacts/:contactId`
- `PUT /admin/api/structures/:id/contact-priorities`

L'eliminazione di un contatto deve preservare gli eventi storici che vi fanno riferimento.

## 15.5 Disponibilità osservate

- `GET /admin/api/structures/:id/availability`
- `GET /admin/api/fields/:fieldId/availability`

Sono endpoint di consultazione, non di creazione arbitraria di slot liberi.

## 15.6 Audit

- `GET /admin/api/structures/:id/audit`

## 15.7 Validazioni

Ogni endpoint di modifica deve:

- Verificare l'identità dell'admin.
- Verificare i permessi.
- Validare il payload.
- Validare i riferimenti.
- Verificare i vincoli di stato.
- Evitare aggiornamenti parziali incoerenti.
- Registrare l'operazione nell'audit.

Definire risposte di errore standardizzate e prevenire modifiche concorrenti non intenzionali tramite versionamento dei documenti.

---

# 16. Interfaccia di dettaglio struttura

La scheda di una struttura esistente deve utilizzare una navigazione per sezioni.

**Sezioni previste:**

1. Panoramica.
2. Dati anagrafici.
3. Campi.
4. Contatti.
5. Orari di reperibilità.
6. Disdette.
7. Disponibilità rilevate.
8. Storico modifiche.

## 16.1 Panoramica

Mostrare:

- Nome e indirizzo.
- Stato.
- Numero di campi.
- Tipologie presenti.
- Canale prioritario.
- Prossimo momento utile per contattare la struttura.
- Termine di disdetta gratuita.
- Eventuali problemi di configurazione.

## 16.2 Tabella campi

Per ogni campo:

- Nome.
- Tipologia.
- Prezzo 90 minuti.
- Stato.
- Azioni.

La modifica del prezzo deve essere rapida, ma accompagnata da conferma e registrazione nell'audit.

## 16.3 Configurazione contatti

Ogni canale deve essere mostrato con:

- Recapito.
- Priorità.
- Stato di abilitazione.
- Autorizzazione.
- Riepilogo degli orari.

La UI deve segnalare i canali configurati ma non effettivamente utilizzabili.

## 16.4 Riepilogo prima dell'attivazione

Mostrare tutti gli errori bloccanti e gli avvisi non bloccanti.

Esempio di errore bloccante: nessun canale autorizzato.

Esempio di avviso: mancano coordinate geografiche affidabili.

L'amministratore non deve poter forzare l'attivazione aggirando i requisiti di sicurezza operativa.

---

# 17. Logging, audit e osservabilità

## 17.1 Audit amministrativo

Registrare almeno:

- Creazione struttura.
- Modifica anagrafica.
- Aggiunta campo.
- Modifica prezzo.
- Cambio stato campo.
- Modifica recapito.
- Cambio priorità.
- Modifica orari.
- Modifica termine disdetta.
- Attivazione, sospensione e archiviazione.

Per ciascun evento:

- Amministratore responsabile.
- Entità coinvolta.
- Tipo di operazione.
- Timestamp.
- Valori modificati, quando appropriato.
- Identificativo di correlazione.

Non registrare password, token o altri segreti.

## 17.2 Logging operativo dell'agente

Separatamente dall'audit admin, registrare:

- Struttura che si è tentato di contattare.
- Canale selezionato.
- Esito della verifica di reperibilità.
- Tentativo effettuato o bloccato.
- Risultato del contatto.
- Eventuale disponibilità comunicata.
- Collegamento alla richiesta di prenotazione.

Questi dati permetteranno di capire perché l'agente ha scelto un determinato canale e di diagnosticare errori.

## 17.3 Metriche utili

In una fase successiva sarà possibile misurare:

- Percentuale di contatti riusciti per canale.
- Tempo medio di risposta.
- Fasce con maggior successo.
- Strutture difficilmente raggiungibili.
- Prenotazioni riuscite per struttura.
- Frequenza delle informazioni obsolete.
- Problemi legati ai ricontatti.

---

# 18. Sicurezza e protezione dei dati

I recapiti delle strutture devono essere visibili soltanto alle componenti autorizzate.

Le risposte destinate agli utenti finali non devono esporre automaticamente numeri privati, contatti interni o note amministrative.

Definire permessi distinti per:

- Lettura amministrativa.
- Scrittura amministrativa.
- Lettura operativa dell'agente.
- Consultazione delle informazioni pubbliche.

Ogni servizio deve ricevere soltanto i dati necessari alla propria funzione.

Prevedere inoltre:

- Validazione e normalizzazione di email e telefoni.
- Gestione dei dati personali secondo le policy applicabili.
- Backup del database.
- Politiche di conservazione dei log.
- Revoca delle autorizzazioni ai canali.
- Protezione delle operazioni amministrative da richieste non autorizzate.
- Divieto per l'AI di eseguire direttamente tool amministrativi.

---

# 19. Piano di implementazione progressivo

L'implementazione deve procedere per incrementi verificabili, evitando di realizzare tutta la UI prima di avere un backend funzionante.

## Fase 0 — Preparazione dell'architettura

Attività:

- Analizzare la struttura attuale del repository.
- Identificare router, service, model e middleware già presenti.
- Stabilire le convenzioni per i nuovi moduli.
- Verificare la persistenza MongoDB nell'ambiente Docker.
- Definire gli schemi e i contratti API.
- Evitare duplicazioni dei servizi esistenti.

**Criterio di completamento:** architettura del modulo definita e coerente con il progetto.

## Fase 1 — Autenticazione Admin

Attività:

- Collection `admin_users`.
- Script inizializzazione amministratore.
- Login.
- Sessione.
- Middleware autorizzazione.
- Logout.
- Secondo fattore.
- Protezioni contro tentativi abusivi.
- Test via Postman.

**Criterio di completamento:** un account admin autorizzato può effettuare operazioni protette, mentre richieste anonime o non autorizzate vengono rifiutate.

## Fase 2 — CRUD strutture

Attività:

- Schema MongoDB.
- Endpoint di creazione.
- Lettura e modifica.
- Validazione indirizzo.
- Stati amministrativi.
- Archiviazione.
- Indici.
- Audit iniziale.

**Criterio di completamento:** una struttura può essere creata, modificata e riletta attraverso le API.

## Fase 3 — CRUD campi

Attività:

- Schema `fields`.
- Collegamento alla struttura.
- Validazione delle quattro tipologie.
- Prezzo individuale per 90 minuti.
- Stati del campo.
- Aggiornamento prezzi.
- Protezione dello storico.

**Criterio di completamento:** una struttura può possedere più campi, anche della stessa tipologia, con prezzi differenti.

## Fase 4 — Contatti e priorità

Attività:

- Schema contatti.
- Canali supportati.
- Recapiti.
- Abilitazione.
- Stato di autorizzazione.
- Ordinamento per priorità.
- Validazione.
- Audit.

**Criterio di completamento:** per una struttura è possibile ottenere un elenco ordinato di canali autorizzati.

## Fase 5 — Reperibilità

Attività:

- Editor logico di fasce settimanali.
- Supporto intervalli multipli.
- Giorni non contattabili.
- Eccezioni.
- Gestione fuso orario.
- Funzione backend di verifica.
- Test dei limiti temporali.

**Criterio di completamento:** il backend è in grado di stabilire deterministicamente se un contatto è consentito in uno specifico momento.

## Fase 6 — Condizioni di disdetta

Attività:

- Aggiunta `cancellationFreeWindowMinutes`.
- Validazione.
- API di lettura e modifica.
- Conversione ore/minuti nell'interfaccia.
- Disponibilità del parametro al motore prenotazioni.
- Compatibilità con gli snapshot delle prenotazioni.

**Criterio di completamento:** ogni struttura attiva ha una soglia di disdetta gratuita utilizzabile dal backend.

## Fase 7 — Interfaccia Admin

Attività:

- Pagina login.
- Dashboard.
- Elenco e ricerca strutture.
- Procedura guidata di creazione.
- Dettaglio struttura.
- Gestione campi.
- Gestione recapiti.
- Editor reperibilità.
- Editor disdetta.
- Riepilogo attivazione.
- Feedback sugli errori.
- Layout responsive.

**Criterio di completamento:** un amministratore può configurare una struttura completa senza utilizzare Postman.

## Fase 8 — Integrazione orchestratore

Attività:

- Servizio ricerca delle strutture attive.
- Servizio dettaglio campo.
- Servizio selezione contatto.
- Controllo delle fasce autorizzate al momento dell'azione.
- Fallback dei canali.
- Logging dei tentativi.
- Collegamento agli adapter disponibili.

**Criterio di completamento:** l'agente utilizza correttamente le configurazioni amministrative e non può aggirarle.

## Fase 9 — Integrazione calendario

Attività:

- Collegamento ai servizi di disponibilità già previsti.
- Registrazione delle risposte delle strutture.
- Conservazione della provenienza dei dati.
- Distinzione tra disponibilità osservate e prenotazioni confermate.
- Visualizzazione in sola lettura nell'Admin.
- Gestione delle informazioni obsolete.

**Criterio di completamento:** le informazioni raccolte dall'agente sono consultabili senza introdurre disponibilità presunte.

## Fase 10 — Integrazione disdette

Attività:

- Lettura delle condizioni applicabili alla prenotazione.
- Snapshot della soglia.
- Collegamento al flusso di disdetta già approvato.
- Compatibilità con il tentativo di recuperare lo slot.
- Passaggio dell'esito al sistema centrale dei crediti.

**Criterio di completamento:** il modulo fornisce correttamente i parametri necessari, senza calcolare direttamente le penali.

## Fase 11 — Collaudo completo

Attività:

- Test unitari.
- Test API.
- Test autorizzazioni.
- Test interfaccia.
- Test integrazione agente.
- Test casi concorrenti.
- Test orari.
- Test cancellazioni.
- Test riavvio Docker e persistenza.
- Stress test sui servizi maggiormente utilizzati.

**Criterio di completamento:** il modulo è utilizzabile nella demo senza dipendere da operazioni manuali sul database.

---

# 20. Piano di test

## 20.1 Autenticazione

- Credenziali corrette.
- Password errata.
- Account sospeso.
- Sessione scaduta.
- Logout.
- Accesso alle API senza autenticazione.
- Tentativo di accesso da parte di un utente non admin.
- Tentativi ripetuti di login.
- Secondo fattore valido e non valido.

## 20.2 Strutture

- Creazione valida.
- Creazione incompleta in bozza.
- Attivazione con configurazione completa.
- Tentativo di attivare una struttura senza campi.
- Tentativo di attivare una struttura senza contatti.
- Modifica anagrafica.
- Sospensione.
- Riattivazione.
- Archiviazione.
- Preservazione dello storico.

## 20.3 Campi

- Campo a 5.
- Campo a 7.
- Campo a 9.
- Campo a 11.
- Tipologia non consentita.
- Due campi della stessa tipologia con prezzi differenti.
- Prezzo mancante.
- Prezzo negativo.
- Cambio prezzo.
- Campo disattivato.
- Campo appartenente a una struttura differente.

## 20.4 Contatti

- Un solo canale.
- Più canali.
- Cambio priorità.
- Canale disabilitato.
- Recapito non valido.
- Recapito valido ma senza integrazione disponibile.
- Canale senza autorizzazione.
- Nessun canale disponibile.
- Fallback corretto.

## 20.5 Orari

- Contatto dentro la fascia.
- Contatto prima dell'apertura.
- Contatto esattamente all'inizio.
- Contatto esattamente alla fine.
- Intervalli multipli.
- Giorno non contattabile.
- Eccezione straordinaria.
- Fasce sovrapposte.
- Passaggio all'ora legale.
- Passaggio all'ora solare.
- Controllo ripetuto immediatamente prima di invio/chiamata.

## 20.6 Disponibilità

- Campo appena censito: disponibilità sconosciuta.
- Prima verifica positiva.
- Prima verifica negativa.
- Informazione divenuta obsoleta.
- Prenotazione Digital Mop confermata.
- Blocco temporaneo in attesa.
- Scadenza del blocco.
- Cancellazione di prenotazione.
- Tentativo di utilizzare una disponibilità non confermata come prenotazione certa.
- Concorrenza tra richieste.

## 20.7 Disdette

- Cancellazione prima della soglia.
- Cancellazione esattamente alla soglia.
- Cancellazione dopo la soglia.
- Modifica della soglia successiva alla prenotazione.
- Verifica dello snapshot.
- Recupero riuscito dello slot attraverso il flusso previsto.
- Recupero non riuscito.
- Nessuna penale economica configurata nell'Admin.
- Corretta delega delle decisioni sui crediti al servizio centrale.

---

# 21. Scenario end-to-end di collaudo

Configurare una struttura demo con:

**Struttura:** Centro Sportivo Demo.

**Campi:**

- Campo A — Calcio a 5 — €65/90 minuti.
- Campo B — Calcio a 7 — €100/90 minuti.
- Campo C — Calcio a 11 — €180/90 minuti.

**Contatti:**

- Telefonata: prima scelta, 09:00–19:00.
- WhatsApp: seconda scelta, 08:00–21:00.
- Email: terza scelta, fascia consentita esplicitamente configurata.

**Disdetta gratuita:** 24 ore.

Eseguire i seguenti controlli:

1. Creare la struttura dall'Admin.
2. Salvare la bozza.
3. Completare i campi.
4. Configurare i canali.
5. Configurare gli orari.
6. Impostare il preavviso gratuito.
7. Attivare la struttura.
8. Verificare che l'agente possa individuarla.
9. Simulare una ricerca di un campo a 7.
10. Verificare la selezione del canale appropriato.
11. Verificare che una chiamata fuori fascia venga bloccata.
12. Registrare una disponibilità comunicata dalla struttura.
13. Verificare l'aggiornamento del calendario.
14. Simulare il percorso di prenotazione già previsto.
15. Verificare che il prezzo e le condizioni vengano conservati nella prenotazione.
16. Cambiare il prezzo nell'Admin.
17. Cambiare la soglia di disdetta nell'Admin.
18. Verificare che le prenotazioni precedenti conservino le condizioni originarie.
19. Simulare una disdetta tardiva.
20. Verificare il passaggio della decisione al sistema centrale dei crediti.

I contatti reali andranno utilizzati esclusivamente verso recapiti di prova autorizzati, per evitare di disturbare strutture durante i test.

---

# 22. Criteri di accettazione finali

Il modulo sarà considerato completo per la demo quando tutte le condizioni seguenti saranno soddisfatte.

## Amministrazione

- [ ] Esiste un login admin separato dagli utenti ordinari.
- [ ] Le API sono protette da autorizzazione.
- [ ] È possibile creare e modificare strutture.
- [ ] È possibile salvare bozze.
- [ ] È possibile attivare, sospendere e archiviare strutture.
- [ ] Le modifiche importanti sono tracciate.

## Campi

- [ ] Ogni struttura può avere più campi.
- [ ] Le tipologie supportate sono 5, 7, 9, 11.
- [ ] Ogni campo possiede il proprio prezzo per 90 minuti.
- [ ] I prezzi sono memorizzati senza errori di arrotondamento.
- [ ] I campi disattivati non vengono proposti per nuove prenotazioni.

## Contatti

- [ ] Si possono configurare più canali.
- [ ] Ogni canale ha recapito, priorità e stato.
- [ ] Le fasce orarie sono indipendenti per canale.
- [ ] Gli orari vengono rispettati dal backend.
- [ ] Il fallback segue le preferenze autorizzate.
- [ ] Nessun agente può contattare una struttura fuori dalle regole consentite.

## Disdette

- [ ] Esiste soltanto la soglia di disdetta gratuita nell'Admin.
- [ ] La soglia è associata alla struttura.
- [ ] Si applica ai suoi campi.
- [ ] Viene salvata nella prenotazione al momento della conferma.
- [ ] Non esistono configurazioni monetarie delle penali nel modulo.
- [ ] Il sistema centrale dei crediti mantiene la responsabilità delle eventuali penalizzazioni.

## Calendario

- [ ] I campi appena inseriti hanno disponibilità sconosciuta.
- [ ] Il calendario viene alimentato dalle interazioni degli agenti.
- [ ] È possibile distinguere disponibilità osservate e prenotazioni confermate.
- [ ] I blocchi in attesa esistono soltanto in Digital Mop.
- [ ] Le informazioni obsolete non vengono considerate garanzie.
- [ ] Lo storico rimane consultabile.

## Integrazione

- [ ] L'orchestratore utilizza i servizi del nuovo modulo.
- [ ] Il flusso prenotazioni già definito rimane invariato.
- [ ] Le chiamate e i messaggi rispettano le configurazioni.
- [ ] Le prenotazioni confermate conservano prezzo e condizioni.
- [ ] I servizi funzionano dopo un riavvio dei container.
- [ ] Le funzionalità principali sono testabili sia tramite UI sia, dove appropriato, con Postman.

---

# 23. Funzionalità escluse dalla prima implementazione

Per mantenere il perimetro controllato, non implementiamo adesso:

- Account autonomi per i gestori delle strutture.
- Portale self-service delle strutture.
- Sincronizzazione con calendari esterni.
- Importazione automatica degli inventari dei campi.
- Disponibilità precompilate o presunte.
- Tariffe variabili per orario o stagione.
- Modifica della durata standard di 90 minuti.
- Gestione economica delle penali delle strutture.
- Risarcimenti economici ai gestori.
- Gestione dei saldi e delle formule delle penali in crediti.
- Fatturazione.
- Gestione delle subscription.
- Nuovo workflow di prenotazione alternativo a quello già approvato.

Queste esclusioni non impediscono di predisporre un modello dati estendibile in futuro.

---

# 24. Risultato atteso

Al completamento, l'amministratore potrà inserire una struttura sportiva completa direttamente dalla dashboard.

Digital Mop conoscerà:

- Dove si trova la struttura.
- Quali campi offre.
- Di quale tipologia sono.
- Quanto costa ciascun campo per 90 minuti.
- Come contattare la struttura.
- Quale canale la struttura preferisce.
- In quali giorni e orari può essere contattata attraverso ogni canale.
- Quanto preavviso richiede per una disdetta gratuita.

L'agente AI utilizzerà queste informazioni per eseguire il flusso di prenotazione esistente e aggiornare progressivamente il calendario con le informazioni effettivamente ricevute.

**Principio architetturale conclusivo:** l'Admin configura l'offerta sportiva e le regole operative; l'agente raccoglie disponibilità e gestisce interazioni; il motore prenotazioni mantiene gli stati reali delle richieste; il sistema crediti decide gli eventuali addebiti. Nessuno di questi moduli deve duplicare le responsabilità degli altri.
