import express from 'express';
import expressWs from 'express-ws';
import { createHmac } from 'crypto';
import createError from 'http-errors';

const app = express();
const wss = expressWs(app).getWss();

const config = [
  {
    "repository": "git@github.com:test/some-private-repo.git",
    "branch": "master",
    "path": "path/to/swagger.yml"
  },
]

const verifySignature = () => {
  return (request, response, next) => {
    const hmac = createHmac('sha1', process.env.GITHUB_WEBHOOK_SECRET)
      .update(JSON.stringify(request.body))
      .digest('hex');

    if (request.headers['x-hub-signature'] === `sha1=${hmac}`) {
      next();
    } else {
      next(createError(400, new Error('Invalid signature')));
    }
  }
}

const eventFilter = () => {
  return (request, response, next) => {
    if (request.headers['x-github-event'] === 'push') {
      next();
    } else {
      next(createError(400, new Error('Invalid event type')));
    }
  }
}

app.post('/api/webhooks/github', express.json(), verifySignature(), eventFilter(), (request, response) => {
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