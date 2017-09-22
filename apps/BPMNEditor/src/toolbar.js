/*! Rappid v2.1.0 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2015 client IO

 2017-09-21 


This Source Code Form is subject to the terms of the Rappid Trial License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/


window.toolbarConfig = {

    tools: [
        {
            type: 'button',
            name: 'load',
            attrs: {
                button: {
                    'data-tooltip': 'Load',
                }
            }
        },
        {
            type: 'button',
            name: 'save',
            attrs: {
                button: {
                    'data-tooltip': 'Save'
                }
            }
        },
        {
            type: 'button',
            name: 'print',
            attrs: {
                button: {
                    'data-tooltip': 'Open a Print Dialog'
                }
            }
        },
        {
            type: 'button',
            name: 'tojson',
            attrs: {
                button: {
                    'data-tooltip': 'Open As JSON'
                }
            }
        },
        {
            type: 'zoom-in',
            name: 'zoom-in',
            attrs: {
                button: {
                    'data-tooltip': 'Zoom In'
                }
            }
        },
        {
            type: 'zoom-out',
            name: 'zoom-out',
            attrs: {
                button: {
                    'data-tooltip': 'Zoom Out'
                }
            }
        },
        {
            type: 'button',
            name: 'clear',
            attrs: {
                button: {
                    'data-tooltip': 'Clear Paper'
                }
            }
        },
        {
            type: 'undo',
            name: 'undo',
            attrs: {
                button: {
                    'data-tooltip': 'Undo'
                }
            }
        },
        {
            type: 'redo',
            name: 'redo',
            attrs: {
                button: {
                    'data-tooltip': 'Redo'
                }
            }
        }
    ]
};