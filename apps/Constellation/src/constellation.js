/*! Rappid v2.1.0 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2015 client IO

 2017-09-21 


This Source Code Form is subject to the terms of the Rappid Trial License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/


(function(joint, document) {

    var nextButton = document.getElementById('next');
    var constellations = JSON.parse(document.getElementById('constellations').textContent);
    var walkthrough = Object.keys(constellations).concat(['']);

    var shapes = {
        Star: joint.dia.Element.define('Star', {
            markup: 'ellipse',
            size: {
                width: 30,
                height: 30
            },
            attrs: {
                ellipse: {
                    refCX: '50%',
                    refCY: '50%',
                    refRx: '50%',
                    refRy: '50%',
                    fill: 'white',
                    stroke: 'white',
                    strokeOpacity: 0.5,
                    strokeWidth: 8,
                    cursor: 'pointer'
                }
            }
        }),
        Name: joint.dia.Element.define('Name', {
            markup: 'text',
            attrs: {
                text: {
                    stroke: '#b0c4de',
                    fill: '#b0c4de',
                    cursor: 'pointer',
                    textAnchor: 'middle',
                    fontSize: 80,
                    fontFamily: 'fantasy',
                    fontWeight: 'bold',
                    letterSpacing: 10
                }
            }
        }),
        Connection: joint.dia.Link.define('Connection', {
            markup: '<path class="connection"/><path class="connection-wrap"/>',
            attrs: {
                '.connection': {
                    stroke: '#FFCC12',
                    strokeWidth: 8,
                    cursor: 'pointer'
                }
            }
        }, {

            highlight: function() {
                this.attr('.connection/stroke', '#FF3355');
            },

            unhighlight: function() {
                this.attr('.connection/stroke', '#FFCC12');
            }
        })
    };

    var Universe = joint.dia.Graph.extend({

        getConstellation: function(name) {
            var constellationStars = [];
            var stars = this.getElements();
            for (var i = 0, n = stars.length; i < n; i++) {
                var star = stars[i];
                if (star.prop('constellation') === name) {
                    constellationStars.push(star);
                }
            }
            return constellationStars;
        },

        getConstellationBBox: function(name) {
            return this.getCellsBBox(this.getConstellation(name));
        },

        loadConstellations: function(constellations) {

            for (var name in constellations) {
                var constellation = constellations[name];
                var stars = constellation.stars || [];
                // Add stars
                for (var i = 0, n = stars.length; i < n; i++) {
                    var star = stars[i];
                    (new shapes.Star({ id: name + '-' + i }))
                        .position(star.x, star.y)
                        .prop('constellation', name)
                        .addTo(this);
                }
                // Add connections
                var connections = constellation.connections || [];
                for (var j = 0, m = connections.length; j < m; j++) {
                    var connection = connections[j];
                    (new shapes.Connection({
                        source: { id: name + '-' + connection[0] },
                        target: { id: name + '-' + connection[1] },
                        constellation: name
                    })).addTo(this);
                }
                // Add constellation name
                var center = this.getConstellationBBox(name).center();
                (new shapes.Name())
                    .attr('text/text', name.toUpperCase())
                    .position(center.x, center.y)
                    .prop('constellation', name)
                    .addTo(this);
            }
        },

        highlightConstellation: function(name) {
            var constellation = this.getConstellation(name);
            var subgraph = this.getSubgraph(constellation);
            for (var i = 0, n = subgraph.length; i < n; i++) {
                var cell = subgraph[i];
                if (cell.isLink()) cell.highlight();
            }
        },

        unhighlightConstellation: function(name) {
            var constellation = this.getConstellation(name);
            var subgraph = this.getSubgraph(constellation);
            for (var i = 0, n = subgraph.length; i < n; i++) {
                var cell = subgraph[i];
                if (cell.isLink()) cell.unhighlight();
            }
        }
    });

    var graph = new Universe;
    var paper = new joint.dia.Paper({
        model: graph,
        interactive: false,
        background: {
            image: 'images/stars.jpeg',
            size: 'cover'
        }
    });

    var paperScroller = new joint.ui.PaperScroller({
        paper: paper,
        padding: 0,
        contentOptions: {
            allowNewOrigin: 'any',
            padding: 1000
        }
    });

    paperScroller.lock();
    paperScroller.$el.appendTo('#universe');
    graph.loadConstellations(constellations);
    paperScroller.adjustPaper();

    next();

    // Interactions

    paper.on({
        'cell:pointerup': function(view) {
            var name = view.model.get('constellation');
            var constellation = this.model.getConstellation(name);
            focusStars(constellation);
        },
        'blank:pointerdown': function() {
            focusStars();
        },
        'cell:mouseenter': function(view) {
            var name = view.model.get('constellation');
            graph.highlightConstellation(name);
        },
        'cell:mouseleave': function(view, evt) {
            if (evt.relatedTarget === this.svg) {
                var name = view.model.get('constellation');
                graph.unhighlightConstellation(name);
            }
        }
    });

    nextButton.addEventListener('click', next, false);

    // Helpers

    function focusStars(stars) {
        stars || (stars = graph.getElements());
        paperScroller.transitionToRect(graph.getCellsBBox(stars), {
            visibility: .8,
            timingFunction: 'ease-out',
            delay: '10ms',
            scaleGrid: 0.05
        });
    }

    function next() {
        var name = walkthrough.pop();
        walkthrough.unshift(name);
        if (name) {
            focusStars(graph.getConstellation(name));
        } else {
            focusStars();
        }
        nextButton.textContent = 'Visit ' + (walkthrough[walkthrough.length - 1] || 'all');
    }

})(joint, document);
