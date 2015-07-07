var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// rooms which are currently available in chat

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

var channels_users = {},
    disconnect_timers = {},
    notify_status_change = {},
    users_last_sockets = {};

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

            broadcastUsersListInChannel();

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
            users_last_sockets[details.email] = socket;

            var continueRegistering = false;
            for (var k in details) {
                if (undefined != details[k] || undefined != socket.user || details[k] != socket.user) {
                    continueRegistering = true;
                    break;
                }
            }

            // jezeli user podal juz dane
            unregisterUserFromPipe();

            if (true === getUserFromPipe(details.email)) {
                // @todo: unfinished?
                alreadyConnected = true;
            }
            else {
                socket.user = details;
            }

            registerUserToPipe();

            broadcastUserUpdate();

            broadcastUsersListInChannel();

            infoLog('USER CONNECTED', details);
        }
    });

    socket.on('change timer', function(details){
        stopDisconnectTimer();

        if (undefined == socket.user)
        {
            return false;
        }

        var oldDetails = JSON.parse(JSON.stringify(socket.user));

        socket.user.interval = details.interval;
        socket.user.seconds_left = details.seconds_left;
        socket.user.current = details.seconds_left;
        socket.user.state = details.state;
        socket.user.started_on = new Date();

        // add more info
        channels_users[socket.picked_pipe][socket.user.email] = socket.user;

        broadcastUserUpdate();

        broadcastUserStatusChange(oldDetails, socket.user);

        infoLog('CHANGE TIMER', details);
    });

    socket.on('give me user list', function(){
        stopDisconnectTimer();

        if (undefined != socket.picked_pipe) {
            addCurrentTimer();

            socket.emit('users list', channels_users[socket.picked_pipe]);
        }
    });

    socket.on('who am i', function(){
        stopDisconnectTimer();

        socket.emit('your details', socket.user);
        socket.emit('your picked pipe', socket.picked_pipe);
        socket.emit('are you connected to pipe', checkIsUserConnectedToPipe());

        infoLog('ASKED FOR DETAILS');
    });

    socket.on('notify status change', function(msg){
        stopDisconnectTimer();

        // check/define list
        if (undefined == notify_status_change[msg.about_who]) {
            notify_status_change[msg.about_who] = [];
        }

        var added = false;
        // check if we already have notifaction request
        if (-1 === notify_status_change[msg.about_who].indexOf(msg.to_who)) {
            notify_status_change[msg.about_who].push(msg.to_who);
            added = true;
        }

        var info = msg;
        info.added = added;
        infoLog('NOTIFY STATUS REQUEST', info);
    });

    socket.on('ignore status change', function(msg){
        stopDisconnectTimer();

        // nothing to do if list is not defined
        if (undefined == notify_status_change[msg.about_who]) {
            return true;
        }

        var removed = false;
        // check if we have notifaction request
        var searchValue = notify_status_change[msg.about_who].indexOf(msg.to_who);
        if (-1 < searchValue) {
            notify_status_change[msg.about_who].splice(searchValue, 1);
            removed = true;
        }

        var info = msg;
        info.removed = removed;
        infoLog('NOTIFY STATUS IGNORE', info);
    });

    var checkIsUserConnectedToPipe = function() {
        if (
            undefined == socket.user
            || undefined == socket.user.email
            || undefined == channels_users[socket.picked_pipe][socket.user.email]
        ) {
            return false;
        }
        return true;
    }

    var getUserFromPipe = function(email) {
        if (undefined != socket.picked_pipe && undefined != channels_users[socket.picked_pipe] && undefined != channels_users[socket.picked_pipe][email]) {
            socket.user = channels_users[socket.picked_pipe][email];
            return true;
        }
        return false;
    }

    var broadcastUserUpdate = function() {
        io.sockets.in(socket.picked_pipe).emit('user update ' + socket.user.email, socket.user);

        infoLog('USERS BROADCASTED');
    }

    var broadcastUserStatusChange = function(oldDetails, newDetails) {
        // nothing to do if list is not defined
        if (undefined == notify_status_change[socket.user.email] || 0 == notify_status_change[socket.user.email].length) {
            return false;
        }

        for (var k in notify_status_change[socket.user.email]) {
            var user_to_notify = notify_status_change[socket.user.email][k];
            if (undefined != users_last_sockets[user_to_notify]) {
                users_last_sockets[user_to_notify].emit('user status change notification', {
                    name : socket.user.name,
                    email : socket.user.email,
                    md5_hash : socket.user.md5_hash,
                    from_state : oldDetails.state,
                    from_interval : oldDetails.interval,
                    to_state : newDetails.state,
                    to_interval : newDetails.interval
                });
            }
            // clear the list
            notify_status_change[socket.user.email] = [];
        }

        infoLog('USERS STATUS CHANGE BROADCASTED');
    }

    var registerUserToPipe = function() {
        if (undefined == channels_users[socket.picked_pipe]) {
            channels_users[socket.picked_pipe] = {};
        }

        if (undefined != socket.picked_pipe && undefined != socket.user && undefined != socket.user.email && undefined != channels_users[socket.picked_pipe]) {
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

    var broadcastUsersListInChannel = function() {
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

    // @todo
    var stopDisconnectTimer = function() {
        //if (undefined != socket.user && undefined != socket.user.email && undefined != disconnect_timers[socket.picked_pipe] && undefined != disconnect_timers[socket.picked_pipe][socket.user.email]) {
        //    clearInterval(disconnect_timers[socket.picked_pipe][socket.user.email]);
        //    delete disconnect_timers[socket.picked_pipe][socket.user.email];
        //    infoLog('DISCONNECT TIMER STOPPED', {email : socket.user.email});
        //}
    }

    socket.on('disconnect', function() {
        if (undefined != socket.user && undefined != socket.user.email) {

            infoLog('DISCONNECT TIMER STARTED 5\'', {email : socket.user.email});
            if (undefined == disconnect_timers[socket.picked_pipe]) {
                disconnect_timers[socket.picked_pipe] = {};
            }

            disconnect_timers[socket.picked_pipe][socket.user.email] = setInterval(function(){
                //unregisterUserFromPipe();
                //broadcastUsersListInChannel();
                //infoLog('DISCONNECT', {email : socket.user.email});
                infoLog('SHOULD DISCONNECT', {email : socket.user.email});
                //clearInterval(disconnect_timers[socket.user.email]);
                //delete disconnect_timers[socket.user.email];
            }, 300000);
        }
    });

    infoLog('JOIN');
});


http.listen(3001, function(){
    console.log('listening on *:3001');
});