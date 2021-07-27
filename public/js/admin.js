const socket = io();
let trigger = false
let statTemplate, gameTemplate, reqInterval;

function drawMessage(message) {
  document.querySelector('.message').innerText = message
}

function grabCurrentPlayersNumber(message) {
  socket.emit('players:get')
}

document.adminform.addEventListener('submit', (event) => {
  event.preventDefault();

  if (trigger) {
    trigger = false
    clearInterval(reqInterval)
  } else {
    trigger = true
    reqInterval = setInterval(() => {
      socket.emit('admin:request')
    }, 500)
  }
  
})

document.querySelector('#playersnumber').addEventListener('click', (event) => {
  event.preventDefault();

  socket.emit('admin:changeplayersnum', event.target.value)

})

function drawBattlefield(game) {

  const wrapper = document.createElement('div')

  const battlefield = document.createElement('div')
  battlefield.classList.add('battlefield_sm')
  wrapper.append(battlefield)

  for (let y = 0; y < game.trackHeight; y++) {
    const row = document.createElement('div')
    for (let x = 0; x < game.trackLength; x++) {
      const cell = document.createElement('div')
      cell.classList.add('cell_sm')
      row.append(cell)
    }
    row.classList.add('row_sm')
    battlefield.append(row)
  }

  return battlefield

}

socket.on('admin:response', async dataPackage => {
  console.log(dataPackage)

  if (!gameTemplate) {
    const gameHBS = await (await fetch('partials/game.hbs')).text();
    gameTemplate = Handlebars.compile(gameHBS);
  }

  if (!statTemplate) {
    const statHBS = await (await fetch('partials/stats.hbs')).text();
    statTemplate = Handlebars.compile(statHBS);
  }

  document.querySelector('.message').innerHTML = gameTemplate ({
    games: dataPackage.games
  })

  document.querySelector('.techwrapper').innerHTML = statTemplate ({
    games: dataPackage.games.length,
    users: dataPackage.users,
    queue: dataPackage.queue
  })

  dataPackage.games.forEach((game, index) => {
    const gameboard = document.querySelectorAll('.monitor')[index]
    const html = drawBattlefield(game)
    gameboard.append(html)

    // console.log(dataPackage)

    dataPackage.games[index].heroes.forEach(hero => {
      const heroCell = gameboard.querySelectorAll('.row_sm')[hero.positionY].querySelectorAll('.cell_sm')[[hero.positionX]]
      heroCell.innerText = hero.skin
      if (hero.boomerang.positionY >= 0 && hero.boomerang.positionX >= 0) {
        const weaponCell = gameboard.querySelectorAll('.row_sm')[Math.round(hero.boomerang.positionY)].querySelectorAll('.cell_sm')[[Math.round(hero.boomerang.positionX)]]
        weaponCell.innerText = hero.boomerang.skin
      }
    })

    dataPackage.games[index].enemies.forEach(enemy => {
      if (enemy.positionY >= 0 && enemy.positionX >= 0) {
        const cell = gameboard.querySelectorAll('.row_sm')[enemy.positionY].querySelectorAll('.cell_sm')[[Math.round(enemy.positionX)]]
        cell.innerText = enemy.skin
      }
    })

  })

})
