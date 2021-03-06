/**
 *
 *  Defines `hNumberPicker` directive which can only be used as element.
 *
 *  It allows end-user to choose number, instead of typing
 *
 *  usage:
 *
 *       <h-number value="input.num" min="1" max="10" step="1" change="onChange()"></h-number>
 *
 *  @author  Howard.Zuo
 *  @date    July 22th, 2015
 *
 */
(function(global) {
    'use strict';

    var definition = function(angular) {

        var defaults = {
            min: 0,
            max: 10000,
            step: 1,
            step2: 10,
            step3: 100,
            timeout: 600
        };

        var assign = function(dest, src) {
            for (var key in src) {
                if (!dest[key]) {
                    dest[key] = src[key];
                }
            }
            return dest;
        };

        var isNumber = function(value) {
            var val = Number(value);
            return !isNaN(val) && val == value;
        };

        var toNumber = function(value) {
            return Number(value);
        };

        var checkNumber = function(value) {
            if (!isNumber(value)) {
                throw new Error('value [' + value + '] is not a valid number');
            }
        };

        var getTarget = function(e) {
            if (e.touches && e.touches.length > 0) {
                return angular.element(e.touches[0].target);
            }
            return angular.element(e.target);
        };

        var getType = function(e) {
            return getTarget(e).attr('type');
        };

        var transform = function(opts) {
            for (var key in opts) {
                var value = opts[key];
                opts[key] = toNumber(value);
            }
        };

        var directive = function($timeout, $interval) {

            return {
                restrict: 'E',
                scope: {
                    'value': '=',
                    'singular': '@',
                    'plural': '@',
                    'min': '@',
                    'max': '@',
                    'step': '@',
                    'change': '&',
                    'save': '&'
                },
                // replace: true,
                link: function($scope, element) {

                    var opts = assign({
                        min: $scope.min,
                        max: $scope.max,
                        step: $scope.step
                    }, defaults);

                    checkNumber(opts.min);
                    checkNumber(opts.max);
                    checkNumber(opts.step);

                    transform(opts);

                    // $scope.value = opts.min;

                    $scope.$watch('value', function(newValue) {
                        $scope.canDown = newValue > opts.min;
                        $scope.canUp = newValue < opts.max;
                    });

                    var changeNumber = function($event) {
                        var type = getType($event);
                        var step = opts.step;
                        switch (type) {
                            case 'up2':
                            case 'down2':
                                step = opts.step2;
                                break;
                            case 'up3':
                            case 'down3':
                                step = opts.step3;
                                break;
                            default:
                                step = opts.step;
                        }

                        if ('up' === type ||'up2' === type || 'up3' === type) {

                            if ($scope.value >= opts.max) {
                                return;
                            }
                            $scope.value += step;
                        } else if ('down' === type || 'down2' === type || 'down3' === type) {
                            if ($scope.value <= opts.min) {
                                return;
                            }
                            $scope.value -= step;
                        }
                        $scope.change();
                    };

                    var timeoutPro;
                    var intervalPro;
                    var start;
                    var end;
                    var addon = element.find('span');

                    addon.on('click', function(e) {

                        changeNumber(e);
                        $scope.$apply();
                        e.stopPropagation();

                    });

                    addon.on('touchstart', function(e) {
                        getTarget(e).addClass('active');
                        start = new Date().getTime();
                        timeoutPro = $timeout(function() {
                            intervalPro = $interval(function() {
                                changeNumber(e);
                            }, 200);
                        }, opts.timeout);
                        e.preventDefault();
                    });

                    addon.on('touchend', function(e) {
                        end = new Date().getTime();
                        if (intervalPro) {
                            $interval.cancel(intervalPro);
                            intervalPro = undefined;
                        }
                        if (timeoutPro) {
                            $timeout.cancel(timeoutPro);
                            timeoutPro = undefined;
                        }
                        if ((end - start) < opts.timeout) {
                            changeNumber(e);
                            $scope.$apply();
                        }
                        getTarget(e).removeClass('active');
                    });

                    $scope.$on('$destroy', function() {
                        addon.off('touchstart touchend click');
                    });

                },
                // template: '<div class="input-group input-group-sm"><span class="input-group-addon" type="down3" ng-disabled="!canDown">-100</span><span class="input-group-addon" type="down2" ng-disabled="!canDown">-10</span><span class="input-group-addon" type="down" ng-disabled="!canDown">&nbsp;-&nbsp;</span><label class="form-control">{{ value }} {{value === 1 ? singular : plural}}</label><span class="input-group-addon" type="up" ng-disabled="!canUp">&nbsp;+&nbsp;</span><span class="input-group-addon" type="up2" ng-disabled="!canUp">+10</span><span class="input-group-addon" type="up3" ng-disabled="!canUp">+100</span><span class="input-group-addon" id="basic-addon2" ng-click="save()"><i class="fa fa-check"></i></span></div>'

                template: '<div class="input-group input-group-sm"><span class="input-group-addon" type="down" ng-disabled="!canDown">&nbsp;-&nbsp;</span><label class="form-control">{{ value }} {{value === 1 ? singular : plural}}</label><span class="input-group-addon" type="up" ng-disabled="!canUp">&nbsp;+&nbsp;</span><span class="input-group-addon" id="basic-addon2" ng-click="save()"><i class="fa fa-check"></i></span></div>'
            };
        };

        var name = 'angularNumberPicker';
        angular.module(name, [])
            .directive('hNumber', ['$timeout', '$interval', directive]);
        return name;
    };

    if (typeof exports === 'object') {
        module.exports = definition(require('angular'));
    } else if (typeof define === 'function' && define.amd) {
        define(['angular'], definition);
    } else {
        definition(global.angular);
    }

}(window));
