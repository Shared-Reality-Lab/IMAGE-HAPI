# Example

This folder contains the guidance example named `hello_path_switch`.

## What will you experience?

The end effector is guided through two separated paths, each defined by a point array with (x,y) coordinates.

The user feels continuous force depending on the position of the end effector (EE) in the workspace and the next point in the line, which is updated depending if you have reached the current point. When it reaches the end of one path, it jumps to the other one without any sort of control or interpolation, just by updating the next target point.

## Contents

### Test.HTML

This is the code for the web page that will contain the embedded example.

### hello_path_switch.js

The main script, which is embedded in the HTML file. It contains the code for initializing the worker, creating the graphics and updating them according to the information sent by the worker.

### hello_path_switch_worker.js

The web worker, which communicates with the main script by sending and receiving messages with data on them.

It contains the control loop code, where all the forces for the haptic device are computed for every instant according to the parameters set in the beginning of the script.
