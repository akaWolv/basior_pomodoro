'use strict';

pomodoroApp.controller('UserCtrl', function ($scope, $rootScope, socket) {
    //$rootScope.user = {
    //    name : undefined,
    //    email : undefined,
    //    current : undefined,
    //    interval : undefined,
    //    state : 'stopped',
    //    md5_hash : undefined
    //};
    $rootScope.user = {};

    $rootScope.$watchCollection('pomodores', function (newValue, oldValue) {
        if (
            angular.isDefined(newValue)
            && angular.isDefined($rootScope.user.email)
            && angular.isDefined(newValue[$rootScope.user.email])
            && (
                angular.isUndefined(oldValue[$rootScope.user.email])
                || (
                    angular.isDefined(oldValue[$rootScope.user.email])
                    && newValue[$rootScope.user.email] != oldValue[$rootScope.user.email]
                )
            )
        ) {
            $rootScope.user = newValue[$rootScope.user.email];
        }
    });

    socket.on('your details', function (details) {
        if (null == details && angular.isDefined($rootScope.user)) {
            // it means that server know nothing about us
            $rootScope.updateConnectionDetails();

            if (angular.isDefined($rootScope.user.email)) {
                $scope.connectUser();
            }
        }

        socket.on('user update ' + $rootScope.user.email, function (details) {
            $rootScope.user = details;
        });
    });

    $rootScope.$watch('timerUp', function (newValue) {
        if (true === newValue) {
            $scope.stopTimer();
            switch ($rootScope.user.interval) {
                case '25':
                    if (confirm('Interval 25\' passed. Switch to interval 5\'?')) {
                        $scope.startTimer('5', 300);
                    }
                    else {
                        // @todo: this is added to prevent confirm() loop if socket failed
                        $rootScope.user.state = 'stopped';
                    }
                    break;
                case '5':
                    if (confirm('Interval 5\' passed. Switch to interval 25\'?')) {
                        $scope.startTimer('25', 1500);
                    }
                    else {
                        // @todo: this is added to prevent confirm() loop if socket failed
                        $rootScope.user.state = 'stopped';
                    }
                    break;
            }
        }
        $rootScope.timerUp = undefined;
    });

    $rootScope.$watchCollection('ConnectionData', function (newValue) {
        $scope.updateDetails(newValue.user_name, newValue.user_email);
    });

    $scope.updateDetails = function (name, email) {
        $rootScope.user.name = name;
        $rootScope.user.email = email;

        $rootScope.user.seconds_left = 0;
        $rootScope.user.state = 'stopped';

        if (angular.isDefined($rootScope.user.email) && angular.isUndefined($rootScope.user.name)) {
            var splited = $rootScope.user.email.split('@');
            $rootScope.user.name = splited[0];
        }

        if (angular.isDefined($rootScope.user.email) && angular.isDefined($rootScope.user.name)) {
            $rootScope.user.md5_hash = calcMD5($rootScope.user.email);

            $scope.connectUser();
        }
    }

    $scope.connectUser = function () {
        socket.emit('connect user', $rootScope.user);
    }

    $scope.startTimer = function (interval, secondsLeft) {
        socket.emit('change timer', {
            state: 'running',
            interval: interval,
            seconds_left: secondsLeft
        });
    }

    $scope.resumeTimer = function () {
        if (0 == $rootScope.user.seconds_left) {
            $scope.stopTimer();
        } else {
            $scope.startTimer($rootScope.user.interval, $rootScope.user.seconds_left);
        }
    }

    $scope.pauseTimer = function () {
        socket.emit('change timer', {
            state: 'paused',
            interval: $rootScope.user.interval,
            seconds_left: $rootScope.user.seconds_left
        });
    }

    $scope.stopTimer = function () {
        socket.emit('change timer', {state: 'stopped', interval: $rootScope.user.interval, seconds_left: 0});
    }

    $scope.actions = [
        {
            action: 'start_25_25',
            text: 'Start 25',
            call_func: '$scope.startTimer(\'25\', 1500)',
            img_class: 'glyphicon-play',
            text_class: 'colors-interval-25'
        },
        {
            action: 'start_5_5',
            text: 'Start 5',
            call_func: '$scope.startTimer(\'5\', 300)',
            img_class: 'glyphicon-play',
            text_class: 'colors-interval-5'
        },
        {
            action: 'start_pause',
            text: 'Pause',
            call_func: '$scope.pauseTimer()',
            img_class: 'glyphicon-pause',
            text_class: 'colors-interval-pause'
        },
        {
            action: 'resume_pause',
            text: 'Resume',
            call_func: '$scope.resumeTimer()',
            img_class: 'glyphicon-play',
            text_class: 'colors-interval-pause'
        },
        {
            action: 'start_stop',
            text: 'Stop',
            call_func: '$scope.stopTimer()',
            img_class: 'glyphicon-stop',
            text_class: 'colors-interval-break'
        }
    ];
    $scope.actions_intervals = [
        {
            action: 'restart_30_25',
            text: 'Restart 30/25',
            call_func: '$scope.startTimer(\'25\', 1800)',
            img_class: 'glyphicon-play',
            text_class: 'colors-interval-25'
        },
        {
            action: 'restart_20_25',
            text: 'Restart 20/25',
            call_func: '$scope.startTimer(\'25\', 1200)',
            img_class: 'glyphicon-play',
            text_class: 'colors-interval-25'
        },
        {
            action: 'restart_15_25',
            text: 'Restart 15/25',
            call_func: '$scope.startTimer(\'25\', 900)',
            img_class: 'glyphicon-play',
            text_class: 'colors-interval-25'
        },
        {
            action: 'restart_10_25',
            text: 'Restart 10/25',
            call_func: '$scope.startTimer(\'25\', 600)',
            img_class: 'glyphicon-play',
            text_class: 'colors-interval-25'
        },
        {
            action: 'restart_5_25',
            text: 'Restart 5/25',
            call_func: '$scope.startTimer(\'25\', 300)',
            img_class: 'glyphicon-play',
            text_class: 'colors-interval-25'
        }//,
        //{action : 'restart_xx_25', text : 'Restart ...', call_func : '$scope.startTimer(\'25\', 3)', img_class : 'glyphicon-play', text_class : 'colors-interval-25'}
    ];

    $scope.isActionVisible = function (action) {
        switch (action) {
            case 'start_pause':
                return $rootScope.user.state == 'running';
            case 'resume_pause':
                return $rootScope.user.state == 'paused';
        }
        return true;
    }

    $scope.call = function (func) {
        eval(func);
    }
});