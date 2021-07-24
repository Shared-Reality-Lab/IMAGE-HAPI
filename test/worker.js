/**
 * If you're not familiar with TypeScript code, just ignore the `<TYPE>` and `:TYPE` parts.
 */const data = self

   if(data){
        /* GET END-EFFECTOR STATE (TASK SPACE) */
        widgetOne.device_read_data();
      
        angles.set(widgetOne.get_device_angles()); 
        posEE.set(widgetOne.get_device_position(angles.array()));
        posEE.set(device_to_graphics(posEE)); 
        
        velEE.set((posEE.copy().sub(posEELast)).div(dt));
        posEELast = posEE;
        /* haptic physics force calculation */
      
      /* ball and end-effector contact forces */
      posEEToBall = (posBall.copy()).sub(posEE);
      posEEToBallMagnitude = posEEToBall.mag();
      
      penBall = posEEToBallMagnitude - (rBall + rEE);
      /* end ball and end-effector contact forces */
      
      
      /* ball forces */
      if(penBall < 0){
        rEEContact = rEE + penBall;
        fContact = posEEToBall.normalize();
        velEEToBall = velBall.copy().sub(velEE);
        velEEToBall = fContact.copy().mult(velEEToBall.dot(fContact));
        velEEToBallMagnitude = velEEToBall.mag();
        
        /* since penBall is negative kBall must be negative to ensure the force acts along the end-effector to the ball */
        fContact = fContact.mult((-kBall * penBall) - (bBall * velEEToBallMagnitude));
      }
      else{
        rEEContact = rEE;
        fContact.set(0, 0);
      }
      /* end ball forces */
      
      
      /* forces due to damping */
      fDamping = (velBall.copy()).mult(-bAir);
      /* end forces due to damping*/
      
      
      /* forces due to walls on ball */
      fWall.set(0, 0);
      
      /* left wall */
      penWall.set((posBall.x - rBall) - posWallLeft.x, 0);
      if(penWall.x < 0){
        fWall = fWall.add((penWall.mult(-kWall))).add((velBall.copy()).mult(-bWall));
      }
      
      /* bottom wall */
      penWall.set(0, (posBall.y + rBall) - posWallBottom.y);
      if(penWall.y > 0){
        fWall = fWall.add((penWall.mult(-kWall))).add((velBall.copy()).mult(-bWall));
      }
      
      /* right wall */
      penWall.set((posBall.x + rBall) - posWallRight.x, 0);
      if(penWall.x > 0){
        fWall = fWall.add((penWall.mult(-kWall))).add((velBall.copy()).mult(-bWall));
      }
      /* end forces due to walls on ball*/
      
      
      /* sum of forces */
      fBall = (fContact.copy()).add(fGravity).add(fDamping).add(fWall);      
      fEE = (fContact.copy()).mult(-1);
      fEE.set(graphics_to_device(fEE));
      /* end sum of forces */
      
      
      /* end haptic physics force calculation */
    }
    
    /* dynamic state of ball calculation (integrate acceleration of ball) */
    posBall = (((fBall.copy()).div(2*mBall)).mult(dt*dt)).add((velBall.copy()).mult(dt)).add(posBall);
    velBall = (((fBall.copy()).div(mBall)).mult(dt)).add(velBall);
    /*end dynamic state of ball calculation */
    
    
    
    torques.set(widgetOne.set_device_torques(fEE.array()));
    widgetOne.device_write_torques();
    
  
    renderingForce = false;


  
  