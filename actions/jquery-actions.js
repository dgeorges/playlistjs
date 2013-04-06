/**
 * playlistjs Actions built ontop of jquery ui.
 */
(function(define) {
    "use strict";
define(['playlist', 'jQuery'], function(Playlist, $) {

    var Actionable = Playlist.Actionable;


    /**
     * A playlistjs action that displays a jquery dialog and completes when the dialog is closed.
     *
     * @param {[Object]} options:
     *     selector: [string] - optional - jquery selector on jqueryui's .dialog will be called on. If not
     *         supplied one will be created for you using the title and content options.
     *     title: [string] - optional - dialog title text
     *     content: [string | function] - optional - content o be appended into the body of the dialog.
     *     dialogOptions: [object] - optional -see http://api.jqueryui.com/dialog/
     */
    function DialogAction (options) {
        var that = this;
        var widget = options.selector ? $(options.selector) : $("<div/>", {title: options.title});

        if (typeof options.content === "string") {
            widget.append($("<p/>", {"text": options.content}));
        } else if (typeof options.content === "function") {
            widget.append(options.content());
        }

        widget.on( "dialogclose", function( event, ui ) {
            that._widget.remove();
            that.complete();
        });

        //todo prevent something?
        this._dialogOptions = options.dialogOptions;
        this._widget = widget;
        Actionable.call(this, options);
    }
    DialogAction.prototype = Object.create(Actionable.prototype);
    Playlist.registerAction("dialog", DialogAction);

    DialogAction.prototype.begin = function (value) {
        this._widget.dialog(this._dialogOptions);
    };


});

})(typeof define == 'function' && define.amd
    ? define
    : function (deps, factory) {
        "use strict";
        factory(window.Playlist, window.$);
    }
    // Boilerplate for AMD, and browser global
);