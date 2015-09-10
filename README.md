# shortIt
A quick ShortURL server with data via external JSON database. Includes Stats and LogEntries logging.

Use local `shorts.json` data or remote JSON data for shorts. Use firebase to manage your data.

Environment variables:
- `COMPANY` ex: Example, Inc
- `DOMAIN` ex: `examp.le`
- `URL`    Company URL, ex: example.com
- `DATA_URL` ex: `https://shortit.firebaseio.com/shorts.json`
- `FAVICON_URL`
- `LOGO_URL`
- `FOOTER1` .. `FOOTER9` Footer link text, ex: Privacy
- `FOOTER_URL1` .. `FOOTER_URL9` Footer link, ex: example/privacy
- `PORT` default: `5000` for heroku
- `RELOAD` reload data frequency, default daily
- `LOGENTRIES` logentries key
- `LOGENTRIES_BUFFER` logentries buffer size, default `100`

## License
MIT
