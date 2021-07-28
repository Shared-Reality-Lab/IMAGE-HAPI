
void setup() {
  SerialUSB.begin(9600);
}

void loop() {
  SerialUSB.write(25);
  delay(1);
}
