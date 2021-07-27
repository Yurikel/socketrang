import crypto from 'crypto'

class Boomerang {
  constructor(speed = 30) {
    this.id = crypto.randomBytes(8).toString("hex");
    this.skin = '🌀';
    this.isShot = false;
    this.hasHit = false;
    this.speed = speed;
  }

  shoot(posX, posY) {
    this.isShot = true;
    this.hasHit = false;
    this.positionX = posX;
    this.positionY = posY;
  }

  moveLeft() {
    this.positionX -= this.speed * 0.01;
  }

  moveRight() {
    this.positionX += this.speed * 0.01;
  }

  return() {
    this.isShot = false;
    this.hasHit = false;
  }
}

export default Boomerang;
