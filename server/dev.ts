import app, { storageReady } from './index.js'

const port = Number(process.env.PORT || 4000)

await storageReady
app.listen(port, () => {
  console.info(`Task manager API listening on http://localhost:${port}`)
})
