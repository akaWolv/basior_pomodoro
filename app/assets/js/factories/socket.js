'use strict';

pomodoroApp.factory('socket', function ($rootScope, $location, $interval) {
    if ('undefined' === typeof io) {
        return false;
    }

    var failures = 0,
        socket = io.connect($location.host() + ':3001');

    socket.on('connect_error', function () {
        failures += 1;
        $rootScope.errorBlend(true,
            'Socket went away :( ' +
            '<br /> ' +
            'reconnecting... ' +
            '<br /> <br /> ' +
            (failures > 1 ? 'Tried ' + failures + ' times so far...' : '')
        );
    });
    socket.on('connect', function () {
        failures = 0;
        $rootScope.errorBlend(false);

        if (angular.isDefined($rootScope.ConnectionData.picked_pipe) || angular.isDefined($rootScope.ConnectionData.user_email)) {
            // check if user is registered
            socket.emit('who am i');
        }
    });

    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});