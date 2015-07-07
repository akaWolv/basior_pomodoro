'use strict';

pomodoroApp.factory('notification', function ($rootScope, $location, $timeout, $window) {
    var notification_type = 'native',
        notification_id = 0;

    // Let's check if the browser supports notifications
    if ("Notification" in $window) {
        Notification.requestPermission(function(result) {
            if ('granted' == result) {
                // Do something with the granted permission.
                notification_type = 'html5';
            }
        });
    }

    var show_config_defaults = {
        title: '',
        body: '',
        icon: 'assets/img/pomodoro-logo.png',
        methodToCallPositive: undefined,
        methodToCallNegative: undefined,
        nativeNotificationFocusOnClick: true,
        nativeNotificationAdditionalBody: '',
        nativeNotificationCloseTimer: true,
        nativeNotificationCloseTimeout: 30000
    }

    return {
        /**
         * {
         *   title: '',
         *   body: '',
         *   icon: '',
         *   methodToCallPositive: undefined,
         *   methodToCallNegative: undefined,
         *   nativeNotificationFocusOnClick: true,
         *   nativeNotificationAdditionalBody: '',
         *   nativeNotificationCloseTimer: true,
         *   nativeNotificationCloseTimeout: 30000
         * }
         * @returns {Notification}
         */
        show : function (params) {
            if (false === angular.isObject(params)) {
                return undefined;
            }

            var config = {
                    title: angular.isDefined(params.title) ? params.title : show_config_defaults.title,
                    body: angular.isDefined(params.body) ? params.body : show_config_defaults.body,
                    icon: angular.isDefined(params.icon) ? params.icon : show_config_defaults.icon,
                    methodToCallPositive: angular.isDefined(params.methodToCallPositive) ? params.methodToCallPositive : show_config_defaults.methodToCallPositive,
                    methodToCallNegative : angular.isDefined(params.methodToCallNegative) ? params.methodToCallNegative : show_config_defaults.methodToCallNegative,
                    nativeNotificationFocusOnClick : angular.isDefined(params.nativeNotificationFocusOnClick) ? params.nativeNotificationFocusOnClick : show_config_defaults.nativeNotificationFocusOnClick,
                    nativeNotificationAdditionalBody : angular.isDefined(params.nativeNotificationAdditionalBody) ? params.nativeNotificationAdditionalBody : show_config_defaults.nativeNotificationAdditionalBody,
                    nativeNotificationCloseTimer : angular.isDefined(params.nativeNotificationCloseTimer) ? params.nativeNotificationCloseTimer : show_config_defaults.nativeNotificationCloseTimer,
                    nativeNotificationCloseTimeout : angular.isDefined(params.nativeNotificationCloseTimeout) ? params.nativeNotificationCloseTimeout : show_config_defaults.nativeNotificationCloseTimeout
                },
                notification;

            // native system notifications
            if ('html5' == notification_type) {
                var nnCloseTimer = angular.isDefined(config.nativeNotificationCloseTimer) ? config.nativeNotificationCloseTimer : true,
                    nnCloseTimeout = (angular.isDefined(config.nativeNotificationCloseTimeout) && angular.isNumber(config.nativeNotificationCloseTimeout))
                        ? config.nativeNotificationCloseTimeout : 10000;

                notification = new Notification(config.title, {
                    icon: config.icon,
                    body: config.body + config.nativeNotificationAdditionalBody,
                    tag: 'nativeNotification' + ++notification_id
                });
                notification.onshow = function() {
                    if (true === nnCloseTimer) {
                        $timeout(function(){
                            notification.close();
                            if (angular.isFunction(config.methodToCallNegative)) {
                                config.methodToCallNegative()
                            }
                        }, nnCloseTimeout);
                    }
                };
                notification.onclick = function() {
                    if (config.nativeNotificationFocusOnClick) {
                        window.focus();
                    }
                    if (angular.isFunction(config.methodToCallPositive)) {
                        config.methodToCallPositive()
                    }
                };
            } else {
                var msg = (config.title.length > 0 ? config.title + '\n\n' : '') + config.body;
                if (angular.isFunction(config.methodToCallPositive)) {
                    if (confirm(msg)) {
                        config.methodToCallPositive()
                    } else {
                        config.methodToCallNegative();
                    }
                } else {
                    alert(msg);
                }
            }

            return notification;
        }
    };
});