const socket = io()
let drawnOnce = false


function drawBattlefield(dataPackage) {

  const wrapper = document.createElement('div')

  const titleRow = document.createElement('div')
  titleRow.classList.add('title')
  wrapper.append(titleRow)

  const battlefield = document.createElement('div')
  battlefield.classList.add('battlefield')
  wrapper.append(battlefield)

  for (let y = 0; y < dataPackage.trackHeight; y++) {
    const row = document.createElement('div')
    for (let x = 0; x < dataPackage.trackLength; x++) {
      const cell = document.createElement('div')
      cell.classList.add('cell')
      cell.classList.add('cellnormal')
      row.append(cell)
    }
    row.classList.add('row')
    battlefield.append(row)
  }

  const messageRow = document.createElement('div')
  messageRow.classList.add('message')
  wrapper.append(messageRow)

  wrapper.classList.add('wrapper')
  document.querySelector('.wrapper').replaceWith(wrapper)

  drawnOnce = true;

}

function drawHeroes(dataPackage) {
  dataPackage.heroes.forEach(hero => {

    let heroCell = document.getElementById(`${hero.id}`)
    if (!heroCell) {
      const heroCell = document.createElement('div')
      heroCell.id = hero.id
      heroCell.classList.add('absolute')
      heroCell.classList.add('hero')
      heroCell.style.zIndex = "1";
      document.querySelector('.battlefield').append(heroCell)
    }
    heroCell = document.getElementById(`${hero.id}`)
    const x = Math.floor((hero.positionX / dataPackage.trackLength) * 100)
    const y = Math.floor((hero.positionY / dataPackage.trackHeight) * 100)
    heroCell.style.left = `${x}%`
    heroCell.style.top = `${y}%`
    heroCell.innerText = hero.skin

  })
}

function drawWeapons(dataPackage) {
  dataPackage.heroes.forEach(hero => {

    let weaponCell = document.getElementById(`${hero.boomerang.id}`)
    if (!weaponCell) {
      const weaponCell = document.createElement('div')
      weaponCell.id = hero.boomerang.id
      weaponCell.classList.add('absolute')
      weaponCell.classList.add('boomerang')
      document.querySelector('.battlefield').append(weaponCell)
    }
    weaponCell = document.getElementById(`${hero.boomerang.id}`)
    const x = Math.floor((hero.boomerang.positionX / dataPackage.trackLength) * 100)
    const y = Math.floor((hero.boomerang.positionY / dataPackage.trackHeight) * 100)
    weaponCell.style.left = `${x}%`
    weaponCell.style.top = `${y}%`

    if (x > 100 || x < 0 || y > 100 || y < 0) {
      weaponCell.innerText = '';
    } else {
      weaponCell.innerText = hero.boomerang.skin
    }
  
  })
}

function drawEnemies(dataPackage) {

  dataPackage.enemies.forEach(enemy => {

    let enemyCell = document.getElementById(`${enemy.id}`)
    if (!enemyCell) {
      const enemyCell = document.createElement('div')
      enemyCell.id = enemy.id
      enemyCell.classList.add('absolute')
      enemyCell.classList.add('enemy')
      document.querySelector('.battlefield').append(enemyCell)
    }
    enemyCell = document.getElementById(`${enemy.id}`)
    const x = Math.floor((enemy.positionX / dataPackage.trackLength) * 100)
    const y = Math.floor((enemy.positionY / dataPackage.trackHeight) * 100)
    enemyCell.style.left = `${x}%`
    enemyCell.style.top = `${y}%`

    enemyCell.innerText = enemy.skin
  
  })

}

function clearCorpses(dataPackage) {
  const enemyList = document.querySelectorAll('.enemy')
  enemyList.forEach(enemyDiv => {
    if (!dataPackage.enemies.map(enemy => enemy.id).includes(enemyDiv.id)) {
      enemyDiv.remove()
    }
  })
  const heroList = document.querySelectorAll('.hero')
  heroList.forEach(heroDiv => {
    if (!dataPackage.heroes.map(hero => hero.id).includes(heroDiv.id)) {
      heroDiv.remove()
    }
  })

}

function drawTitle(dataPackage) {
  document.querySelector('.title').innerText = `Current score: ${dataPackage.score}`
}

function drawMessage(message) {
  document.querySelector('.message').innerText = message
}


document.addEventListener("keydown", event => {
  // console.log(event.keyCode)
  if (event.keyCode === 87 || event.keyCode === 38) {
    socket.emit('keyup')
  } else if (event.keyCode === 65 || event.keyCode === 37) {
    socket.emit('keyleft')
  } else if (event.keyCode === 68 || event.keyCode === 39) {
    socket.emit('keyright')
  } else if (event.keyCode === 83 || event.keyCode === 40) {
    socket.emit('keydown')
  } else if (event.keyCode === 32) {
    socket.emit('shoot')
  } 
});

socket.on('player:queue', (id, waitTime, queueLength, numberOfPlayers) => {
  const string = `Your ID: <b>${id}</b><br>Average wait timer: ${waitTime} seconds, players ${queueLength} of ${numberOfPlayers}`
  // console.log(string)
  document.querySelector('.title').innerHTML = string
})

socket.on('update', dataPackage => {
  if (!drawnOnce) {
    drawBattlefield(dataPackage)
  }
  drawEnemies(dataPackage)
  drawWeapons(dataPackage)
  drawHeroes(dataPackage)
  drawTitle(dataPackage)
  clearCorpses(dataPackage)

  dataPackage.heroes.forEach(hero => {
    const boomerangDiv = document.getElementById(`${hero.boomerang.id}`);
    hero.boomerang.isShot ? boomerangDiv.hidden = false : boomerangDiv.hidden = true 
  })

})

socket.on('message', message => {
  if (drawnOnce) {
    drawMessage(message)
  }
})

socket.on('levelup', () => {
  const cells = document.querySelectorAll('.cell')
  cells.forEach(cell => {
    cell.classList.toggle('cellup')
    cell.classList.toggle('cellnormal')
    setTimeout(() => {
      cell.classList.toggle('cellup')
      cell.classList.toggle('cellnormal')
    }, 2000)
  })
})

socket.on('gameover', () => {
  const cells = document.querySelectorAll('.cell')
  cells.forEach(cell => {
    cell.classList.remove('cellup')
    cell.classList.remove('cellnormal')
    cell.classList.add('cellred')
  })
})

window.addEventListener('beforeunload', (event) => {
  event.preventDefault();
  socket.emit('disconnect')
});
