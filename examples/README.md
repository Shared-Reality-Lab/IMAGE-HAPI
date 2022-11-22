# Examples

This folder contains six examples using the JS version of the hAPI (Haply's API) and additional libraries used in them that are not part of the hAPI.

## How to use each example

1. Build the Javascript version to `dist`, running the commands listed in [here](../README.md).
2. Go inside one of the example's folder and run the `Test.HTML` in the browser.
3. Open the console to check for any logs about the behavior of the Haply 2DIY.
4. Connect the Haply 2DIY to the computer.
5. Press the `Press me` button, a window will pop up.
6. Select the correct serial port for the Haply 2DIY (DO NOT connect just yet - ).
7. While holding firmly the Haply 2DIY in its home position, press the `Connect` button in the pop up.
    * Home positions
        * Haply 2DIYv1: fully contracted arms.
        * Haply 2DIYv3: fully extended arms.
8. Now the example is running, be sure to hold the end effector firmly and do not let it go loose.
    * For some examples there is a `Stop force` button, which is to turn off/on the applied force.
9. To stop the example, leave the end effector in a place where there is zero force being applied.
    * For the examples with the `Stop force` button, press it so the delivered force is zero.
10. Stop running the `Test.HTML` in the browser and close the window.

## Types

### Exploratory

The user can freely move the end effector to explore the elements in the work area, and feel force only when interacting with them.

### Guidance

Rather than let the user explore the workspace and move the end effector, the end effector is the one moving the hand of the user.

Guidance examples use a PID controller to give an smooth response and prevent the end effector of delivering too strong forces, oscillations or other abrupt behaviors.
