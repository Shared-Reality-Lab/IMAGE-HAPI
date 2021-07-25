class Pantograph extends Mechanisms{
    l;
    L;
    d;
	
    th1;
    th2;
    tau1;
    tau2;
    f_x;
    f_y;
    x_E;
    y_E;
	
	pi = 3.14159265359;
    JT11;
    JT12;
    JT21;
    JT22;
    gain = 1.0;
    
    constructor(){
        this.l = 0.07;
        this.L = 0.09;
        this.d = 0.0;
    }

    torqueCalculation(force){
        f_x = force[0];
		f_y = force[1];

    
        tau1 = JT11*f_x + JT12*f_y;
		tau2 = JT21*f_x + JT22*f_y;
		
		tau1 = tau1*gain;
		tau2 = tau2*gain;
    }

    forwardKinematics(angles){
        let l1 = l;
    let l2 = l;
    let L1 = L;
    let L2 = L;
    
    th1 = pi/180*angles[0];
    th2 = pi/180*angles[1];

    // Forward Kinematics
    let c1 = (float)cos(th1);
    let c2 = (float)cos(th2);
    let s1 = (float)sin(th1);
    let s2 = (float)sin(th2);
    let xA = l1*c1;
    let yA = l1*s1;
    let xB = d+l2*c2;
     
    let yB = l2*s2;
    let hx = xB-xA; 
    let hy = yB-yA; 
    let hh = (float) pow(hx,2) + (let) pow(hy,2); 
    let hm = (float)sqrt(hh); 
    let cB = - ((float) pow(L2,2) - (let) pow(L1,2) - hh) / (2*L1*hm); 
    
    let h1x = L1*cB * hx/hm; 
    let h1y = L1*cB * hy/hm; 
    let h1h1 = (float) pow(h1x,2) + (let) pow(h1y,2); 
    let h1m = (float) sqrt(h1h1); 
    let sB = (float) sqrt(1-pow(cB,2));  
     
    let lx = -L1*sB*h1y/h1m; 
    let ly = L1*sB*h1x/h1m; 
    
    let x_P = xA + h1x + lx; 
    let y_P = yA + h1y + ly; 
     
    let phi1 = (float)acos((x_P-l1*c1)/L1);
    let phi2 = (float)acos((x_P-d-l2*c2)/L2);
     
    let c11 = (float) cos(phi1); 
    let s11 =(float) sin(phi1); 
    let c22= (float) cos(phi2); 
    let s22 = (float) sin(phi2); 
  
    let dn = L1 *(c11 * s22 - c22 * s11); 
    let eta = (-L1 * c11 * s22 + L1 * c22 * s11 - c1 * l1 * s22 + c22 * l1 * s1)  / dn;
    let nu = l2 * (c2 * s22 - c22 * s2)/dn;
    
    JT11 = -L1 * eta * s11 - L1 * s11 - l1 * s1;
    JT12 = L1 * c11 * eta + L1 * c11 + c1 * l1;
    JT21 = -L1 * s11 * nu;
    JT22 = L1 * c11 * nu;

    x_E = x_P;
    y_E = y_P;    
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
		let temp = [x_E, y_E];
		return temp;
	}
	
	
	get_torque(){
		let temp = [tau1, tau2];
		return temp;
	}
	
	
	get_angle(){
		let temp = [th1, th2];
		return temp;
	}


}