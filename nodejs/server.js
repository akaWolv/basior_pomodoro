var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// rooms which are currently available in chat

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

var channels_users = {};
var disconnect_timers = {}

io.on('connection', function(socket){
    socket.user = undefined;
    socket.picked_pipe = undefined;

    socket.on('pick pipe', function(cmd){
        stopDisconnectTimer();

        if (undefined != cmd.pipe)
        {
            socket.join(cmd.pipe);
            socket.picked_pipe = cmd.pipe;

            if (undefined == channels_users[socket.picked_pipe]) {
                channels_users[socket.picked_pipe] = {};
            }

            registerUserToPipe();

            emitUsersListInChannel();

            infoLog('PIPE PICKED', {'pipe' : socket.picked_pipe});
        }
        else if (undefined != socket.picked_pipe){
            socket.join(socket.picked_pipe);
            infoLog('PIPE LEFT', {'pipe' : socket.picked_pipe});
        }
    });

    socket.on('connect user', function(details){
        stopDisconnectTimer();

        if (undefined != details && undefined != details.email)
        {
            // jezeli user podal juz dane
            unregisterUserFromPipe();

            var alreadyConnected = false;
            if (socket.user) {
                alreadyConnected = true;
            }

            socket.user = details;

            registerUserToPipe();

            if (alreadyConnected) {
                io.sockets.in(socket.picked_pipe).emit('user update ' + socket.user.email, socket.user);
            }
            else {
                emitUsersListInChannel();
            }

            infoLog('USER CONNECTED', details);
        }
    });

    socket.on('change timer', function(details){
        stopDisconnectTimer();

        if (undefined == socket.user)
        {
            return false;
        }

        socket.user.interval = details.interval;
        socket.user.current = details.seconds_left;
        socket.user.state = details.state;

        channels_users[socket.picked_pipe][socket.user.email] = socket.user;
        channels_users[socket.picked_pipe][socket.user.email].started_on = new Date();

        io.sockets.in(socket.picked_pipe).emit('user update ' + socket.user.email, socket.user);

        infoLog('CHANGE TIMER', details);
    });


    var registerUserToPipe = function() {
        if (undefined != socket.picked_pipe && undefined != socket.user && undefined != socket.user.email) {
            channels_users[socket.picked_pipe][socket.user.email] = socket.user;

            infoLog('USER REGISTERED TO PIPE', {pipe : socket.picked_pipe, user : socket.user.email});
        }
    }

    var unregisterUserFromPipe = function() {
        if (undefined != socket.picked_pipe && undefined != socket.user && undefined != socket.user.email) {
            delete channels_users[socket.picked_pipe][socket.user.email];
        }
    }

    var addCurrentTimer = function() {
        if (undefined != socket.picked_pipe) {
            for (var k in channels_users[socket.picked_pipe]) {
                channels_users[socket.picked_pipe][k].current_time = new Date();
            }
        }
    }

    var emitUsersListInChannel = function() {
        if (undefined != socket.picked_pipe) {
            addCurrentTimer();

            io.sockets.in(socket.picked_pipe).emit('users list', channels_users[socket.picked_pipe]);
        }
    }

    var infoLog = function(log_name, log) {
        var info_log = {};
        info_log.pipe = socket.picked_pipe;
        info_log.client_id = socket.client.id;
        info_log.ip = socket.conn.remoteAddress;
        // merge two objects
        if (undefined != log && 'object' === typeof log) {
            for (var attrname in log) {
                info_log[attrname] = log[attrname];
            }
        }
        var logDate = new Date();
        logDate = logDate.toISOString().split('T').join(' ').split('Z').join('');
        console.log(logDate + '|' + log_name + '|' + JSON.stringify(info_log));
    }

    var stopDisconnectTimer = function() {
        if (undefined != socket.user && undefined != socket.user.email && undefined != disconnect_timers[socket.user.email]) {
            clearInterval(disconnect_timers[socket.user.email]);
            infoLog('DISCONNECT TIMER STOPPED', {email : socket.user.email});
        }
    }

    socket.on('disconnect', function() {
        if (undefined != socket.user && undefined != socket.user.email) {

            infoLog('DISCONNECT TIMER STARTED 5\'', {email : socket.user.email});
            disconnect_timers[socket.user.email] = setInterval(function(){
                unregisterUserFromPipe();
                emitUsersListInChannel();
                infoLog('DISCONNECT', {email : socket.user.email});
                clearInterval(disconnect_timers[socket.user.email]);
                delete disconnect_timers[socket.user.email];
            }, 1800000);
        }
    });

    infoLog('JOIN');
});


http.listen(3001, function(){
    console.log('listening on *:3001');
});