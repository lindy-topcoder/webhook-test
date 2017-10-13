import request from 'request';

export default class SwaggerHubClient
{
  constructor (host, apiKey) {
    this.host = host;
    this.apiKey = apiKey;
  }

  save (owner, api, document) {
    console.log(`${this.host}/apis/${owner}/${api}`)
    return new Promise((resolve, reject) => {
      request({
        url: `${this.host}/apis/${owner}/${api}`,
        method: 'POST',
        headers: {
          Authorization: this.apiKey,
        },
        body: document,
        json: true,
      }, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          if (response.statusCode === 200) {
            resolve(response);
          } else if (response.statusCode === 201) {
            resolve(response);
          } else {
            reject(response);
          }
        }
      })
    })
  }
}