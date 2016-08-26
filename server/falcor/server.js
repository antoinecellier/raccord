import express from 'express'

export default port => {
  const endpoint = 'falcor'

  express()
    .get(`/${endpoint}`, (req, res) => res.send('Hello Falcor'))
    .listen(port)

  console.log(`Falcor server running on http://localhost:${port}/${endpoint}`)
}
