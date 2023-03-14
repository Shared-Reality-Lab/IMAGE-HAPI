# Example

This folder contains the exploratory example named `hello_dots`.

## What will you experience?

There are rows of dots that go through the work area, as part of a pattern.

The user can feel _bumps_ as the result of the force applied when the end effector touches the dots.

## Contents

### Test.HTML

This is the code for the web page that will contain the embedded example.

### hello_dots.js

The main script, which is embedded in the HTML file. It contains the code for initializing the worker, creating the graphics and updating them according to the information sent by the worker.

### hello_dots_worker.js

The web worker, which communicates with the main script by sending and receiving messages with data on them.

It contains the control loop code, where all the forces for the haptic device are computed for every instant according to the parameters set in the beginning of the script.

## Range
```
var kDot = 380-1200;
var bDot = 0.5; 
```
`kDot` can vary from `380-1200` to experience the different magnitudes of the force.
- `380-600`: the user can experience a slight bumping feeling when moving across the dots. If the user releases the end effector, it will shake slightly and stop.
- `600-1000`: the user can experience a moderate bumping feeling. If the user releases the end effector, it will shake moderately and stop.
- `1000-1200`: the user can experience a substantial bumping feeling; it becomes tough to follow a straight line. If the user releases the end effort, it will shake substantially and will not stop.
-  changing the `kDot` value by around 150-200 can have distinct feelings. 
