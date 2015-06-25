'use strict';

// Declare app level module which depends on filters, and services
var pomodoroApp = angular.module('PomodoroApp', ['ngSanitize']);

pomodoroApp.factory('socket', function ($rootScope, $location, $interval) {
    if ('undefined' === typeof io)
    {
        return false;
    }
    var failures = 0;
// @todo: time sync?
    var socket = io.connect($location.host() + ':3001');
    socket.on('connect_error', function() {
        failures += 1;
        $rootScope.errorBlend(true,
            'Socket went away :( ' +
            '<br /> ' +
            'reconnecting... ' +
            '<br /> <br /> ' +
            (failures > 1 ? 'Tried ' + failures + ' times so far...' : '')
        );
    });
    socket.on('connect', function() {
        failures = 0;
        $rootScope.errorBlend(false);

        if (angular.isDefined($rootScope.ConnectionData.picked_pipe) || angular.isDefined($rootScope.ConnectionData.user_email)) {
            // check if user is registered
            socket.emit('who am i');
        }
    });

    // keep connection up
    $interval(function(){ socket.emit('i am awake'); }, 30000);

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

pomodoroApp.controller('MainCtrl', function($scope, $rootScope, $location, socket, $interval, $window) {
    // @todo?
    //$window.onfocus = function(){
        //console.log("focused");
        //socket.emit('give me user list');
    //}
    $rootScope.error_blend = false;
    $rootScope.error_blend_text = '';
    $rootScope.errorBlend = function(status, text) {
        $rootScope.error_blend = true === status;

        if (angular.isString(text)){
            $rootScope.error_blend_text = text;
        } else {
            $rootScope.error_blend_text = '';
        }
    };

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

    $scope.$checkIfUserLogged = function() {
        if ( angular.isDefined($scope.ConnectionForm.channel_name) == false) {

            var $lineTop    = $('.user-menu-toggle .line-top'),
                $lineMiddle = $('.user-menu-toggle .line-middle'),
                $lineBottom = $('.user-menu-toggle .line-bottom'),
                time        = 200,
                rotateClass = 'rotate',
                hoverClass  = 'hover';

            $(".bg-layer").addClass("show");
            $(".user-menu").removeClass("hide");
            $(".user-menu").addClass("user-menu-display");

            var transitionTop    = $lineTop.addClass(hoverClass),
                transitionMiddle = $lineMiddle.addClass(hoverClass),
                transitionBottom = $lineBottom.addClass(hoverClass);

            setTimeout(function() {
                transitionTop.addClass(rotateClass);
                transitionMiddle.addClass(rotateClass);
                transitionBottom.addClass(rotateClass);
            }, time);
        }
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

    $scope.closeMenu = function() {
        var $lineTop     = $('.user-menu-toggle .line-top'),
            $lineMiddle  = $('.user-menu-toggle .line-middle'),
            $lineBottom  = $('.user-menu-toggle .line-bottom'),
            time        = 200,
            rotateClass = 'rotate',
            hoverClass  = 'hover';

        $(".user-menu").toggleClass("user-menu-display");
        $(".user-menu").removeClass("hide");
        $(".bg-layer").toggleClass("show");

        var transitionTop    = $lineTop.removeClass(rotateClass),
            transitionMiddle = $lineMiddle.removeClass(rotateClass),
            transitionBottom = $lineBottom.removeClass(rotateClass);

        setTimeout(function() {
            transitionTop.removeClass(hoverClass);
            transitionMiddle.removeClass(hoverClass);
            transitionBottom.removeClass(hoverClass);
        }, time);
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

    $scope.$checkIfUserLogged();

    $interval(function(){
        $rootScope.current_time = new Date();
        $rootScope.timer_running = true;
    }, 1000);
});

pomodoroApp.controller('ChannelCtrl', function($scope, $rootScope, socket) {
    $scope.channel = {};
    $rootScope.pomodores = {};

    $rootScope.$watchCollection('ConnectionData.channel_name', function(newValue) {
        $scope.channel.name = newValue;
        socket.emit('pick pipe', {pipe : newValue});
    });

    socket.on('users list', function(pomodores) {
        $rootScope.timer_running = false;
        $rootScope.pomodores = pomodores;
    });

    socket.on('you picked pipe', function(picked_pipe){
        if (null == picked_pipe && angular.isDefined($scope.channel.name)) {
            // it means that server know nothing about us
            $scope.updateConnectionDetails();

            socket.emit('pick pipe', {pipe : $scope.channel.name});
        }
    });
});

pomodoroApp.controller('PomodorCtrl', function($scope, $rootScope, socket) {
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

    $scope.init = function(email) {
        if (angular.isUndefined($rootScope.pomodores[email])) {
            return false;
        }
        $scope.pomodor = $rootScope.pomodores[email];
        //$scope.updateTimer();

        // current user
        if ($scope.pomodor.email == $scope.ConnectionData.user_email) {
            $rootScope.current_user = $scope.pomodor;
        }

        $scope.calculateCurrentTimeDiff($scope.pomodor.started_on, $rootScope.current_time);

        $scope.is_current_user_counter = $scope.pomodor.email == $scope.ConnectionData.user_email;
    }

    $rootScope.$watch('current_time', function(newValue){
        $scope.calculateCurrentTimeDiff($scope.pomodor.started_on, newValue);
    });

    socket.on('user update ' + $scope.pomodor.email, function(details){
        $scope.pomodor = details;
    });

    $rootScope.$watchCollection('pomodores', function(newValue){
        if (angular.isDefined(newValue[$scope.pomodor.email]))
        {
            $scope.pomodor = newValue[$scope.pomodor.email];
        }
    });

    $scope.calculateCurrentTimeDiff = function(startedOn, currentTime) {
        var a = new Date(startedOn);
        var b = new Date(currentTime);
        var secondsDiff = parseFloat(b - a) / 1000
        if ('running' == $scope.pomodor.state && false === isNaN(secondsDiff)) {
            if (secondsDiff > $scope.pomodor.seconds_left) {
                $scope.pomodor.current = 0;
                if (true === $scope.is_current_user_counter){
                    // @todo: current_user?
                    $rootScope.timerUp = true;
                }
            }
            else {
                $scope.pomodor.current = $scope.pomodor.seconds_left - secondsDiff;
            }
        }

        if ($scope.is_current_user_counter) {
            $rootScope.current_user.current = $scope.pomodor.current;
        }
    }

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

    $rootScope.$watchCollection('pomodores', function(newValue, oldValue){
        if (undefined != newValue && newValue[$scope.user.email] != oldValue[$scope.user.email]) {
            $scope.user = newValue[$scope.user.email];
            if ($scope.user.state == 'paused') {
                $scope.paused = true;
            }
        }
    });

    socket.on('your details', function(details){
        if (null == details && angular.isDefined($scope.user)) {
            // it means that server know nothing about us
            $scope.updateConnectionDetails();

            socket.emit('connect user', $scope.user);
            console.log('resend user details');
        }
    });

    socket.on('user update ' + $scope.user.email, function(details){
        $scope.user = details;
    });

    $rootScope.$watch('timerUp', function(newValue){
        if (true === newValue)
        {
            $scope.stopTimer();
            switch ($scope.user.interval) {
                case '25':
                    if (confirm('Interval 25\' passed. Switch to interval 5\'?')) {
                        $scope.startTimer('5', 300);
                    }
                    else {
                        // @todo: this is added to prevent confirm() loop if socket failed
                        $scope.user.state = 'stopped';
                    }
                    break;
                case '5':
                    if (confirm('Interval 5\' passed. Switch to interval 25\'?')) {
                        $scope.startTimer('25', 1500);
                    }
                    else {
                        // @todo: this is added to prevent confirm() loop if socket failed
                        $scope.user.state = 'stopped';
                    }
                    break;
            }
        }
        $rootScope.timerUp = undefined;
    });

    $rootScope.$watchCollection('ConnectionData', function(newValue){
        $scope.user.name = newValue.user_name;
        $scope.user.email = newValue.user_email;

        $scope.user.seconds_left = 0;
        $scope.user.state = 'stopped';

        if (angular.isDefined($scope.user.email) && angular.isUndefined($scope.user.name)) {
            var splited = $scope.user.email.split('@');
            $scope.user.name = splited[0];
        }

        if (angular.isDefined($scope.user.email) && angular.isDefined($scope.user.name)) {
            $scope.user.md5_hash = calcMD5($scope.user.email);

            socket.emit('connect user', $scope.user);
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
        else if (0 == $scope.user.seconds_left) {
            $scope.stopTimer();
        }
        else {
            socket.emit('change timer', {state : 'running', interval : $scope.user.interval, seconds_left : $scope.user.seconds_left});
        }
    }

    $scope.stopTimer = function() {
        $scope.paused = false;
        socket.emit('change timer', {state : 'stopped', interval : $scope.user.interval, seconds_left : 0});
    }

    $scope.actions = [
        {action : 'start_25_25', text : 'Start 25', call_func : '$scope.startTimer(\'25\', 1500)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'},
        {action : 'start_5_5', text : 'Start 5', call_func : '$scope.startTimer(\'5\', 300)', img_class : 'glyphicon-play', text_class : 'colors-interval-5'},
        {action : 'start_pause', text : 'Pause', call_func : '$scope.pauseTimer()', img_class : 'glyphicon-pause', text_class : 'colors-interval-pause'},
        {action : 'resume_pause', text : 'Resume', call_func : '$scope.pauseTimer()', img_class : 'glyphicon-play', text_class : 'colors-interval-pause'},
        {action : 'start_stop', text : 'Stop', call_func : '$scope.stopTimer()', img_class : 'glyphicon-stop', text_class : 'colors-interval-break'}
    ];
    $scope.actions_intervals = [
        {action : 'restart_30_25', text : 'Restart 30/25', call_func : '$scope.startTimer(\'25\', 1800)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'},
        {action : 'restart_20_25', text : 'Restart 20/25', call_func : '$scope.startTimer(\'25\', 1200)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'},
        {action : 'restart_15_25', text : 'Restart 15/25', call_func : '$scope.startTimer(\'25\', 900)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'},
        {action : 'restart_10_25', text : 'Restart 10/25', call_func : '$scope.startTimer(\'25\', 600)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'},
        {action : 'restart_5_25', text : 'Restart 5/25', call_func : '$scope.startTimer(\'25\', 300)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'}//,
        //{action : 'restart_xx_25', text : 'Restart ...', call_func : '$scope.startTimer(\'25\', 3)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'}
    ];

    $scope.isActionVisible = function(action) {
        switch (action) {
            case 'start_pause':
                return $scope.user.state != 'paused';
            case 'resume_pause':
                return $scope.user.state == 'paused';
        }
        return true;
    }

    $scope.call = function(func) {
        eval(func);
    }
});