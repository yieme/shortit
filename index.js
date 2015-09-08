var express = require('express');
var app     = express();
var pak     = require('./package.json');
var Client  = require('node-rest-client').Client;
var client  = new Client();
var shorts  = require('./shorts.json');
var shortsDataUrl = process.env.SHORTS_DATA_URL;
app.set('port', (process.env.PORT || 5000));
var template      = '<br><br><center><h1 style="font-family:arial">$msg';
var lastUpdate    = 0;
var started       = +new Date();
var refreshWait   = 5000; // 5 seconds between refresh requests
var reloadFrequency = process.env.RELOAD || 24*60*60*1000; /// daily default
var stats         = {};
var Logger        = require('le_node');
var logentriesConfig = {
	token:      process.env.LOGENTRIES,
	bufferSize: process.env.LOGENTRIES_BUFFER || 100,
	secure:     1,
	'console':  1
};
var log           = ((process.env.LOGENTRIES)) ? new Logger(logentriesConfig) : console;
log.error         = log.error || log.err;

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
			log.error('SHORTS_URL not defined');
		}
	}
}

function notFound(req, res) {
	res.status(404).send(template.replace('$msg',  'Not Found'));
	bump('_404');
	log.info('Not Found');
}

app.get('/', function (req, res) {
	bump('_home');
	var msg = pak.version + ' ' + duration(+new Date() - started) + '-' + duration(+new Date() - lastUpdate);
  res.send(template.replace('$msg',  pak.name + '</h1><sup style="color:gray">' + msg));
	log.info('/');
});

app.get('/_reload', function (req, res) {
	bump('_reload');
	res.send(template.replace('$msg',  'OK'));
	getShorts();
	log.info('/_reload');
});

app.get('/_stats', function (req, res) {
	bump('_stats');
	res.json(stats);
	log.info('/_stats');
});

app.get('/_stats/:short', function (req, res) {
	bump('_stats');
	res.json(stats[req.params.short]);
	log.info('/_stats/' + req.params.short);
});

app.get('/:short', function (req, res) {
	var short = req.params.short;
	var url   = shorts[short];
	if (url) {
		url = url.url || url; // support firebase short: { id: short, url: url } formatted data
		res.redirect(302, url);
		log.info(short + ': ' + url);
		bump(short);
	} else {
		notFound(res);
	}
});

var server = app.listen(app.get('port'), function () {
  var host = server.address().address;
  var port = server.address().port;
  log.info(pak.name + ' ' + pak.version + ' listening on: ' + host + ' port: ' + port + ' at: ' + new Date().toString());
	if (!process.env.LOGENTRIES) {
		log.warn('LOGENTRIES not defined');
	}
});

getShorts();
setInterval(getShorts, reloadFrequency);
