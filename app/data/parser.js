(function () {
  'use strict';

  var angular = window.angular;

  angular
  .module('webpageToolkit')
  .factory('parser', [
    function () {
      return {

        // You can modify "data" for compiling with template.
        // This preset code just passes the data as is.
        parse: function (data) {
          var parsedData = angular.copy(data);
          return parsedData;
        }

      };
    }
  ]);

}());
