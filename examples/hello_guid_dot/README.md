# Example

This folder contains the guidance example named `hello_guid_dot`.

## What will you experience?

The end effector is drawn towards a generated random point in the work area.

The user feels force depending on the position of the end effector (EE) in the workspace. The greater the distance between the point and the EE, the greater the force that the user feels towards it.

## Contents

### Test.HTML

This is the code for the web page that will contain the embedded example.

### hello_guid_dot.js

The main script, which is embedded in the HTML file. It contains the code for initializing the worker, creating the graphics and updating them according to the information sent by the worker.

### hello_guid_dot_worker.js

The web worker, which communicates with the main script by sending and receiving messages with data on them.

It contains the control loop code, where all the forces for the haptic device are computed for every instant according to the parameters set in the beginning of the script.
