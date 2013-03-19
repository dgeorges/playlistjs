/**
 * Library to queue up asynchronous  events and then play them. Built on top of the cujojs's when  CommonJS Promises/A library.
 * Primary use case to build web application tutorials or step by step guides.
 * @author Daniel Georges
 */
(function(define) {
    "use strict";
define(['when/when', 'when/pipeline', 'when/parallel'], function(when, pipeline, parallel) {

    /**
     * The parent class of playlistjs unit of work.
     *
     * Inherit this prototype to make your own Action. Your action must have an execute method
     * which will be called when playlistjs has determined it should play your action. Your
     * execute method can do whatever it want synchronously or asynchronously. As long as either
     * complete or fail are eventually called to indicate the end of the action.
     */
    function Actionable () {
        this._deferred = when.defer();
    }

    /** May be overridden but override should always invoke parent */
    Actionable.prototype.complete = function (results) {
        // fulfill the promise
        this._deferred.resolve(results);
    };

    /** May be overridden but override should always invoke parent */
    Actionable.prototype.fail = function (error) {
        // fail the promise
        this._deferred.reject(error);
    };

    Actionable.prototype.doAction = function (value) {
        this.execute(value);
        return this._deferred.promise;
    };

    /**
     * Map of registered actions.
     * @type {Object}
     */
    var actionables = {};
    function registerAction(name, actionable){
        actionables[name] = actionable;
    }

    function getActions (name, actionable){
        return actionables;
    }

    /** Helper functions **/

    function isActionable (a) {
        return a instanceof Actionable || !!a.actionName;
    }
    function isObject (obj) {
        return !!obj && Object.prototype.toString.call(obj) === '[object Object]';
    }

    function isValidPlaylistDescriptor (descriptor) {
        return !isActionable(descriptor) && (Array.isArray(descriptor) || isObject(descriptor));
    }

    function onError(e) {
        throw new Error("error executing Actionable");
    }

    function createActionable (obj) {
        if (obj instanceof Actionable) {
            return obj;
        } else if (obj.actionName) {
            var ActionableConstructor = actionables[obj.actionName];
            if (ActionableConstructor) {
                return new ActionableConstructor(obj.options);
            }
        }

        return undefined;
    }

    /** The playlist **/

    function Playlist (descriptor, start, end) {
        this._descriptor = descriptor || [];
        this._start = start;
        this._end = end;
    }

    /**
     * Execute the created playlist.
     */
    Playlist.prototype.play = function () {
        this._start.resolve(true);
    };

    function createSyncronizedPlaylist (descriptor) {
        var defered = when.defer();
        var promise = defered.promise;

        var actionPipeline = descriptor.map(function (step) {
            if (isValidPlaylistDescriptor(step)) {
                var newPlaylist = createPlaylist(step);
                return function (value) {
                    this.play();
                    return this._end;
                }.bind(newPlaylist);
            } else {
                var action = createActionable(step);
                if (!action) {
                    throw new Error("incorrect syntax");
                }
                return action.doAction.bind(action);
            }
        });
        promise = promise.then(function (value) {
            return pipeline(actionPipeline, value);
        }, onError);

        return new Playlist(descriptor, defered, promise);
    }

    function createAsyncronizedPlaylist (descriptor) {
        var defered = when.defer();
        var promise = defered.promise;

        var promises = [];
        var actions = [];
        Object.keys(descriptor).forEach(function (stepName) {
            var step = descriptor[stepName];
            if (isValidPlaylistDescriptor(step)) {
                var newPlaylist = createPlaylist(step);
                actions.push(function (value) {
                    this.play();
                    return this._end;
                }.bind(newPlaylist));
            } else {
                var action = createActionable(step);
                if (!action) {
                    throw new Error("incorrect syntax");
                }
                actions.push(action.doAction.bind(action));
            }
        });
        promise = promise.then(function (value) {
            return parallel(actions, value);
        }, onError);

        return new Playlist(descriptor, defered, promise);
    }

    /**
     * Given a playlist descriptor will create the playlist instance.
     *
     * @param {[Array || Object]} descriptor - A collection of Objects that describe the actions you wish to invoke.
     * Each Object in the collection can be an instance of Actionable or a simple JSON object of the Actionable.
     * If using the JSON object to describe the actionable, it must have the property actionName, which is the
     * name the Actionable was registered with and a options property that will be passed to the constructor of
     * that class. If the collection of Objects is an array, each action is done in sequence. If the collection
     * is a map (ie. JSON object) action are invoked together. Your descriptor can be a mix of array's or map's
     * to describe your unique workflow.
     *
     */
    function createPlaylist (descriptor) {
        var playlist;
        if (isObject(descriptor) && !isActionable(descriptor)) {
            playlist = createAsyncronizedPlaylist(descriptor);
        } else if (Array.isArray(descriptor)) {
            playlist = createSyncronizedPlaylist(descriptor);
        }

        return playlist;
    }


    return {
        Actionable: Actionable,
        createPlaylist: createPlaylist,
        registerAction: registerAction,
        getActions: getActions
    };
});
})(typeof define == 'function' && define.amd
    ? define
    : function (deps, factory) { typeof exports == 'object'
        ? (module.exports = factory(require('when/when'), require('when/pipeline'), require('when/parallel')))
        : (this.Playlist = factory(this.when, this.when_pipeline, this.when_parallel));
    }
    // Boilerplate for AMD, Node, and browser global
);