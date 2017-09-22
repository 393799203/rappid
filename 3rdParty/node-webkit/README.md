JointJS in node-webkit
======================

Usage
-----

1. Download node-webkit for your platform: https://github.com/rogerwang/node-webkit
2. cd JointJS
3. node-webkit .


Notes
-----

- Edge version of Lodash library was necessary (https://github.com/lodash/lodash/blob/master/dist/lodash.js).
Otherwise, errors of type "Uncaught TypeError: Cannot read property 'each' of undefined" were seen.

- The above note implies we have to use the clean version of JointJS (joint.clean.js).
