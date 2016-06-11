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
- `BUTTON1` .. `BUTTON9` Button link text, ex: Donate
- `BUTTON_URL1` .. `BUTTON_URL9` Button link, ex: `http://example.com/donate`
- `FOOTER1` .. `FOOTER9` Footer link text, ex: Privacy
- `FOOTER_URL1` .. `FOOTER_URL9` Footer link, ex: `http://example.com/privacy`
- `PORT` default: `5000` for heroku
- `RELOAD` reload data frequency, default daily
- `LOGENTRIES` logentries key
- `LOGENTRIES_BUFFER` logentries buffer size, default `100`
- `CONSOLE_PASSTHRU` URL stub for console log passthru. Ex: value of `/console`. So a visit to: `/console/test` would log `test` to the console
- `LOG_PASSTHRU` URL stub for log passthru. Ex: value of `/log`. So a visit to: `/log/yo` would log `yo` to the logentries, if active, or console
- `PASSTHRU_MESSAGE` response message for passthru's
- `APPNAME` generator application name override
- `APPVERSION` generator application version override
- `MESSAGE` MESSAGE override

## Notes

- node-rest-client 1.5.x is ok; however, 1.8.0 breaks

## License
MIT
