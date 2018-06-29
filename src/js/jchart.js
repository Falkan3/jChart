/*
 *  Plugin template - v0.0.1
 *  A plugin template
 *
 *  Made by Adam Kocić (Falkan3)
 *  Under MIT License
 */
// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ($, window, document, undefined) {

    "use strict";

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    const pluginName = "jChart",
        pluginNameLower = pluginName.toLowerCase(),
        objPrefix = 'jchart--',

        defaults = {
            elements: {
                container: null,
                body: null,
            },
            data: {
                value: 0,
                maxvalue: 0,
            },
            appearance: {
                baseColor: '#ddd',
                segmentColor: '#00a3f2',
                baseOffset: 0,
            },
            callbacks: {
                onInit() {
                }
            }
        };
    let objThis = null;

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend(true, {}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        objThis = this;

        //dynamic vars
        //this.html = $('html');

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        //if(jQuery.fn.pluginName) {...} - check for functions from other plugins (dependencies)

        init() {

            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.settings
            // you can add more functions like the one below and
            // call them like the example bellow
            this.initElement();

            // On Init callback
            if (this.settings.callbacks.onInit && $.isFunction(this.settings.callbacks.onInit)) {
                this.settings.callbacks.onInit.call(this);
            }
        },

        /*
         * Main function for initializing
         */
        initElement() {
            objThis.initHtml();
        },

        /*
         * Initialize HTML drawing function
         */
        initHtml() {
            objThis.drawContainer();
            objThis.drawBody();
        },

        /*
         * Draw chart container
         */
        drawContainer() {
            const $html = $('<div>', {'class': pluginNameLower});
            objThis.settings.elements.container = $html;
            objThis.$element.append($html);
        },

        drawBodyBase() {
            //const $html_svg = $('<svg>', {'class': objPrefix + 'donut', 'width': '100%', 'height': '100%', 'viewBox': '0 0 42 42'});

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('class', objPrefix + 'donut');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 42 42'); // double cx and cy
            svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

            const donutRing = objThis.drawSvgCircle({
                class: objPrefix + 'donut--ring',
                fill: 'transparent',
                stroke: objThis.settings.appearance.baseColor,
                'stroke-width': 3
            });
            // const donutHole = objThis.drawSvgCircle({
            //     class: objPrefix + 'donut--hole'
            // });
            const donutSegment = objThis.drawSvgCircle({
                class: objPrefix + 'donut--segment',
                fill: 'transparent',
                stroke: objThis.settings.appearance.segmentColor,
                'stroke-width': 3,
                'stroke-dasharray': '85 15', // Circumference − All preceding segments’ total length + First segment’s offset = Current segment offset
            });
            const donutSegment2 = objThis.drawSvgCircle({
                class: objPrefix + 'donut--segment',
                fill: 'transparent',
                stroke: '#ce4b99',
                'stroke-width': 3,
                'stroke-dasharray': '15 85',
                'stroke-dashoffset': '40',
            });

            const svgElement = objThis.settings.elements.body[0].appendChild(svg);
            svgElement.appendChild(donutRing);
            //svgElement.appendChild(donutHole);
            svgElement.appendChild(donutSegment);
            svgElement.appendChild(donutSegment2);

            /* jQuery (doesn't work properly) */
            // const $html_hole = $('<circle>', {'class': objPrefix + 'donut--hole', 'cx': 21, 'cy': 21, 'r': 15.91549430918954, 'fill': '#fff'});
            // const $html_ring = $('<circle>', {'class': objPrefix + 'donut--ring', 'cx': 21, 'cy': 21, 'r': 15.91549430918954, 'fill': 'transparent', 'stroke': '#d2d3d4', 'stroke-width': 3});

            // $('<svg width="100%" height="100%" viewBox="0 0 42 42" class="donut">\n' +
            // '  <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="#fff"></circle>\n' +
            // '  <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#d2d3d4" stroke-width="3"></circle>\n' +
            // '\n' +
            // '  <circle class="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#ce4b99" stroke-width="3"></circle>\n' +
            // '</svg>');

            //$html_svg.attr({width: '100%', height: '100%'})
            // $html_svg.append($html_hole).append($html_ring);
        },

        drawSvgCircle(options) {
            const defaults = {
                'class': '',
                'cx': 21, // half of viewbox
                'cy': 21, // half of viewbox
                'r': 100 / (2 * Math.PI),// 15.91549430918954
                'fill': '#fff',
                'stroke': '', // #000
                'stroke-width': 0,
                'stroke-dasharray': '',
                'stroke-dashoffset': '25',
            };
            const settings = $.extend(true, {}, defaults, options);

            const nCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            nCircle.setAttributeNS(null, "class", settings.class);
            nCircle.setAttributeNS(null, "cx", settings.cx);
            nCircle.setAttributeNS(null, "cy", settings.cy);
            nCircle.setAttributeNS(null, "r", settings.r);
            nCircle.setAttributeNS(null, "fill", settings.fill);
            if (settings.stroke)
                nCircle.setAttributeNS(null, "stroke", settings.stroke);
            if (settings['stroke-width'])
                nCircle.setAttributeNS(null, "stroke-width", settings['stroke-width']);
            if (settings['stroke-dasharray'])
                nCircle.setAttributeNS(null, "stroke-dasharray", settings['stroke-dasharray']);
            if (settings['stroke-dashoffset'])
                nCircle.setAttributeNS(null, "stroke-dashoffset", settings['stroke-dashoffset']);

            return nCircle;
        },

        drawBodySegment() {

        },

        /*
         * Draw chart body
         */
        drawBody() {
            const $html = $('<div>', {'class': objPrefix + 'body'});
            objThis.settings.elements.body = $html;
            objThis.settings.elements.container.append($html);

            objThis.drawBodyBase();
        },

        /* ------------------------------ HELPERS ------------------------------- */

        Log(message) {
            console.log('*** ' + pluginName + ' ***');

            if (message instanceof Array) {
                for (let value of message) {
                    console.log(message);
                }
            } else {
                console.log(message);
            }
        },

        /*
         * Sort an array containing DOM elements by their position in the document (top to bottom)
         */
        objSortByPositionInDOM(input, attr, attr2) {
            //sort by position in DOM
            let _input = input;
            let output;
            if (attr && attr2) {
                output = _input.sort(function (a, b) {
                    if (a[attr][attr2][0] === b[attr][attr2][0]) return 0;
                    if (!a[attr][attr2][0].compareDocumentPosition) {
                        // support for IE8 and below
                        return a[attr][attr2][0].sourceIndex - b[attr][attr2][0].sourceIndex;
                    }
                    if (a[attr][attr2][0].compareDocumentPosition(b[attr][attr2][0]) & 2) {
                        // b comes before a
                        return 1;
                    }
                    return -1;
                });
            }
            else if (attr) {
                output = _input.sort(function (a, b) {
                    if (a[attr][0] === b[attr][0]) return 0;
                    if (!a[attr][0].compareDocumentPosition) {
                        // support for IE8 and below
                        return a[attr][0].sourceIndex - b[attr][0].sourceIndex;
                    }
                    if (a[attr][0].compareDocumentPosition(b[attr][0]) & 2) {
                        // b comes before a
                        return 1;
                    }
                    return -1;
                });
            } else {
                output = _input.sort(function (a, b) {
                    if (a[0] === b[0]) return 0;
                    if (!a[0].compareDocumentPosition) {
                        // support for IE8 and below
                        return a[0].sourceIndex - b[0].sourceIndex;
                    }
                    if (a[0].compareDocumentPosition(b[0]) & 2) {
                        // b comes before a
                        return 1;
                    }
                    return -1;
                });
            }

            return output;
        },
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        let instances = [];

        this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                const instance = new Plugin(this, options);
                $.data(this, "plugin_" +
                    pluginName, instance);
                instances.push(instance);
            }

            // Make it possible to access methods from public.
            // e.g `$element.plugin('method');`
            if (typeof options === 'string') {
                const args = Array.prototype.slice.call(arguments, 1);
                data[options].apply(data, args);
            }
        });

        if (instances.length === 1) {
            return instances[0];
        }

        return null
    };

})(jQuery, window, document);