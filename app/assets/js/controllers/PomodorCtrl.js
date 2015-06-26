'use strict';

pomodoroApp.controller('PomodorCtrl', function ($scope, $rootScope, socket) {
    //$scope.pomodor = {
    //    current: 0,
    //    email: "",
    //    interval: "",
    //    md5_hash: "",
    //    name: "",
    //    state: "", running/stopped/paused
    //    started_on: "",
    //    current_tme: ""
    //};
    $scope.is_current_user_counter = false;

    $scope.init = function (email) {
        if (angular.isUndefined($rootScope.pomodores[email])) {
            return false;
        }
        $scope.pomodor = $rootScope.pomodores[email];
        //$scope.updateTimer();

        // current user
        if ($scope.pomodor.email == $scope.ConnectionData.user_email) {
            $rootScope.user = $scope.pomodor;
        }

        $scope.calculateCurrentTimeDiff($scope.pomodor.started_on, $rootScope.current_time);

        $scope.is_current_user_counter = $scope.pomodor.email == $scope.ConnectionData.user_email;
    }

    $rootScope.$watch('current_time', function (newValue) {
        $scope.calculateCurrentTimeDiff($scope.pomodor.started_on, newValue);
    });

    socket.on('user update ' + $scope.pomodor.email, function (details) {
        $scope.pomodor = details;
    });

    $rootScope.$watchCollection('pomodores', function (newValue) {
        if (angular.isDefined(newValue[$scope.pomodor.email])) {
            $scope.pomodor = newValue[$scope.pomodor.email];
        }
    });

    $scope.calculateCurrentTimeDiff = function (startedOn, currentTime) {
        var a = new Date(startedOn);
        var b = new Date(currentTime);
        var secondsDiff = parseFloat(b - a) / 1000
        if ('running' == $scope.pomodor.state && false === isNaN(secondsDiff)) {
            if (secondsDiff > $scope.pomodor.seconds_left) {
                $scope.pomodor.current = 0;
                if (true === $scope.is_current_user_counter) {
                    // @todo: current_user?
                    $rootScope.timerUp = true;
                }
            }
            else {
                $scope.pomodor.current = $scope.pomodor.seconds_left - secondsDiff;
            }
        }

        if ($scope.is_current_user_counter) {
            $rootScope.user.current = $scope.pomodor.current;
        }
    }

    $scope.pomodorClass = function () {
        var name = '';
        switch ($scope.pomodor.state) {
            case 'running':
                switch ($scope.pomodor.interval) {
                    case '5':
                        name = 'colors-interval-5'
                        break;
                    case '25':
                        name = 'colors-interval-25'
                        break;
                    default:
                        name = 'colors-interval-break'
                        break;
                }
                break;
            case 'stopped':
                name = 'colors-interval-break'
                break;
            case 'paused':
                name = 'colors-interval-pause'
                break;
        }
        return name;
    }

    $scope.pomodorText = function () {
        var text = '';
        switch ($scope.pomodor.state) {
            case 'running':
                switch ($scope.pomodor.interval) {
                    case '5':
                        text = 'minor tasks'
                        break;
                    case '25':
                        text = 'do not disturb'
                        break;
                    default:
                        text = 'waiting'
                        break;
                }
                break;
            case 'stopped':
                text = 'waiting'
                break;
            case 'paused':
                text = 'idle'
                break;
        }
        return text;
    }
});