import http from 'http';
import express from 'express';
import { Server as socketIOServer } from 'socket.io';
import path from 'path';
import Game from './game/Game.js'


const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(process.argv[1]);

const app = express();
const httpServer = http.createServer(app);
const io = new socketIOServer(httpServer);

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))
// hbs.registerPartials(path.join(__dirname, 'views/partials'))

const users = []
const queue = []
const games = []
let waitTimeAnalyzer = [3]
let numberOfPlayers = 2
let fps = 25

io.on('connection', (user) => {
  const path = new URL(user.handshake.headers.referer).pathname;

  if (path !== '/admin') { //player

    users.push(user)
    queue.push(user)
    console.log(`(+) player joins, id: ${user.id}, total players: ${users.length}`)
    const averageWaitTime = Math.round(waitTimeAnalyzer.reduce((a, v) => a + v, 0) / waitTimeAnalyzer.length)
    queue.forEach(user => {
      user.emit('player:queue', user.id, averageWaitTime, queue.length, numberOfPlayers)
    })
    
    if (queue.length >= numberOfPlayers) {
      const team = queue.splice(0, numberOfPlayers)
      const game = new Game(team)
      team.forEach((user, index) => {
        waitTimeAnalyzer.push(Math.round((Date.now() - user.handshake.issued) / 1000))
        user.gameID = game.gameID
        user.heroIndex = index
        user.updateEmitter = setInterval(() => {
          if (game.dataPackage) {
            user.emit('update', game.dataPackage)
          }
        }, 1000 / fps)
      })
      console.log(`New game started with ${team.length} player(s)!`)
      games.push(game)
      game.play()
    }

    user.on('disconnect', () => {
      games.find(game => game.gameID === user.gameID)?.heroes[user.heroIndex]?.die()
      console.log(`(-) player leaves, id: ${user.id}, total players: ${users.length - 1}`)
      users.splice(users.indexOf(user), 1);
      queue.splice(queue.indexOf(user), 1);
    });

  } else { //admin

    user.on('admin:request', () => {

      let gamesFilteredData = []
      let usersFilteredData = []
      let queueFilteredData = []

      games.forEach(game => gamesFilteredData.push(game.dataPackage));
      users.forEach(user => usersFilteredData.push({ id: user.id }));
      queue.forEach(user => queueFilteredData.push({ id: user.id }));

      const dataPackage = {
        games: gamesFilteredData,
        queue: queueFilteredData,
        users: usersFilteredData,
      }

      user.emit('admin:response', dataPackage)
    })

    user.on('admin:changeplayersnum', (value) => {
      numberOfPlayers = value
      console.log(`Number of players per game changed to ${value}`)
    })

    user.on('admin:getplayersnum', (value) => {
      numberOfPlayers = value
    })
  }
});

app.get('/', (req, res) => {
  res.render('index', {
    script: '/js/application.js',
  });
});

app.get('/admin', (req, res) => {
  res.render('admin', {
    script: '/js/admin.js',
    numberOfPlayers,
  });
});

setInterval(() => {
  games.forEach((game, index) => {
    if (game.gameOver) {
      games.splice(index, 1)
    }
  })
}, 2000)

httpServer.listen(PORT, () => {
    console.log(`Starting server @ port ${PORT}`);
});
