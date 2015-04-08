(function () {
  'use strict';

  var angular = window.angular;
  var _ = window._;
  var $ = window.jQuery;
  var Handlebars = window.Handlebars;

  var schema = {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "title": "Name",
        "description": "Name or alias",
        "maxLength": 10
      },
      "type": {
        "type": "string",
        "title": "Type",
        "enum": ["dr", "jr", "sir", "mrs", "mr", "NaN", "dj"]
      },
      "friends": {
        "type": "array",
        "title": "Friends",
        "items": {
          "type": "object",
          "title": "Friend",
          "properties": {
            "name": {
              "type": "string",
              "title": "Name"
            }
          },
          "required": ["name"]
        }
      }
    },
    "required": ["name"]
  };
  var source = '<h1>Hello, {{type}}{{name}}!</h1>\n' +
               '<h2>Friends:</h2>\n' +
               '<ul>\n' +
               '{{#each friends}}\n' +
               '<li>{{name}}</li>\n' +
               '{{/each}}\n' +
               '</ul>';
  var template = Handlebars.compile(source);
  var viewport = $('#preview').contents().find('html');

  angular
  .module('webpageToolkit', ['schemaForm'])
  .controller('FormController', [
    '$scope',
    function ($scope) {

      $scope.schema = schema;
      $scope.model = {};

      $scope.form = ['*'];

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

      $scope.$watch('model', _.debounce(function () {
        $scope.$apply(function () {
          $scope.render();
        });
      }, 500), true);

    }
  ]);

}());
