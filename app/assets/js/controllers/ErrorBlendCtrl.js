'use strict';

pomodoroApp.controller('ErrorBlendCtrl', function ($scope, $rootScope) {

    $scope.error_blend = false;
    $scope.error_blend_text = '';

    $rootScope.errorBlend = function (status, text) {
        $scope.error_blend = true === status;

        if (angular.isString(text)) {
            $scope.error_blend_text = text;
        } else {
            $scope.error_blend_text = '';
        }
    }
});