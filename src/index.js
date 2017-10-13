import express from 'express';
import dotenv from 'dotenv';
import uuid from 'uuid';

import GitHubWebhook, { VALID_WEBHOOK } from './GitHubWebhook';
import GitHubWebhookValidator from './GitHubWebHookValidator';
import GitRepository from './GitRepository';
import SwaggerHubIntegratorJob from './SwaggerHubIntegratorJob';
import SwaggerCombiner from './SwaggerCombiner';
import SwaggerHubClient from './SwaggerHubClient';

dotenv.config();

const app = express();
const router = express.Router();

const apis = [
  {
    name: 'topcoder API v3',
    repositories: [
      {
        sshUrl: 'git@github.com:appirio-tech/tc1-api-core.git',
        branch: 'devx', //no swagger in master
        path: 'tech.core/tech.core.service.identity/doc/swagger.yaml',
      },
      {
        sshUrl: 'git@github.com:appirio-tech/ap-challenge-microservice.git',
        branch: 'master',
        path: 'swagger.yaml',
      },
      {
        sshUrl: 'git@github.com:appirio-tech/tc-direct-project-service.git',
        branch: 'master',
        path: 'swagger.yaml',
      },
      {
        sshUrl: 'git@github.com:appirio-tech/ap-review-microservice.git',
        branch: 'master',
        path: 'swagger.yaml',
      },
      {
        sshUrl: 'git@github.com:appirio-tech/ap-submission-microservice.git',
        branch: 'master',
        path: 'service/swagger.yaml',
      },
      {
        sshUrl: 'git@github.com:appirio-tech/tc-tags-service.git',
        branch: 'master',
        path: 'swagger.yaml', //wrong path
      },
      {
        sshUrl: 'git@github.com:appirio-tech/ap-member-microservice.git',
        branch: 'master',
        path: 'swagger.yaml',
      },
      {
        sshUrl: 'git@github.com:appirio-tech/tc-preferences-service.git',
        branch: 'master',
        path: 'swagger.yaml',
      },

      {
        sshUrl: 'git@github.com:topcoder-platform/tc-billing-account-service.git',
        branch: 'master',
        path: 'swagger.yaml',
      },
      {
        sshUrl: 'git@github.com:appirio-tech/ap-file-microservice.git',
        branch: 'dev', // no swagger in master
        path: 'swagger.yaml',
      },
      // {
      //   url: 'git@github.com:appirio-tech/ap-member-cert-microservice.git',
      //   branch: 'master',
      //   path: 'service/src/main/java/com/appirio/service/membercert/resources', //no swagger
      // },
      // {
      //   url: 'git@github.com:appirio-tech/ap-notification-service.git', //no repo
      //   branch: 'master',
      //   path: 'src/main/java/com/appirio/notificationservice/resources',
      // },
      {
        sshUrl: 'git@github.com:appirio-tech/ap-alert-microservice.git',
        branch: 'dev', // no swagger in master
        path: 'swagger.json',
      },
      // {
      //   sshUrl: 'git@github.com:appirio-tech/ap-event-sample-service.git',
      //   branch: 'master',
      //   path: 'src/main/java/com/appirio/event/sample/resources' // no swagger
      // },
    ]
  }
]


const combiner = new SwaggerCombiner('topcoder API', '1.0.0');
const swaggerHubClient = new SwaggerHubClient(process.env.SWAGGER_HUB_API_HOST, process.env.SWAGGER_HUB_API_SECRET);



const allRepositories = apis.reduce((accumulator, api) => {
  accumulator.concat(api.repositories)
  return accumulator;
}, [])

const githubWebhookValidator = new GitHubWebhookValidator(process.env.GITHUB_WEBHOOK_SECRET, ['push'], allRepositories);
const gitHubWebhook = new GitHubWebhook(githubWebhookValidator);

apis
  .filter(api => api.repositories.some(repository => repository.sshUrl === 'git@github.com:appirio-tech/ap-alert-microservice.git'))
  .forEach(api => {
    const job = new SwaggerHubIntegratorJob(uuid.v1(), 'tmp', process.env.GITHUB_PUBLIC_KEY, process.env.GITHUB_PRIVATE_KEY, api.repositories, combiner, swaggerHubClient, process.env.SWAGGER_HUB_OWNER, process.env.SWAGGER_HUB_API);

    job.run();
  })

gitHubWebhook.on(VALID_WEBHOOK, (data) => {

  apis
    .filter(api => api.repositories.some(repository => repository.sshUrl === data.repository.ssh_url))
    .forEach(api => {
      const job = new SwaggerHubIntegratorJob(uuid.v1(), 'tmp', process.env.GITHUB_PUBLIC_KEY, process.env.GITHUB_PRIVATE_KEY, api.repositories, combiner, swaggerHubClient, process.env.SWAGGER_HUB_OWNER, process.env.SWAGGER_HUB_API);

      job.run();
    })

  // const swaggerDoc = swaggerDocuments.find(swaggerDocument => swaggerDocument.sshUrl === data.repository.ssh_url);
  //
  // const gitRepository = new GitRepository(swaggerDoc.sshUrl, swaggerDoc.branch, process.env.GITHUB_PUBLIC_KEY, process.env.GITHUB_PRIVATE_KEY);
  // gitRepository
  //   .clone()
  //   .then(() => {
  //     return gitRepository
  //       .getFile(swaggerDoc.path)
  //       .then(file => file.getBlob())
  //       .then(blob => {
  //         console.log(blob.toString());
  //       })
  //   })
  //   .catch(e => {
  //     console.log(e);
  //   });
})

router.use('/api/webhooks/github', gitHubWebhook.router);


app.use ('/', router);
app.use((error, request, response, next) => {
  response.status(error.status);
  response.json({message: error.message})
})

app.listen(process.env.PORT || 5000);