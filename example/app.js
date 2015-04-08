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
               '<h2>Friends:</h2>' +
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
    '$sce',
    function ($scope, $sce) {

      $scope.schema = schema;
      $scope.model = {};

      $scope.form = [
        '*',
        {
          type: 'submit',
          title: 'Save'
        }
      ];

      $scope.submit = function (form) {
        $scope.$broadcast('schemaFormValidate');
        if (form.$valid) {
          console.log($scope.model);
        }
      };

      $scope.preview = function () {
        var html = template($scope.model);
        viewport.html(html);
      };

      $scope.$watch('model', _.debounce(function () {
        $scope.$apply(function () {
          $scope.preview();
        });
      }, 500), true);

    }
  ]);

}());
