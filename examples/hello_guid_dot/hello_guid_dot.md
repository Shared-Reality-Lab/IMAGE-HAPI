| variable | Description | How to get |
| ----------- | ----------- | ----------- |
prevPosEE | previous position of EE | posEE
posEE | position of EE | measured
fCalc | calculated force on EE | using PID controller
fEE | force on EE | fCalc
randy | position of the guide dot | generated randomly
diff | differential error - derivative | errorPosEE/(timedif * 0.001)
error | proportional component | randy-posEE
cumError | integral component | errorPosEE+(errorPosEE * timedif * 0.001)
errorPosEE | derivative component | posEE - prePosEE
error | difference between randy and EE position | randy - posEE
timediff | the time taken to execute the loop once | the time now - oldTime