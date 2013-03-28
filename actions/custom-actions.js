/**
 * Custom playlistjs Actions.
 */
(function(define) {
    "use strict";
define(['playlist', 'jQuery'], function(Playlist, $) {

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


    /**
     * Will display a Notice at the top of the screen. The action completes after the specified time and
     * the notice has faded out.
     *
     * @param {[Object]} options:
     *    timing: [Array] - required - specifies the duration as such [fade-in time, duration, fade-out time]
     *    content: [string | function] - required - content to be displayed in the notice.
     *    class: [string] - optional - space separated string of css class you like to apply to the container
     */
    function NoticeAction (options) {
        var widget = $("<div/>", {"style": "position: fixed; top: 0px; width: 100%; display: none"});

        if (options["class"]) {
            widget.addClass(options["class"]);
        }

        if (typeof options.content === 'string') {
            widget.append($("<div>", {"class": "playlistjs-notice", "text": options.content}));
        } else if (typeof options.content === 'string') {
            widget.append(options.content());
        }

        this._widget = widget;
        this._options = options;
        Actionable.call(this);
    }
    NoticeAction.prototype = Object.create(Actionable.prototype);
    Playlist.registerAction("notice", NoticeAction);

    NoticeAction.prototype.execute = function (value) {
        var that = this,
            timing = this._options.timing;

        $("body").prepend(this._widget);
        this._widget.toggle("fade", timing[0], function () {
            setTimeout(function () {
                that._widget.toggle("fade", timing[2], function () {
                    that._widget.remove();
                    that.complete();
                });
            }, timing[1]);

        });
    };



    /**
     * Will apply the specified styles to the target for a specified amount of time and then will revert it.
     * Action is complete once original styles have been re-applied.
     * @param {[Object]} options:
     *    target: [string] - required - css selector of DOM elements you wish to target.
     *    style: [map] - required - css style you wish to apply.
     *    applyTIme: [number] - number of millisecond the styles should be applied for.
     */
    function AlterStyleAction (options) {
        var widget = $(options.target);
        var originalStyles = {};
        Object.keys(options.style).forEach(function (prop) {
            originalStyles[prop] = widget.css(prop);
        });


        this._widget = widget;
        this._originalStyle = originalStyles;
        this._options = options;
        Actionable.call(this);
    }
    AlterStyleAction.prototype = Object.create(Actionable.prototype);
    Playlist.registerAction("alterStyles", AlterStyleAction);

    AlterStyleAction.prototype.execute = function (value) {
        var that = this;

        this._widget.css(this._options.style);
        if (this._options.applyTime) {
            setTimeout(function () {
                that.revert();
            }, this._options.applyTime);
        }
    };

    AlterStyleAction.prototype.revert = function () {
        this._widget.css(this._originalStyle);
        this.complete();
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