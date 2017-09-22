/*! Rappid v2.1.0 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2015 client IO

 2017-09-21 


This Source Code Form is subject to the terms of the Rappid Trial License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/


var app = app || {};

app.Selection = Backbone.Collection.extend();

app.SelectionView = Backbone.View.extend({

    initialize: function(options) {

        this.options = options;

        _.bindAll(this, 'render');

        this.listenTo(this.model, 'add reset change', this.render);
        this.listenTo(this.model, 'remove', this.remove);
    },

    render: function() {

        var paper = this.options.paper;

        var boxTemplate = V('rect', { fill: 'none', 'stroke': '#C6C7E2', 'stroke-width': 1, 'pointer-events': 'none' });
        _.invoke(this.boxes, 'remove');
        this.boxes = [];

        this.model.each(function(element) {

            var box = boxTemplate.clone();
            var p = 3; // Box padding.
            box.attr(g.rect(_.extend({}, element.get('position'), element.get('size'))).moveAndExpand({
                x: -p, y: -p, width: 2*p, height: 2*p
            }));
            V(paper.viewport).append(box);
            this.boxes.push(box);

        }, this);

        return this;
    }
});
