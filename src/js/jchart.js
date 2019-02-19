/* jChart plugin
 * by Adam Kocić (Falkan3)
 * github.com/Falkan3
 * (c) 2019-02-19
 *
 * !
 * Universal Module Definition (UMD) with Constructor Boilerplate
 * (c) 2017 Chris Ferdinandi, MIT License, https://gomakethings.com
 */

(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([], function () {
            return factory(root);
        });
    } else if ( typeof exports === 'object' ) {
        module.exports = factory(root);
    } else {
        root.jChart = factory(root);
    }
})(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this, function (window) {

    'use strict';

    //
    // Shared Variables
    //

    const defaults = {
        pluginName: 'jChart',
        initClass: 'js-jchart',
        someVar: 123,
        callbackOnInit: function() {
        },
        callbackBefore: function () {
        },
        callbackAfter: function () {
        },
        callbackOnInitArray: [
            function () {
                console.log('Init function callback array 1');
            },
            function () {
                console.log('Init function callback array 2');
            },
        ],
    };


    //
    // Shared Methods
    //

    //
    // Helpers
    //
    const Helper = require('./modules/helper.js');
    const SvgHelper = require('./modules/svg_helper.js');

    //
    // Constructor
    // Can be named anything you want
    //

    const Constructor = function (options) {

        //
        // Unique Variables
        //

        const publicAPIs = {};
        let settings;

        //
        // Internal Helpers
        //

        let svgHelper;

        //
        // Unique Methods
        //

        /**
         * A private method
         */
        const somePrivateMethod = function () {
            // Code goes here...
            Helper.log(settings.someVar, 'info');
            console.log(svgHelper.test());
        };

        /**
         * A public method
         */
        publicAPIs.doSomething = function () {
            somePrivateMethod();
            // Code goes here...
        };

        /**
         * Another public method
         */
        publicAPIs.init = function (options) {

            // Merge options into defaults
            settings = Helper.mergeDeep(defaults, options || {});

            // Initialize internal helpers
            svgHelper = new SvgHelper(settings);

            // On Init callback
            publicAPIs.callbackCall('Init');
        };

        /**
         * Call callback by name
         * @public
         * @param {String} callbackName callback's name
         */
        publicAPIs.callbackCall = function (callbackName) {
            const callback = settings[`callbackOn${callbackName}`];
            const callbackArray = settings[`callbackOn${callbackName}Array`];
            if (typeof callback === 'function') {
                callback.call(this);
            }
            if(Helper.isArray(callbackArray)) {
                Helper.forEach(callbackArray, function(value, prop) {
                    if (typeof callbackArray[prop] === 'function') {
                        callbackArray[prop].call(this);
                    }
                }, this);
            }
        };

        // Initialize the plugin
        publicAPIs.init(options);

        // Return the public APIs
        return publicAPIs;

    };


    //
    // Return the constructor
    //

    return Constructor;

});