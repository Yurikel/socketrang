import Boomerang from './Boomerang.js'
import crypto from 'crypto'
class Hero {
  constructor(weaponSpeed) {
    this.id = crypto.randomBytes(8).toString("hex");
    this.weaponSpeed = weaponSpeed;
    this.skin = '🤠';
    this.positionX = 0;
    this.positionY = Math.floor(6 * Math.random());
    this.isDead = false;
    this.boomerang = new Boomerang(this.weaponSpeed);
  }

  moveLeft() {this.positionX -= 1}
  moveRight() {this.positionX += 1}
  moveUp() {this.positionY -= 1}
  moveDown() {this.positionY += 1}

  die() {
    this.skin = '💀';
    this.isDead = true;
  }
}

export default Hero;
