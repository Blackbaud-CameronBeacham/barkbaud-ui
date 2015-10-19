/*globals angular */

(function () {
    'use strict';

    var barkbaudConfig = {
        apiUrl: 'https://glacial-mountain-6366.herokuapp.com/'
    };

    function config($locationProvider, $urlRouterProvider, $stateProvider, bbWindowConfig) {
        $locationProvider.html5Mode(false);
        $urlRouterProvider.otherwise('/dashboard');
        $stateProvider
            .state('home', {
                controller: 'DashboardPageController as dashboardPage',
                templateUrl: 'pages/dashboard/dashboardpage.html',
                url: ''
            });

        bbWindowConfig.productName = 'Barkbaud';
    }

    config.$inject = ['$locationProvider', '$urlRouterProvider', '$stateProvider', 'bbWindowConfig'];

    function run(bbDataConfig, barkbaudAuthService, $rootScope, $state) {

        $rootScope.$on('$stateChangeStart', function (event, toState) {
            if (!barkbaudAuthService.authenticated && toState.name !== 'login') {
                event.preventDefault();
                $state.go('login');
            }
        });

        function addBaseUrl(url) {
            return barkbaudConfig.apiUrl + url;
        }

        bbDataConfig.dataUrlFilter = addBaseUrl;
        bbDataConfig.resourceUrlFilter = addBaseUrl;
    }

    run.$inject = ['bbDataConfig', 'barkbaudAuthService', '$rootScope', '$state'];

    angular.module('barkbaud', ['sky', 'ui.bootstrap', 'ui.router', 'ngAnimate', 'barkbaud.templates'])
        .constant('barkbaudConfig', barkbaudConfig)
        .config(config)
        .run(run)
        .controller('MainController', angular.noop);
}());
