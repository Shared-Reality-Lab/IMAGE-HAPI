
class Pantograph //extends Mechanisms
{

    
    constructor(){
        this.l = 0.07;
        this.L = 0.09;
        this.d = 0.0;
      
    // l;
    // L;
    // d;
	
    this.th1 = 0;
    this.th2 = 0;
    this.tau1 = 0;
    this.tau2 = 0;
    this.f_x = 0;
    this.f_y = 0;
    this.x_E = 0;
    this.y_E = 0;
	
	this.pi = 3.14159265359;
    this.JT11 = 0;
    this.JT12 = 0;
    this.JT21 = 0;
    this.JT22 = 0;
    this.gain = 1.0;      
    }

    torqueCalculation(force){
        this.f_x = force[0];
		this.f_y = force[1];

    
        this.tau1 = this.JT11*this.f_x + this.JT12*this.f_y;
		this.tau2 = this.JT21*this.f_x + this.JT22*this.f_y;
		
		this.tau1 = this.tau1*this.gain;
		this.tau2 = this.tau2*this.gain;
    }

    forwardKinematics(angles){
        let l1 = this.l;
    let l2 = this.l;
    let L1 = this.L;
    let L2 = this.L;
    
    this.th1 = this.pi/180*angles[0];
    this.th2 = this.pi/180*angles[1];

    // Forward Kinematics
    let c1 = parseFloat(Math.cos(this.th1));
    let c2 = parseFloat(Math.cos(this.th2));
    let s1 = parseFloat(Math.sin(this.th1));
    let s2 = parseFloat(Math.sin(this.th2));
    let xA = l1*c1;
    let yA = l1*s1;
    let xB = this.d+l2*c2;
     
    let yB = l2*s2;
    let hx = xB-xA; 
    let hy = yB-yA; 
    let hh = parseFloat( Math.pow(hx,2) +  Math.pow(hy,2)); 
    let hm =parseFloat(Math.sqrt(hh)); 
    let cB = - (parseFloat(Math.pow(L2,2) - parseFloat(Math.pow(L1,2) - hh) / (2*L1*hm))); 
    
    let h1x = L1*cB * hx/hm; 
    let h1y = L1*cB * hy/hm; 
    let h1h1 = parseFloat(Math.pow(h1x,2)) + parseFloat(Math.pow(h1y,2)); 
    let h1m = parseFloat(Math.sqrt(h1h1)); 
    let sB = parseFloat(Math.sqrt(1-Math.pow(cB,2)));  
     
    let lx = -L1*sB*h1y/h1m; 
    let ly = L1*sB*h1x/h1m; 
    
    let x_P = xA + h1x + lx; 
    let y_P = yA + h1y + ly; 
     
    let phi1 = parseFloat(Math.acos((x_P-l1*c1)/L1));
    let phi2 = parseFloat(Math.acos((x_P-this.d-l2*c2)/L2));
     
    let c11 = parseFloat(Math.cos(phi1)); 
    let s11 =parseFloat(Math.sin(phi1)); 
    let c22= parseFloat(Math.cos(phi2)); 
    let s22 = parseFloat(Math.sin(phi2)); 
  
    let dn = L1 *(c11 * s22 - c22 * s11); 
    let eta = (-L1 * c11 * s22 + L1 * c22 * s11 - c1 * l1 * s22 + c22 * l1 * s1)  / dn;
    let nu = l2 * (c2 * s22 - c22 * s2)/dn;
    
    this.JT11 = -L1 * eta * s11 - L1 * s11 - l1 * s1;
    this.JT12 = L1 * c11 * eta + L1 * c11 + c1 * l1;
    this.JT21 = -L1 * s11 * nu;
    this.JT22 = L1 * c11 * nu;

    this.x_E = x_P;
    this.y_E = y_P;   
    
    }

    forceCalculation(){
	}
	
	
	positionControl(){
	}
	
	
	inverseKinematics(){
	}
	
	
	set_mechanism_parameters(parameters){
		this.l = parameters[0];
		this.L = parameters[1];
		this.d = parameters[2];
	}
	
	
	set_sensor_data(data){
	}
	
	
	get_coordinate(){
		let temp = [this.x_E, this.y_E];
		return temp;
	}
	
	
	get_torque(){
		let temp = [this.tau1, this.tau2];
		return temp;
	}
	
	
	get_angle(){
		let temp = [this.th1, this.th2];
		return temp;
	}


}
// /**
//  **********************************************************************************************************************
//  * @file       Mechanisms.java
//  * @author     Steve Ding, Colin Gallacher
//  * @version    V2.0.0
//  * @date       19-September-2018
//  * @brief      Mechanisms abstract class designed for use as a template. 
//  **********************************************************************************************************************
//  * @attention
//  *
//  *
//  **********************************************************************************************************************
//  */


// class Mechanisms{
		

// 	forwardKinematics(angles);
	

// 	torqueCalculation(forces);


//   /**
//    * Performs force calculations
//    */
// 	forceCalculation();
	

//   /**
//    * Performs calculations for position control
//    */
// 	positionControl();
	

//   /**
//    * Performs inverse kinematics calculations
//    */
// 	inverseKinematics();
	
	

// 	set_mechanism_parameters(parameters);
	

// 	set_sensor_data(data);
	
	
//   /**
//    * @return   end-effector coordinate position
//    */
// 	get_coordinate();

	
//   /**
//    * @return   torque values from physics calculations
//    */	
// 	get_torque();
	

//   /**
//    * @return   angle values from physics calculations
//    */
// 	get_angle();
	

// }

// class Pantograph //extends Mechanisms
// {

    
//     constructor(){
//         this.l = 0.07;
//         this.L = 0.09;
//         this.d = 0.0;
      
//     // l;
//     // L;
//     // d;
	
//     this.th1 = 0;
//     this.th2 = 0;
//     this.tau1 = 0;
//     this.tau2 = 0;
//     this.f_x = 0;
//     this.f_y = 0;
//     this.x_E = 0;
//     this.y_E = 0;
	
// 	this.pi = 3.14159265359;
//     this.JT11 = 0;
//     this.JT12 = 0;
//     this.JT21 = 0;
//     this.JT22 = 0;
//     this.gain = 1.0;      
//     }

//     torqueCalculation(force){
//         this.f_x = force[0];
// 		this.f_y = force[1];

    
//         this.tau1 = this.JT11*this.f_x + this.JT12*this.f_y;
// 		this.tau2 = this.JT21*this.f_x + this.JT22*this.f_y;
		
// 		this.tau1 = this.tau1*this.gain;
// 		this.tau2 = this.tau2*this.gain;
//     }

//     forwardKinematics(angles){
//         let l1 = this.l;
//     let l2 = this.l;
//     let L1 = this.L;
//     let L2 = this.L;
    
//     this.th1 = this.pi/180*angles[0];
//     this.th2 = this.pi/180*angles[1];

//     // Forward Kinematics
//     let c1 = parseFloat(Math.cos(this.th1));
//     let c2 = parseFloat(Math.cos(this.th2));
//     let s1 = parseFloat(Math.sin(this.th1));
//     let s2 = parseFloat(Math.sin(this.th2));
//     let xA = l1*c1;
//     let yA = l1*s1;
//     let xB = this.d+l2*c2;
     
//     let yB = l2*s2;
//     let hx = xB-xA; 
//     let hy = yB-yA; 
//     let hh = parseFloat( Math.pow(hx,2) +  Math.pow(hy,2)); 
//     let hm =parseFloat(Math.sqrt(hh)); 
//     let cB = - (parseFloat(Math.pow(L2,2) - parseFloat(Math.pow(L1,2) - hh) / (2*L1*hm))); 
    
//     let h1x = L1*cB * hx/hm; 
//     let h1y = L1*cB * hy/hm; 
//     let h1h1 = parseFloat(Math.pow(h1x,2)) + parseFloat(Math.pow(h1y,2)); 
//     let h1m = parseFloat(Math.sqrt(h1h1)); 
//     let sB = parseFloat(Math.sqrt(1-Math.pow(cB,2)));  
     
//     let lx = -L1*sB*h1y/h1m; 
//     let ly = L1*sB*h1x/h1m; 
    
//     let x_P = xA + h1x + lx; 
//     let y_P = yA + h1y + ly; 
     
//     let phi1 = parseFloat(Math.acos((x_P-l1*c1)/L1));
//     let phi2 = parseFloat(Math.acos((x_P-this.d-l2*c2)/L2));
     
//     let c11 = parseFloat(Math.cos(phi1)); 
//     let s11 =parseFloat(Math.sin(phi1)); 
//     let c22= parseFloat(Math.cos(phi2)); 
//     let s22 = parseFloat(Math.sin(phi2)); 
  
//     let dn = L1 *(c11 * s22 - c22 * s11); 
//     let eta = (-L1 * c11 * s22 + L1 * c22 * s11 - c1 * l1 * s22 + c22 * l1 * s1)  / dn;
//     let nu = l2 * (c2 * s22 - c22 * s2)/dn;
    
//     this.JT11 = -L1 * eta * s11 - L1 * s11 - l1 * s1;
//     this.JT12 = L1 * c11 * eta + L1 * c11 + c1 * l1;
//     this.JT21 = -L1 * s11 * nu;
//     this.JT22 = L1 * c11 * nu;

//     this.x_E = x_P;
//     this.y_E = y_P;   
    
//     }

//     forceCalculation(){
// 	}
	
	
// 	positionControl(){
// 	}
	
	
// 	inverseKinematics(){
// 	}
	
	
// 	set_mechanism_parameters(parameters){
// 		this.l = parameters[0];
// 		this.L = parameters[1];
// 		this.d = parameters[2];
// 	}
	
	
// 	set_sensor_data(data){
// 	}
	
	
// 	get_coordinate(){
// 		let temp = [this.x_E, this.y_E];
// 		return temp;
// 	}
	
	
// 	get_torque(){
// 		let temp = [this.tau1, this.tau2];
// 		return temp;
// 	}
	
	
// 	get_angle(){
// 		let temp = [this.th1, this.th2];
// 		return temp;
// 	}


// }