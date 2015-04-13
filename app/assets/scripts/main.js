(function () {
  'use strict';

  var angular = window.angular;
  var $ = window.jQuery;
  var _ = window._;
  var Handlebars = window.Handlebars;
  var saveAs = window.saveAs;

  var appName = 'webpage-toolkit';
  var schemaUrl = 'data/schema.json';
  var templateUrl = 'data/template.hbs';
  var deviceData = {
    pc: {
      width: 1024,
      height: 1600
    },
    tablet: {
      width: 768,
      height: 1024
    },
    smartphone: {
      width: 375,
      height: 667
    }
  };
  var defaultViewportWidth = 980;

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
      $scope.settings = {
        previewDevice: 'pc'
      };
      $scope.html = '';
      $scope.previewWidth = 0;
      $scope.errorShown = false;
      $scope.errorMessage = '';

      $scope.init = function () {
        var schemaRequest = $scope.loadSchema();
        var templateRequest = $scope.loadTemplate();
        $q.all([schemaRequest, templateRequest]).then(function () {
          $timeout(function () {
            $scope.defaults = angular.copy($scope.model);
            $scope.syncStorage('model');
            $scope.syncStorage('settings');
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
        $scope.html = $scope.getHtml();
        $scope.previewWidth = $scope.getPreviewWidth();
        $timeout(function () {
          viewport.contentWindow.document.open();
          viewport.contentWindow.document.write($scope.html);
          viewport.contentWindow.document.close();
        });
      };

      $scope.getPreviewWidth = function () {
        if ($scope.settings.previewDevice === 'pc') {
          return deviceData.pc.width;
        }
        var viewportData = $scope.getViewportData();
        var width = viewportData.width;
        if (!width) {
          return defaultViewportWidth;
        }
        if (width === 'device-width') {
          return deviceData[$scope.settings.previewDevice].width;
        }
        return parseInt(width, 10);
      };

      $scope.getViewportData = function () {
        var viewportData = {};
        var viewportContent = $('<div>').append($scope.html).find('meta[name="viewport"]').attr('content');
        if (!viewportContent) {
          return viewportData;
        }
        viewportContent.split(',').forEach(function (configSet) {
          var config = configSet.trim().split('=');
          if (!config[0] || !config[1]) {
            return;
          }
          viewportData[config[0].trim()] = config[1].trim();
        });
        return viewportData;
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

      $scope.$watch('settings.previewDevice', function () {
        $scope.previewWidth = $scope.getPreviewWidth();
      });

      $scope.init();

    }
  ])
  .directive('appViewport', [
    '$timeout',
    function ($timeout) {
      return {
        restrict: 'A',
        link: function (scope, element) {
          scope.$watchGroup(['settings.previewDevice', 'previewWidth'], function () {
            $timeout(function () {
              var device = deviceData[scope.settings.previewDevice];
              var viewportWidth = element.width();
              var ratio = device.height / device.width;
              var scale = viewportWidth / scope.previewWidth;
              var viewport = element.find('iframe');
              element.css({
                paddingBottom: viewportWidth * ratio
              });
              viewport.css({
                width: (100 / scale) + '%',
                height: (100 / scale) + '%',
                transform: 'scale(' + scale + ')'
              });
            });
          });
        }
      };
    }
  ]);

}());
