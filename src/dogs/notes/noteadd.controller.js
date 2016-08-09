/*global angular */

(function () {
    'use strict';

    function NoteAddController($uibModalInstance, bbData, dogId) {
        var self = this;

        bbData.load({
            data: 'api/dogs/notetypes'
        }).then(function (result) {
            self.noteTypes = result.data.value;
        });

        self.note = {};
        self.saveData = function () {
            bbData.save({
                url: 'api/dogs/' + dogId + '/notes',
                data: self.note,
                type: 'POST'
            }).then(function (result) {
                $uibModalInstance.close(result.data);
            }).catch(function (result) {
                self.error = result.data.error;
            });
        };
    }

    NoteAddController.$inject = [
        '$uibModalInstance',
        'bbData',
        'dogId'
    ];

    angular.module('barkbaud')
        .controller('NoteAddController', NoteAddController);
}());
