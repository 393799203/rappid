/*! Rappid v2.1.0 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2015 client IO

 2017-09-21 


This Source Code Form is subject to the terms of the Rappid Trial License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/


var App = window.App || {};

(function(_, joint) {

    App.ThemePicker = joint.ui.Toolbar.extend({

        className: function() {
            return _.result(joint.ui.Toolbar.prototype, 'className') + ' theme-picker';
        },

        options: {
            mainView: null // an instance of App.MainView
        },

        themes: {
            type: 'select-button-group',
            name: 'theme-picker',
            multi: false,
            options: [
                { value: 'modern', content: 'Modern' },
                { value: 'dark', content: 'Dark' },
                { value: 'material', content: 'Material' }
            ],
            attrs: {
                '.joint-select-button-group': {
                    'data-tooltip': 'Change Theme',
                    'data-tooltip-position': 'bottom'
                }
            }
        },

        init: function() {

            this.themes.selected = _.findIndex(this.themes.options, { value: this.defaultTheme });
            this.options.tools = [this.themes];
            this.on('theme-picker:option:select', this.onThemeSelected, this);

            joint.ui.Toolbar.prototype.init.apply(this, arguments);
        },

        onThemeSelected: function(option) {

            joint.setTheme(option.value);
            if (this.options.mainView) {
                this.adjustAppToTheme(this.options.mainView, option.value);
            }
        },

        adjustAppToTheme: function(app, theme) {

            // Make the following changes silently without the command manager notice.
            app.commandManager.stopListening();

            // Links in the dark theme would not be visible on the dark background.
            // Note that this overrides custom color
            var linkColor = (theme === 'dark' ? '#f6f6f6' : '#222138');

            var themedLinks = app.graph.getLinks();
            var defaultLink = app.paper.options.defaultLink;
            if (defaultLink instanceof joint.dia.Link) {
                themedLinks.push(defaultLink);
            }

            _.invoke(themedLinks, 'attr', {
                '.connection': { 'stroke': linkColor },
                '.marker-target': { 'fill': linkColor },
                '.marker-source': { 'fill': linkColor }
            });

            // Material design has no grid shown.
            if (theme === 'material') {
                app.paper.options.drawGrid = false;
                app.paper.clearGrid();
            } else {
                app.paper.options.drawGrid = true;
                app.paper.drawGrid();
            }

            app.commandManager.listen();
        }
    });

})(_, joint);
