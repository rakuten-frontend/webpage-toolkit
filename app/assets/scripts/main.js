(function () {
  'use strict';

  var angular = window.angular;
  var $ = window.jQuery;
  var Handlebars = window.Handlebars;
  var saveAs = window.saveAs;
  var Dyframe = window.Dyframe;

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

      var dyframe = new Dyframe($('#dyframe')[0], {});
      var template;
      var timer;

      $scope.schema = {};
      $scope.model = {};
      $scope.defaults = {};
      $scope.form = ['*'];
      $scope.loaded = false;
      $scope.started = false;
      $scope.settings = {
        previewDevice: 'pc'
      };
      $scope.errorShown = false;
      $scope.errorMessage = '';

      $scope.init = function () {
        var schemaRequest = $scope.loadSchema();
        var templateRequest = $scope.loadTemplate();
        $q.all([schemaRequest, templateRequest]).then(function () {
          $scope.loaded = true;
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

      $scope.start = function () {
        $scope.defaults = angular.copy($scope.model);
        $scope.syncStorage('model');
        $scope.syncStorage('settings');
        $scope.started = true;
      };

      $scope.syncStorage = function (key) {
        if (!localStorageService.get(key)) {
          localStorageService.set(key, $scope[key]);
        }
        localStorageService.bind($scope, key);
      };

      $scope.getHtml = function () {
        return template($scope.model);
      };

      $scope.getJson = function () {
        return JSON.stringify($scope.model, null, '  ');
      };

      $scope.render = function () {
        var profile = '';
        switch ($scope.settings.previewDevice) {
          case 'tablet':
          case 'smartphone':
            profile = $scope.settings.previewDevice;
            break;
        }
        $('#dyframe').removeClass().addClass('frame frame-' + $scope.settings.previewDevice);
        dyframe.render({
          html: $scope.getHtml(),
          profile: profile
        });
      };

      $scope.openPreview = function () {
        var child = window.open();
        child.document.open();
        child.document.write($scope.getHtml());
        child.document.close();
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
        var blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
        saveAs(blob, filename);
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

      $scope.$watch('model', function () {
        if (!$scope.loaded) {
          return;
        }
        if (!$scope.started) {
          $scope.start();
        }
        if (timer) {
          $timeout.cancel(timer);
        }
        timer = $timeout(function () {
          $scope.render();
        }, 500);
      }, true);

      $scope.$watch('importFiles', function () {
        if (!$scope.started || !$scope.importFiles || $scope.importFiles.length === 0) {
          return;
        }
        $scope.importJson($scope.importFiles[0]);
      });

      $scope.$watch('settings.previewDevice', function () {
        if (!$scope.started) {
          return;
        }
        $scope.render();
      });

      $scope.init();

    }
  ]);

}());
