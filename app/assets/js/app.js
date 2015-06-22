'use strict';

// Declare app level module which depends on filters, and services
var pomodoroApp = angular.module('PomodoroApp', []);

pomodoroApp.factory('socket', function ($rootScope, $location) {
    if ('undefined' === typeof io)
    {
        return false;
    }

    var socket = io.connect($location.host() + ':3001');
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

pomodoroApp.filter('secondsToDateTime', [function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}]);

pomodoroApp.controller('MainCtrl', function($scope, $rootScope, $location, socket) {
    $rootScope.ConnectionData = {
        channel_name : undefined,
        user_email : undefined,
        user_name : undefined
    }

    $scope.ConnectionForm = {
        channel_name : undefined,
        user_email : undefined,
        user_name : undefined
    }

    $scope.updateConnectionDetails = function() {
        if (angular.isDefined($scope.ConnectionForm.channel_name) && 0 < $scope.ConnectionForm.channel_name.length) {
            $rootScope.ConnectionData.channel_name = $scope.ConnectionForm.channel_name;
            if (angular.isDefined($scope.ConnectionForm.user_email) && 0 < $scope.ConnectionForm.user_email.length) {
                $rootScope.ConnectionData.user_email = $scope.ConnectionForm.user_email;
                if (angular.isDefined($scope.ConnectionForm.user_name) && 0 < $scope.ConnectionForm.user_name.length) {
                    $rootScope.ConnectionData.user_name = $scope.ConnectionForm.user_name;
                }
                else {
                    $rootScope.ConnectionData.user_name = undefined;
                }
            }
            else {
                $rootScope.ConnectionData.user_email = undefined;
                $rootScope.ConnectionData.user_name = undefined;
            }
        }
        else {
            $rootScope.ConnectionData.channel_name = undefined;
            $rootScope.ConnectionData.user_email = undefined;
            $rootScope.ConnectionData.user_name = undefined;
        }

        $scope.$updateUrl();
    }

    $scope.$updateUrl = function() {
        var url_parts = [];

        if (angular.isDefined($scope.ConnectionData.channel_name)) {
            url_parts.push($scope.ConnectionData.channel_name);
            if (angular.isDefined($scope.ConnectionData.user_email)) {
                url_parts.push($scope.ConnectionData.user_email);
                if (angular.isDefined($scope.ConnectionData.user_name)) {
                    url_parts.push($scope.ConnectionData.user_name);
                }
            }
        }

        var url = url_parts.join('/');
        $location.path('/' + url);
    }

    $scope.$current_path = function(){
        var path = $location.path.call($location);
        var path_splitted = path.split('/');
        var result_list = [];
        for(var k in path_splitted) {
            if (0 < path_splitted[k].length) {
                result_list.push(path_splitted[k]);
            }
        }

        return result_list;
    };

    $scope.$formValuesFromUrl = function() {
        var url_details = $scope.$current_path();

        $scope.ConnectionForm.channel_name = angular.isDefined(url_details[0]) ? url_details[0] : undefined;
        $scope.ConnectionForm.user_email = angular.isDefined(url_details[1]) ? url_details[1] : undefined;
        $scope.ConnectionForm.user_name = angular.isDefined(url_details[2]) ? url_details[2] : undefined;
        $scope.updateConnectionDetails();
    }
    $scope.$formValuesFromUrl();
});

pomodoroApp.controller('ChannelCtrl', function($scope, $rootScope, socket) {
    $scope.channel = {};
    $scope.pomodores = {};

    $rootScope.$watchCollection('ConnectionData.channel_name', function(newValue) {
        $scope.channel.name = newValue;
        socket.emit('pick pipe', {pipe : newValue});
    });

    socket.on('users list', function(pomodores) {
        $scope.pomodores = pomodores;
    });
});

pomodoroApp.controller('PomodorCtrl', function($scope, $rootScope, socket, $interval) {
    //$scope.pomodor = {
    //    current: 0,
    //    email: "",
    //    interval: "",
    //    md5_hash: "",
    //    name: "",
    //    state: "",
    //    started_on: "",
    //    current_tme: ""
    //};

    $scope.init = function(pomodor) {
        $scope.pomodor = pomodor;
        $scope.updateTimer();

        // current user
        if ($scope.pomodor.email == $scope.ConnectionData.user_email) {
            $rootScope.current_user = $scope.pomodor;
        }
    }

    $scope.tick = function(){
        if ('running' == $scope.pomodor.state) {
            if (0 >= $scope.pomodor.current) {
                if ($scope.pomodor.email == $scope.ConnectionData.user_email) {
                    $rootScope.timerUp = true;
                }
            }
            else {
                $scope.pomodor.current--;
            }
        }
    }
    $scope.counter = $interval(function(){ $scope.tick(); }, 1000);

    socket.on('user update ' + $scope.pomodor.email, function(details){
        $scope.pomodor = details;
    });

    $scope.pomodorClass = function() {
        var name = '';
        switch ($scope.pomodor.state)
        {
            case 'running':
                switch ($scope.pomodor.interval)
                {
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

    $scope.pomodorText = function() {
        var text = '';
        switch ($scope.pomodor.state)
        {
            case 'running':
                switch ($scope.pomodor.interval)
                {
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

    $scope.updateTimer = function() {
        var date1 = new Date($scope.pomodor.started_on);
        var date2 = new Date($scope.pomodor.current_time);

        var diff = date2 - date1;
        var diffSeconds = diff / 1000;
        if (NaN != diffSeconds && 0 < $scope.pomodor.current - diffSeconds) {
            $scope.pomodor.current -= diffSeconds;
        }
        else {
            $scope.pomodor.current = 0;
            $scope.pomodor.state = 'stopped';
        }
    }
});

pomodoroApp.controller('UserCtrl', function($scope, $rootScope, socket) {
    //$scope.user = {
    //    name : undefined,
    //    email : undefined,
    //    current : undefined,
    //    interval : undefined,
    //    state : 'stopped',
    //    md5_hash : undefined
    //};
    $scope.user = {};
    $scope.paused = false;

    $rootScope.$watch('timerUp', function(newValue){
        if (true === newValue)
        {
            $scope.stopTimer();
            switch ($scope.user.interval) {
                case '25':
                    if (confirm('Interval 25\' passed. Switch to interval 5\'?')) {
                        $scope.startTimer('5', 300);
                    }
                    break;
                case '5':
                    if (confirm('Interval 5\' passed. Switch to interval 25\'?')) {
                        $scope.startTimer('25', 1500);
                    }
                    break;
            }
        }
        $rootScope.timerUp = undefined;
    });

    $rootScope.$watchCollection('ConnectionData', function(){
        $scope.user.name = $rootScope.ConnectionData.user_name;
        $scope.user.email = $rootScope.ConnectionData.user_email;

        if (angular.isDefined($scope.user.email) && angular.isUndefined($scope.user.name)) {
            var splited = $scope.user.email.split('@');
            $scope.user.name = splited[0];
        }

        if (angular.isDefined($scope.user.email) && angular.isDefined($scope.user.name)) {
            $scope.user.md5_hash = calcMD5($scope.user.email);
            socket.emit('connect user', $scope.user);
        }


        socket.on('user update ' + $scope.user.email, function(details){
            $scope.user = details;
        });
    });

    $rootScope.$watchCollection('current_user', function(newValue){
        if (undefined != newValue)
        {
            $scope.user.current = newValue.current;
            $scope.user.interval = newValue.interval;
            $scope.user.state = newValue.state;
            $scope.user.md5_hash = newValue.md5_hash;

            socket.emit('change timer', {state : $scope.user.state, interval : $scope.user.interval, seconds_left : $scope.user.current});
        }
    });

    $scope.startTimer = function(interval, secondsLeft) {
        $scope.paused = false;
        socket.emit('change timer', {state : 'running', interval : interval, seconds_left : secondsLeft});
    }

    $scope.pauseTimer = function() {
        $scope.paused = !$scope.paused
        if (true === $scope.paused) {
            socket.emit('change timer', {state : 'paused', interval : $scope.user.interval, seconds_left : $scope.user.current});
        }
        else {
            socket.emit('change timer', {state : 'running', interval : $scope.user.interval, seconds_left : $scope.user.current});
        }
    }

    $scope.stopTimer = function() {
        $scope.paused = false;
        socket.emit('change timer', {state : 'stopped', interval : $scope.user.interval, seconds_left : 0});
    }

    $scope.actions = [
        {action : 'Start 25', call_func : '$scope.startTimer(\'25\', 1500)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'},
        {action : 'Start 5', call_func : '$scope.startTimer(\'5\', 300)', img_class : 'glyphicon-play', text_class : 'colors-interval-5'},
        {action : 'Pause', call_func : '$scope.pauseTimer()', img_class : 'glyphicon-pause', text_class : 'colors-interval-pause'},
        {action : 'Stop', call_func : '$scope.stopTimer()', img_class : 'glyphicon-stop', text_class : 'colors-interval-break'}
    ];
    $scope.actions_intervals = [
        {action : 'Restart 30/25', call_func : '$scope.startTimer(\'25\', 1800)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'},
        {action : 'Restart 20/25', call_func : '$scope.startTimer(\'25\', 1200)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'},
        {action : 'Restart 15/25', call_func : '$scope.startTimer(\'25\', 900)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'},
        {action : 'Restart 10/25', call_func : '$scope.startTimer(\'25\', 600)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'},
        {action : 'Restart 5/25', call_func : '$scope.startTimer(\'25\', 300)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'}
    ];

    $scope.call = function(func) {
        eval(func);
    }
});