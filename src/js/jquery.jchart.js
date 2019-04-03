/*
 *  jChart - v0.1.1
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
        objPrefix = 'jchart__',

        defaults = {
            elements: {
                container: null,
                body: null,
                group: null,
                figure: null,
                svg: null,
                segments: [],
                markers: null,
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
                    title: 'untitled',
                    strokeWidth: 3
                }
            },
            appearance: {
                type: 'donut',
                baseColor: 'transparent', // no base by default
                segmentColor: {
                    normal: '#00a3f2',
                    active: '#00d8f2',
                },
                baseOffset: 0, // offset for starting point of first segment
                baseStrokeWidth: 1,
                strokeWidth: 3, // default stroke width for all segments
                animated: true,

                /* TITLE */
                title: {
                    chartTitle: '',
                    // tooltips
                    showValue: true,
                    showPercentage: true,
                    // summary - show a value inside the donut chart
                    showSummary: false,
                    summaryTitle: '', // by default it shows the percentage of the greatest segment in the chart
                    // (if summaryTitle is empty)
                    summarySegment: null // the segment's id which percentage will be displayed in the summary
                },

                /* DONUT AND CIRCLE */
                radius: 100 / (2 * Math.PI), // 125 for full area of the SVG canvas
                innerCutout: 0.75, // how "thin" the segments are from the center point. (0 will render a pie chart (full circle))
                centerX: 21,
                centerY: 21,

                /* DONUT */
                subType: 'circle', // render type: circle for circle based approach, path for line and arc approach using path
                isGauge: false, // if the donut will be rendered as a full circle or a half-circle
                gap: 1, // gap between segments for donut chart (in percentage, 1 = 1%)

                /* BAR */
                showMarkers: true,
                markerColor: '#f45a42',
                markerCount: 10,
                markerWidth: 0.5, // in percentage of width - 0.5 means 0.5%
                rx: 0, // horizontal corner radius
                ry: 0 // vertical corner radius
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
            const $figure = $('<figure>', {'class': instance._objPrefix + 'figure'});

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
            let markers = [];

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

                    switch (instance.settings.appearance.subType) {
                        /* donut chart - circle */
                        case 'circle':
                            break;
                        /* donut chart - path */
                        case 'path':
                            svgElement.appendChild(graphData['ring']);
                            break;
                    }

                    // animation loop
                    if (instance.settings.appearance.animated) {
                        instance._methods.animationLoop(instance, function (instance, progress) {
                            instance._methods.drawBodySegmentDonut(instance, data, values, {
                                'type': instance.settings.appearance.subType,
                                'updateOnly': true,
                                'modifier': progress
                            });
                        });
                    }

                    // set text inside donut chart summary
                    if (instance.settings.appearance.title.showSummary) {
                        // count drawable segments in chart (visible and non-zero value segments)
                        // draw svg text element and append it to the svg element
                        const chartSummary = instance._methods.drawSvgText(instance, {
                            'class': `${instance._objPrefix}summary`,
                            'x': instance.settings.appearance.centerX,
                            'y': instance.settings.appearance.isGauge ? instance.settings.appearance.centerY * 0.9 : instance.settings.appearance.centerY
                        });
                        instance.settings.elements.summary = chartSummary;
                        svgElement.appendChild(chartSummary);

                        if (instance.settings.appearance.title.summaryTitle) {
                            instance.settings.elements.summary.innerHTML = instance.settings.appearance.title.summaryTitle;
                        } else {
                            if (instance.settings.appearance.title.summarySegment !== null) {
                                // if a summary segment id is given, show the percentage of that segment
                                const segment = instance.settings.data[instance.settings.appearance.title.summarySegment];
                                if (typeof segment !== 'undefined') {
                                    const percentage = Math.round(segment.percentage * 10) / 10;
                                    instance.settings.elements.summary.innerHTML = `${percentage}%`;
                                }
                            } else {
                                // if no summary segment id is specified, show the percentage of the segment with the greatest value
                                const drawableSegments = instance._methods.getDrawableSegments(instance, data, true);
                                if(drawableSegments.length) {
                                    const percentage = Math.round(drawableSegments[0].percentage * 10) / 10;
                                    instance.settings.elements.summary.innerHTML = `${percentage}%`;
                                }
                            }
                        }
                    }
                    break;
                /* pie chart */
                case 'pie':
                    graphData = instance._methods.drawBodyBasePie(instance);
                    svg = graphData['svg'];

                    segments = instance._methods.drawBodySegmentPie(instance, data, values);

                    svgElement = instance.settings.elements.body[0].appendChild(svg);

                    // animation loop
                    if (instance.settings.appearance.animated) {
                        instance._methods.animationLoop(instance, function (instance, progress) {
                            instance._methods.drawBodySegmentPie(instance, data, values, {
                                'updateOnly': true,
                                'modifier': progress
                            });
                        });
                    }
                    break;
                case 'bar':
                    graphData = instance._methods.drawBodyBaseBar(instance);
                    svg = graphData['svg'];

                    segments = instance._methods.drawBodySegmentBar(instance, data, values);

                    svgElement = instance.settings.elements.body[0].appendChild(svg);
                    svgElement.appendChild(graphData['background']);
                    if (graphData['markers'].group !== null) {
                        const markersGroup = graphData['markers'].group;
                        for (const index in graphData['markers'].markers) {
                            if (graphData['markers'].markers.hasOwnProperty(index)) {
                                markersGroup.appendChild(graphData['markers'].markers[index]);
                            }
                        }
                        svgElement.appendChild(markersGroup);
                    }

                    // animation loop
                    if (instance.settings.appearance.animated) {
                        instance._methods.animationLoop(instance, function (instance, progress) {
                            instance._methods.drawBodySegmentBar(instance, data, values, {
                                'updateOnly': true,
                                'modifier': progress
                            });
                        });
                    }

                    // set text inside donut chart summary
                    if (instance.settings.appearance.title.showSummary) {
                        // count drawable segments in chart (visible and non-zero value segments)
                        // draw svg text element and append it to the svg element
                        instance.settings.elements.summary = [];
                        let summaryOffsetX = 0;

                        for (const item in data) {
                            if (data.hasOwnProperty(item)) {
                                const segment = data[item];

                                const chartSummary = instance._methods.drawSvgText(instance, {
                                    'class': `${instance._objPrefix}summary`,
                                    'x': `${segment['percentage'] / 2 + summaryOffsetX}%`,
                                    'y': '50%'
                                });
                                summaryOffsetX += segment['percentage'];
                                instance.settings.elements.summary.push(chartSummary);
                                svgElement.appendChild(chartSummary);

                                if (instance.settings.appearance.title.summarySegment !== null) {
                                    // if a summary segment id is given, show the percentage of that segment
                                    const segment = instance.settings.data[instance.settings.appearance.title.summarySegment];
                                    if (typeof segment !== 'undefined') {
                                        const percentage = Math.round(segment.percentage * 10) / 10;
                                        chartSummary.innerHTML = `${percentage}%`;
                                    }
                                } else {
                                    // if no summary segment id is specified, show the percentage of the segment with the greatest value
                                    const drawableSegments = instance._methods.getDrawableSegments(instance, data, true);
                                    const percentage = Math.round(drawableSegments[0].percentage * 10) / 10;
                                    chartSummary.innerHTML = `${percentage}%`;
                                }
                            }
                        }
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

                    if (typeof segment !== 'undefined' && typeof segment.nodeType !== 'undefined') {
                        const segmentElement = group.appendChild(segment); //svgElement.appendChild(segment);
                        const $segmentElement = $(segmentElement);
                        data[item]['element'] = $segmentElement;
                        instance.settings.elements.segments.push($segmentElement);
                    }
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

                    if (typeof segment !== 'undefined') {
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
                                /* bar chart */
                                case 'bar':
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
                                /* bar chart */
                                case 'bar':
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
                isGauge: instance.settings.appearance.isGauge, // gauge chart for donut chart (top half of the circle only)
                centerX: instance.settings.appearance.centerX,
                centerY: instance.settings.appearance.isGauge ? instance.settings.appearance.centerY / 2 : instance.settings.appearance.centerY
            };
            const settings = $.extend(true, {}, defaults, options);

            let response = {};

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('class', instance._objPrefix + 'donut');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', `0 0 ${settings.centerX * 2} ${settings.centerY * 2}`); // double cx and cy
            svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

            /* common vars */
            let donutRing;

            switch (settings.type) {
                case 'circle':
                    /* -------- Method 1 - Circle -------- */

                    donutRing = instance._methods.drawSvgCircle(instance, {
                        class: instance._objPrefix + 'donut__ring' + instance._objPrefix + 'donut__ring-circle',
                        fill: instance.settings.appearance.baseColor,
                        stroke: instance.settings.appearance.baseColor,
                        'stroke-width': instance.settings.appearance.baseStrokeWidth
                    });
                    const donutHole = null;
                    // const donutHole = instance._methods.drawSvgCircle(instance, {
                    //     class: instance._objPrefix + 'donut__hole'
                    // });


                    response = {'svg': svg, 'ring': donutRing, 'hole': donutHole};
                    break;
                case 'path':
                    /* -------- Method 2 - Path - Arc and Line -------- */

                    const baseDoughnutRadius = instance.settings.appearance.radius + instance.settings.appearance.baseStrokeWidth; // + instance.settings.appearance.baseOffset;
                    const cutoutRadius = instance.settings.appearance.radius * (instance.settings.appearance.innerCutout);
                    const baseCutoutRadius = cutoutRadius - instance.settings.appearance.baseStrokeWidth; // - instance.settings.appearance.baseOffset;
                    const rad = (settings.isGauge ? Math.PI : Math.PI * 2); // 180deg : 360deg

                    //Calculate values for the path.
                    //We needn't calculate startRadius, segmentAngle and endRadius, because base doughnut doesn't animate.
                    const startRadius = -rad, // -1.570
                        segmentAngle = (99.9999 / 100) * rad, // 6.2831, // 1 * ((99.9999/100) * (PI*2)),
                        endRadius = startRadius + segmentAngle, // 4.7131
                        startX = instance.settings.appearance.centerX + Math.cos(startRadius) * baseDoughnutRadius,
                        startY = instance.settings.appearance.centerY + Math.sin(startRadius) * baseDoughnutRadius,
                        endX = instance.settings.appearance.centerX + Math.cos(endRadius) * baseDoughnutRadius,
                        endY = instance.settings.appearance.centerY + Math.sin(endRadius) * baseDoughnutRadius,
                        startX2 = instance.settings.appearance.centerX + Math.cos(endRadius) * baseCutoutRadius,
                        startY2 = instance.settings.appearance.centerY + Math.sin(endRadius) * baseCutoutRadius,
                        endX2 = instance.settings.appearance.centerX + Math.cos(startRadius) * baseCutoutRadius,
                        endY2 = instance.settings.appearance.centerY + Math.sin(startRadius) * baseCutoutRadius;
                    const cmd = [
                        'M', startX, startY,
                        'A', baseDoughnutRadius, baseDoughnutRadius, 0, 1, 1, endX, endY,
                        'L', startX2, startY2,
                        'A', baseCutoutRadius, baseCutoutRadius, 0, 1, 0, endX2, endY2, // reverse
                        'Z'
                    ];

                    donutRing = instance._methods.drawSvgPath(instance, {
                        class: `${instance._objPrefix}donut__ring ${instance._objPrefix}donut__ring-path`,
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
                isGauge: instance.settings.appearance.isGauge, // gauge chart for donut chart (top half of the circle only)
                updateOnly: false,
                modifier: 1,
                drawableSegments: instance._methods.getDrawableSegments(instance, data).length
            };
            const settings = $.extend(true, {}, defaults, options);

            let segments = [];
            data = instance.settings.data;

            /* common vars */
            const gap = (settings.drawableSegments > 1 || settings.isGauge) ? instance.settings.appearance.gap : 0.00001; // gap between segments. Set to that number because 0 causes unwanted behavior.

            switch (settings.type) {
                case 'circle':
                    /* -------- Method 1 - Circle -------- */

                    const base_offset = 25; // base offset set to 25 to make the chart start from the top
                    let offset = 0; //offset for dashoffset parameter, increased after every segment is drawn and supplied to dashoffset parameter for the next segment
                    // const gap = instance.settings.appearance.gap; // gap between segments

                    for (const segment in data) {
                        if (data.hasOwnProperty(segment)) {
                            const local_offset = (100 - data[segment]['percentage'] * settings.modifier);

                            // draw the segment only if it's set to be drawn and its data value is greater than 0
                            if (data[segment]['draw'] === true && data[segment]['value'] > 0) {
                                // svg settings for both draw and update
                                let svgCircleOptions = {};

                                let drawOnly = false;
                                let element = null;

                                // format the segment title
                                const titlePartials = {
                                    'segmentTitle': data[segment]['title'],
                                    'segmentValue': instance._methods.numberFormat(data[segment]['value'], 0, ',', '\xa0'),
                                    'segmentPercentage': Math.round(data[segment]['percentage'] * 10) / 10
                                };
                                let title = titlePartials.segmentTitle;
                                if (instance.settings.appearance.title.showValue && instance.settings.appearance.title.showPercentage) {
                                    title += `: ${titlePartials.segmentValue} (${titlePartials.segmentPercentage}%)`;
                                } else if (instance.settings.appearance.title.showValue) {
                                    title += `: ${titlePartials.segmentValue}`;
                                } else if (instance.settings.appearance.title.showPercentage) {
                                    title += `: ${titlePartials.segmentPercentage}%`;
                                }
                                //

                                if (settings.updateOnly) {
                                    drawOnly = true;
                                    element = data[segment]['element'][0];

                                    // svg settings for only update
                                    svgCircleOptions = {
                                        fill: 'transparent',
                                        stroke: data[segment]['color']['normal'],
                                        'stroke-width': data[segment]['strokeWidth'],
                                        'stroke-dasharray': Math.max((data[segment]['percentage'] * settings.modifier - gap), 0) + ' ' + (local_offset + gap),// '85 15',
                                        'stroke-dashoffset': base_offset + offset
                                    };
                                } else {
                                    // svg settings for only draw
                                    svgCircleOptions = {
                                        'd-id': segment,
                                        class: `${instance._objPrefix}donut__segment ${instance._objPrefix}donut__segment-circle`,
                                        title: title,
                                        fill: 'transparent',
                                        stroke: data[segment]['color']['normal'],
                                        'stroke-width': data[segment]['strokeWidth'],
                                        'stroke-dasharray': Math.max((data[segment]['percentage'] * settings.modifier - gap), 0) + ' ' + (local_offset + gap),// '85 15',
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

                    const doughnutRadius = instance.settings.appearance.radius;
                    const cutoutRadius = doughnutRadius * (instance.settings.appearance.innerCutout);
                    const centerX = instance.settings.appearance.centerX;
                    const centerY = instance.settings.appearance.centerY;
                    const startAngle = settings.isGauge ? Math.PI : Math.PI / 2; // 180deg : 90deg
                    const rad = settings.isGauge ? Math.PI : Math.PI * 2; // 360deg
                    // const gap = instance.settings.appearance.gap; // gap between segments
                    const gapPercent = (gap / 100);
                    let gapForSegment = gapPercent; // distribute gap evenly between all segments. One gap percentage is added to offset for startRadius gap.

                    let startRadius = -startAngle; // -90 degree
                    if (settings.isGauge) {
                        startRadius += gapPercent * startAngle; // add an additional gap before the first segment
                        gapForSegment += (gapPercent / settings.drawableSegments); // distribute the additional gap before the first segment between all segments - divide the gap by the segment count and deduct that part from each segment's percentage
                    }

                    // draw each path
                    for (const segment in data) {
                        if (data.hasOwnProperty(segment)) {
                            const gapAngle = gapPercent * rad,
                                segmentAngle = settings.modifier * (Math.max((data[segment]['percentage_raw'] - gapForSegment), 0) * rad),
                                endRadius = startRadius + segmentAngle,
                                largeArc = ((endRadius - startRadius) % rad) > Math.PI ? 1 : 0,
                                startX = centerX + Math.cos(startRadius) * doughnutRadius,
                                startY = centerY + Math.sin(startRadius) * doughnutRadius,
                                endX = centerX + Math.cos(endRadius) * doughnutRadius,
                                endY = centerY + Math.sin(endRadius) * doughnutRadius,
                                startX2 = centerX + Math.cos(endRadius) * cutoutRadius,
                                startY2 = centerY + Math.sin(endRadius) * cutoutRadius,
                                endX2 = centerX + Math.cos(startRadius) * cutoutRadius,
                                endY2 = centerY + Math.sin(startRadius) * cutoutRadius;

                            // draw the segment only if it's set to be drawn and its data value is greater than 0
                            if (data[segment]['draw'] === true  && data[segment]['value'] > 0 && segmentAngle > 0) {
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

                                // format the segment title
                                const titlePartials = {
                                    'segmentTitle': data[segment]['title'],
                                    'segmentValue': instance._methods.numberFormat(data[segment]['value'], 0, ',', '\xa0'),
                                    'segmentPercentage': Math.round(data[segment]['percentage'] * 10) / 10
                                };
                                let title = titlePartials.segmentTitle;
                                if (instance.settings.appearance.title.showValue && instance.settings.appearance.title.showPercentage) {
                                    title += `: ${titlePartials.segmentValue} (${titlePartials.segmentPercentage}%)`;
                                } else if (instance.settings.appearance.title.showValue) {
                                    title += `: ${titlePartials.segmentValue}`;
                                } else if (instance.settings.appearance.title.showPercentage) {
                                    title += `: ${titlePartials.segmentPercentage}%`;
                                }
                                //

                                // update only settings
                                if (settings.updateOnly) {
                                    drawOnly = true;
                                    element = data[segment]['element'][0];

                                    // svg settings for only update
                                    svgPathOptions = {
                                        fill: data[segment]['color']['normal'],
                                        stroke: 'transparent',
                                        'stroke-width': data[segment]['strokeWidth'],
                                        d: cmd.join(' ')
                                    };
                                } else {
                                    // svg settings for only draw
                                    svgPathOptions = {
                                        'd-id': segment,
                                        class: `${instance._objPrefix}donut__segment ${instance._objPrefix}donut__segment-path`,
                                        title: title,
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

                            if (data[segment]['push'] === true  && segmentAngle > 0) {
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
            svg.setAttribute('class', `${instance._objPrefix}pie`);
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
                drawableSegments: instance._methods.getDrawableSegments(instance, data).length
            };
            const settings = $.extend(true, {}, defaults, options);

            let segments = [];

            /* common vars */
            let gap = 0.00001;
            let baseGap = 0; // gap base value
            if (instance.settings.appearance.gap && settings.drawableSegments > 1) {
                gap = instance.settings.appearance.gap;
                baseGap = gap * 0.1;
            }
            // const gap = (settings.drawableSegments > 1) ? instance.settings.appearance.gap : 0.00001; // gap between segments. Set to that number because 0 causes unwanted behavior.
            const base_offset = 0; // base offset set to 0 to make the chart start from the top
            let offset = 0; // offset for the next segment

            const gapPercent = (gap / 100);

            for (const segment in data) {
                if (data.hasOwnProperty(segment)) {
                    const percentage = settings.modifier * data[segment]['percentage_raw'];

                    // draw the segment only if it's set to be drawn and its data value is greater than 0
                    if (data[segment]['draw'] === true  && data[segment]['value'] > 0) {
                        const startCoordinates = instance._methods.getCoordinatesForPercent(1, base_offset + offset + gapPercent);
                        const endCoordinates = instance._methods.getCoordinatesForPercent(1, base_offset + offset + percentage - gapPercent);
                        const largeArcFlag = settings.modifier * (data[segment]['percentage_raw']) > .5 ? 1 : 0;

                        // start and end for gap
                        let gapCoordinatesStart = instance._methods.getCoordinatesForPercent(baseGap + gapPercent, base_offset + offset + gapPercent);
                        let gapCoordinatesEnd = instance._methods.getCoordinatesForPercent(baseGap + gapPercent, base_offset + offset + percentage - gapPercent);
                        let gapCoordinatesCenter = {x: (gapCoordinatesStart['x'] + gapCoordinatesEnd['x']) / 2, y: (gapCoordinatesStart['y'] + gapCoordinatesEnd['y']) / 2};
                        // /gap

                        const pathData = [
                            `M ${startCoordinates['x']} ${startCoordinates['y']}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endCoordinates['x']} ${endCoordinates['y']}`,
                            `L ${gapCoordinatesCenter['x']} ${gapCoordinatesCenter['y']}`,
                        ].join(' ');

                        // svg settings for both draw and update
                        let svgPathOptions = {};

                        let drawOnly = false;
                        let element = null;

                        // format the segment title
                        const titlePartials = {
                            'segmentTitle': data[segment]['title'],
                            'segmentValue': instance._methods.numberFormat(data[segment]['value'], 0, ',', '\xa0'),
                            'segmentPercentage': Math.round(data[segment]['percentage'] * 10) / 10
                        };
                        let title = titlePartials.segmentTitle;
                        if (instance.settings.appearance.title.showValue && instance.settings.appearance.title.showPercentage) {
                            title += `: ${titlePartials.segmentValue} (${titlePartials.segmentPercentage}%)`;
                        } else if (instance.settings.appearance.title.showValue) {
                            title += `: ${titlePartials.segmentValue}`;
                        } else if (instance.settings.appearance.title.showPercentage) {
                            title += `: ${titlePartials.segmentPercentage}%`;
                        }
                        //

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
                                class: `${instance._objPrefix}pie__segment`,
                                title: title,
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

                        offset += percentage;
                    } else {
                        if (data[segment]['push'] === true) {
                            offset += percentage + gapPercent;
                        }
                    }
                }
            }

            return segments;
        },

        /* BAR */

        drawBodyBaseBar(instance) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('class', `${instance._objPrefix}bar`);
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 100 10'); // 100 width and 10 height
            svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

            const background = instance._methods.drawSvgRect(instance, {
                fill: instance.settings.appearance.baseColor,
            }, false, null);

            let markers = {group: null, markers: null};

            if (instance.settings.appearance.showMarkers) {
                markers.markers = [];
                markers.group = instance._methods.drawGroup(instance, {class: `${instance._objPrefix}markers`});
                const markerCount = instance.settings.appearance.markerCount;
                for (let i = 0; i <= markerCount; i++) {
                    let markerWidth = instance.settings.appearance.markerWidth,
                        markerOffsetX = i * (100 / markerCount);
                    // check if the current iteration is the last marker
                    markerOffsetX -= (i === markerCount) ? markerWidth : 0;
                    // check if the current iteration is the first or the last marker
                    // only apply half marker width modifier for the middle markers
                    markerOffsetX -= (i === 0 || i === markerCount) ? 0 : (markerWidth / 2);

                    const marker = instance._methods.drawSvgRect(instance, {width: markerWidth, height: '125%', x: markerOffsetX, fill: instance.settings.appearance.markerColor});
                    markers.markers.push(marker);
                }
            }
            instance.settings.elements.markers = markers;

            return {'svg': svg, 'background': background, 'markers': markers};
        },

        drawBodySegmentBar(instance, data, values, options) {
            const defaults = {
                updateOnly: false,
                modifier: 1,
            };
            const settings = $.extend(true, {}, defaults, options);

            let segments = [];

            const base_offset = 0; // base offset set to 0 to make the chart start from the left
            let offset = 0; //offset for the next segment

            for (const segment in data) {
                if (data.hasOwnProperty(segment)) {
                    // draw the segment only if it's set to be drawn and its data value is greater than 0
                    if (data[segment]['draw'] === true  && data[segment]['value'] > 0) {
                        const startCoordinates = base_offset + offset;
                        const width = data[segment]['percentage'] * settings.modifier;

                        offset += data[segment]['percentage'] * settings.modifier;

                        // svg settings for both draw and update
                        let svgRectOptions = {};

                        let drawOnly = false;
                        let element = null;
                        if (settings.updateOnly) {
                            drawOnly = true;
                            element = data[segment]['element'][0];

                            // svg settings for only update
                            svgRectOptions = {
                                width: width,
                                x: `${startCoordinates}%`,
                                fill: data[segment]['color']['normal'],
                            };
                        } else {
                            // svg settings for only draw
                            svgRectOptions = {
                                'd-id': segment,
                                class: `${instance._objPrefix}bar__segment`,

                                width: width,
                                x: `${startCoordinates}%`,
                                fill: data[segment]['color']['normal'],
                            };
                        }

                        const barSegment = instance._methods.drawSvgRect(instance, svgRectOptions, drawOnly, element);

                        if (!settings.updateOnly) {
                            /* ******* jQuery element in settings.data array approach ******* */
                            data[segment]['element'] = barSegment;
                            segments.push(barSegment);
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

        drawSvgRect(instance, options, updateOnly = false, element = null) {
            const defaults = {
                'width': '100%',
                'height': '100%',
                'x': 0,
                'y': 0,
                'rx': instance.settings.appearance.rx,
                'ry': instance.settings.appearance.ry,
                'class': '',
                'fill': '#fff',
                'stroke': '', // #000
                'stroke-width': 0,
            };
            const settings = $.extend(true, {}, defaults, options);

            let nRect = element;
            if (!updateOnly) {
                nRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            }

            for (const attribute in settings) {
                if (settings.hasOwnProperty(attribute) && settings[attribute] !== '' && settings[attribute] !== 0) {
                    nRect.setAttributeNS(null, attribute, settings[attribute]);
                }
            }

            return nRect;
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

        drawSvgText(instance, options, updateOnly = false, element = null) {
            const defaults = {
                'class': '',
                'x': 0,
                'y': 0,
                'alignment-baseline': 'middle',
                'text-anchor': 'middle'
            };
            const settings = $.extend(true, {}, defaults, options);

            let nElement = element;
            if (!updateOnly) {
                nElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            }

            for (const attribute in settings) {
                if (settings.hasOwnProperty(attribute) && settings[attribute] !== '' && settings[attribute] !== 0) {
                    nElement.setAttributeNS(null, attribute, settings[attribute]);
                }
            }

            return nElement;
        },

        getCoordinatesForPercent(radius, percent) {
            const x = radius * Math.cos(2 * Math.PI * percent);
            const y = radius * Math.sin(2 * Math.PI * percent);

            return {x: x, y: y};
        },

        getDrawableSegments(instance, data, sortByValue = false) {
            const drawableSegments = data.filter(function (segment) {
                return segment.draw === true &&
                    segment.percentage_raw > 0;
            });

            if (sortByValue) {
                drawableSegments.sort(function (a, b) {
                    return a.value < b.value;
                });
                drawableSegments.sort();
            }

            return drawableSegments;
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
                if (easing)
                    progress = easeOut(progress);

                if (progress < 0)
                    progress = 0;

                if (progress > 1)
                    progress = 1;

                callback.apply(instance, [instance, progress]);

                if (progress < 1)
                    requestAnimationFrame(tick);
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

        /*
         * Use this function to only update values of current segments, e.g. swapping the value of segment 1 from '100' to '3000'.
         * This will not draw the segments from scratch, so if the number of segment changes, use the Refresh function instead.
         */
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
                    if (instance.settings.appearance.animated) {
                        instance._methods.animationLoop(instance, function (instance, progress) {
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
                    if (instance.settings.appearance.animated) {
                        instance._methods.animationLoop(instance, function (instance, progress) {
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

        /*
         * Use this function to draw a new set of data. This will redraw all the segments from scratch.
         * Needed when a change of number of segments occurs.
         */
        Refresh(instance) {
            instance._methods.initElement(instance);

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

        numberFormat(number, decimals, dec_point, thousands_sep) {
            // Strip all characters but numerical ones.
            number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
            var n = !isFinite(+number) ? 0 : +number,
                prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
                dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
                s = '',
                toFixedFix = function (n, prec) {
                    var k = Math.pow(10, prec);
                    return '' + Math.round(n * k) / k;
                };
            // Fix for IE parseFloat(0.55).toFixed(0) = 0;
            s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
            if (s[0].length > 3) {
                s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
            }
            if ((s[1] || '').length < prec) {
                s[1] = s[1] || '';
                s[1] += new Array(prec - s[1].length + 1).join('0');
            }
            return s.join(dec);
        }
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