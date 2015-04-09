(function () {
  'use strict';

  var angular = window.angular;
  var _ = window._;
  var Handlebars = window.Handlebars;

  var appName = 'webpage-toolkit';
  var schemaUrl = 'data/schema.json';
  var templateUrl = 'data/template.hbs';

  angular
  .module('webpageToolkit', ['schemaForm', 'angularFileUpload', 'LocalStorageModule', 'ui.sortable'])
  .config([
    'localStorageServiceProvider',
    'schemaFormDecoratorsProvider',
    function (localStorageServiceProvider, decoratorsProvider) {
      localStorageServiceProvider.setPrefix(appName);
      decoratorsProvider.addMapping(
        'bootstrapDecorator',
        'array',
        'assets/templates/array.html'
      );
    }
  ])
  .controller('FormController', [
    '$scope',
    '$q',
    '$http',
    '$timeout',
    'localStorageService',
    function ($scope, $q, $http, $timeout, localStorageService) {

      var viewport = document.getElementById('viewport');
      var template;

      $scope.schema = {};
      $scope.model = {};
      $scope.defaults = {};
      $scope.form = ['*'];
      $scope.initialized = false;
      $scope.previewDevice = 'pc';
      $scope.errorShown = false;
      $scope.errorMessage = '';

      $scope.init = function () {
        var schemaRequest = $scope.loadSchema();
        var templateRequest = $scope.loadTemplate();
        $q.all([schemaRequest, templateRequest]).then(function () {
          $timeout(function () {
            $scope.defaults = angular.copy($scope.model);
            if (!localStorageService.get('model')) {
              localStorageService.set('model', $scope.model);
            }
            localStorageService.bind($scope, 'model');
            $scope.initialized = true;
          }, 100);   // Hotfix for getting array value correctly.
        });
      };

      $scope.loadSchema = function () {
        var request = $http.get(schemaUrl).then(function (data) {
          $scope.schema = data.data;
        });
        return request;
      };

      $scope.loadTemplate = function () {
        var request = $http.get(templateUrl).then(function (data) {
          template = Handlebars.compile(data.data);
        });
        return request;
      };

      $scope.getHtml = function () {
        return template($scope.model);
      };

      $scope.getJson = function () {
        return JSON.stringify($scope.model, null, '  ');
      };

      $scope.render = function () {
        viewport.contentWindow.document.open();
        viewport.contentWindow.document.write($scope.getHtml());
        viewport.contentWindow.document.close();
      };

      $scope.downloadHtml = function () {
        $scope.$broadcast('schemaFormValidate');
        if (!$scope.appForm.$valid) {
          $scope.alert('Invalid form input');
          return;
        }
        $scope.download('index.html', $scope.getHtml());
      };

      $scope.downloadJson = function () {
        $scope.download('data.json', $scope.getJson());
      };

      $scope.download = function (filename, text) {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);
        pom.click();
      };

      $scope.importJson = function (file) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function () {
          $scope.import($scope.parseJson(reader.result));
        };
      };

      $scope.parseJson = function (string) {
        return JSON.parse(string);
      };

      $scope.import = function (data) {
        $scope.model = angular.copy(data);
        $scope.$apply();
        $scope.$broadcast('schemaFormValidate');
      };

      $scope.reset = function () {
        $scope.model = angular.copy($scope.defaults);
      };

      $scope.alert = function (message) {
        $scope.errorMessage = message;
        $scope.errorShown = true;
        $timeout(function () {
          $scope.errorMessage = '';
          $scope.errorShown = false;
        }, 2000);
      };

      $scope.$watch('model', _.debounce(function () {
        if (!$scope.initialized) {
          return;
        }
        $scope.$apply(function () {
          $scope.render();
        });
      }, 500), true);

      $scope.$watch('importFiles', function () {
        if (!$scope.initialized || !$scope.importFiles || $scope.importFiles.length === 0) {
          return;
        }
        $scope.importJson($scope.importFiles[0]);
      });

      $scope.init();

    }
  ]);

}());
