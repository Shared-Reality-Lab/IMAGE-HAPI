| variable | Description | How to get |
| ----------- | ----------- | ----------- |
posEE | position of EE | read from device
posEELast | last position of EE | when a new contact is made, posEELast=posEE
velEE | velocity of EE | posEE-posEELast/dt
posEEToDot | the displacement between EE and the closet dot | <ul><li>posEE.x % distBtwnCols</li><li>posEE.y % distBtwnRows</li></ul> 
posEEToDotMagnitude | the distance between EE and the closet dot | velEEToDot.mag()
velEEToDot | velocity of EE relative to the cloest dot | -velEEDot 
velEEToDotMagnitude | length of the velocity vector of EE relative to the cloest dot| velEEToDot.mag()
dt | time of movement | given
bAir | damping coefficient of the air | given
rEE | radius of EE | given
fEE | force on EE | -fDot+fDamping
fDamping | damping force on EE | velEE*(-bAir)
fDot | force on the closet dot | <ul><li>Turn posEEToDot into a unit vector (decide the direction)</li><li>fDot*((-kDot*penDot)-(bDot*velEEToDotMagnitude))</li></ul>
kDot | moment of dot (N*m) | given
bDot | damping coefficient of dot | given
penDot | distance between closet dot and EE | posEEToDotMagnitude - (rDot + rEE)
rDot | radius of dot | given
distBtwnRows | distance rows | given
distBtwnCols | distance cols | given
start | start of dots pattern | given
end | end of dots pattern | given
edgeMargin | allows to execute the if condition at 10% more of the dotted area, pervent the case that dots are at the boundary of dots pattern | given