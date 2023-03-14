# Example

This folder contains the exploratory example named `hello_stripes`.

## What will you experience?

There are horizontal lines that go through the work area, as part of a pattern.

The user can feel a _bump_ as the result of the force applied when the end effector crosses the lines.

## Contents

### Test.HTML

This is the code for the web page that will contain the embedded example.

### hello_stripes.js

The main script, which is embedded in the HTML file. It contains the code for initializing the worker, creating the graphics and updating them according to the information sent by the worker.

### hello_stripes_worker.js

The web worker, which communicates with the main script by sending and receiving messages with data on them.

It contains the control loop code, where all the forces for the haptic device are computed for every instant according to the parameters set in the beginning of the script.

## Range
```
var kWall = 1000 - 3500;
var bWall = 1;
```
The value of `kWall` can vary from `1000 - 3500`; the more significant the bumping force the user can feel when passing through the stripes.
- `var kWall = 1000 - 1500;`: if the user moves slowly, the user will feel the bumping force will get over a stripe. If the user is moving fast, the user will not feel anything
- `var wall = 1500-2000;`: if the user moves slowly, the user will feel the bumping force, and the end effector will fluctuate. If the user is moving fast, the bumping force is not distinct.
- `var wall = 2000-3500;`: if the user moves slowly, the user will feel the bumping force, bringing the end effector to the next stripe. If the user is moving fast, the bumping force becomes more distinct.
- changing `kWall` by 300 will give the user distinct feelings.