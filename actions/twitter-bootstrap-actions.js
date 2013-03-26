
(function(define) {
    "use strict";
define(['playlist', 'jQuery'], function(Playlist, $) {
    var Actionable = Playlist.Actionable;

    /**
     * A playlistjs action that displays a twitter bootstrap modal and completes when the modal is hidden. As
     * per http://twitter.github.com/bootstrap/javascript.html#modals.
     *
     * @param {[object]} options:
     *     contentProvider: [object] - an object with the following methods: getHeader, getBody, getFooter. Each
     *         called to populate their respective areas.
     *     dismissBtnText: [string]
     *     closeable: [boolean] - optional - if true will place and 'x' in the top right cornor to dismiss the modal
     *     modalOptions: [Object]  see http://twitter.github.com/bootstrap/javascript.html#modals
     */
    function ModalAction (options) {
        var that = this;
        var contentProvider = options.contentProvider;
        var widget = $("<div/>", {"class": "modal hide fade"});

        var isCloseable = options.closeable;

        function createCloseButton () {
            return $("<button/>", {"class": "close", "data-dismiss":"modal", "type":"button"}).html("&times;");
        }
        function createDismissButton () {
            return $("<button/>", {"class": "btn", "data-dismiss":"modal"}).text(options.dismissBtnText);
        }

        if (contentProvider.getHeader) {
            var header = $("<div/>", {"class": "modal-header"});
            if (isCloseable) {
                header.append(createCloseButton());
                isCloseable = false; // button is inserted set to false to prevent it from being created again
            }

            header.append(contentProvider.getHeader());
            widget.append(header);
        }

        if (contentProvider.getBody) {
            var body = $("<div/>", {"class": "modal-body"});
            if (isCloseable) {
                body.append(createCloseButton());
                isCloseable = false; // button is inserted set to false to prevent it from being created again
            }
            body.append(contentProvider.getBody());
            widget.append(body);
        }

        if (contentProvider.getFooter) {
            var footer = $("<div/>", {"class": "modal-footer"});
            footer.append(contentProvider.getFooter());
            if(options.dismissBtnText) {
                footer.append(createDismissButton());
            }
            widget.append(footer);
        } else if (options.dismissBtnText) {
            widget.append(createDismissButton());
        }

        widget.on("hidden", function () {
            that.complete(true);
            widget.remove(); //must be removed
        });

        this._modalOptions = options.modalOptions;
        this._widget = widget;
        Actionable.call(this);
    }
    ModalAction.prototype = Object.create(Actionable.prototype);
    Playlist.registerAction("modal", ModalAction);

    ModalAction.prototype.execute = function (value) {
        this._widget.modal(this._modalOptions);
    };


    /**
     * A playlistjs action that displays a twitter bootstrap popover and completes when the popover is hidden
     * or destroyed as described by http://twitter.github.com/bootstrap/javascript.html#popovers. Note: another
     * way to close the popover is to call the close method or any click event that fire on any element in the
     * popover that has the class 'close'.
     *
     * @param {[Object]} options:
     *    target: [string] - required - css selector indicating the elements to display the popover on.
     *    closeable: [boolean] - optional - if true and popoverOptions have html=true will place a 'x' in the title
     *        which will hide the popover when pressed.
     *    closeTimeout: [number] - optional - if specified popover will automatically close after time has expired.
     *        completing the action.
     *    popoverOptions: [object] see http://twitter.github.com/bootstrap/javascript.html#popovers
     */
    function PopoverAction (options) {
        var that = this;
        var widget = $(options.target);

        widget.on("hide", function () {
            that.complete();
        });

        function closeFn (event) {
            if (this.dataset.popoverId === that._uuid) {
                that.close();
                $(document).off("click", ".popover .close", closeFn);
                // take lister off.
            }
        }

        $(document).on("click", ".popover .close", closeFn);

        this._uuid = "" + Date.now();
        this._widget = widget;
        this._popoverOptions = options.popoverOptions;
        this._options = options;
        Actionable.call(this);
    }
    PopoverAction.prototype = Object.create(Actionable.prototype);
    Playlist.registerAction("popover", PopoverAction);


    PopoverAction.prototype.execute = function (value) {
        if (this._options.closeable && this._popoverOptions.html) {
            var close = $("<div/>").append($("<a/>", {"class": "close", "html": "&times;", "data-popover-id": this._uuid})).html();
            this._popoverOptions.title += close;
        }

        this._widget.popover(this._popoverOptions);

        this._widget.popover("show");
        var that = this;
        if (this._options.closeTimeout) {
            setTimeout(function () {
                that._widget.popover("hide");
            }, this._options.closeTimeout);
        }
    };

    PopoverAction.prototype.close = function () {
        this._widget.popover("hide");
    };


    /**
     * A playlistjs action that displays a twitter bootstrap alert and completes when the alert is closed.
     * see http://twitter.github.com/bootstrap/javascript.html#alerts
     *
     * @param {[Object]} options:
     *      target: [string] - required - css selector where alert will be displayed
     *      closeable: [boolean] - optional - if true will place an 'x' that when clicked will dismiss the alert
     *      closeTimeout: [number] - optional - if specified popover will automatically close after time has expired.
     *      class: [string] - optional - a css class to add to the alert. for example "alert-error" for twitter error style
     *      contentProvider: [string || function] - The main contents of the alert
     */
    function AlertAction (options) {
        var that = this;
        var contentProvider = options.contentProvider;

        var widget = $("<div/>", {"class": "alert fade in "}).addClass(options["class"] || "");
        if (options.closeable) {
            widget.append($("<a/>", {"class": "close", "data-dismiss": "alert", "href":"#", "html": "&times;"}));
        }

        if (typeof contentProvider === "string") {
            widget.append(document.createTextNode(contentProvider));
        }

        if (contentProvider.getHeading) {
            widget.append(contentProvider.getHeading());
        }

        if (contentProvider.getBody){
            widget.append(contentProvider.getBody());
        }
        // fired when alert is dismissed from x or timeout.
        widget.on("closed", function () {
            that.complete(true);
        });

        this._options = options;
        this._widget = widget;
        this._alert = widget.alert();
        Actionable.call(this);
    }
    AlertAction.prototype = Object.create(Actionable.prototype);
    Playlist.registerAction("alert", AlertAction);

    AlertAction.prototype.execute = function (value) {
        var that = this;
        $(this._options.target).prepend(this._widget);

        if (this._options.closeTimeout) {
            setTimeout(function () {
                that._widget.alert('close');
            }, this._options.closeTimeout);
        }
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