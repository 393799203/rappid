/*! Rappid v2.1.0 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2015 client IO

 2017-09-21 


This Source Code Form is subject to the terms of the Rappid Trial License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/


(function(joint) {

    'use strict';

    joint.shapes.app = joint.shapes.app || {};

    joint.shapes.app.CircularModel = joint.shapes.devs.Model.extend({

        defaults: _.defaultsDeep({
            type: 'app.CircularModel',
            ports: {
                groups: {
                    'in': {
                        markup: '<circle class="port-body" r="10"/>',
                        attrs: {
                            '.port-body': {
                                fill: '#61549C',
                                'stroke-width': 0
                            },
                            '.port-label': {
                                'font-size': 11,
                                fill: '#61549C',
                                'font-weight': 800
                            }
                        },
                        position: {
                            name: 'ellipse',
                            args: {
                                startAngle: 0,
                                step: 30
                            }
                        },
                        label: {
                            position: {
                                name: 'radial',
                                args: null
                            }
                        }
                    },
                    'out': {
                        markup: '<circle class="port-body" r="10"/>',
                        attrs: {
                            '.port-body': {
                                fill: '#61549C',
                                'stroke-width': 0
                            },
                            '.port-label': {
                                'font-size': 11,
                                fill: '#61549C',
                                'font-weight': 800
                            }
                        },
                        position: {
                            name: 'ellipse',
                            args: {
                                startAngle: 180,
                                step: 30
                            }
                        },
                        label: {
                            position: {
                                name: 'radial',
                                args: null
                            }
                        }
                    }
                }
            }

        }, joint.shapes.devs.Model.prototype.defaults)
    });

    joint.shapes.app.RectangularModel = joint.shapes.devs.Model.extend({

        defaults: _.defaultsDeep({
            type: 'app.RectangularModel',
            ports: {
                groups: {
                    'in': {
                        markup: '<circle class="port-body" r="10"/>',
                        attrs: {
                            '.port-body': {
                                fill: '#61549C',
                                'stroke-width': 0
                            },
                            '.port-label': {
                                'font-size': 11,
                                fill: '#61549C',
                                'font-weight': 800
                            }
                        },
                        label: {
                            position: {
                                name: 'left',
                                args: {
                                    y: 0
                                }
                            }
                        }
                    },
                    'out': {
                        markup: '<circle class="port-body" r="10"/>',
                        attrs: {
                            '.port-body': {
                                fill: '#61549C',
                                'stroke-width': 0
                            },
                            '.port-label': {
                                'font-size': 11,
                                fill: '#61549C',
                                'font-weight': 800
                            }
                        },
                        label: {
                            position: {
                                name: 'right',
                                args: {
                                    y: 0
                                }
                            }
                        }
                    }
                }
            }
        }, joint.shapes.devs.Model.prototype.defaults)
    });

    joint.shapes.app.Link = joint.dia.Link.extend({

        defaults: _.defaultsDeep({
            type: 'app.Link',
            router: {
                name: 'normal'
            },
            connector: {
                name: 'normal'
            },
            attrs: {
                '.tool-options': {
                    'data-tooltip-class-name': 'small',
                    'data-tooltip': 'Click to open Inspector for this link',
                    'data-tooltip-position': 'left'
                },
                '.marker-source': {
                    d: 'M 10 0 L 0 5 L 10 10 z',
                    stroke: 'transparent',
                    fill: '#222138',
                    transform: 'scale(0.001)'
                },
                '.marker-target': {
                    d: 'M 10 0 L 0 5 L 10 10 z',
                    stroke: 'transparent',
                    fill: '#222138',
                    transform: 'scale(1)'
                },
                '.connection': {
                    stroke: '#222138',
                    'stroke-dasharray': '0',
                    'stroke-width': 1
                }
            }
        }, joint.dia.Link.prototype.defaults)
    });

})(joint);
