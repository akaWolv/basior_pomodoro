'use strict';

pomodoroApp.controller('ChannelCtrl', function ($scope, $rootScope, socket) {
    $scope.channel = {};
    $rootScope.pomodores = {};

    $rootScope.$watchCollection('ConnectionData.channel_name', function (newValue) {
        $scope.channel.name = newValue;
        socket.emit('pick pipe', {pipe: newValue});
    });

    socket.on('users list', function (pomodores) {
        $rootScope.timer_running = false;
        $rootScope.pomodores = pomodores;
    });

    socket.on('your picked pipe', function (picked_pipe) {
        if (null == picked_pipe && angular.isDefined($scope.channel.name)) {
            // it means that server know nothing about us
            $rootScope.updateConnectionDetails();
            $scope.pickPipe($scope.channel.name);
        }
    });

    $scope.pickPipe = function (pipeName) {
        socket.emit('pick pipe', {pipe: pipeName});
    }
});