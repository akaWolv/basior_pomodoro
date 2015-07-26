'use strict';

pomodoroApp.controller('MainCtrl', function ($scope, $rootScope, $location, socket, $interval, notification) {

    /**
     * dark layout switch
     * @type {boolean}
     */
    this.darkMode = false;

    /**
     * prevents burn-in effect on LCD screen
     * @type {boolean}
     */
    this.burnInGuard = false;

    $scope.ConnectionForm = {
        channel_name: undefined,
        user_email: undefined,
        user_name: undefined
    }

    // update connection details params
    $rootScope.updateConnectionDetails = function () {
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

    // update url with form data
    $scope.$updateUrl = function () {
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


    // get values form url, fill form and update connection details
    $scope.$formValuesFromUrl = function () {
        var url_details = [],
            path = $location.path.call($location),
            path_splitted = path.split('/');

        for (var k in path_splitted) {
            if (0 < path_splitted[k].length) {
                url_details.push(path_splitted[k]);
            }
        }

        $scope.ConnectionForm.channel_name = angular.isDefined(url_details[0]) ? url_details[0] : undefined;
        $scope.ConnectionForm.user_email = angular.isDefined(url_details[1]) ? url_details[1] : undefined;
        $scope.ConnectionForm.user_name = angular.isDefined(url_details[2]) ? url_details[2] : undefined;
        $rootScope.updateConnectionDetails();
    }
    $scope.$formValuesFromUrl();

    socket.on('user status change notification', function(msg) {
        $rootScope.notifyAboutStatusChange[msg.email] = undefined;

        var minutes_set = 'running' == msg.to_state ? msg.seconds_set / 60 : undefined;

        notification.show({
            title: msg.name + ' has changed status',
            body: 'new status: ' +
                (
                    'running' == msg.to_state
                    ? 'interval ' + (msg.to_interval != minutes_set ? minutes_set + '\' / ' : '') + msg.to_interval + '\''
                    : msg.to_state
                ),
            icon: 'http://www.gravatar.com/avatar/' + msg.md5_hash,
            nativeNotificationAdditionalBody: '\n\n(click to show channel)',
            nativeNotificationFocusOnClick: true
        });
    });

    // timers
    // clock
    $interval(function () {
        $rootScope.current_time = new Date();
        $rootScope.timer_running = true;
    }, 1000);

    // keep connection up
    $interval(function () {
        socket.emit('i am awake');
    }, 30000);

    // ////////////////////////////////////////////// //
    // @todo: rewrite methods below in angular style  //
    // ////////////////////////////////////////////// //
    $scope.$checkIfUserDefined = function () {
        if (angular.isDefined($scope.ConnectionForm.channel_name) == false) {
            userMenuToggle();
        }
    }

    $scope.$checkIfUserDefined();

    $scope.closeMenu = function () {
        userMenuToggle();
    }

    $scope.burnInGuardProcessorInit = function () {
        var $burnGuard = $('<div>').attr('id','burnGuard').css({
            'background-color':'#FF00FF',
            'width':'1px',
            'height':$(document).height()+'px',
            'position':'absolute',
            'top':'0px',
            'left':'0px',
            'display':'none',
            'zIndex' : 190000
        }).appendTo('body');

        var colors = ['#FF0000','#00FF00','#0000FF'],
            color = 0,
            delay = 4000,
            scrollDelay = 1000,
            easing = 'linear',
            instance = undefined,
            bodyMargin = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                _horizontalDirection: Math.random() < .5 ? -1 : 1,
                _horizontalMin: -45,
                _horizontalMax: 45,
                _verticalDirection: Math.random() < .5 ? -1 : 1,
                _verticalMin: -30,
                _verticalMax: 30,
                _step: 1
            },
            processor = function ()
            {
                // stripe
                color = ++color % 3;
                var rColor = colors[color];
                $burnGuard.css({
                    'left':'0px',
                    'background-color':rColor
                })
                .show()
                .animate(
                    {'left': $(window).width()+'px'},
                    scrollDelay,
                    easing,
                    function(){
                        $(this).hide();
                    }
                );

                // body movement
                if (bodyMargin.left <= bodyMargin._horizontalMin || bodyMargin.left >= bodyMargin._horizontalMax) {
                    bodyMargin._horizontalDirection = -1 * bodyMargin._horizontalDirection;
                }

                bodyMargin.left  = bodyMargin.left + (bodyMargin._step * bodyMargin._horizontalDirection);
                bodyMargin.right = -1 * bodyMargin.left;

                if (bodyMargin.top <= bodyMargin._verticalMin || bodyMargin.top >= bodyMargin._verticalMax) {
                    bodyMargin._verticalDirection = -1 * bodyMargin._verticalDirection;
                }

                bodyMargin.top = bodyMargin.top + (bodyMargin._step * bodyMargin._verticalDirection);
                bodyMargin.bottom = -1 * bodyMargin.top;

                $('#channelBricksContainer').css(
                    {
                        marginLeft : bodyMargin.left  + 'px',
                        marginRight : bodyMargin.right + 'px',
                        marginTop : bodyMargin.top + 'px',
                        marginBottom : bodyMargin.bottom + 'px'
                    }
                );

                // @todo? check on big screeen
                //$('#channelBricksContainer').animate(
                //    {
                //        marginLeft : bodyMargin.left  + 'px',
                //        marginRight : bodyMargin.right + 'px',
                //        marginTop : bodyMargin.top + 'px',
                //        marginBottom : bodyMargin.bottom + 'px'
                //    },
                //    delay,
                //    easing
                //);
            },
            start = function () {
                if (angular.isUndefined(instance)) {
                    instance = $interval(processor, delay);
                }
            },
            cancel = function () {
                if (angular.isDefined(instance)) {
                    $interval.cancel( instance );
                    instance = undefined;
                }
            };

        return {start : start, cancel : cancel};
    }

    $scope.burnInGuardProcessorRepeater = $scope.burnInGuardProcessorInit();
    $scope.toggleBurnInGuardRepeater = function(toggle) {
        if (angular.isDefined($scope.burnInGuardProcessorRepeater)) {
            if (true === toggle) {
                $scope.burnInGuardProcessorRepeater.start();
            } else {
                $scope.burnInGuardProcessorRepeater.cancel();
            }
        }
    };
    $scope.toggleBurnInGuardRepeater(this.burnInGuard);
});
