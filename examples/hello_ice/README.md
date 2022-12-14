# Example

This folder contains the exploratory example named `hello_ice`.

## What will you experience?

There is a line that goes through the work area, which sets up two sections.

Each section has a different viscosity/damping; the user can feel it by moving the end effector through the workspace. The damping is **negative**, so the device follows the movements of the user, making it easier to move around and creating a sensation of sliding through the surface.

The left section has no force and the right one shows the effect with 1.2 negative damping.

## Contents

### Test.HTML

This is the code for the web page that will contain the embedded example.

### hello_ice.js

The main script, which is embedded in the HTML file. It contains the code for initializing the worker, creating the graphics and updating them according to the information sent by the worker.

### hello_ice_worker.js

The web worker, which communicates with the main script by sending and receiving messages with data on them.

It contains the control loop code, where all the forces for the haptic device are computed for every instant according to the parameters set in the beginning of the script.
