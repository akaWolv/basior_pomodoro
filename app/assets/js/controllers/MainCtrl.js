'use strict';

pomodoroApp.controller('MainCtrl', function ($scope, $rootScope, $location, socket, $interval, $window) {

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

});
