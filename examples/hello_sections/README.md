# Example

This folder contains the exploratory example named `hello_sections`.

## What will you experience?

There are two lines that go through the work area, which set up a total of three sections.

The user can feel a _bump_ as the result of the force applied when the end effector crosses the lines, indicating the user has reach another section in the workspace.

## Contents

### Test.HTML

This is the code for the web page that will contain the embedded example.

### hello_sections.js

The main script, which is embedded in the HTML file. It contains the code for initializing the worker, creating the graphics and updating them according to the information sent by the worker.

### hello_sections_worker.js

The web worker, which communicates with the main script by sending and receiving messages with data on them.

It contains the control loop code, where all the forces for the haptic device are computed for every instant according to the parameters set in the beginning of the script.
