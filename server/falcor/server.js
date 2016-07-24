import express from 'express'

export class FalcorServer {

  constructor(port) {
    this.runServer(port)
  }

  runServer(port, schema) {
    let endpoint = 'falcor'

    express()
      .get(`/${endpoint}`,(req, res) => res.send('Hello Falcor'))
      .listen(port)

    console.log(`Falcor server running on http://localhost:${port}/${endpoint}`);
  }
};
