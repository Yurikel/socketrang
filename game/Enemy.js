import crypto from 'crypto'

class Enemy {
  constructor(game) {
    this.id = crypto.randomBytes(8).toString("hex");
    this.game = game;
    this.birth();
  }

  birth() {
    this.getStats();
    this.speed = Math.floor(Math.random() * 6) + 2; // moves per second
    this.score = this.speed;
  }

  getStats() {
    this.positionY = Math.floor(this.game.trackHeight * Math.random());
    this.positionX = this.game.trackLength - 1;
    this.generateSkin();
  }

  generateSkin() {
    const skins = ['👾', '👹', '👻', '👽', '👿', '💩', '🤡', '🤺', '🧛', '🧟', '🎃'];
    this.skin = skins[Math.floor(Math.random() * skins.length)];
  }

  moveLeft() {
    this.positionX -= this.speed * 0.01;
  }

  rebirth() {
    this.id = crypto.randomBytes(8).toString("hex");
    this.getStats();
    this.speed += Math.floor(this.game.totalScore / 1000);
    // this.score = this.speed;
  }
}

export default Enemy;
