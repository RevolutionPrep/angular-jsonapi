(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelForm', AngularJsonAPIModelFormWrapper);

  function AngularJsonAPIModelFormWrapper(
    AngularJsonAPIModelValidationError,
    AngularJsonAPIModelLinkerService,
    validateJS,
    $q
  ) {

    AngularJsonAPIModelForm.prototype.save = save;
    AngularJsonAPIModelForm.prototype.reset = reset;
    AngularJsonAPIModelForm.prototype.validate = validate;

    AngularJsonAPIModelForm.prototype.link = link;
    AngularJsonAPIModelForm.prototype.unlink = unlink;

    AngularJsonAPIModelForm.prototype.toJson = toJson;

    return {
      create: AngularJsonAPIModelFormFactory
    };

    function AngularJsonAPIModelFormFactory(parent) {
      return new AngularJsonAPIModelForm(parent);
    }

    function AngularJsonAPIModelForm(parent) {
      var _this = this;

      _this.data = {
        id: parent.data.id,
        type: parent.data.type,
        attributes: {},
        relationships: {}
      };

      _this.relationships = {};
      _this.parent = parent;
      _this.schema = parent.schema;
      _this.model = {};
      _this.reset();
    }

    /**
     * Encodes object into json
     * @return {json} Json object
     */
    function toJson() {
      var _this = this;
      var data = angular.copy(_this.data);
      var relationships = {};
      delete data.attributes;
      data.attributes = {};
      angular.forEach(_this.parent.data.attributes, function(value, key) {
        if (value != _this.model[key]) {
          data.attributes[key] = _this.model[key];
        }
        if (value != _this.data.attributes[key]) {
          data.attributes[key] = _this.data.attributes[key];
        }
      });
      angular.forEach(data.relationships, function(value, key) {
        if (value.data !== undefined) {
          relationships[key] = value;
          if (_this.model[key] && relationships[key].data.id !== _this.model[key].id) {
            relationships[key].data.id = _this.model[key].id;
          }
        }
      });
      data.relationships = relationships;

      return {
        data: data
      };
    }

    /**
     * Saves form, shortcut to parent.save()
     * @return {promise} Promise associated with synchronization
     */
    function save() {
      var _this = this;

      return _this.parent.save();
    }

    /**
     * Resets form to state of a parent
     * @return {undefined}
     */
    function reset(auto) {
      var _this = this;
      angular.forEach(_this.schema.relationships, function(data, key) {
        _this.data.relationships[key] = angular.copy(_this.parent.data.relationships[key]) || {};
        if (angular.isArray(_this.relationships[key])) {
          _this.relationships[key] = _this.parent.relationships[key].slice();
          angular.forEach(_this.relationships[key], function(data, key) {
            if (!_this.model[key]) { _this.model[key] = []; }
            var m = {};
            angular.extend(m, data.model);
            _this.model[key].push(m);
          });
        } else {
          _this.relationships[key] = _this.parent.relationships[key];
          if (_this.relationships[key]) {
            var m = {};
            angular.extend(m, _this.relationships[key].model);
            _this.model[key] = m;
          }
        }
      });

      if (auto === true && _this.parent.synchronized === true) {
        return;
      }

      angular.forEach(_this.schema.attributes, function(validator, key) {
        _this.data.attributes[key] = angular.copy(_this.parent.data.attributes[key]);
      });
      angular.extend(_this.model, _this.data.attributes);

      _this.parent.errors.validation.clear();
    }

    /**
     * Validates form
     * @return {promise} Promise rejected to errors object indexed by keys. If the
     * key param i stated it only validates an attribute, else all attributes.
     */
    function validate(key) {
      var _this = this;
      var attributesWrapper;
      var constraintsWrapper;
      var deferred = $q.defer();
      if (key === undefined) {
        attributesWrapper = _this.model; // _this.data.attributes;
        constraintsWrapper = _this.schema.attributes;
      } else {
        attributesWrapper = {};
        constraintsWrapper = {};

        attributesWrapper[key] = _this.model[key]; // _this.data.attributes[key];
        constraintsWrapper[key] = _this.schema.attributes[key];
      }

      validateJS.async(
        attributesWrapper,
        constraintsWrapper
      ).then(resolve, reject);

      function resolve() {
        if (key === undefined) {
          _this.parent.errors.validation.clear();
        } else {
          _this.parent.errors.validation.clear(key);
        }

        deferred.resolve();
      }

      function reject(errorsMap) {
        _this.parent.error = true;
        if (key === undefined) {
          _this.parent.errors.validation.clear();
        } else {
          _this.parent.errors.validation.clear(key);
        }

        angular.forEach(errorsMap, function(errors, attribute) {
          angular.forEach(errors, function(error) {
            _this.parent.errors.validation.add(attribute, AngularJsonAPIModelValidationError.create(error, attribute));
          });
        });

        deferred.reject(_this.parent.errors.validation);
      }

      return deferred.promise;
    }

    /**
     * Adds link to a form without synchronization
     * @param {string} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function link(key, target, oneWay) {
      var _this = this;
      oneWay = oneWay === undefined ? false : true;

      return $q.resolve(AngularJsonAPIModelLinkerService.link(_this.parent, key, target, oneWay, true));
    }

    /**
     * Removes link from form without synchronization
     * @param  {[type]} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function unlink(key, target, oneWay) {
      var _this = this;
      oneWay = oneWay === undefined ? false : true;

      return $q.resolve(AngularJsonAPIModelLinkerService.unlink(_this.parent, key, target, oneWay, true));
    }
  }
})();
