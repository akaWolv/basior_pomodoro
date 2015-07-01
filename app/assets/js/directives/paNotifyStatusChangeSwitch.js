pomodoroApp.directive('paNotifyStatusChangeSwitch', function($rootScope, socket) {
    return {
        restrict : 'A',
        scope : true,
        require : 'ngModel',
        link: function (scope, elem, attr) {
            scope.$watch('notifyAboutStatusChange[\'' + scope.pomodor.email + '\']', function(newV, oldV){
                if (angular.isDefined(newV)) {
                    if (angular.isUndefined($rootScope.user.notify_status_change)) {
                        $rootScope.user.notify_status_change = [];
                    }

                    var searchValue = $rootScope.user.notify_status_change.indexOf(scope.$parent.pomodor.email);

                    if (newV == oldV) {
                        // do nothing
                    } else if (true === newV) {
                        socket.emit('notify status change', {to_who: $rootScope.user.email, about_who : scope.$parent.pomodor.email});

                        //$rootScope.notifyAboutStatusChange = true;
                        //if (-1 == searchValue) {
                        //    $rootScope.user.notify_status_change.push(scope.$parent.pomodor.email);
                        //}
                    } else {
                        socket.emit('ignore status change', {to_who: $rootScope.user.email, about_who : scope.$parent.pomodor.email});

                        //$rootScope.notifyAboutStatusChange = false;
                        //if (-1 < searchValue) {
                        //    $rootScope.user.notify_status_change.slice(searchValue, 1);
                        //}
                    }
                }
            });
        }
    };
})