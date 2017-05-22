(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelSourceError', AngularJsonAPIModelSourceErrorWrapper);

  function AngularJsonAPIModelSourceErrorWrapper() {
    SourceError.prototype = Object.create(Error.prototype);
    SourceError.prototype.constructor = SourceError;
    SourceError.prototype.name = 'SourceError';

    return {
      create: SourceErrorFactory
    };

    function SourceErrorFactory(message, source, code, action, response) {
      return new SourceError(message, source, code, action, response);
    }

    function SourceError(message, source, code, action, response) {
      var _this = this;
      var errors = [];
      if (response && response.data && response.data.errors) {
        errors = response.data.errors;
      }
      _this.message = message;
      _this.context = {
        source: source,
        code: code,
        action: action,
        errors: errors
      };
    }
  }
})();
