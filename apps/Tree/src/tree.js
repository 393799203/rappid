/*! Rappid v2.1.0 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2015 client IO

 2017-09-21 


This Source Code Form is subject to the terms of the Rappid Trial License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/


(function(joint, _, window) {

    var COLORS = ['#31d0c6', '#7c68fc', '#fe854f', '#feb663'];
    var DIRECTIONS = ['R', 'BR', 'B', 'BL', 'L', 'TL', 'T', 'TR'];
    var POSITIONS = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];

    joint.setTheme('material');

    var graph = new joint.dia.Graph;
    var tree = new joint.layout.TreeLayout({ graph: graph });

    var paper = new joint.dia.Paper({
        width: 500,
        height: 500,
        gridSize: 10,
        model: graph,
        perpendicularLinks: true,
        interactive: false
    });

    var paperScroller = new joint.ui.PaperScroller({
        paper: paper,
        cursor: 'grab',
        baseWidth: 1,
        baseHeight: 1,
        contentOptions: {
            padding: 100,
            allowNewOrigin: 'any'
        }
    });

    paper.on({
        'element:pointerdown': onElementClick,
        'blank:pointerdown': paperScroller.startPanning
    });

    paperScroller.render().$el.appendTo('#tree-app');

    var element = new joint.shapes.basic.Generic({
        markup: '<rect stroke="#6a6c8a" stroke-width="2" rx="5" ry="5" cursor="pointer"/>',
        size: { height: 30, width: 30 },
        attrs: {
            rect: {
                'ref-width': '100%',
                'ref-height': '100%',
                fill: COLORS[0]
            }
        }
    });

    var link = new joint.dia.Link({
        markup: '<path class="connection" stroke="#6a6c8a" stroke-width="2" d="M 0 0 0 0" pointer-events="none"/>',
        connector: { name: 'rounded' }
    });

    showHalo(element.clone().position(250, 250).addTo(graph).findView(paper));

    // Demo functions
    function layout() {
        tree.layout();
        paperScroller.adjustPaper();
    }

    function showHalo(view, opt) {

        var model = view.model;

        if (opt && opt.animation) {
            paperScroller.scrollToElement(model, opt);
        } else {
            paperScroller.centerElement(model);
        }

        var halo = new joint.ui.Halo({
            cellView: view,
            tinyThreshold: 0,
            boxContent: getBoxContent(model),
            handles: _.times(DIRECTIONS.length, function(i) {
                return {
                    name: DIRECTIONS[i],
                    position: POSITIONS[i],
                    // Rotate the icon inside the handle based on the position
                    attrs: {
                        '.handle': {
                            style: 'transform: rotate(' + (i * 45) + 'deg); background-image: url("images/handle.png")'
                        }
                    }
                };
            })
        });

        // Listen to all halo events and
        // try to parse the direction from the event name.
        halo.on('all', function(eventName) {
            var match = /\:(\w+)\:pointerdown/.exec(eventName);
            var direction = match && match[1];
            if (direction) {
                addElement(model, direction);
                halo.options.boxContent = getBoxContent(model);
                halo.update();
                layout();
                paperScroller.centerElement(model);
            }
        });

        halo.render();
    }

    function getBoxContent(model) {

        var content = '<li>Add new element to an arbitrary side.</li>';

        if (graph.isSource(model)) {
            content += '<li>Double-click to <b>generate</b> a tree.</li>';
        } else if (graph.isSink(model)) {
            content += '<li>Double-click to <b>remove</b> the element.</li>';
        }

        return '<ul>' + content + '</ul>';
    }

    var clickTimerId;

    function onElementClick(view) {

        if (clickTimerId) {
            // double click
            window.clearTimeout(clickTimerId);
            clickTimerId = null;
            onElementDblClick(view);

        } else {
            // single click
            clickTimerId = window.setTimeout(click, 200);
        }

        function click() {
            clickTimerId = null;
            showHalo(view, { animation: true });
        }
    }

    function onElementDblClick(view) {

        var element = view.model;
        if (element.isElement()) {
            if (graph.isSource(element)) {
                generateTree(element, { n: 4, depth: 3, directions: ['T', 'B', 'R', 'L'] });
                layout();
            } else if (graph.isSink(element)) {
                element.remove();
                layout();
            }
        }
    }

    function addElement(element, direction) {

        var color = COLORS[_.random(0, COLORS.length - 1)];

        var newElement = element.clone()
                .set('direction', direction)
                .attr('rect/fill', color)
                .addTo(graph);

        link.clone().set({
            source: { id: element.id },
            target: { id: newElement.id }
        }).addTo(graph);

        return newElement;
    }

    function generateTree(element, opt) {

        opt = opt || {};

        var n = opt.n || 0;
        var depth = opt.depth || 0;
        var directions = opt.directions || DIRECTIONS;

        _.times(n, function() {
            var direction = directions[_.random(0, directions.length - 1)];
            var newElement = addElement(element, direction);
            if (depth > 0) {
                generateTree(newElement, {
                    n: n / 2,
                    depth: depth-1,
                    directions: directions
                });
            }
        });
    }
})(joint, _, window);
