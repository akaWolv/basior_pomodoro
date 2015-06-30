'use strict';

// Declare app level module which depends on filters, and services
var pomodoroApp = angular.module('PomodoroApp', ['ngSanitize']);
pomodoroApp.run(function($rootScope) {

    $rootScope.error_blend = {
        show: false,
        text: ''
    };

    $rootScope.ConnectionData = {
        channel_name: undefined,
        user_email: undefined,
        user_name: undefined
    }
});