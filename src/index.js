import express from 'express';
import expressWs from 'express-ws';

const app = express();
const wss = expressWs(app).getWss();

const config = [
  {
    "repository": "git@github.com:test/some-private-repo.git",
    "branch": "master",
    "path": "path/to/swagger.yml"
  },
]



app.post('/api/webhooks/github', express.json(), (request, response) => {
  response.send(request.body);
  console.log(JSON.stringify(request.body));
})

app.ws('/ws', (ws, request) => {

});

app.use((error, request, response, next) => {
  response.status(error.status);
  response.json({message: error.message})
})

app.listen(process.env.PORT || 5000);