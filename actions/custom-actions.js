/**
 * Library to overlay a HTML5 application with helpful information like
 * How to's, tutorials, did you know's etc...
 *
 * *We need a promise library
 */
(function(define) {
    "use strict";
define(['playlist'], function(Playlist) {

    var Actionable = Playlist.Actionable;

    /**
     * This action will use setTimeout to wait the amount of time specified before completing.
     *
     * @param {[Object]} options:
     *    timeout: [number] - required - amount in millisecond to wait
     */
    function WaitAction(options) {
        this._options = options;
        Actionable.call(this);
    }
    WaitAction.prototype = Object.create(Actionable.prototype);
    Playlist.registerAction("wait", WaitAction);

    WaitAction.prototype.execute = function (value) {
        var that = this;
        setTimeout(function () {
            that.complete("start!" + value);
        }, this._options.timeout);
    };

});

})(typeof define == 'function' && define.amd
    ? define
    : function (deps, factory) {
        "use strict";
        factory(window.Playlist);
    }
    // Boilerplate for AMD, and browser global
);