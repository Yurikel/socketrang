import Hero from'./Hero.js'
import Enemy from './Enemy.js'
import crypto from 'crypto'

class Game {
  constructor(players) {
    this.initialEnemyCount = 3;
    this.trackLength = 30 // + Math.floor(Math.random() * 6);
    this.trackHeight = 10 // + Math.floor(Math.random() * 3);
    this.totalScore = 0;
    this.weaponSpeed = 40;
    this.levelUpPoints = 50;
    this.fps = 60;
    
    this.players = players;
    this.gameID = crypto.randomBytes(16).toString("hex");
    this.creationTime = new Date();
    this.heroes = Array(this.players.length).fill().map(() => new Hero(this.weaponSpeed));
    this.enemies = Array(this.initialEnemyCount).fill().map(() => new Enemy(this));
    this.gameInterval;
    this.gameOver = false;
  }

  checkHeroesEnemyCollision(hero) {
    this.enemies.forEach(enemy => {
      if (Math.abs(hero.positionX - enemy.positionX) < 0.5 && hero.positionY === enemy.positionY) {
        hero.die();
        this.players[this.heroes.indexOf(hero)].emit('message', 'YOU ARE DEAD!💀')
      }
    });
  }

  checkHeroesWeaponStatus(hero) {

    this.enemies.forEach(enemy => {
      if (enemy.positionX < 0) {
        enemy.rebirth(); // enemy went off-screen
      }
      if (Math.abs(hero.boomerang.positionX - enemy.positionX) < 0.5 && Math.abs(hero.boomerang.positionY - enemy.positionY) < 0.5 && hero.boomerang.isShot) {
        this.totalScore += enemy.score;
        hero.boomerang.hasHit = true;
        enemy.rebirth(); // enemy is killed and being reborn
      }
    });

    if (Math.abs(hero.boomerang.positionX - hero.positionX) < 0.5 && Math.abs(hero.boomerang.positionY - hero.positionY) < 0.5 && hero.boomerang.isShot && hero.boomerang.hasHit) {
      hero.boomerang.return(); // the hero catches his boomerang
    }
    if ((hero.boomerang.positionX < 0 && hero.boomerang.hasHit) || (hero.boomerang.positionX >= this.trackLength - 1)) {
      hero.boomerang.return(); // boomerang returned to the player when it flies off-screen
    }

    if (hero.boomerang.isShot) {
      if (hero.boomerang.hasHit) { // if it's on returning move to the player
        const delta = Math.abs((hero.boomerang.positionY - hero.positionY) / (hero.boomerang.positionX - hero.positionX));
        if (hero.boomerang.positionY > hero.positionY) { // if ahead of the player
          hero.boomerang.positionY - delta > 0 ? hero.boomerang.positionY -= delta : null
        } else {
          hero.boomerang.positionY + delta < this.trackLength ? hero.boomerang.positionY += delta : null
        }
        hero.boomerang.moveLeft();
      } else {
        hero.boomerang.moveRight();
      };
    };

  }

  checkEnemyNumber() {
    if (this.enemies.length < this.initialEnemyCount + Math.floor(this.totalScore / this.levelUpPoints)) {
      this.enemies.push(new Enemy(this));

      this.players.forEach(player => {
        player.emit('message', 'Levelled up! More enemies are approaching!')
        player.emit('levelup')
      })
      this.levelUp = true;
      setTimeout(() => {
        this.levelUp = false;
        this.players.forEach(player => {
          player.emit('message', '')
        })
      }, 3000)
    };
  };

  checkGameOver() {
    if (this.heroes.every(hero => hero.isDead)) {
      this.players.forEach(player => {
          player.emit('gameover')
          setTimeout(() => {
          player.emit('message', 'Game over!')
          clearInterval(player.updateEmitter) //stopping sending data to players
        }, 800)
      })
      setTimeout(() => {
        clearInterval(this.gameInterval); //killing game cycle
        this.gameOver = true;
      }, 1000)
    }
  };

  packData() {
    const enemiesFilteredData = []
    this.enemies.forEach(enemy => {
      enemiesFilteredData.push({
        id: enemy.id,
        skin: enemy.skin,
        // score: enemy.score,
        positionX: enemy.positionX,
        positionY: enemy.positionY,
      })
    });

    const heroesFilteredData = []
    this.heroes.forEach(hero => {
      heroesFilteredData.push({
        id: hero.id,
        skin: hero.skin,
        positionX: hero.positionX,
        positionY: hero.positionY,
        isDead: hero.isDead,
        boomerang: hero.boomerang
      })
    });

    this.dataPackage = {
      gameID: this.gameID,
      timeElapsed: Math.round((Date.now() - this.creationTime) / 1000),
      score: this.totalScore,
      trackLength: this.trackLength,
      trackHeight: this.trackHeight,
      enemies: enemiesFilteredData,
      heroes: this.heroes,
    }
  }

  inputRead() {
    this.players.forEach((player, index) => {
      player.on('keyleft', () => {
        if (this.heroes[index].positionX > 0 && !this.heroes[index].isDead) {
          this.heroes[index].moveLeft();
        }
      })
      player.on('keyright', () => {
        if (this.heroes[index].positionX < this.trackLength - 1  && !this.heroes[index].isDead) {
          this.heroes[index].moveRight();
        }
      })
      player.on('keyup', () => {
        if (this.heroes[index].positionY > 0  && !this.heroes[index].isDead) {
          this.heroes[index].moveUp();
        }
      })
      player.on('keydown', () => {
        if (this.heroes[index].positionY < this.trackHeight - 1  && !this.heroes[index].isDead) {
          this.heroes[index].moveDown();
        }
      })
      player.on('shoot', () => {
        if (!this.heroes[index].boomerang.isShot  && !this.heroes[index].isDead) {
          this.heroes[index].boomerang.shoot(this.heroes[index].positionX, this.heroes[index].positionY)
        }
      })
    })
  }
  
  play() {
    
    this.gameInterval = setInterval(() => {

      this.heroes.forEach(hero => {
        this.checkHeroesEnemyCollision(hero); //checking players being hit by enemies
        this.checkHeroesWeaponStatus(hero); //checking weapons and enemies statuses
      });

      this.enemies.forEach(enemy => enemy.moveLeft());

      this.checkEnemyNumber();
      this.checkGameOver();

      this.packData();

    }, 1000 / this.fps);

    this.inputRead()

  }

}

export default Game;
