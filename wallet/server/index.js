import express from 'express'
import { bootVault, vaultSecret } from './logic/vault.js'
import { jsonErrors } from './middleware/operator.js'
import operator from './routes/operator.js'

const PORT = Number(process.env.OPERATOR_PORT || 3001)

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', true)
app.use(express.json({ limit: '1mb' }))
app.use('/api', operator)
app.use(jsonErrors)

bootVault()
  .then((wallet) => {
    app.set('operatorSecret', vaultSecret())
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Aether operator on :${PORT} signer ${wallet.address}`)
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
