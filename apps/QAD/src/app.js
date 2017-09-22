/*! Rappid v2.1.0 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2015 client IO

 2017-09-21 


This Source Code Form is subject to the terms of the Rappid Trial License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/


// @import jquery.js
// @import lodash.js
// @import backbone.js
// @import geometry.js
// @import vectorizer.js
// @import joint.clean.js
// @import joint.shapes.qad.js
// @import selection.js
// @import factory.js
// @import snippet.js

var app = app || {};
var qad = window.qad || {};

app.AppView = Backbone.View.extend({

    el: '#app',

    events: {
        'click #toolbar .add-question': 'addQuestion',
        'click #toolbar .add-answer': 'addAnswer',
        'click #toolbar .preview-dialog': 'previewDialog',
        'click #toolbar .code-snippet': 'showCodeSnippet',
        'click #toolbar .load-example': 'loadExample',
        'click #toolbar .clear': 'clear'
    },

    initialize: function() {

        this.initializePaper();
        this.initializeSelection();
        this.initializeHalo();
        this.initializeInlineTextEditor();
        this.initializeTooltips();

        this.loadExample();
    },

    initializeTooltips: function() {

        new joint.ui.Tooltip({
            rootTarget: '#paper',
            target: '.element',
            content: _.bind(function(element) {

                var cellView = this.paper.findView(element);
                var cell = cellView.model;

                var t = '- Double-click to edit text inline.';
                if (cell.get('type') === 'qad.Question') {
                    t += '<br/><br/>- Connect a port with another Question or an Answer.';
                }

                return  t;

            }, this),
            direction: 'right',
            right: '#paper',
            padding: 20
        });
    },

    initializeInlineTextEditor: function() {

        var cellViewUnderEdit;

        var closeEditor = _.bind(function() {

            if (this.textEditor) {
                this.textEditor.remove();
                // Re-enable dragging after inline editing.
                cellViewUnderEdit.options.interactive = true;
                this.textEditor = cellViewUnderEdit = undefined;
            }
        }, this);

        this.paper.on('cell:pointerdblclick', function(cellView, evt) {

            // Clean up the old text editor if there was one.
            closeEditor();

            var vTarget = V(evt.target);
            var text;
            var cell = cellView.model;

            switch (cell.get('type')) {

                case 'qad.Question':

                    text = joint.ui.TextEditor.getTextElement(evt.target);
                    if (!text) {
                        break;
                    }
                    if (vTarget.hasClass('body') || V(text).hasClass('question-text')) {

                        text = cellView.$('.question-text')[0];
                        cellView.textEditPath = 'question';

                    } else if (V(text).hasClass('option-text')) {

                        cellView.textEditPath = 'options/' + _.findIndex(cell.get('options'), { id: V(text.parentNode).attr('option-id') }) + '/text';
                        cellView.optionId = V(text.parentNode).attr('option-id');

                    } else if (vTarget.hasClass('option-rect')) {

                        text = V(vTarget.node.parentNode).find('.option-text');
                        cellView.textEditPath = 'options/' + _.findIndex(cell.get('options'), { id: V(vTarget.node.parentNode).attr('option-id') }) + '/text';
                    }
                    break;

                case 'qad.Answer':
                    text = joint.ui.TextEditor.getTextElement(evt.target);
                    cellView.textEditPath = 'answer';
                    break;
            }

            if (text) {

                this.textEditor = new joint.ui.TextEditor({ text: text });
                this.textEditor.render(this.paper.el);

                this.textEditor.on('text:change', function(newText) {

                    var cell = cellViewUnderEdit.model;
                    // TODO: prop() changes options and so options are re-rendered
                    // (they are rendered dynamically).
                    // This means that the `text` SVG element passed to the ui.TextEditor
                    // no longer exists! An exception is thrown subsequently.
                    // What do we do here?
                    cell.prop(cellViewUnderEdit.textEditPath, newText);

                    // A temporary solution or the right one? We just
                    // replace the SVG text element of the textEditor options object with the new one
                    // that was dynamically created as a reaction on the `prop` change.
                    if (cellViewUnderEdit.optionId) {
                        this.textEditor.options.text = cellViewUnderEdit.$('.option.option-' + cellViewUnderEdit.optionId + ' .option-text')[0];
                    }

                }, this);

                cellViewUnderEdit = cellView;
                // Prevent dragging during inline editing.
                cellViewUnderEdit.options.interactive = false;
            }
        }, this);

        $(document.body).on('click', _.bind(function(evt) {

            var text = joint.ui.TextEditor.getTextElement(evt.target);
            if (this.textEditor && !text) {

                closeEditor();
            }
        }, this));
    },

    initializeHalo: function() {

        this.paper.on('cell:pointerup', function(cellView, evt) {

            if (cellView.model instanceof joint.dia.Link) return;

            var halo = new joint.ui.Halo({ graph: this.graph, paper: this.paper, cellView: cellView, useModelGeometry: true, type: 'toolbar' });

            // As we're using the FreeTransform plugin, there is no need for an extra resize tool in Halo.
            // Therefore, remove the resize tool handle and reposition the clone tool handle to make the
            // handles nicely spread around the elements.
            halo.removeHandle('resize');
            halo.removeHandle('rotate');
            halo.removeHandle('fork');
            halo.removeHandle('link');
            //halo.changeHandle('clone', { position: 'se' });

            halo.on('action:remove:pointerdown', function() {
                this.selection.reset();
            }, this);

            halo.render();

        }, this);
    },

    initializeSelection: function() {

        document.body.addEventListener('keydown', _.bind(function(evt) {

            var code = evt.which || evt.keyCode;
            // Do not remove the element with backspace if we're in inline text editing.
            if ((code === 8 || code === 46) && !this.textEditor && this.selection.first()) {

                this.selection.first().remove();
                this.selection.reset();
                return false;
            }

        }, this), false);

        var selection = this.selection = new app.Selection;
        new app.SelectionView({ model: selection, paper: this.paper });

        this.paper.on('cell:pointerup', function(cellView) {
            if (!cellView.model.isLink()) {
                selection.reset([cellView.model]);
            }
        });
        this.paper.on('blank:pointerdown', function() {
            selection.reset([]);
        });

        selection.on('add reset', this.onSelectionChange, this);
    },

    initializePaper: function() {

        this.graph = new joint.dia.Graph;

        this.paper = new joint.dia.Paper({
            el: this.$('#paper'),
            model: this.graph,
            width: 800,
            height: 600,
            gridSize: 10,
            snapLinks: { radius: 75 },
            validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
                // Prevent linking from input ports.
                if (magnetS && magnetS.getAttribute('type') === 'input') return false;
                // Prevent linking from output ports to input ports within one element.
                if (cellViewS === cellViewT) return false;
                // Prevent linking to input ports.
                return true;
                //return (magnetT && magnetT.getAttribute('type') === 'input') || (cellViewS.model.get('type') === 'qad.Question' && cellViewT.model.get('type') === 'qad.Answer');
            },
            validateMagnet: function(cellView, magnet) {
                // Note that this is the default behaviour. Just showing it here for reference.
                // Disable linking interaction for magnets marked as passive (see below `.inPorts circle`).
                return magnet.getAttribute('magnet') !== 'passive';
            },
            defaultLink: new joint.dia.Link({
                router: { name: 'manhattan' },
                connector: { name: 'rounded' },
                attrs: {
                    '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z', fill: '#6a6c8a', stroke: '#6a6c8a' },
                    '.connection': {
                        stroke: '#6a6c8a', 'stroke-width': 2
                        //filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 2 } }
                    }
                }
            })
        });
    },

    onSelectionChange: function(collection) {

        var cell = collection.first();
        if (cell) {
            this.status('Selection: ' + cell.get('type'));
        } else {
            this.status('Selection emptied.');
        }
    },

    // Show a message in the statusbar.
    status: function(m) {
        this.$('#statusbar .message').text(m);
    },

    addQuestion: function() {

        var q = app.Factory.createQuestion('Question');
        this.graph.addCell(q);
        this.status('Question added.');
    },

    addAnswer: function() {

        var a = app.Factory.createAnswer('Answer');
        this.graph.addCell(a);
        this.status('Answer added.');
    },

    previewDialog: function() {

        var cell = this.selection.first();
        var el = qad.renderDialog(app.Factory.createDialogJSON(this.graph, cell));

        $('#preview').empty();
        $('#preview').append($('<div>', { 'class': 'background' }));
        $('#preview').append(el).show();

        $('#preview .background').on('click', function() {

            $('#preview').empty();
        });
    },

    loadExample: function() {

        //this.graph.fromJSON({"cells":[{"type":"qad.Question","size":{"width":251.8984375,"height":66.8},"inPorts":[{"id":"in","label":"In"}],"outPorts":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"position":{"x":34,"y":140},"angle":0,"question":"Does the thing work?","id":"8c1450b5-ca1f-4222-9a11-69c05e67c6b6","z":1,"attrs":{".label":{"text":"Does the thing work?"},".inPorts>.port0>.port-label":{"text":"In"},".inPorts>.port0>.port-body":{"port":{"id":"in","type":"in"},"fill":"#f6f6f6"},".inPorts>.port0":{"ref":".body","ref-y":0.5},".outPorts>.port0>.port-label":{"text":"Yes"},".outPorts>.port0>.port-body":{"port":{"id":"yes","type":"out"},"fill":"#31d0c6"},".outPorts>.port0":{"ref":".body","ref-y":0.25,"ref-dx":0},".outPorts>.port1>.port-label":{"text":"No"},".outPorts>.port1>.port-body":{"port":{"id":"no","type":"out"},"fill":"#fe854f"},".outPorts>.port1":{"ref":".body","ref-y":0.75,"ref-dx":0}}},{"type":"qad.Answer","size":{"width":223.796875,"height":66.8},"inPorts":[{"id":"in","label":"In"}],"outPorts":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"position":{"x":311,"y":26},"angle":0,"answer":"Don't mess about with it.","id":"d90182dd-46f7-4392-a483-4c9c2c9c3715","z":2,"attrs":{"text":{"text":"Don't mess about with it."}}},{"type":"qad.Question","size":{"width":245.6484375,"height":66.8},"inPorts":[{"id":"in","label":"In"}],"outPorts":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"position":{"x":127,"y":308},"angle":0,"question":"Did you mess about with it?","id":"3ff1e021-fece-4ec7-8ce9-4420d90901d8","z":3,"attrs":{".label":{"text":"Did you mess about with it?"},".inPorts>.port0>.port-label":{"text":"In"},".inPorts>.port0>.port-body":{"port":{"id":"in","type":"in"},"fill":"#f6f6f6"},".inPorts>.port0":{"ref":".body","ref-y":0.5},".outPorts>.port0>.port-label":{"text":"Yes"},".outPorts>.port0>.port-body":{"port":{"id":"yes","type":"out"},"fill":"#31d0c6"},".outPorts>.port0":{"ref":".body","ref-y":0.25,"ref-dx":0},".outPorts>.port1>.port-label":{"text":"No"},".outPorts>.port1>.port-body":{"port":{"id":"no","type":"out"},"fill":"#fe854f"},".outPorts>.port1":{"ref":".body","ref-y":0.75,"ref-dx":0}}},{"type":"link","source":{"id":"8c1450b5-ca1f-4222-9a11-69c05e67c6b6","selector":"g:nth-child(1) g:nth-child(4) g:nth-child(1) circle:nth-child(1)     ","port":"yes"},"target":{"id":"d90182dd-46f7-4392-a483-4c9c2c9c3715"},"id":"45c5f30e-bc19-4fda-97f2-b55ea7cab916","embeds":"","z":4,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}},{"type":"qad.Answer","size":{"width":151.7890625,"height":66.8},"inPorts":[{"id":"in","label":"In"}],"outPorts":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"position":{"x":499,"y":266},"angle":0,"answer":"You're an idiot","id":"9bfbdacd-ae3e-4982-824a-1cbba53603a3","z":5,"attrs":{"text":{"text":"You're an idiot"}}},{"type":"link","source":{"id":"3ff1e021-fece-4ec7-8ce9-4420d90901d8","selector":"g:nth-child(1) g:nth-child(4) g:nth-child(1) circle:nth-child(1)     ","port":"yes"},"target":{"id":"9bfbdacd-ae3e-4982-824a-1cbba53603a3"},"id":"f2c31a0d-c424-4653-a114-94c6d279d264","embeds":"","z":6,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}},{"type":"qad.Question","size":{"width":205.6171875,"height":66.8},"inPorts":[{"id":"in","label":"In"}],"outPorts":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"position":{"x":208,"y":465},"angle":0,"question":"Will you get screwed?","id":"05c074aa-140a-4b81-8ba7-648675ccef6f","z":8,"attrs":{".label":{"text":"Will you get screwed?"},".inPorts>.port0>.port-label":{"text":"In"},".inPorts>.port0>.port-body":{"port":{"id":"in","type":"in"},"fill":"#f6f6f6"},".inPorts>.port0":{"ref":".body","ref-y":0.5},".outPorts>.port0>.port-label":{"text":"Yes"},".outPorts>.port0>.port-body":{"port":{"id":"yes","type":"out"},"fill":"#31d0c6"},".outPorts>.port0":{"ref":".body","ref-y":0.25,"ref-dx":0},".outPorts>.port1>.port-label":{"text":"No"},".outPorts>.port1>.port-body":{"port":{"id":"no","type":"out"},"fill":"#fe854f"},".outPorts>.port1":{"ref":".body","ref-y":0.75,"ref-dx":0}}},{"type":"qad.Answer","size":{"width":142.5,"height":66.8},"inPorts":[{"id":"in","label":"In"}],"outPorts":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"position":{"x":530,"y":519},"angle":0,"answer":"Put it in a bin","id":"df22d7c0-a59e-4963-879b-a8de67f189b6","z":9,"attrs":{"text":{"text":"Put it in a bin"}}},{"type":"link","source":{"id":"8c1450b5-ca1f-4222-9a11-69c05e67c6b6","selector":"g:nth-child(1) g:nth-child(4) g:nth-child(2) circle:nth-child(1)     ","port":"no"},"target":{"id":"3ff1e021-fece-4ec7-8ce9-4420d90901d8","selector":"g:nth-child(1) g:nth-child(3) g:nth-child(1) circle:nth-child(1)     ","port":"in"},"id":"a65339c9-01c8-4fa5-a181-d72ecaf8a7ec","embeds":"","z":10,"vertices":[{"x":334,"y":224},{"x":76,"y":304}],"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}},{"type":"link","source":{"id":"3ff1e021-fece-4ec7-8ce9-4420d90901d8","selector":"g:nth-child(1) g:nth-child(4) g:nth-child(2) circle:nth-child(1)     ","port":"no"},"target":{"id":"05c074aa-140a-4b81-8ba7-648675ccef6f","selector":"g:nth-child(1) g:nth-child(3) g:nth-child(1) circle:nth-child(1)     ","port":"in"},"id":"85430e16-8a6d-43c9-ab79-a468f3435991","embeds":"","z":11,"vertices":[{"x":412,"y":412},{"x":174,"y":457}],"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}},{"type":"link","source":{"id":"05c074aa-140a-4b81-8ba7-648675ccef6f","selector":"g:nth-child(1) g:nth-child(4) g:nth-child(2) circle:nth-child(1)     ","port":"no"},"target":{"id":"df22d7c0-a59e-4963-879b-a8de67f189b6"},"id":"3bf86457-227f-437e-98b5-ccf73b489342","embeds":"","z":12,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}},{"type":"qad.Answer","size":{"width":172.75,"height":66.8},"inPorts":[{"id":"in","label":"In"}],"outPorts":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"position":{"x":509,"y":402},"angle":0,"answer":"Poor boy","id":"162b05c4-bbda-42e5-b079-33aea3bad948","z":13,"attrs":{"text":{"text":"You poor bastard"}}},{"type":"link","source":{"id":"05c074aa-140a-4b81-8ba7-648675ccef6f","selector":"g:nth-child(1) g:nth-child(4) g:nth-child(1) circle:nth-child(1)     ","port":"yes"},"target":{"id":"162b05c4-bbda-42e5-b079-33aea3bad948"},"id":"fb898507-7eab-4f89-a75c-5f886b73b1c5","embeds":"","z":14,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}}]});
        this.graph.fromJSON({"cells":[{"type":"qad.Question","size":{"width":201.8984375,"height":125},"position":{"x":45,"y":38},"angle":0,"question":"Does the thing work?","options":[{"id":"yes","text":"Yes"},{"id":"no","text":"No"}],"id":"d849d917-8a43-4d51-9e99-291799c144db","z":1,"attrs":{".options":{"ref-y":45},".question-text":{"text":"Does the thing work?"},".option-yes":{"transform":"translate(0, 0)","dynamic":true},".option-yes .option-rect":{"height":30,"dynamic":true},".option-yes .option-port .port-body":{"port":"yes","dynamic":true},".option-yes .option-text":{"text":"Yes","dynamic":true},".option-no":{"transform":"translate(0, 30)","dynamic":true},".option-no .option-rect":{"height":30,"dynamic":true},".option-no .option-port .port-body":{"port":"no","dynamic":true},".option-no .option-text":{"text":"No","dynamic":true},".inPorts>.port-in>.port-label":{"text":"In"},".inPorts>.port-in>.port-body":{"port":{"id":"in","type":"in","label":"In"}},".inPorts>.port-in":{"ref":".body","ref-x":0.5}}},{"type":"qad.Answer","size":{"width":223.796875,"height":66.8},"inPorts":[{"id":"in","label":"In"}],"outPorts":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"position":{"x":464,"y":68},"angle":0,"answer":"Don't mess about with it.","id":"4073e883-1cc6-46a5-b22d-688ca1934324","z":2,"attrs":{"text":{"text":"Don't mess about with it."}}},{"type":"link","source":{"id":"d849d917-8a43-4d51-9e99-291799c144db","selector":"g:nth-child(1) g:nth-child(3) g:nth-child(1) g:nth-child(4) circle:nth-child(1)      ","port":"yes"},"target":{"id":"4073e883-1cc6-46a5-b22d-688ca1934324"},"router":{"name":"manhattan"},"connector":{"name":"rounded"},"id":"9d87214a-7b08-47ce-9aec-8e49ed7ae929","embeds":"","z":3,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}},{"type":"qad.Question","size":{"width":195.6484375,"height":125},"position":{"x":55,"y":245},"angle":0,"question":"Did you mess about with it?","options":[{"id":"yes","text":"Yes"},{"id":"no","text":"No"}],"id":"8ce3f820-54f0-41f0-a46c-1e4f57b5f91e","z":4,"attrs":{".options":{"ref-y":45},".question-text":{"text":"Did you mess about with it?"},".option-yes":{"transform":"translate(0, 0)","dynamic":true},".option-yes .option-rect":{"height":30,"dynamic":true},".option-yes .option-port .port-body":{"port":"yes","dynamic":true},".option-yes .option-text":{"text":"Yes","dynamic":true},".option-no":{"transform":"translate(0, 30)","dynamic":true},".option-no .option-rect":{"height":30,"dynamic":true},".option-no .option-port .port-body":{"port":"no","dynamic":true},".option-no .option-text":{"text":"No","dynamic":true},".inPorts>.port-in>.port-label":{"text":"In"},".inPorts>.port-in>.port-body":{"port":{"id":"in","type":"in","label":"In"}},".inPorts>.port-in":{"ref":".body","ref-x":0.5}}},{"type":"qad.Answer","size":{"width":156.234375,"height":66.8},"inPorts":[{"id":"in","label":"In"}],"outPorts":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"position":{"x":343,"y":203},"angle":0,"answer":"Run away!","id":"7da45291-2535-4aa1-bb50-5cadd2b2fb91","z":5,"attrs":{"text":{"text":"Run away!"}}},{"type":"link","source":{"id":"8ce3f820-54f0-41f0-a46c-1e4f57b5f91e","selector":"g:nth-child(1) g:nth-child(3) g:nth-child(1) g:nth-child(4) circle:nth-child(1)      ","port":"yes"},"target":{"id":"7da45291-2535-4aa1-bb50-5cadd2b2fb91"},"router":{"name":"manhattan"},"connector":{"name":"rounded"},"id":"fd9f3367-79b9-4f69-b5b7-2bba012e53bb","embeds":"","z":6,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}},{"type":"qad.Question","size":{"width":155.6171875,"height":125},"position":{"x":238,"y":429},"angle":0,"question":"Will you get screwed?","options":[{"id":"yes","text":"Yes"},{"id":"no","text":"No"}],"id":"fd3e0ab4-fd3a-4342-972b-3616e0c0a5cf","z":7,"attrs":{".options":{"ref-y":45},".question-text":{"text":"Will you get screwed?"},".option-yes":{"transform":"translate(0, 0)","dynamic":true},".option-yes .option-rect":{"height":30,"dynamic":true},".option-yes .option-port .port-body":{"port":"yes","dynamic":true},".option-yes .option-text":{"text":"Yes","dynamic":true},".option-no":{"transform":"translate(0, 30)","dynamic":true},".option-no .option-rect":{"height":30,"dynamic":true},".option-no .option-port .port-body":{"port":"no","dynamic":true},".option-no .option-text":{"text":"No","dynamic":true},".inPorts>.port-in>.port-label":{"text":"In"},".inPorts>.port-in>.port-body":{"port":{"id":"in","type":"in","label":"In"}},".inPorts>.port-in":{"ref":".body","ref-x":0.5}}},{"type":"link","source":{"id":"d849d917-8a43-4d51-9e99-291799c144db","selector":"g:nth-child(1) g:nth-child(3) g:nth-child(2) g:nth-child(4) circle:nth-child(1)      ","port":"no"},"target":{"id":"8ce3f820-54f0-41f0-a46c-1e4f57b5f91e","selector":"g:nth-child(1) g:nth-child(4) g:nth-child(1) circle:nth-child(1)     ","port":"in"},"router":{"name":"manhattan"},"connector":{"name":"rounded"},"id":"641410b2-aeb5-42ad-b757-2d9c6e4d56bd","embeds":"","z":8,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}},{"type":"link","source":{"id":"8ce3f820-54f0-41f0-a46c-1e4f57b5f91e","selector":"g:nth-child(1) g:nth-child(3) g:nth-child(2) g:nth-child(4) circle:nth-child(1)      ","port":"no"},"target":{"id":"fd3e0ab4-fd3a-4342-972b-3616e0c0a5cf","selector":"g:nth-child(1) g:nth-child(4) g:nth-child(1) circle:nth-child(1)     ","port":"in"},"router":{"name":"manhattan"},"connector":{"name":"rounded"},"id":"3b9de57d-be21-4e9e-a73b-693b32e5f14a","embeds":"","z":9,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}},{"type":"qad.Answer","size":{"width":177.1953125,"height":66.8},"inPorts":[{"id":"in","label":"In"}],"outPorts":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"position":{"x":545,"y":400},"angle":0,"answer":"Poor boy.","id":"13402455-006d-41e3-aacc-514f551b78b8","z":10,"attrs":{"text":{"text":"Poor boy."}}},{"type":"qad.Answer","size":{"width":146.9453125,"height":66.8},"inPorts":[{"id":"in","label":"In"}],"outPorts":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"position":{"x":553,"y":524},"angle":0,"answer":"Put it in a bin.","id":"857c9deb-86c3-47d8-bc6d-8f36c5294eab","z":11,"attrs":{"text":{"text":"Put it in a bin."}}},{"type":"link","source":{"id":"fd3e0ab4-fd3a-4342-972b-3616e0c0a5cf","selector":"g:nth-child(1) g:nth-child(3) g:nth-child(1) g:nth-child(4) circle:nth-child(1)      ","port":"yes"},"target":{"id":"13402455-006d-41e3-aacc-514f551b78b8"},"router":{"name":"manhattan"},"connector":{"name":"rounded"},"id":"7e96039d-c3d4-4c86-b8e5-9a49835e114b","embeds":"","z":12,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}},{"type":"link","source":{"id":"fd3e0ab4-fd3a-4342-972b-3616e0c0a5cf","selector":"g:nth-child(1) g:nth-child(3) g:nth-child(2) g:nth-child(4) circle:nth-child(1)      ","port":"no"},"target":{"id":"857c9deb-86c3-47d8-bc6d-8f36c5294eab"},"router":{"name":"manhattan"},"connector":{"name":"rounded"},"id":"eecaae21-3e81-43f9-a5c1-6ea40c1adba8","embeds":"","z":13,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z","fill":"#6a6c8a","stroke":"#6a6c8a"},".connection":{"stroke":"#6a6c8a","stroke-width":2}}}]});
    },

    clear: function() {

        this.graph.clear();
    },

    showCodeSnippet: function() {

        var cell = this.selection.first();
        var dialogJSON = app.Factory.createDialogJSON(this.graph, cell);

        var id = _.uniqueId('qad-dialog-');

        var snippet = '';
        snippet += '<div id="' + id + '"></div>';
        snippet += '<link rel="stylesheet" type="text/css" href="http://qad.client.io/css/snippet.css"></script>';
        snippet += '<script type="text/javascript" src="http://qad.client.io/src/snippet.js"></script>';
        snippet += '<script type="text/javascript">';
        snippet += 'document.getElementById("' + id + '").appendChild(qad.renderDialog(' + JSON.stringify(dialogJSON) + '))';
        snippet += '</script>';

        var content = '<textarea>' + snippet + '</textarea>';

        var dialog = new joint.ui.Dialog({
            width: '50%',
            height: 200,
            draggable: true,
            title: 'Copy-paste this snippet to your HTML page.',
            content: content
        });

        dialog.open();
    }
});
