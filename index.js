var express = require('express');
var app     = express();
var pak     = require('./package.json');
var Client  = require('node-rest-client').Client;
var client  = new Client();
var year    = new Date().getFullYear();
var envic   = require('envic')
var shortIt = {
	company:    process.env.COMPANY       || process.env.NAME || process.env.APPNAME || pak.name,
	domain:     process.env.DOMAIN        || process.env.NAME || process.env.APPNAME || pak.name,
	name:       process.env.APPNAME       || pak.name,
	version:    process.env.APPVERSION    || pak.version,
	url:        process.env.URL           || 'https://github.com/yieme/shortit',
	year:       process.env.YEAR          || (year > 2015) ? '2015-' + year : year,
	logoUrl:    process.env.LOGO_URL      || 'logo.png',
	faviconUrl: process.env.FAVICON_URL   || 'favicon.png',
	nopowered:  process.env.NO_POWERED_BY || false,
	headCode:   process.env.HEADCODE      || '',
	bodyCode:   process.env.BODYCODE      || '',
	header1:    process.env.HEADERNAM     || false,
	value1:     process.env.HEADERVAL     || false,
	header2:    process.env.HEADERNAM2    || false,
	value2:     process.env.HEADERVAL2    || false,
	server:     process.env.SERVER        || false
};

shortIt.nameVersion = shortIt.name + '/' + shortIt.version
var conPassThru    = process.env.CONSOLE_PASSTHRU // console pass-thru
var logPassThru    = process.env.LOG_PASSTHRU
var passThruReturn = process.env.PASSTHRU_MESSAGE || '{ok:1}'
var passThruMaxLen = (process.env.PASSTHRU_MAXLEN) ? parseInt(process.env.PASSTHRU_MAXLEN) : 0 // maximum length of pass-thru string
var footerLinks = '';
var buttonLinks = '';
var shorts  = require('./shorts.json');
var fs      = require('fs');
var shortsDataUrl = process.env.DATA_URL;
app.set('port', (process.env.PORT || 5000));
var template      = '<br><br><center><h1 style="font-family:arial">$msg';
var home          = '$company uses the $domain domain as part of a service to protect users from harmful activity, to provide value for the developer ecosystem, and as a quality signal for surfacing interesting events.';
var msg404        = 'Sorry, page not found';
var lastUpdate    = 0;
var started       = +new Date();
var refreshWait   = 5000; // 5 seconds between refresh requests
var reloadFrequency = process.env.RELOAD || 24*60*60*1000; /// daily default
var stats         = {};
//var Logger        = require('le_node');
var winston    = require('winston')
var logentriesConfig = {
	token:      process.env.LOGENTRIES,
	bufferSize: process.env.LOGENTRIES_BUFFER || 100,
	secure:     1,
	'console':  1
};
var logger      = new winston.Logger()
logger.add(winston.transports.Console)
if (logentriesConfig.token) {
	console.log('Log transport: LogEntries')
	var Logentries = require('winston-logentries')
	logger.add(new winston.transports.Logentries(logentriesConfig))
}
var logUrl = envic('LOG_URL')
console.log('logUrls:', logUrl)
if (logUrl) {
	console.log('Log transport: Http')
	for (var i=0; i < logUrls.length; i++) {
		logger.add( winston.transports.Http, logUrls[i] )
	}
}
var log = {
	info:    (logentriesConfig.token) ? function(m) { logger.log('info',    m)} : console.log,
	warning: (logentriesConfig.token) ? function(m) { logger.log('warning', m)} : console.warn,
	error:   (logentriesConfig.token) ? function(m) { logger.log('error',   m)} : console.error
}
//var log           = ((process.env.LOGENTRIES)) ? new Logger(logentriesConfig) : console;
//log.error         = log.error   || log.err;
//log.warning       = log.warning || log.warn;
var favicon_png   = '';
var logo_png      = '';

app.use(function customHeaders( req, res, next ){
  // Switch off the default 'X-Powered-By: Express' header
	if (shortIt.nopowered) {
		app.disable( 'x-powered-by' );
	} else {
  	res.setHeader( 'X-Powered-By', shortIt.nameVersion);
	}
	if (shortIt.server)  res.setHeader('Server', shortIt.server)
	if (shortIt.header1) res.setHeader(shortIt.header1, shortIt.value1)
	if (shortIt.header2) res.setHeader(shortIt.header2, shortIt.value2)
  next()
})

function bump(area) {
	var now   = new Date();
	var year  = now.getFullYear();
	var month = now.getMonth() + 1;
	month     = (month<=9) ? '0' + month : ''+ month;
	var day   = now.getDate();
	day       = (day <= 9) ? '0' + day : '' + day;
	var stat  = stats[area] || {};
	stat.tdd = stat.tdd || 0;
	stat.tdd++;
	stat[year]     = stat[year]     || {};
	stat[year].ytd = stat[year].ytd || 0;
	stat[year].ytd++;
	stat[year][month]      = stat[year][month]      || {};
	stat[year][month].mtd  = stat[year][month].mtd  || 0;
	stat[year][month].mtd++;
	stat[year][month][day] = stat[year][month][day] || 0;
	stat[year][month][day]++;
	stats[area] = stat;
}

function duration(val) {
	val = Math.round(val / 1000);
	if (val <= 59) return val + 's';
	val = Math.round(val / 60);
	if (val <= 59) return val + 'm';
	val = Math.round(val / 60);
	if (val <= 23) return val + 'h';
	val = Math.round(val / 24);
	return val + 'd';
}

function getShorts() {
	var now       = +new Date();
	var timeDelta = now - lastUpdate;
	if (timeDelta > refreshWait) {
		lastUpdate  = now;
		if (shortsDataUrl) {
			client.get(shortsDataUrl, function(data, response){
				log.info(shortsDataUrl +   ' loaded at: ' + new Date().toString());
				var parsed = JSON.parse(data);
				shorts     = parsed;
			});
		} else {
			log.error('DATA_URL not defined');
		}
	}
}

function sendJson(res, obj) {
	res.type('json');
	obj = obj || {};
	var json = JSON.stringify(obj, null, 2);
	res.send(json);
}

function notFound(res, short) {
	bump('_404');
	log.warning('/' + short + ' Not Found');
	if (shorts._404) return doShort('_404', res);
	render(res, '_404', msg404.replace('$short', short));
	res.status(404);
}

function doShort(short, res) {
	var url   = shorts[short];
	if (url) {
		url = url.url || url; // support firebase short: { id: short, url: url } formatted data
		res.redirect(302, url);
		log.info(short + ': ' + url);
		bump(short);
	} else {
		notFound(res, short);
	}
}

function render(res, name, $msg) {
	var result = template.replace('$msg', $msg);
	for(var max=10; max>0 && result.indexOf('$') >= 0; max--) {
		result = result
			.replace('$company',     shortIt.company)
			.replace('$url',         shortIt.url)
			.replace('$domain',      shortIt.domain)
			.replace('$year',        shortIt.year)
			.replace('$logoUrl',     shortIt.logoUrl)
			.replace('$faviconUrl',  shortIt.faviconUrl)
			.replace('$packageName', shortIt.name)
			.replace('$packageVer',  shortIt.version)
			.replace('$headCode',    shortIt.headCode)
			.replace('$bodyCode',    shortIt.bodyCode)
			.replace('$buttonLinks', buttonLinks)
			.replace('$footerLinks', footerLinks)
		;
	}
	res.send(result);
	bump(name);
	log.info('/' + name);
}

function renderPng(res, name, img) {
	res.type('png');
	res.send(img);
	name = name + '.png';
	bump(name);
	log.info('/' + name);
}

app.get('/favicon.png', function (req, res) {
	renderPng(res, 'favicon', favicon);
});

app.get('/logo.png', function (req, res) {
	renderPng(res, 'logo', logo);
});

app.get('/', function (req, res) {
	if (shorts._home) return doShort('_home', res);
	render(res, '_home', process.env.MESSAGE || home);
});

app.get('/_reload', function (req, res) {
	render(res, '_reload', 'Reload done.');
	getShorts();
});

app.get('/_stats', function (req, res) {
	bump('_stats');
	stats._running = duration(+new Date() - started);
	stats._updated = duration(+new Date() - lastUpdate);
	sendJson(res, stats);
	log.info('/_stats ' + JSON.stringify(stats));
});

app.get('/_stats/:short', function (req, res) {
	bump('_stats/*');
	sendJson(res, stats[req.params.short]);
	log.info('/_stats/' + req.params.short);
});

String.prototype.replaceIgnoreCase = function(strReplace, strWith) {
    var reg = new RegExp(strReplace, 'i'); // i=ignore case, g=global (ie all)
    return this.replace(reg, strWith);
};

if (conPassThru) { // console pass-thru
	app.get(conPassThru, function (req, res) {
		data = req.originalUrl.replaceIgnoreCase(conPassThru, '')
		if (data.substr(0,1) == '/') data = data.replace('/', '')
		if (data.substr(0,1) == '?') data = data.replace('?', '')
		if (passThruMaxLen && data.length > passThruMaxLen) {
			data = data.substr(0, passThruMaxLen)
		}
		console.log('data', data);
		res.send(passThruReturn)
	});
}

if (logPassThru) {
	app.get(logPassThru, function (req, res) {
		data = req.originalUrl.replaceIgnoreCase(logPassThru, '')
		if (data.substr(0,1) == '/') data = data.replace('/', '')
		if (data.substr(0,1) == '?') data = data.replace('?', '')
		if (passThruMaxLen && data.length > passThruMaxLen) {
			data = data.substr(0, passThruMaxLen)
		}
		log.info(data);
		res.send(passThruReturn)
	});
}

app.get('/:short', function (req, res) {
	doShort(req.params.short, res);
});

var server = app.listen(app.get('port'), function () {
  var host = server.address().address;
  var port = server.address().port;
  log.info(pak.name + ' ' + pak.version + ' listening on: ' + host + ' port: ' + port + ' at: ' + new Date().toString());
	if (!process.env.COMPANY) {
		log.warning('COMPANY not defined');
	}
	if (!process.env.DOMAIN) {
		log.warning('DOMAIN not defined');
	}
	if (!process.env.URL) {
		log.warning('URL not defined');
	}
});

function loadFile(path, cb) {
	fs.readFile('./' + path, 'utf8', function (err, data) {
	  if (data && !err) {
			log.info('Loaded ' + path);
		} else {
			log.warning('Unable to load ' + path);
		}
		cb(data);
	});
}

function loadTemplate(name, cb) {
	loadFile('./templates/' + name + '.html', cb);
}

function loadPng(path, cb) {
	fs.readFile('./' + path, function (err, data) {
	  if (data && !err) {
			log.info('Loaded ' + path);
		} else {
			log.warning('Unable to load ' + path);
		}
		cb(data);
	});
}

loadTemplate('index', function(data) {
	template = data || '';
});
loadTemplate('home', function(data) {
	home = data || '';
});
loadTemplate('404', function(data) {
	msg404 = data || '';
});
loadTemplate('footerLink', function(data) {
	data = data || '';
	for (var i=1; i<=9; i++) {
		if (process.env['FOOTER'+i]) {
			footerLinks += data
				.replace('$url',  process.env[ 'FOOTER_URL' + i ])
				.replace('$text', process.env[ 'FOOTER'     + i ])
			;
		}
	}
});
loadTemplate('buttonLink', function(data) {
	data = data || '';
	for (var i=1; i<=9; i++) {
		if (process.env['BUTTON'+i]) {
			buttonLinks += data
				.replace('$url',  process.env[ 'BUTTON_URL' + i ])
				.replace('$text', process.env[ 'BUTTON'     + i ])
			;
		}
	}
});
loadPng('favicon.png', function(data) {
	favicon = data || null;
});
loadPng('logo.png', function(data) {
	logo = data || null;
});

getShorts();
setInterval(getShorts, reloadFrequency);
