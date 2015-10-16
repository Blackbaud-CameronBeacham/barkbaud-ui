/*globals angular */

(function () {
    'use strict';

    var barkbaudConfig = {
        apiUrl: 'https://glacial-mountain-6366.herokuapp.com/'
    };

    barkbaudConfig.apiUrl = 'http://localhost:5000/';

    function config($locationProvider, $stateProvider, bbWindowConfig) {
        $locationProvider.html5Mode(false);

        $stateProvider
            .state('login', {
                controller: 'LoginPageController as loginPage',
                templateUrl: 'pages/login/loginpage.html',
                url: '/login'
            })
            .state('home', {
                controller: 'DashboardPageController as dashboardPage',
                templateUrl: 'pages/dashboard/dashboardpage.html',
                url: ''
            })
            .state('dog', {
                abstract: true,
                controller: 'DogPageController as dogPage',
                templateUrl: 'pages/dogs/dogpage.html',
                url: '/dogs/:dogId',
                resolve: {
                    dogId: ['$stateParams', function ($stateParams) {
                        return $stateParams.dogId;
                    }]
                }
            })
            .state('dog.views', {
                url: '',
                views: {
                    'summary': {
                        controller: 'DogSummaryTileController as dogSummaryTile',
                        templateUrl: 'pages/dogs/summary/summarytile.html'
                    },
                    'notes': {
                        controller: 'DogNotesTileController as dogNotesTile',
                        templateUrl: 'pages/dogs/notes/notestile.html'
                    }
                }
            });

        bbWindowConfig.productName = 'Barkbaud';
    }

    config.$inject = ['$locationProvider', '$stateProvider', 'bbWindowConfig'];

    function run(bbDataConfig) {
        function addBaseUrl(url) {
            return barkbaudConfig.apiUrl + url;
        }

        bbDataConfig.dataUrlFilter = addBaseUrl;
        bbDataConfig.resourceUrlFilter = addBaseUrl;
    }

    run.$inject = ['bbDataConfig'];

    angular.module('barkbaud', ['sky', 'ui.bootstrap', 'ui.router', 'ngAnimate', 'barkbaud.templates'])
        .constant('barkbaudConfig', barkbaudConfig)
        .config(config)
        .run(run)
        .controller('MainController', angular.noop);
}());

/*global angular */

(function () {
    'use strict';

    function barkPhoto() {
        return {
            scope: {
                barkPhotoUrl: '='
            },
            link: function (scope, el) {
                scope.$watch('barkPhotoUrl', function (newValue) {
                    if (newValue) {
                        el.css('background-image', 'url(\'' + newValue + '\')');
                    }
                });
            },
            replace: true,
            templateUrl: 'components/photo.html'
        };
    }

    angular.module('barkbaud')
        .directive('barkPhoto', barkPhoto);
}());

/*global angular */

(function () {
    'use strict';

    function DashboardPageController($stateParams, bbData, bbWindow) {
        var self = this;

        bbWindow.setWindowTitle('Dashboard');

        bbData.load({
            data: 'api/dogs'
        }).then(function (result) {
            self.dogs = result.data.data;
        });
    }

    DashboardPageController.$inject = ['$stateParams', 'bbData', 'bbWindow'];

    angular.module('barkbaud')
        .controller('DashboardPageController', DashboardPageController);
}());

/*global angular */

(function () {
    'use strict';

    function DogPageController($stateParams, bbData, bbWindow, dogId) {
        var self = this;

        self.tiles = [
            {
                id: 'DogSummaryTile',
                view_name: 'summary',
                collapsed: false,
                collapsed_small: false
            },
            {
                id: 'DogNotesTile',
                view_name: 'notes',
                collapsed: false,
                collapsed_small: false
            }
        ];

        self.layout = {
            one_column_layout: [
                'DogSummaryTile',
                'DogNotesTile'
            ],
            two_column_layout: [
                [
                    'DogSummaryTile'
                ],
                [
                    'DogNotesTile'
                ]
            ]
        };

        bbData.load({
            data: 'api/dogs/' + encodeURIComponent(dogId)
        }).then(function (result) {
            self.dog = result.data.data;
            bbWindow.setWindowTitle(self.dog.name);
        });
    }

    DogPageController.$inject = ['$stateParams', 'bbData', 'bbWindow', 'dogId'];

    angular.module('barkbaud')
        .controller('DogPageController', DogPageController);
}());

/*global angular */

(function () {
    'use strict';

    function DogNotesTileController($timeout, bbData, dogId) {
        var self = this;

        bbData.load({
            data: 'api/dogs/' + encodeURIComponent(dogId) + '/notes'
        }).then(function (result) {
            self.notes = result.data.data;
        });
    }

    DogNotesTileController.$inject = ['$timeout', 'bbData', 'dogId'];

    angular.module('barkbaud')
        .controller('DogNotesTileController', DogNotesTileController);
}());

/*global angular */

(function () {
    'use strict';

    function DogSummaryTileController($timeout, bbData, dogId) {
        var self = this;

        bbData.load({
            data: 'api/dogs/' + encodeURIComponent(dogId) + '/summary'
        }).then(function (result) {
            self.summary = result.data;
        });
    }

    DogSummaryTileController.$inject = ['$timeout', 'bbData', 'dogId'];

    angular.module('barkbaud')
        .controller('DogSummaryTileController', DogSummaryTileController);
}());

/*global angular */

(function () {
    'use strict';

    function LoginPageController(bbWindow, barkbaudAuthService) {
        var self = this;

        self.isAuthenticated = false;
        self.login = barkbaudAuthService.login;
        self.logout = barkbaudAuthService.logout;

        barkbaudAuthService.isAuthenticated().then(function (r) {
            self.isAuthenticated = r;
        });

        bbWindow.setWindowTitle('Login');
    }

    LoginPageController.$inject = [
        'bbWindow',
        'barkbaudAuthService'
    ];

    angular.module('barkbaud')
        .controller('LoginPageController', LoginPageController);
}());

/*global angular */

(function () {
    'use strict';

    function barkbaudAuthService(barkbaudConfig, bbData, $q, $window) {
        var service = {};

        service.isAuthenticated = function () {
            var deferred = $q.defer();
            bbData.load({
                data: 'auth/authenticated'
            }).then(function (result) {
                deferred.resolve(result.data.authenticated);
            });
            return deferred.promise;
        };

        service.login = function () {
            $window.location.href = barkbaudConfig.apiUrl + 'auth/login';
        };

        service.logout = function () {
            $window.location.href = barkbaudConfig.apiUrl + 'auth/logout';
        };

        return service;
    }

    barkbaudAuthService.$inject = [
        'barkbaudConfig',
        'bbData',
        '$q',
        '$window'
    ];

    angular.module('barkbaud')
        .factory('barkbaudAuthService', barkbaudAuthService);
}());

angular.module('barkbaud.templates', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('components/photo.html',
        '<div class="bark-dog-photo img-circle center-block">\n' +
        '</div>\n' +
        '');
    $templateCache.put('pages/dashboard/dashboardpage.html',
        '<div class="container-fluid">\n' +
        '  <h1>Dashboard</h1>\n' +
        '  <div class="panel" ng-repeat="dog in dashboardPage.dogs">\n' +
        '    <div class="panel-body">\n' +
        '      <div class="row">\n' +
        '          <div class="col-md-3 col-lg-2">\n' +
        '              <bark-photo bark-photo-url="dog.image.url"></bark-photo>\n' +
        '          </div>\n' +
        '          <div class="col-md-9 col-lg-10">\n' +
        '              <h2>\n' +
        '                <a ui-sref="dog.views({dogId: dog.objectId})">{{dog.name}}</a>\n' +
        '              </h2>\n' +
        '              <p class="bark-dog-bio">{{dog.bio}}</p>\n' +
        '          </div>\n' +
        '      </div>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</div>\n' +
        '');
    $templateCache.put('pages/dogs/dogpage.html',
        '<div class="bb-page-header">\n' +
        '    <div class="container-fluid">\n' +
        '        <div class="row">\n' +
        '            <div class="col-md-3 col-lg-2">\n' +
        '                <bark-photo bark-photo-url="dogPage.dog.image.url"></bark-photo>\n' +
        '            </div>\n' +
        '            <div class="col-md-9 col-lg-10">\n' +
        '                <h1>{{dogPage.dog.name}}</h1>\n' +
        '                <p></p>\n' +
        '                <p class="bark-dog-bio">{{dogPage.dog.bio}}</p>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n' +
        '<div class="container-fluid">\n' +
        '    <bb-tile-dashboard bb-layout="dogPage.layout" bb-tiles="dogPage.tiles"></bb-tile-dashboard>\n' +
        '</div>\n' +
        '');
    $templateCache.put('pages/dogs/notes/notestile.html',
        '<bb-tile bb-tile-header="\'Notes\'">\n' +
        '  <div bb-tile-section>\n' +
        '    <div ng-repeat="note in dogNotesTile.notes">\n' +
        '      <h4>{{ note.title }}</h4>\n' +
        '      <p>{{ note.description }}</p>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</bb-tile>\n' +
        '');
    $templateCache.put('pages/dogs/summary/summarytile.html',
        '<bb-tile bb-tile-header="\'Summary\'">\n' +
        '    <div bb-tile-section>\n' +
        '        \n' +
        '    </div>\n' +
        '</bb-tile>\n' +
        '');
    $templateCache.put('pages/login/loginpage.html',
        '<div class="container-fluid">\n' +
        '  <h1>Login</h1>\n' +
        '  <div class="panel">\n' +
        '    <div class="panel-body">\n' +
        '      <div ng-switch="loginPage.isAuthenticated">\n' +
        '        <div ng-switch-when="\'true\'">\n' +
        '          Welcome\n' +
        '        </div>\n' +
        '        <div ng-switch-default>\n' +
        '          <button type="button" class="btn btn-primary" ng-click="loginPage.login()">\n' +
        '            Login with Blackbaud\n' +
        '          </button>\n' +
        '        <div>\n' +
        '      </div>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</div>\n' +
        '');
}]);

//# sourceMappingURL=app.js.map