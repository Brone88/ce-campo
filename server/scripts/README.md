# Script

Comandi di prova del server. Si lanciano dalla cartella `server`.

## Chiamata outbound nello stesso container dell'inbound

Per confrontare inbound e outbound nello stesso ambiente, eseguire dalla
radice del progetto, con il servizio `backend` già avviato:

```bash
docker compose exec backend npm run test-call
```

La chiamata parte verso `TEST_PHONE_NUMBER` e usa il codice, Node, la rete e le
variabili d'ambiente del container che gestisce l'inbound. Non viene avviato un
secondo container. Per la prova solo audio, terminabile con Ctrl+C:

```bash
docker compose exec backend npm run test-call -- --audio-test
```

`exec` usa i file già presenti nel container: le modifiche locali non vengono
copiate automaticamente. Per confrontare entrambi i versi con il codice locale
aggiornato, ricostruire prima il backend (riavvia il servizio; farlo senza
chiamate in corso):

```bash
docker compose up -d --build backend
```

Ripetere quindi inbound e outbound sulla stessa versione. Il comando
`npm run test-call` eseguito direttamente su Windows resta una prova in un
ambiente diverso.

## Variabili

Inbound e outbound usano lo stesso oggetto sessione da `buildLiveSession`.
La chiusura della chiamata passa da una sola delega `end_call`
(`test_completed` o `user_requested`) e da un unico saluto finale.

### Screening outbound

Sulle chiamate in uscita lo screening testuale è attivo di default.
Non si applica all'inbound né a `--audio-test`. Per disattivarlo:

```bash
docker compose exec -e LIVE_SCREEN_OUTBOUND=0 backend npm run test-call
```

Fasi: risposta telefonica → ascolto iniziale → classificazione dedicata →
apertura della conversazione oppure hangup diretto senza saluto.
Lo screening chiama Responses separatamente, senza strumenti, usando le prime
trascrizioni come dati. Non dipende da una delega della voce e non cerca parole
chiave. Solo `machine` con certezza alta chiude; `human` con certezza alta
autorizza l'apertura. Risultati incerti, errori o silenzio rilasciano la
conversazione allo scadere della finestra, senza dichiarare una persona certa.
Durante lo screening `end_call` dal modello delegato viene bloccato.

Il percorso corrente crea la chiamata con OpenAI e autenticazione digest verso
`sips:sip.telnyx.com:5061`. Non invia il comando Telnyx `POST /v2/calls` e non
usa l'[AMD Telnyx](https://developers.telnyx.com/docs/voice/programmable-voice/answering-machine-detection).
Il classificatore testuale non riconosce beep, timbro registrato o audio
privo di trascrizione. Il sideband SIP non può bloccare il playback: non è
una garanzia che nessuna parola raggiunga una segreteria.

`LIVE_SCREEN_IDLE_MS`: pausa fra frammenti prima della classificazione, default
1000 ms. `LIVE_SCREEN_WINDOW_MS`: limite dall'evento di risposta, default
12000 ms. Minimo per entrambi 1000 ms. Massimo tre richieste seriali.
`OPENAI_SCREENING_MODEL` sceglie il modello; fallback a
`OPENAI_DELEGATION_MODEL`, poi `gpt-6-luna`. Richieste con `store: false`.

Test senza chiamate telefoniche (usa Responses ed effettua richieste API):

```bash
docker compose exec backend npm run test-screening
```

Gli esempi sono sintetici e non misurano l'affidabilità sul traffico reale.
Log `screening.*`. Test locali del coordinamento: `npm run test-live`
dalla cartella `server`.

### Backend delegato

`OPENAI_DELEGATION_MODEL` sceglie il modello del backend, default `gpt-6-luna`.
`OPENAI_DELEGATION_SERVICE_TIER` sceglie il tier, default `priority`.
Se la delega fallisce con quel tier, impostare `auto`.
`OPENAI_DELEGATION_REASONING` sceglie lo sforzo di ragionamento, default `low`.

Letti da `server/.env`. Lo script esce subito se ne manca una.

| Variabile | Uso |
| --- | --- |
| `TELNYX_API_KEY` | Autenticazione alle API Telnyx |
| `TELNYX_VERIFY_PROFILE_ID` | Profilo Verify usato per l'SMS |
| `TEST_PHONE_NUMBER` | Cellulare che riceve l'SMS, formato `+39` seguito da 9 o 10 cifre |

## OTP

`scripts/test-otp.js` parla con Telnyx Verify. Il numero non si passa da riga di comando: arriva da `TEST_PHONE_NUMBER`.

### Inviare l'SMS

```bash
npm run test-otp
```

Chiede un codice al numero in `TEST_PHONE_NUMBER` e stampa la risposta di Telnyx.

### Verificare il codice

Il codice lo passi tu, dopo `--`, così npm lo inoltra allo script:

```bash
npm run test-otp-verify -- 40432
```

Il codice deve essere di 4–8 cifre. In console compare `response_code` di Telnyx (`accepted` se il codice è quello giusto).
