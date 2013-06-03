
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 5000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('release'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
// app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);

// io.configure(function(){
//     io.set('transports', ['xhr-polling']);
//     io.set('polling duration', 300);
// });

var imgData = [];
var imgId   = 0;

// エコー
io.sockets.on('connection', function(socket){
    socket.emit('assets', {'images': imgData, 'currImgId': imgId -1});
    socket.on('assets-rqst', function(data){
        console.log('receive assets-rqst');
        socket.emit('assets', {'images': imgData, 'currImgId': imgId -1});
    });

    socket.on('upload', function(data){
        data.file        = data.file.replace(/10/g , '11');
        imgData[imgId] = data.file;
        data.id          = imgId;
        io.sockets.emit('uploaded', data);
        imgId += 1;
        if(imgId >= 7){imgId = 0;}
    });
});
