(function () {
  'use strict';

  var angular = window.angular;
  var _ = window._;
  var $ = window.jQuery;
  var Handlebars = window.Handlebars;

  var schemaUrl = 'schema.json';
  var templateUrl = 'template.hbs';

  angular
  .module('webpageToolkit', ['schemaForm', 'angularFileUpload'])
  .controller('FormController', [
    '$scope',
    '$q',
    '$http',
    function ($scope, $q, $http) {

      var viewport = $('#preview').contents().find('html');
      var template;

      $scope.schema = {};
      $scope.model = {};
      $scope.form = ['*'];
      $scope.initialized = false;

      $scope.init = function () {
        var schemaRequest = $scope.loadSchema();
        var templateRequest = $scope.loadTemplate();
        $q.all([schemaRequest, templateRequest]).then(function () {
          $scope.initialized = true;
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
        viewport.html($scope.getHtml());
      };

      $scope.downloadHtml = function () {
        $scope.$broadcast('schemaFormValidate');
        if (!$scope.appForm.$valid) {
          alert('Invalid form data');
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
        }
      };

      $scope.parseJson = function (string) {
        return JSON.parse(string);
      };

      $scope.import = function (data) {
        $scope.model = angular.copy(data);
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
