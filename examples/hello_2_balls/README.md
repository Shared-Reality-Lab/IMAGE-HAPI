# Example

This folder contains the exploratory example named `hello_2_balls`.

## What will you experience?

There are two balls constrained by four walls.
The balls have different weights, sizes and are in an environment with gravity.

The end effector only interacts with the balls; the user can feel their weight, the gravity force and the force applied by the walls in the balls.

## Contents

### Test.HTML

This is the code for the web page that will contain the embedded example.

### hello_2_balls.js

The main script, which is embedded in the HTML file. It contains the code for initializing the worker, creating the graphics and updating them according to the information sent by the worker.

### hello_2_balls_worker.js

The web worker, which communicates with the main script by sending and receiving messages with data on them.

It contains the control loop code, where all the forces for the haptic device are computed for every instant according to the parameters set in the beginning of the script.
