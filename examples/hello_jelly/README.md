# Example

This folder contains the exploratory example named `hello_jelly`.

## What will you experience?

There is a line that goes through the work area, which sets up two sections.

Each section has a different viscosity/damping; the user can feel it by moving the end effector through the workspace.

The left section has level 1 damping and the right one has level 4.

## Contents

### Test.HTML

This is the code for the web page that will contain the embedded example.

### hello_jelly.js

The main script, which is embedded in the HTML file. It contains the code for initializing the worker, creating the graphics and updating them according to the information sent by the worker.

### hello_jelly_worker.js

The web worker, which communicates with the main script by sending and receiving messages with data on them.

It contains the control loop code, where all the forces for the haptic device are computed for every instant according to the parameters set in the beginning of the script.

## Range
```
var bTopLeft = 0.6-1.8; 
var bTopRight = 0.6-1.8; 
var bBotLeft = 0.6-1.8; 
var bBotRight = 0.6-1.8;
```
All parameters above can vary in the `0.6-1.8` range to experience a "jelly" feeling; the more significant the difference between the right and left parameters, the more viscosity the user can feel.
- `0.6-1.0`: The user will have a different feeling than moving on normal texture, but this feeling is not apparent.
- `1.0-1.4`: The user will find moving more challenging than the first level, and the feeling is apparent.
- `1.0-1.8`: The user will find moving more challenging than the first level, and the feeling is apparent.
- changing `bTopLeft` or `bTopRight` or `bBotLeft` or `bBotRight` by around 0.3 will give the user distinct feelings.
