# Example

This folder contains the exploratory example named `hello_image`.

## What will you experience?

The sections and objects of the following image are shown and the user can interact with them. The sections are shown one by one, it is differentiable from the surrounding space because it has damping texture (like in the `hello_jelly` demo). The objects are presented like filled static circles the user can feel and go around.

The following buttons are included in the example:
- **Stop/Apply force:** turn on/off all the forces on the device, this is already implemented in other examples.
- **Remove/Show objects:** turn on/off the forces produced by the objects. If it is off, you would not be able to feel or see them and when on, the objects are present as red colored circles that can be felt with the end effector.
- **Remove/Show segments:** turn on/off the forces produced by the current segment. If it is off, you would not be able to feel anything and when on, the segment is present as a purple colored region with damping, so when the end effector goes inside, it is harder to move around.
- **Next segment:** since the segments are presented one at a time, with this button you can change to the next one.

## Contents

### Test.HTML

This is the code for the web page that will contain the embedded example.

### hello_image.js

The main script, which is embedded in the HTML file. It contains the code for initializing the worker, creating the graphics and updating them according to the information sent by the worker.

### hello_image_worker.js

The web worker, which communicates with the main script by sending and receiving messages with data on them.

It contains the control loop code, where all the forces for the haptic device are computed for every instant according to the parameters set in the beginning of the script.