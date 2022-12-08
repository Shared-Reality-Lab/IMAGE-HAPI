# Example

This folder contains the exploratory example named `hello_ball`.

## What will you experience?

There is one ball constrained by three walls, the environment has gravity.

The end effector only interacts with the ball; the user can feel its weight, the gravity force and the force applied by the walls in the ball.

## Contents

### Test.HTML

This is the code for the web page that will contain the embedded example.

### hello_ball.js

The main script, which is embedded in the HTML file. It contains the code for initializing the worker, creating the graphics and updating them according to the information sent by the worker.

### hello_ball_worker.js

The web worker, which communicates with the main script by sending and receiving messages with data on them.

It contains the control loop code, where all the forces for the haptic device are computed for every instant according to the parameters set in the beginning of the script.
