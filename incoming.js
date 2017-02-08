var fs = require('fs');
var fname, stream;
var stat = {}
var sh = require('child_process');

function log(o) {
  var ts = (new Date()).toISOString().slice(0,13); 
  var fname2 = __dirname + "/logs/log-" + ts + '.jsonl';
  if(fname2 !== fname) {
    if(stream) { 
      stream.end(); 
      var prevFname = fname;
      setTimeout(() =>
        sh.exec('xz -9 ' + prevFname),
        3000);
      fs.writeFile(__dirname + "/public/" + ts.replace(/[^-0-9]/g,'-') + '.json', 
        JSON.stringify(stat), 'utf-8');
      stat = {};
    }
    fname = fname2;
    stream = fs.createWriteStream(fname, {flags: 'a'});
  }
  stat[o.type] = (stat[o.type] | 0) + 1;
  stream.write(JSON.stringify(o) + "\n");
}

require('http').createServer(function(req, res) {
  var o = req.headers;
  if(req.method === "POST") {
    /*
    if( o["x-real-ip"] === "77.75.164.25" ||
        o["x-real-ip"] === "79.98.198.139" ||
        o["x-real-ip"] === "90.185.98.167"
        ) { return res.end(""); }
        */
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    var s = "";
    var logId = ("" + Math.random()).slice(2);
    o.logId = logId;
    o.timestamp = (new Date()).toISOString();
    o.type = "incoming/entries";
    log(o);
    req.on('data', data => s += data);
    req.on('end', function() {
      res.end("");
      try {
        var a = JSON.parse(s);
        if(!Array.isArray(a)) {
          throw Error;
        }
        a.forEach(function(o) {
          if(o.constructor !== Object || o.type === "incoming/entries") {
            log({logId, type: "incoming/error", data: o});
          } else {
            o.logId = logId;
            log(o);
          }
        });
      } catch(e) {
        log({logId,
          type: "incoming/error",
          data: s});
      }
    });
  } else {
    if(req.url.startsWith("/log.js?")) {
      if(o["x-real-ip"] === "77.75.164.25") { return res.end(""); }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.end("");
      o.type = "get/" + req.url.slice(8);
      o.timestamp = (new Date()).toISOString();
      log(o);
    } else {
      fs.readFile( __dirname + "/public/" + 
            req.url.slice(1).replace(/[^-a-zA-Z0-9._]/g, ""), 
          (err, data) => res.end(data));
    }
  }
}).listen(8888, o=>console.log('Listening on port 8888'));
