/*globals angular */

(function () {
    'use strict';

    var barkbaudConfig = {
        apiUrl: 'https://glacial-mountain-6366.herokuapp.com/'
    };

    function config($locationProvider, $urlRouterProvider, bbWindowConfig) {
        $locationProvider.html5Mode(false);

        $urlRouterProvider.otherwise(function ($injector) {
            var $state = $injector.get('$state');
            $state.go('dashboard');
        });

        bbWindowConfig.productName = 'Barkbaud';
    }

    config.$inject = ['$locationProvider', '$urlRouterProvider', 'bbWindowConfig'];

    function run(bbDataConfig, bbWait, barkbaudAuthService, $rootScope, $state) {

        function addBaseUrl(url) {
            return barkbaudConfig.apiUrl + url;
        }

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
            var redirect;
            if (!barkbaudAuthService.authenticated) {
                event.preventDefault();
                $rootScope.$emit('bbBeginWait');

                redirect = $state.href(toState, toParams, { absolute: true });
                barkbaudAuthService.isAuthenticated().then(function (authenticated) {
                    $rootScope.$emit('bbEndWait');
                    if (authenticated) {
                        $state.go(toState, toParams);
                    } else {
                        barkbaudAuthService.modal(redirect).then(function () {
                            return $state.go(toState.name, toParams);
                        });
                    }
                });
            }
        });

        $rootScope.$on('bbBeginWait', function (e, opts) {
            e.stopPropagation();
            bbWait.beginPageWait(opts);
        });

        $rootScope.$on('bbEndWait', function (e, opts) {
            e.stopPropagation();
            bbWait.endPageWait(opts);
        });

        bbDataConfig.dataUrlFilter = addBaseUrl;
        bbDataConfig.resourceUrlFilter = addBaseUrl;
    }

    run.$inject = ['bbDataConfig', 'bbWait', 'barkbaudAuthService', '$rootScope', '$state'];

    function MainController(barkbaudAuthService) {
        var self = this;
        self.logout = barkbaudAuthService.logout;
    }

    MainController.$inject = ['barkbaudAuthService'];

    angular.module('barkbaud', ['sky', 'ui.bootstrap', 'ui.router', 'ngAnimate', 'barkbaud.templates', 'ui.gravatar'])
        .constant('barkbaudConfig', barkbaudConfig)
        .config(config)
        .run(run)
        .controller('MainController', MainController);
}());

/*global angular */

(function () {
    'use strict';

    function constituentUrlFilter() {
        return function (constituentId) {
            return 'https://renxt.blackbaud.com/constituents/' + encodeURIComponent(constituentId);
        };
    }

    angular.module('barkbaud')
        .filter('barkConstituentUrl', constituentUrlFilter);

}());

/*global angular */

(function () {
    'use strict';

    function barkPhoto(gravatarService) {
        return {
            scope: {
                barkPhotoUrl: '=',
                barkPhotoGravatarEmail: '='
            },
            link: function (scope, el) {
                function setImageUrl(url) {
                    el.css('background-image', 'url(\'' + url + '\')');
                }

                scope.$watch('barkPhotoUrl', function (newValue) {
                    if (newValue) {
                        setImageUrl(newValue.replace('http://', '//'));
                    }
                });

                scope.$watch('barkPhotoGravatarEmail', function (newValue) {
                    if (newValue) {
                        setImageUrl(gravatarService.url(newValue, {default: 'mm'}));
                    }
                });
            },
            replace: true,
            templateUrl: 'components/photo.html'
        };
    }

    barkPhoto.$inject = ['gravatarService'];

    angular.module('barkbaud')
        .directive('barkPhoto', barkPhoto);
}());

/*global angular */

(function () {
    'use strict';

    function dashboardPageConfig($stateProvider) {
        $stateProvider
            .state('dashboard', {
                controller: 'DashboardPageController as dashboardPage',
                templateUrl: 'pages/dashboard/dashboardpage.html',
                url: '/dashboard'
            });
    }

    dashboardPageConfig.$inject = ['$stateProvider'];

    function DashboardPageController($scope, $stateParams, bbData, bbWindow) {
        var self = this;

        $scope.$emit('bbBeginWait');
        bbWindow.setWindowTitle('Dashboard');
        bbData.load({
            data: 'api/dogs'
        }).then(function (result) {
            self.dogs = result.data.data;
            $scope.$emit('bbEndWait');
        });
    }

    DashboardPageController.$inject = [
        '$scope',
        '$stateParams',
        'bbData',
        'bbWindow'
    ];

    angular.module('barkbaud')
        .config(dashboardPageConfig)
        .controller('DashboardPageController', DashboardPageController);
}());

/*global angular */

(function () {
    'use strict';

    function DogCurrentHomeTileController($timeout, bbData, bbMoment, dogId) {
        var self = this;

        self.getTimeInHome = function (fromDate) {
            var fromDateMoment = bbMoment(fromDate.iso);

            return 'since ' + fromDateMoment.format('L') + ' (' + fromDateMoment.startOf('month').fromNow(true) + ')';
        };

        bbData.load({
            data: 'api/dogs/' + encodeURIComponent(dogId) + '/currenthome'
        }).then(function (result) {
            self.currentHome = result.data.data;
        });
    }

    DogCurrentHomeTileController.$inject = ['$timeout', 'bbData', 'bbMoment', 'dogId'];

    angular.module('barkbaud')
        .controller('DogCurrentHomeTileController', DogCurrentHomeTileController);
}());

/*global angular */

(function () {
    'use strict';

    function dogPageConfig($stateProvider) {
        $stateProvider
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
                    'currenthome': {
                        controller: 'DogCurrentHomeTileController as dogCurrentHomeTile',
                        templateUrl: 'pages/dogs/currenthome/currenthometile.html'
                    },
                    'previoushomes': {
                        controller: 'DogPreviousHomesTileController as dogPreviousHomesTile',
                        templateUrl: 'pages/dogs/previoushomes/previoushomestile.html'
                    },
                    'notes': {
                        controller: 'DogNotesTileController as dogNotesTile',
                        templateUrl: 'pages/dogs/notes/notestile.html'
                    }
                }
            });
    }

    dogPageConfig.$inject = ['$stateProvider'];

    function DogPageController($scope, $stateParams, bbData, bbWindow, dogId) {
        var self = this;

        self.tiles = [
            {
                id: 'DogCurrentHomeTile',
                view_name: 'currenthome',
                collapsed: false,
                collapsed_small: false
            },
            {
                id: 'DogPreviousHomesTile',
                view_name: 'previoushomes',
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
                'DogCurrentHomeTile',
                'DogPreviousHomesTile',
                'DogNotesTile'
            ],
            two_column_layout: [
                [
                    'DogCurrentHomeTile',
                    'DogPreviousHomesTile'
                ],
                [
                    'DogNotesTile'
                ]
            ]
        };

        $scope.$emit('bbBeginWait');
        bbData.load({
            data: 'api/dogs/' + encodeURIComponent(dogId)
        }).then(function (result) {
            self.dog = result.data.data;
            bbWindow.setWindowTitle(self.dog.name);
            $scope.$emit('bbEndWait');
        });
    }

    DogPageController.$inject = [
        '$scope',
        '$stateParams',
        'bbData',
        'bbWindow',
        'dogId'
    ];

    angular.module('barkbaud')
        .config(dogPageConfig)
        .controller('DogPageController', DogPageController);
}());

/*global angular */

(function () {
    'use strict';

    function NoteAddController($modalInstance, bbData, dogId) {
        var self = this;

        self.note = {};
        self.saveData = function () {
            bbData.save({
                url: '/api/dogs/' + dogId + '/notes',
                data: self.note,
                type: 'POST'
            }).then(function (result) {
                $modalInstance.close(result.data);
            });
        };
    }

    NoteAddController.$inject = [
        '$modalInstance',
        'bbData',
        'dogId'
    ];

    function barkNoteAdd(bbModal) {
        return {
            open: function (dogId) {
                return bbModal.open({
                    controller: 'NoteAddController as noteAdd',
                    templateUrl: 'pages/dogs/notes/noteadd.html',
                    resolve: {
                        dogId: function () {
                            return dogId;
                        }
                    }
                });
            }
        };
    }

    barkNoteAdd.$inject = ['bbModal'];

    angular.module('barkbaud')
        .controller('NoteAddController', NoteAddController)
        .factory('barkNoteAdd', barkNoteAdd);
}());

/*global angular */

(function () {
    'use strict';

    function DogNotesTileController($timeout, bbData, bbMoment, barkNoteAdd, dogId) {
        var self = this;

        bbData.load({
            data: 'api/dogs/' + encodeURIComponent(dogId) + '/notes'
        }).then(function (result) {
            self.notes = result.data.data;
        });

        self.getNoteDate = function (date) {
            if (date && date.iso) {
                return bbMoment(date.iso).calendar();
            }
        };

        self.addNote = function () {
            barkNoteAdd.open(dogId);
        };
    }

    DogNotesTileController.$inject = ['$timeout', 'bbData', 'bbMoment', 'barkNoteAdd', 'dogId'];

    angular.module('barkbaud')
        .controller('DogNotesTileController', DogNotesTileController);
}());

/*global angular */

(function () {
    'use strict';

    function DogPreviousHomesTileController($timeout, bbData, dogId) {
        var self = this;

        bbData.load({
            data: 'api/dogs/' + encodeURIComponent(dogId) + '/previoushomes'
        }).then(function (result) {
            self.previousHomes = result.data.data;
        });

        self.getSummaryDate = function (date) {
            if (date && date.iso) {
                return bbMoment(date.iso).format('MMM Do YY');
            }
        };
    }

    DogPreviousHomesTileController.$inject = ['$timeout', 'bbData', 'dogId'];

    angular.module('barkbaud')
        .controller('DogPreviousHomesTileController', DogPreviousHomesTileController);
}());

/*global angular */

(function () {
    'use strict';

    function DogSummaryTileController($timeout, bbData, bbMoment, dogId) {
        var self = this;

        bbData.load({
            data: 'api/dogs/' + encodeURIComponent(dogId) + '/summary'
        }).then(function (result) {
            self.summary = result.data.data;
        });

        self.getSummaryDate = function (date) {
            if (date && date.iso) {
                return bbMoment(date.iso).format('MMM Do YY');
            }
        };
    }

    DogSummaryTileController.$inject = ['$timeout', 'bbData', 'bbMoment', 'dogId'];

    angular.module('barkbaud')
        .controller('DogSummaryTileController', DogSummaryTileController);
}());

/*global angular */

(function () {
    'use strict';

    function LoginPageController($location, $window, bbWait, bbWindow, barkbaudAuthService, barkbaudRedirect) {
        var self = this;

        self.error = $location.search().error;
        self.logout = barkbaudAuthService.logout;

        self.login = function () {
            barkbaudAuthService.login(barkbaudRedirect);
        };

        bbWindow.setWindowTitle('Login');

        self.waitingForAuth = true;
        barkbaudAuthService.isAuthenticated().then(function (authenticated) {
            self.waitingForAuth = false;
            if (authenticated) {
                barkbaudAuthService.update(authenticated);
            }
        });

    }

    LoginPageController.$inject = [
        '$location',
        '$window',
        'bbWait',
        'bbWindow',
        'barkbaudAuthService',
        'barkbaudRedirect'
    ];

    angular.module('barkbaud')
        .controller('LoginPageController', LoginPageController);
}());

/*global angular */

(function () {
    'use strict';

    function barkbaudAuthService(barkbaudConfig, bbData, bbModal, $q, $window) {
        var modal,
            service = {};

        function go(action, redirect) {
            $window.location.href = [
                barkbaudConfig.apiUrl,
                'auth/',
                action,
                '?redirect=',
                encodeURIComponent(redirect)
            ].join('');
        }

        service.isAuthenticated = function () {
            var deferred = $q.defer();
            bbData.load({
                data: 'auth/authenticated'
            }).then(function (result) {
                service.authenticated = result.data.authenticated;
                deferred.resolve(result.data.authenticated);
            });
            return deferred.promise;
        };

        service.login = function (redirect) {
            go('login', redirect);
        };

        service.logout = function (redirect) {
            go('logout', redirect);
        };

        service.update = function () {
            modal.close(service.authenticated);
        };

        service.modal = function (redirect) {
            if (!modal) {
                modal = bbModal.open({
                    controller: 'LoginPageController as loginPage',
                    templateUrl: 'pages/login/loginpage.html',
                    resolve: {
                        barkbaudRedirect: function () {
                            return redirect;
                        }
                    }
                });
            }

            return modal.result;
        };

        return service;
    }

    barkbaudAuthService.$inject = [
        'barkbaudConfig',
        'bbData',
        'bbModal',
        '$q',
        '$window'
    ];

    angular.module('barkbaud')
        .factory('barkbaudAuthService', barkbaudAuthService);
}());

angular.module('barkbaud.templates', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('components/photo.html',
        '<div class="bark-photo img-circle center-block">\n' +
        '</div>\n' +
        '');
    $templateCache.put('pages/dashboard/dashboardpage.html',
        '<div class="container-fluid">\n' +
        '  <h1>Dashboard</h1>\n' +
        '  <section class="panel" ng-repeat="dog in dashboardPage.dogs">\n' +
        '    <div class="panel-body">\n' +
        '      <div class="row">\n' +
        '          <div class="col-md-3 col-lg-2">\n' +
        '            <a ui-sref="dog.views({dogId: dog.objectId})">\n' +
        '              <bark-photo bark-photo-url="dog.image.url"></bark-photo>\n' +
        '            </a>\n' +
        '          </div>\n' +
        '          <div class="col-md-9 col-lg-10">\n' +
        '              <h1>\n' +
        '                <a ui-sref="dog.views({dogId: dog.objectId})">{{dog.name}}</a>\n' +
        '              </h1>\n' +
        '              <h4>{{dog.breed}} &middot; {{dog.gender}}</h4>\n' +
        '              <p class="bb-text-block bark-dog-bio">{{dog.bio}}</p>\n' +
        '          </div>\n' +
        '      </div>\n' +
        '    </div>\n' +
        '  </section>\n' +
        '</div>\n' +
        '');
    $templateCache.put('pages/dogs/currenthome/currenthometile.html',
        '<bb-tile bb-tile-header="\'Current home\'">\n' +
        '  <div ng-show="dogCurrentHomeTile.currentHome">\n' +
        '    <div ng-switch="dogCurrentHomeTile.currentHome.constituentId || 0">\n' +
        '      <div bb-tile-section ng-switch-when="0" class="bb-no-records">\n' +
        '        This dog has no current home.\n' +
        '      </div>\n' +
        '      <div ng-switch-default>\n' +
        '        <div ng-switch="dogCurrentHomeTile.currentHome.constituent.error || \'\'">\n' +
        '          <div bb-tile-section ng-switch-when="\'\'" class="bb-no-records">\n' +
        '            Error reading current home.\n' +
        '          </div>\n' +
        '          <div bb-tile-section ng-switch-default>\n' +
        '            <div class="row">\n' +
        '              <div class="col-sm-3 col-xs-4">\n' +
        '                <bark-photo class="bark-photo-small" bark-photo-gravatar-email="dogCurrentHomeTile.currentHome.constituent.email.address"></bark-photo>\n' +
        '              </div>\n' +
        '              <div class="col-sm-9 col-xs-8">\n' +
        '                <h4>\n' +
        '                  <a ng-href="{{dogCurrentHomeTile.currentHome.constituentId | barkConstituentUrl}}">\n' +
        '                    {{:: dogCurrentHomeTile.currentHome.constituent.first }}\n' +
        '                    {{:: dogCurrentHomeTile.currentHome.constituent.last }}\n' +
        '                  </a>\n' +
        '                </h4>\n' +
        '                <h5>{{:: dogCurrentHomeTile.getTimeInHome(dogCurrentHomeTile.currentHome.fromDate) }}</h5>\n' +
        '                <p class="bark-home-address" ng-show="dogCurrentHomeTile.currentHome.constituent.address.address">{{:: dogCurrentHomeTile.currentHome.constituent.address.address }}</p>\n' +
        '                <p ng-show="dogCurrentHomeTile.currentHome.constituent.phone.number">\n' +
        '                  {{:: dogCurrentHomeTile.currentHome.constituent.phone.number }}\n' +
        '                </p>\n' +
        '                <p ng-show="dogCurrentHomeTile.currentHome.constituent.email.address">\n' +
        '                  <a ng-href="mailto:{{:: dogCurrentHomeTile.currentHome.constituent.email.address }}">{{:: dogCurrentHomeTile.currentHome.constituent.email.address }}</a>\n' +
        '                </p>\n' +
        '              <div>\n' +
        '            </div>\n' +
        '          </div>\n' +
        '        </div>\n' +
        '      </div>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</bb-tile>\n' +
        '');
    $templateCache.put('pages/dogs/dogpage.html',
        '<div class="bb-page-header">\n' +
        '    <div class="container-fluid">\n' +
        '        <div class="row">\n' +
        '            <div class="col-md-3 col-lg-2">\n' +
        '                <bark-photo bark-photo-url="dogPage.dog.image.url"></bark-photo>\n' +
        '            </div>\n' +
        '            <div class="col-md-9 col-lg-10">\n' +
        '                <h1>\n' +
        '                  {{dogPage.dog.name}}\n' +
        '                </h1>\n' +
        '                <h4>{{dogPage.dog.breed}} &middot; {{dogPage.dog.gender}}</h4>\n' +
        '                <p></p>\n' +
        '                <p class="bb-text-block bark-dog-bio">{{dogPage.dog.bio}}</p>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n' +
        '<div class="container-fluid">\n' +
        '    <bb-tile-dashboard bb-layout="dogPage.layout" bb-tiles="dogPage.tiles"></bb-tile-dashboard>\n' +
        '</div>\n' +
        '');
    $templateCache.put('pages/dogs/notes/noteadd.html',
        '<bb-modal>\n' +
        '  <div class="modal-form">\n' +
        '    <bb-modal-header>Add note</bb-modal-header>\n' +
        '    <div bb-modal-body>\n' +
        '      <form name="noteAdd.formAdd" ng-submit="noteAdd.saveData()">\n' +
        '        <div class="form-group">\n' +
        '          <label class="control-label">Title</label>\n' +
        '          <input type="text" class="form-control" ng-model="noteAdd.note.title" />\n' +
        '        </div>\n' +
        '        <div class="form-group">\n' +
        '          <label class="control-label">Description</label>\n' +
        '          <textarea class="form-control" ng-model="noteAdd.note.description"></textarea>\n' +
        '        </div>\n' +
        '        <div class="form-group">\n' +
        '          <label class="control-label">\n' +
        '            <input type="checkbox" bb-check ng-model="noteAdd.note.addConstituentNote" />\n' +
        '            Also add this note to the dog\'s current owner\n' +
        '          </label>\n' +
        '        </div>\n' +
        '      </form>\n' +
        '    </div>\n' +
        '    <bb-modal-footer>\n' +
        '      <bb-modal-footer-button-primary ng-click="noteAdd.save()"></bb-modal-footer-button-primary>\n' +
        '      <bb-modal-footer-button-cancel></bb-modal-footer-button-cancel>\n' +
        '    </bb-modal-footer>\n' +
        '  </div>\n' +
        '</bb-modal>\n' +
        '');
    $templateCache.put('pages/dogs/notes/notestile.html',
        '<bb-tile bb-tile-header="\'Notes\'">\n' +
        '  <div>\n' +
        '    <div class="toolbar bb-tile-toolbar">\n' +
        '      <button type="button" class="btn bb-btn-secondary" ng-click="dogNotesTile.addNote()"><i class="fa fa-plus-circle"></i> Add Note</button>\n' +
        '    </div>\n' +
        '    <div ng-show="dogNotesTile.notes">\n' +
        '      <div ng-switch="dogNotesTile.notes.length || 0">\n' +
        '        <div bb-tile-section ng-switch-when="0" class="bb-no-records">\n' +
        '          This dog has no notes.\n' +
        '        </div>\n' +
        '        <div ng-switch-default class="bb-repeater">\n' +
        '          <div ng-repeat="note in dogNotesTile.notes" class="bb-repeater-item">\n' +
        '            <h4 class="bb-repeater-item-title">{{ note.title }}</h4>\n' +
        '            <h5>{{ dogNotesTile.getNoteDate(note.date) }}</h5>\n' +
        '            <p>{{ note.description }}</p>\n' +
        '          </div>\n' +
        '        </div>\n' +
        '      </div>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</bb-tile>\n' +
        '');
    $templateCache.put('pages/dogs/previoushomes/previoushomestile.html',
        '<bb-tile bb-tile-header="\'Previous homes\'">\n' +
        '  <div>\n' +
        '    <div ng-show="dogSummaryTile.previousHomes">\n' +
        '      <div ng-switch="dogSummaryTile.previousHomes.length || 0">\n' +
        '        <div bb-tile-section ng-switch-when="0" class="bb-no-records">\n' +
        '          This dog has no previous homes.\n' +
        '        </div>\n' +
        '        <div ng-switch-default class="bb-repeater">\n' +
        '          <div ng-repeat="previousHome in dogSummaryTile.previousHomes" class="bb-repeater-item">\n' +
        '            <h4 class="bb-repeater-item-title">{{ previousHome.constituent.name }}</h4>\n' +
        '            <h5>\n' +
        '              {{ dogSummaryTile.getSummaryDate(previousHome.fromDate) }}\n' +
        '              <span ng-show="previousHome.toDate">\n' +
        '                to {{ dogSummaryTile.getSummaryDate(previousHome.toDate) }}\n' +
        '              </span>\n' +
        '            </h5>\n' +
        '          </div>\n' +
        '        </div>\n' +
        '      </div>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</bb-tile>\n' +
        '');
    $templateCache.put('pages/login/loginpage.html',
        '<bb-modal>\n' +
        '  <div class="modal-form modal-authorize">\n' +
        '    <bb-modal-header>Barkbaud</bb-modal-header>\n' +
        '    <div bb-modal-body>\n' +
        '      <p class="alert alert-danger" ng-if="loginPage.error" ng-switch="loginPage.error">\n' +
        '        <span ng-switch-when="access_denied">\n' +
        '          Barkbaud requires access to RENXT.\n' +
        '        </span>\n' +
        '        <span ng-switch-default>\n' +
        '          An unknown error has occurred.\n' +
        '        </span>\n' +
        '      </p>\n' +
        '      <p>Welcome to the Barkbaud Sample App.  This demo was built to showcase the Blackbaud NXT API and Blackbaud Sky UX.</p>\n' +
        '      <p>Click the Login button below to view the demo, or click the Learn More button below to visit the GitHub repo.</p>\n' +
        '    </div>\n' +
        '    <bb-modal-footer>\n' +
        '      <div ng-show="loginPage.waitingForAuth">\n' +
        '        <i class="fa fa-2x fa-spin fa-spinner" ></i> Checking authentication...\n' +
        '      </div>\n' +
        '      <div ng-hide="loginPage.waitingForAuth">\n' +
        '        <bb-modal-footer-button-primary  ng-click="loginPage.login()">\n' +
        '          Authorize Barkbaud\n' +
        '        </bb-modal-footer-button-primary>\n' +
        '        <a href="https://github.com/blackbaud/barkbaud" target="_blank" class="btn bb-btn-secondary">\n' +
        '          Learn More\n' +
        '        </a>\n' +
        '      </div>\n' +
        '    </bb-modal-footer>\n' +
        '  </div>\n' +
        '</bb-modal>\n' +
        '');
}]);

//# sourceMappingURL=app.js.map