# shortit
A quick ShortURL server with data via external JSON database. Includes Stats and LogEntries logging.

Use local `shorts.json` data or remote JSON data for shorts. Use firebase to manage your data.

Environment variables:
- `NAME` ex: `mybit.ly`
- `DATA_URL` ex: `https://shortit.firebaseio.com/shorts.json`
- `PORT` default: `5000` for heroku
- `RELOAD` reload data frequency, default daily
- `LOGENTRIES` logentries key
- `LOGENTRIES_BUFFER` logentries buffer size, default `100`

## License
MIT
