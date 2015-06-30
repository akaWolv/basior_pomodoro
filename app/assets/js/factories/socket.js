'use strict';

pomodoroApp.factory('socket', function ($rootScope, $location, $timeout, $window) {
    if ('undefined' === typeof io) {
        $rootScope.error_blend = {
            show: true,
            text: 'Socket went away :( <br /> refreshing page in 5 seconds...'
        }

        $rootScope.socket_available = false;

        $timeout(function(){ $window.location.reload() }, 5000);

        return false;
    }

    $rootScope.socket_available = true;

    var failures = 0,
        socket = io.connect($location.host() + ':3001');

    socket.on('connect_error', function () {
        failures += 1;
        $rootScope.error_blend = {
            show: true,
            text:   'Socket went away :( ' +
                    '<br /> ' +
                    'reconnecting... ' +
                    '<br /> <br /> ' +
                    (failures > 1 ? 'Tried ' + failures + ' times so far...' : '')
        }
    });

    socket.on('connect', function () {
        // reset failures
        failures = 0;
        // hide error blend
        $rootScope.error_blend.show = false;
        // check if user is registered
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