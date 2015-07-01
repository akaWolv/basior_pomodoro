pomodoroApp.directive('paBlend', function() {
    return {
        restrict : 'A',
        scope : {},
        templateUrl : 'partials/error_blend.html',
        link: function (scope, elem, attr) {
            if (angular.isUndefined(attr.paBlendShow) || angular.isUndefined(attr.paBlendShow)) {
                console.log('required attributes: pa-blend-show, pa-blend-text');
                return false;
            }

            attr.$observe('paBlendShow', function(newV){
                scope.error_blend_show = (true === newV || 'true' == newV);
            });

            attr.$observe('paBlendText', function(newV){
                scope.error_blend_text = angular.isString(newV) ? newV : 'error';
            });
        }
    };
})