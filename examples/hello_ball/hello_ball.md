| variable | Description | How to get |
| ----------- | ----------- | ----------- |
posEE | position of the end effector | read from device
posEELast | last position of the end effector | when a new contact is made, posEELast=posEE
velEE | velocity of the end effector | posEE-posEELast/dt
posBall | position of the ball | given
velBall | velocity of the ball | <ul><li>initial: -velEE</li><li>update: (fBall/mBall)*dt+velBall</li></ul>
posEEToBall | displacement between EE and ball | posBall-posEE
posEEToBallMagnitude | distance between EE and ball | pythagorean theorem
velEEToBall | velocity of EE relvative of the ball | fContact*((velBall-velEE)⋅fContact) (keeps in the vellEEToBall variable how much of the force vector (fContact) is applied in the direction of the motion vector (velEEToBall).)
velEEToBallMagnitude | length of velEEToBall vector | pythagorean theorem
rEE | radius of EE | given
rBall | radius of ball | given
mBall | mass of ball | given
kBall | moment of ball (N*m) | given
bBall | damping coefficient of ball | given
penBall | the distance between the surface of the ball and the surface of end effector (penBall < 0 means ball and EE contact)| posEEToBallMagnitude - (rBall + rEE)
bAir | damping factor of the air (it is negative because it acts in the opposite way of the movement, since it is resistance.) | given
fGravity | gravitational force on the ball | 9.8*mBall
dt | time of movement | given
fEE | Total force of EE = force of contact that ball applied on EE |  -fContact
fBall | Total force on the ball | fContact + fGravity + fDamping
fContact | force of contact that EE applied on the ball | <ul><li>turn posEEToBall into a unit vector, which is going to be the base to kind of build the force to apply</li><li>(-kBall1 * penBall1) - (bBall1 * velEEToBall1Magnitude)</li></ul>
fDamping | damping force on the ball (A damping force is a force used to slow down or stop a motion, it is like resistance to movement) | velBall*(-bAir) (it acts in the opposite way of the movement, since it is resistance.)
fWall | force on ball from walls | -kWall*penWall + -bWall*velBall
bWall | damping factor of the air | assigned
penWall | distance between ball surface to lefe, right, buttom of wall | different depending on part of wall
posWallLeft | left boundary of wall | assigned
posWallRight | right boundary of wall | assigned
posWallBottom | bottom boundary of wall | assigned

