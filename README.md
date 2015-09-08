# shortit
A quick ShortURL server with data via external JSON database. Includes Stats and LogEntries logging.

Use local `shorts.json` data or remote JSON data for shorts. Use firebase to manage your data.

Environment variables:
- `SHORTS_DATA_URL` ex: [https://shorts.firebaseio.com](https://shorts.firebaseio.com)
- `PORT` default: 5000 for heroku
- `RELOAD` reload data frequency, default daily
- `LOGENTRIES` logentries key
- `LOGENTRIES_BUFFER` logentries buffer size, default 100
