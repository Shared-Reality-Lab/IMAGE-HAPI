byte incomingByte;
boolean state = 0;
int counter = 0;
void setup() {
  SerialUSB.begin(0);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  
    counter++;
    incomingByte = SerialUSB.read();
    SerialUSB.print(counter);
    if(counter >=100){
      counter =0;
    }
    delay(2);
    //digitalWrite(LED_BUILTIN, state);
    

}
