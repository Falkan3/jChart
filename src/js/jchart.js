/*
 *  jChart - v0.0.1
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
                group: null,
                figure: null,
                svg: null,
                segments: []
            },
            data: [],
            values: {}, // values necessary for the graphing, like sum of values of all segments
            placeholder: {
                data: {
                    value: 0, // value of the segment
                    color: {
                        normal: '#00a3f2', // stroke/fill color of the segment
                        active: '#00d8f2',
                    },
                    draw: true, // whether to draw the segment on the chart or not; default true
                    push: true, // whether to push the next segment via offset. Best to set false together when draw is set to false (the empty section will always be at the end that way); default true
                    order: null, // drawing order
                    name: '',
                    strokeWidth: 3
                }
            },
            appearance: {
                type: 'donut',
                baseColor: '#ddd',
                segmentColor: {
                    normal: '#00a3f2',
                    active: '#00d8f2',
                },
                baseOffset: 0, // offset for starting point of first segment
                baseStrokeWidth: 1,
                strokeWidth: 3, // default stroke width for all segments
                animated: true,

                /* DONUT AND CIRCLE */
                radius: 100 / (2 * Math.PI),
                innerCutout: 0.75, // how "thin" the segments are from the center point. (0 will render a pie chart (full circle))
                centerX: 21,
                centerY: 21,

                /* DONUT */
                subType: 'circle', // render type: circle for circle based approach, path for line and arc approach using path
                gap: 1, // gap between segments for donut chart (in percentage, 1 = 1%)
            },
            callbacks: {
                onInit() {
                },
                onRefresh() {
                },
                onSegmentMouseover() {
                },
                onSegmentMouseout() {
                }
            }
        };

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
        this._nameLower = pluginNameLower;
        this._objPrefix = objPrefix;
        this._methods = methods;

        //dynamic vars
        //this.html = $('html');

        this._methods.init(this);
    }

    // Avoid Plugin.prototype conflicts
    // $.extend(Plugin.prototype, {
    const methods = {
        //if(jQuery.fn.pluginName) {...} - check for functions from other plugins (dependencies)

        init(instance) {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. instance.element
            // and instance.settings
            // you can add more functions like the one below and
            // call them like the example bellow
            instance._methods.initElement(instance);

            // On Init callback
            if (instance.settings.callbacks.onInit && $.isFunction(instance.settings.callbacks.onInit)) {
                instance.settings.callbacks.onInit.call(instance);
            }
        },

        /*
         * Main function for initializing
         */
        initElement(instance) {
            // calculate the values
            instance._methods.calculateDataValues(instance);

            // draw html
            instance._methods.initHtml(instance);
        },

        /*
         * Calculate the necessary values for graphing (maxval, percentage value of each segment)
         */
        calculateDataValues(instance) {
            const values = {
                maxval: 0,
            };
            const data = instance.settings.data;

            // calculate the sum data values
            for (const segment in data) {
                if (data.hasOwnProperty(segment)) {
                    data[segment] = $.extend(true, {}, instance.settings.placeholder.data, data[segment]);
                    values.maxval += data[segment].value;
                }
            }

            //console.log(data);
            //console.log(values.maxval);

            // calculate the single data values
            for (const segment in data) {
                if (data.hasOwnProperty(segment)) {
                    if (values.maxval === 0) {
                        data[segment].percentage_raw = 0;
                        data[segment].percentage = 0;
                    } else {
                        data[segment].percentage_raw = data[segment].value / values.maxval;
                        data[segment].percentage = (data[segment].value / values.maxval) * 100;
                    }
                    if (data[segment].order === null) {
                        data[segment].order = data.length;
                    }
                }
            }

            // sort data by their order parameter
            function compare(a, b) {
                if (a['order'] === null) return 1;
                if (b['order'] === null) return -1;
                if (a['order'] < b['order'])
                    return -1;
                if (a['order'] > b['order'])
                    return 1;
                return 0;
            }

            data.sort(compare);

            //instance.settings.data = data;
            instance.settings.values = values;
        },

        /*
         * Initialize HTML drawing function
         */
        initHtml(instance) {
            instance._methods.drawContainer(instance);
            instance._methods.drawBody(instance);
        },

        /*
         * Draw chart container
         */
        drawContainer(instance) {
            /* ---- cleanup ---- */
            if (typeof instance.settings.elements.container !== 'undefined' && instance.settings.elements.container !== null) {
                instance.settings.elements.container.remove();
            }
            if (typeof instance.settings.elements.figure !== 'undefined' && instance.settings.elements.figure !== null) {
                instance.settings.elements.figure.remove();
            }
            /* ---- cleanup ---- */

            const $container = $('<div>', {'class': pluginNameLower});
            const $figure = $('<figure>');

            instance.settings.elements.container = $container;
            instance.settings.elements.figure = $figure;

            instance.$element.append($container);

            $container.append($figure);
        },

        /*
         * Draw chart body
         */
        drawBody(instance) {
            /* ---- cleanup ---- */
            if (typeof instance.settings.elements.body !== 'undefined' && instance.settings.elements.body !== null) {
                instance.settings.elements.body.remove();
            }
            if (typeof instance.settings.elements.figureCaption !== 'undefined' && instance.settings.elements.figureCaption !== null) {
                instance.settings.elements.figureCaption.remove();
            }
            /* ---- cleanup ---- */

            const $chartBody = $('<div>', {'class': instance._objPrefix + 'body'});
            const $figureCaption = $('<figcaption>');

            instance.settings.elements.body = $chartBody;
            instance.settings.elements.figureCaption = $figureCaption;

            instance.settings.elements.figure.append($chartBody);
            instance.settings.elements.figure.append($figureCaption);

            instance._methods.drawBodyBase(instance);
            instance._methods.addEventListeners(instance);
        },

        drawBodyBase(instance) {
            /* ---- cleanup ---- */
            if (typeof instance.settings.elements.svg !== 'undefined' && instance.settings.elements.svg !== null) {
                instance.settings.elements.svg.remove();
            }
            if (typeof instance.settings.elements.group !== 'undefined' && instance.settings.elements.group !== null) {
                instance.settings.elements.group.remove();
            }
            /* ---- cleanup ---- */

            // render data into the graph
            const data = instance.settings.data;
            const values = instance.settings.values;
            let graphData = null;
            let svg = null;
            let svgElement = null;
            let segments = [];

            switch (instance.settings.appearance.type) {
                /* donut chart */
                case 'donut':
                    graphData = instance._methods.drawBodyBaseDonut(instance, {
                        'type': instance.settings.appearance.subType
                    });

                    svg = graphData['svg'];
                    segments = instance._methods.drawBodySegmentDonut(instance, data, values, {
                        'type': instance.settings.appearance.subType
                    });

                    svgElement = instance.settings.elements.body[0].appendChild(svg);
                    svgElement.appendChild(graphData['ring']);

                    switch (instance.settings.appearance.type) {
                        /* donut chart - circle */
                        case 'circle':
                            break;
                        /* donut chart - path */
                        case 'path':
                            svgElement.appendChild(graphData['ring']);
                            break;
                    }

                    // animation loop
                    if(instance.settings.appearance.animated) {
                        instance._methods.animationLoop(instance, function(instance, progress) {
                            instance._methods.drawBodySegmentDonut(instance, data, values, {
                                'type': instance.settings.appearance.subType,
                                'updateOnly': true,
                                'modifier': progress
                            });
                        });
                    }
                    break;
                /* pie chart */
                case 'pie':
                    graphData = instance._methods.drawBodyBasePie(instance);

                    svg = graphData['svg'];
                    segments = instance._methods.drawBodySegmentPie(instance, data, values);

                    svgElement = instance.settings.elements.body[0].appendChild(svg);

                    // animation loop
                    if(instance.settings.appearance.animated) {
                        instance._methods.animationLoop(instance, function(instance, progress) {
                            instance._methods.drawBodySegmentPie(instance, data, values, {
                                'updateOnly': true,
                                'modifier': progress
                            });
                        });
                    }
                    break;
                default:
                    break;
            }

            /* ******* jQuery element in settings.elements array approach ******* */

            // for (const segment in segments) {
            //     if (segments.hasOwnProperty(segment)) {
            //         const segmentElement = svgElement.appendChild(segments[segment]);
            //         instance.settings.elements.segments.push({data_id: instance.settings.elements.segments.length, element: $(segmentElement)});
            //     }
            // }

            /* ******* jQuery element in settings.data array approach ******* */

            const group = svgElement.appendChild(instance._methods.drawGroup(instance));

            for (const item in data) {
                if (data.hasOwnProperty(item)) {
                    const segment = data[item]['element'];
                    const segmentElement = group.appendChild(segment); //svgElement.appendChild(segment);
                    const $segmentElement = $(segmentElement);
                    data[item]['element'] = $segmentElement;
                    instance.settings.elements.segments.push($segmentElement);
                }
            }

            instance.settings.elements.svg = svgElement;
            instance.settings.elements.group = $(group);
        },

        addEventListeners(instance) {
            /* ******* jQuery element in settings.data array approach ******* */

            const items = instance.settings.data;

            for (const item in items) {
                if (items.hasOwnProperty(item)) {
                    const segment = items[item]['element'];
                    segment.on('mouseover', function () {
                        const $this = $(this);
                        // todo: remake the instance getting
                        //const instance = $this.closest('.' + instance._nameLower).parent().data('plugin_' + instance._name);
                        const dId = $this.attr('d-id');
                        $this.removeClass('active');
                        $this.addClass('active');
                        switch (instance.settings.appearance.type) {
                            /* donut chart */
                            case 'donut':
                                switch (instance.settings.appearance.subType) {
                                    /* donut chart - circle */
                                    case 'circle':
                                        $this.css('stroke', instance.settings.data[dId]['color']['active']);
                                        break;
                                    /* donut chart - path */
                                    case 'path':
                                        $this.css('fill', instance.settings.data[dId]['color']['active']);
                                        break;
                                }
                                break;
                            /* pie chart */
                            case 'pie':
                                $this.css('fill', instance.settings.data[dId]['color']['active']);
                                break;
                        }

                        // On Segment Mouseover callback
                        if (instance.settings.callbacks.onSegmentMouseover && $.isFunction(instance.settings.callbacks.onSegmentMouseover)) {
                            instance.settings.callbacks.onSegmentMouseover.call(instance, dId, instance.settings.data[dId]);
                        }
                    });
                    segment.on('mouseout', function () {
                        const $this = $(this);
                        // todo: remake the instance getting
                        //const instance = $this.closest('.' + instance._nameLower).parent().data('plugin_' + instance._name);
                        const dId = $this.attr('d-id');
                        $this.removeClass('active');
                        switch (instance.settings.appearance.type) {
                            /* donut chart */
                            case 'donut':
                                switch (instance.settings.appearance.subType) {
                                    /* donut chart - circle */
                                    case 'circle':
                                        $this.css('stroke', '');
                                        break;
                                    /* donut chart - path */
                                    case 'path':
                                        $this.css('fill', '');
                                        break;
                                }
                                break;
                            /* pie chart */
                            case 'pie':
                                $this.css('fill', '');
                                break;
                        }

                        // On Segment Mouseout callback
                        if (instance.settings.callbacks.onSegmentMouseout && $.isFunction(instance.settings.callbacks.onSegmentMouseout)) {
                            instance.settings.callbacks.onSegmentMouseout.call(instance, instance.settings.data[dId], instance.settings.data[dId]);
                        }
                    });
                }
            }

            /* ******* jQuery element in settings.elements array approach ******* */

            // const segments = instance.settings.elements.segments;
            // for (const segment in segments) {
            //     if (segments.hasOwnProperty(segment)) {
            //         const data = instance.settings.data[segments[segment]['data_id']];
            //         const $element = segments[segment]['element'];
            //         $element.on('mouseover', function () {
            //             const $this = $(this);
            //             $element.removeClass('active');
            //             $this.addClass('active');
            //             $this.css('fill', data['color']['active']);
            //         });
            //         $element.on('mouseout', function () {
            //             const $this = $(this);
            //             $this.removeClass('active');
            //             $this.css('fill', '');
            //         });
            //     }
            // }
        },

        /* DONUT */

        drawBodyBaseDonut(instance, options) {
            const defaults = {
                type: 'circle', // ['path', 'circle']
            };
            const settings = $.extend(true, {}, defaults, options);

            let response = {};

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('class', instance._objPrefix + 'donut');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', `0 0 ${instance.settings.appearance.centerX * 2} ${instance.settings.appearance.centerY * 2}`); // double cx and cy
            svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

            /* common vars */
            let donutRing;

            switch (settings.type) {
                case 'circle':
                    /* -------- Method 1 - Circle -------- */

                    donutRing = instance._methods.drawSvgCircle(instance, {
                        class: instance._objPrefix + 'donut--ring' + instance._objPrefix + 'donut--ring-circle',
                        fill: 'transparent',
                        stroke: instance.settings.appearance.baseColor,
                        'stroke-width': instance.settings.appearance.baseStrokeWidth
                    });
                    const donutHole = null;
                    // const donutHole = instance._methods.drawSvgCircle(instance, {
                    //     class: instance._objPrefix + 'donut--hole'
                    // });


                    response = {'svg': svg, 'ring': donutRing, 'hole': donutHole};
                    break;
                case 'path':
                    /* -------- Method 2 - Path - Arc and Line -------- */

                    const baseDoughnutRadius = instance.settings.appearance.radius + instance.settings.appearance.baseStrokeWidth; // + instance.settings.appearance.baseOffset;
                    const cutoutRadius = instance.settings.appearance.radius * (instance.settings.appearance.innerCutout);
                    const baseCutoutRadius = cutoutRadius - instance.settings.appearance.baseStrokeWidth; // - instance.settings.appearance.baseOffset;

                    //Calculate values for the path.
                    //We needn't calculate startRadius, segmentAngle and endRadius, because base doughnut doesn't animate.
                    const startRadius = -Math.PI / 2, // -1.570
                        segmentAngle = (99.9999 / 100) * (Math.PI * 2), // 6.2831, // 1 * ((99.9999/100) * (PI*2)),
                        endRadius = startRadius + segmentAngle, // 4.7131
                        startX = instance.settings.appearance.centerX + Math.cos(startRadius) * baseDoughnutRadius,
                        startY = instance.settings.appearance.centerY + Math.sin(startRadius) * baseDoughnutRadius,
                        endX2 = instance.settings.appearance.centerX + Math.cos(startRadius) * baseCutoutRadius,
                        endY2 = instance.settings.appearance.centerY + Math.sin(startRadius) * baseCutoutRadius,
                        endX = instance.settings.appearance.centerX + Math.cos(endRadius) * baseDoughnutRadius,
                        endY = instance.settings.appearance.centerY + Math.sin(endRadius) * baseDoughnutRadius,
                        startX2 = instance.settings.appearance.centerX + Math.cos(endRadius) * baseCutoutRadius,
                        startY2 = instance.settings.appearance.centerY + Math.sin(endRadius) * baseCutoutRadius;
                    const cmd = [
                        'M', startX, startY,
                        'A', baseDoughnutRadius, baseDoughnutRadius, 0, 1, 1, endX, endY,
                        'L', startX2, startY2,
                        'A', baseCutoutRadius, baseCutoutRadius, 0, 1, 0, endX2, endY2, // reverse
                        'Z'
                    ];

                    donutRing = instance._methods.drawSvgPath(instance, {
                        class: instance._objPrefix + 'donut--ring' + instance._objPrefix + 'donut--ring-path',
                        fill: instance.settings.appearance.baseColor,
                        d: cmd.join(' '),
                    });

                    response = {'svg': svg, 'ring': donutRing};
                    break;
            }

            return response;
        },

        drawBodySegmentDonut(instance, data, values, options) {
            const defaults = {
                type: 'circle', // ['path', 'circle']
                updateOnly: false,
                modifier: 1,
            };
            const settings = $.extend(true, {}, defaults, options);

            let segments = [];
            if (settings.updateOnly) {
                data = instance.settings.data;
                segments = instance.settings.data;
            }
            /* common vars */
            const gap = instance.settings.appearance.gap; // gap between segments

            switch (settings.type) {
                case 'circle':
                    /* -------- Method 1 - Circle -------- */

                    const base_offset = 25; // base offset set to 25 to make the chart start from the top
                    let offset = 0; //offset for dashoffset parameter, increased after every segment is drawn and supplied to dashoffset parameter for the next segment
                    // const gap = instance.settings.appearance.gap; // gap between segments

                    for (const segment in data) {
                        if (data.hasOwnProperty(segment)) {
                            const local_offset = (100 - data[segment]['percentage'] * settings.modifier);

                            if (data[segment]['draw'] === true) {
                                // if color is empty, supply the default color from appearance settings
                                if (typeof data[segment]['color']['normal'] === 'undefined') {
                                    data[segment]['color']['normal'] = instance.settings.appearance.segmentColor.normal;
                                }
                                if (typeof data[segment]['color']['active'] === 'undefined') {
                                    data[segment]['color']['active'] = instance.settings.appearance.segmentColor.active;
                                }

                                // svg settings for both draw and update
                                // svg settings for both draw and update
                                let svgCircleOptions = {};

                                let drawOnly = false;
                                let element = null;
                                if (settings.updateOnly) {
                                    drawOnly = true;
                                    element = data[segment]['element'][0];

                                    // svg settings for only update
                                    svgCircleOptions = {
                                        'd-id': segment,
                                        class: instance._objPrefix + 'donut--segment' + ' ' + instance._objPrefix + 'donut--segment-circle',
                                        fill: 'transparent',
                                        stroke: data[segment]['color']['normal'],
                                        'stroke-width': data[segment]['strokeWidth'],
                                        'stroke-dasharray': (data[segment]['percentage'] * settings.modifier - gap) + ' ' + (local_offset + gap),// '85 15',
                                        'stroke-dashoffset': base_offset + offset
                                    };
                                } else {
                                    // svg settings for only draw
                                    svgCircleOptions = {
                                        fill: 'transparent',
                                        stroke: data[segment]['color']['normal'],
                                        'stroke-width': data[segment]['strokeWidth'],
                                        'stroke-dasharray': (data[segment]['percentage'] * settings.modifier - gap) + ' ' + (local_offset + gap),// '85 15',
                                        'stroke-dashoffset': base_offset + offset
                                    };
                                }

                                const donutSegment = instance._methods.drawSvgCircle(instance, svgCircleOptions, drawOnly, element);

                                if (!settings.updateOnly) {
                                    /* ******* jQuery element in settings.data array approach ******* */
                                    data[segment]['element'] = donutSegment;
                                    segments.push(donutSegment);
                                }
                            }

                            if (data[segment]['push'] === true) {
                                offset += local_offset;
                            }
                        }
                    }
                    break;
                case 'path':
                    /* -------- Method 2 - Path - Arc and Line -------- */

                    let startRadius = -Math.PI / 2; // -90 degree
                    const doughnutRadius = instance.settings.appearance.radius;
                    const cutoutRadius = doughnutRadius * (instance.settings.appearance.innerCutout);
                    const centerX = instance.settings.appearance.centerX;
                    const centerY = instance.settings.appearance.centerY;
                    // const gap = instance.settings.appearance.gap; // gap between segments

                    // draw each path
                    for (const segment in data) {
                        if (data.hasOwnProperty(segment)) {
                            const gapPercent = (gap / 100),
                                gapAngle = gapPercent * (Math.PI * 2),
                                segmentAngle = settings.modifier * ((data[segment]['percentage_raw'] - gapPercent) * (Math.PI * 2)),
                                endRadius = startRadius + segmentAngle,
                                largeArc = ((endRadius - startRadius) % (Math.PI * 2)) > Math.PI ? 1 : 0,
                                startX = centerX + Math.cos(startRadius) * doughnutRadius,
                                startY = centerY + Math.sin(startRadius) * doughnutRadius,
                                endX2 = centerX + Math.cos(startRadius) * cutoutRadius,
                                endY2 = centerY + Math.sin(startRadius) * cutoutRadius,
                                endX = centerX + Math.cos(endRadius) * doughnutRadius,
                                endY = centerY + Math.sin(endRadius) * doughnutRadius,
                                startX2 = centerX + Math.cos(endRadius) * cutoutRadius,
                                startY2 = centerY + Math.sin(endRadius) * cutoutRadius;

                            if (data[segment]['draw'] === true) {
                                // if color is empty, supply the default color from appearance settings
                                if (typeof data[segment]['color']['normal'] === 'undefined') {
                                    data[segment]['color']['normal'] = instance.settings.appearance.segmentColor.normal;
                                }
                                if (typeof data[segment]['color']['active'] === 'undefined') {
                                    data[segment]['color']['active'] = instance.settings.appearance.segmentColor.active;
                                }

                                const cmd = [
                                    'M', startX, startY, // Move pointer
                                    'A', doughnutRadius, doughnutRadius, 0, largeArc, 1, endX, endY, // Draw outer arc path
                                    'L', startX2, startY2, // Draw line path (this line connects outer and innner arc paths)
                                    'A', cutoutRadius, cutoutRadius, 0, largeArc, 0, endX2, endY2, // Draw inner arc path
                                    'Z' // Close path
                                ];

                                // svg settings for both draw and update
                                let svgPathOptions = {};

                                let drawOnly = false;
                                let element = null;
                                // update only settings
                                if (settings.updateOnly) {
                                    drawOnly = true;
                                    element = data[segment]['element'][0];

                                    // svg settings for only update
                                    svgPathOptions = {
                                        'd-id': segment,
                                        class: instance._objPrefix + 'donut--segment' + ' ' + instance._objPrefix + 'donut--segment-path',
                                        fill: data[segment]['color']['normal'],
                                        stroke: 'transparent',
                                        'stroke-width': data[segment]['strokeWidth'],
                                        d: cmd.join(' ')
                                    };
                                } else {
                                    // svg settings for only draw
                                    svgPathOptions = {
                                        fill: data[segment]['color']['normal'],
                                        stroke: 'transparent',
                                        'stroke-width': data[segment]['strokeWidth'],
                                        d: cmd.join(' ')
                                    };
                                }

                                const donutSegment = instance._methods.drawSvgPath(instance, svgPathOptions, drawOnly, element);

                                if (!settings.updateOnly) {
                                    /* ******* jQuery element in settings.data array approach ******* */
                                    data[segment]['element'] = donutSegment;
                                    segments.push(donutSegment);
                                }
                            }

                            if (data[segment]['push'] === true) {
                                startRadius += segmentAngle + gapAngle;
                            }
                        }
                    }
                    break;
            }

            return segments;
        },

        /* PIE */

        drawBodyBasePie(instance) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('class', instance._objPrefix + 'pie');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '-1 -1 2 2'); // -1 -1 for the offset so that the center point of the circle will be the start for sin and cos functions. 2 2 to simplify the calculations (center at [1,1])
            svg.setAttribute('style', 'transform: rotate(-0.25turn)'); //rotate 25% counter-clockwise so the start point is at the top
            svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

            return {'svg': svg};
        },

        drawBodySegmentPie(instance, data, values, options) {
            const defaults = {
                updateOnly: false,
                modifier: 1,
            };
            const settings = $.extend(true, {}, defaults, options);

            let segments = [];

            const base_offset = 0; // base offset set to 0 to make the chart start from the top
            let offset = 0; //offset for the next segment

            for (const segment in data) {
                if (data.hasOwnProperty(segment)) {
                    if (data[segment]['draw'] === true) {
                        // if color is empty, supply the default color from appearance settings
                        if (typeof data[segment]['color']['normal'] === 'undefined') {
                            data[segment]['color']['normal'] = instance.settings.appearance.segmentColor.normal;
                        }
                        if (typeof data[segment]['color']['active'] === 'undefined') {
                            data[segment]['color']['active'] = instance.settings.appearance.segmentColor.active;
                        }

                        const startCoordinates = instance._methods.getCoordinatesForPercent(base_offset + offset);

                        offset += data[segment]['percentage_raw'] * settings.modifier;

                        const endCoordinates = instance._methods.getCoordinatesForPercent(offset);

                        const startX = startCoordinates['x'];
                        const startY = startCoordinates['y'];
                        const endX = endCoordinates['x'];
                        const endY = endCoordinates['y'];

                        const largeArcFlag = data[segment]['percentage_raw'] * settings.modifier > .5 ? 1 : 0;

                        const pathData = [
                            `M ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                            `L 0 0`,
                        ].join(' ');

                        // svg settings for both draw and update
                        let svgPathOptions = {};

                        let drawOnly = false;
                        let element = null;
                        if (settings.updateOnly) {
                            drawOnly = true;
                            element = data[segment]['element'][0];

                            // svg settings for only update
                            svgPathOptions = {
                                fill: data[segment]['color']['normal'],
                                d: pathData
                            };
                        } else {
                            // svg settings for only draw
                            svgPathOptions = {
                                'd-id': segment,
                                class: instance._objPrefix + 'pie--segment',
                                fill: data[segment]['color']['normal'],
                                d: pathData
                            };
                        }

                        const pieSegment = instance._methods.drawSvgPath(instance, svgPathOptions, drawOnly, element);

                        if (!settings.updateOnly) {
                            /* ******* jQuery element in settings.data array approach ******* */
                            data[segment]['element'] = pieSegment;
                            segments.push(pieSegment);
                        }
                    } else {
                        if (data[segment]['push'] === true) {
                            offset += data[segment]['percentage_raw'];
                        }
                    }
                }
            }

            return segments;
        },

        /* --- SVG helpers--- */

        drawGroup(instance, options) {
            const defaults = {
                'class': '',
            };
            const settings = $.extend(true, {}, defaults, options);

            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

            for (const attribute in settings) {
                if (settings.hasOwnProperty(attribute) && settings[attribute] !== '' && settings[attribute] !== 0) {
                    group.setAttributeNS(null, attribute, settings[attribute]);
                }
            }

            return group;
        },

        drawSvgCircle(instance, options, updateOnly = false, element = null) {
            const defaults = {
                'class': '',
                'cx': instance.settings.appearance.centerX, // half of viewbox
                'cy': instance.settings.appearance.centerY, // half of viewbox
                'r': instance.settings.appearance.radius,// 15.91549430918954
                'fill': '#fff',
                'stroke': '', // #000
                'stroke-width': instance.settings.appearance.strokeWidth,
                'stroke-dasharray': '',
                'stroke-dashoffset': '25', // Circumference − All preceding segments’ total length + First segment’s offset = Current segment offset
            };
            const settings = $.extend(true, {}, defaults, options);

            let nCircle = element;
            if (!updateOnly) {
                nCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            }

            for (const attribute in settings) {
                if (settings.hasOwnProperty(attribute) && settings[attribute] !== '' && settings[attribute] !== 0) {
                    nCircle.setAttributeNS(null, attribute, settings[attribute]);
                }
            }

            return nCircle;
        },

        drawSvgPath(instance, options, updateOnly = false, element = null) {
            const defaults = {
                'class': '',
                'fill': '#fff',
                'd': '',
                'stroke': '', // #000
                'stroke-width': 0,
                'stroke-dasharray': '',
                'stroke-dashoffset': 0, // Circumference − All preceding segments’ total length + First segment’s offset = Current segment offset
            };
            const settings = $.extend(true, {}, defaults, options);

            let nPath = element;
            if (!updateOnly) {
                nPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            }

            for (const attribute in settings) {
                if (settings.hasOwnProperty(attribute) && settings[attribute] !== '' && settings[attribute] !== 0) {
                    nPath.setAttributeNS(null, attribute, settings[attribute]);
                }
            }

            return nPath;
        },

        getCoordinatesForPercent(percent) {
            const x = Math.cos(2 * Math.PI * percent);
            const y = Math.sin(2 * Math.PI * percent);

            return {x: x, y: y};
        },

        /*
         * Input: ([R, G, B], -100~100)
         * ([135, 10, 0], -50)
         */
        lightenRgbColors(c, n) {
            let d;
            for (let i = 3; i--; c[i] = d < 0 ? 0 : d > 255 ? 255 : d | 0) {
                d = c[i] + n;
            }
            return c
        },

        /* --- /SVG helpers--- */

        animationLoop(instance, callback, duration = 1000, easing = true) {
            const time = {
                start: performance.now(),
                total: duration
            };

            const easeOut = progress =>
                Math.pow(--progress, 3) + 1;

            const tick = now => {
                time.elapsed = now - time.start;
                const progress_raw = time.elapsed / time.total;
                let eased = 1;
                let progress = progress_raw;
                if(easing)
                    progress = easeOut(progress);

                //console.log(progress_raw);

                if (progress < 1) {
                    callback.apply(instance, [instance, progress]);

                    requestAnimationFrame(tick);
                }
            };

            requestAnimationFrame(tick);
        },

        /* ------------------------------ STRUCTURE ------------------------------- */

        GetInstance(instance) {
            instance._methods.Log(instance, instance);
        },

        Destroy(instance) {
            instance.settings.elements.container.remove();
            $.removeData(instance.$element, "plugin_" + instance._name);
        },

        Update(instance) {
            // calculate data values required to draw the graph
            instance._methods.calculateDataValues(instance);

            // update the graph segments
            const data = instance.settings.data;
            const values = instance.settings.values;

            switch (instance.settings.appearance.type) {
                /* donut chart */
                case 'donut':
                    // animation loop
                    if(instance.settings.appearance.animated) {
                        instance._methods.animationLoop(instance, function(instance, progress) {
                            instance._methods.drawBodySegmentDonut(instance, data, values, {
                                'type': instance.settings.appearance.subType,
                                'updateOnly': true,
                                'modifier': progress
                            });
                        });
                    }
                    break;
                /* pie chart */
                case 'pie':
                    // animation loop
                    if(instance.settings.appearance.animated) {
                        instance._methods.animationLoop(instance, function(instance, progress) {
                            instance._methods.drawBodySegmentPie(instance, data, values, {
                                'updateOnly': true,
                                'modifier': progress
                            });
                        });
                    }
                    break;
                default:
                    break;
            }
        },

        Refresh(instance) {
            instance.initElement();

            // On Init callback
            if (instance.settings.callbacks.onRefresh && $.isFunction(instance.settings.callbacks.onRefresh)) {
                instance.settings.callbacks.onRefresh.call(instance);
            }
        },

        /* ------------------------------ HELPERS ------------------------------- */

        Log(instance, message) {
            console.log('*** ' + instance._name + ' ***');

            if (message instanceof Array) {
                for (let value of message) {
                    console.log(value);
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
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations

    // default outside method call: pluginInstance._methods.nameOfAnInnerFunction(pluginInstance, arg1, arg2...);
    $.fn[pluginName] = function (options) {
        let instances = [];

        this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                const instance = new Plugin(this, options);
                $.data(this, "plugin_" +
                    pluginName, instance);
                instances.push(instance);
            }
        });

        if (instances.length === 1) {
            return instances[0];
        }

        return null
    };

})(jQuery, window, document);