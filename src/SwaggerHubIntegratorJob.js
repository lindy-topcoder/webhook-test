import PromisePool from 'es6-promise-pool';
import logger from 'winston';

import GitRepository from './GitRepository';

export default class SwaggerHubIntegratorJob
{
  constructor (id, basePath, publicKey, privateKey, swaggerDocuments, combiner, swaggerHubClient, swaggerHubOwner, swaggerHubApi) {
    this.id = id;
    this.basePath = basePath;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.swaggerDocuments = swaggerDocuments;
    this.combiner = combiner;
    this.swaggerHubClient = swaggerHubClient;
    this.swaggerHubOwner = swaggerHubOwner;
    this.swaggerHubApi = swaggerHubApi;
  }

  run () {

    logger.info('starting job', {id: this.id});

    this.cloneAll()
      .then(results => results.filter(result => !result.error))
      .then(validResults => this.combiner.combine(validResults.map(validResult => `${validResult.repository.path}/${validResult.swaggerDocument.path}`)))
      .then(swaggerDoc => this.swaggerHubClient.save(this.swaggerHubOwner, this.swaggerHubApi, swaggerDoc))
      .then(response => {

      })
      .catch (e => {
        // console.log(e);
      })
  }

  cloneAll () {

    const docs = this.swaggerDocuments.slice();

    const pool = new PromisePool(() => {

      if (docs.length === 0) {
        return null;
      }

      const swaggerDocument = docs.pop();

      return new Promise((resolve) => {
        const repository = new GitRepository(swaggerDocument.sshUrl, swaggerDocument.branch, this.publicKey, this.privateKey);
        repository
          .clone(`${this.basePath}/${this.id}`)
          .then(() => {
            resolve({
              repository: repository,
              error: false,
            });
          })
          .catch(e => {
            resolve({
              repository: repository,
              error: e,
            });
          })
      })
        .then(result => {
          return {
            swaggerDocument: swaggerDocument,
            repository: result.repository,
            error: result.error
          }
        })
    }, 1);

    const results = [];

    pool.addEventListener('fulfilled', (e) => {
      results.push(e.data.result);
    })

    return pool.start()
      .then(() => {
        return results;
      });
  }
}