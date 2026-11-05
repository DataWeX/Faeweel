import { Router } from 'express'
import {
  auth,
  beginAuth,
  beginRegister,
  checkId,
  digestPreview,
  finishAuth,
  finishRegister,
  identity,
  issueId,
  ledger,
  logout,
  mandate,
  sealId,
  session,
  signIntent,
  status,
  verifyId,
} from '../controllers/operator.js'
import { asyncRoute, attachSession, requireSession } from '../middleware/operator.js'

const router = Router()

router.get('/status', asyncRoute(status))
router.post('/webauthn/register/begin', asyncRoute(beginRegister))
router.post('/webauthn/register/finish', asyncRoute(finishRegister))
router.post('/webauthn/auth/begin', asyncRoute(beginAuth))
router.post('/webauthn/auth/finish', asyncRoute(finishAuth))
router.post('/logout', requireSession, asyncRoute(logout))
router.get('/session', requireSession, asyncRoute(session))
router.post('/sign', requireSession, asyncRoute(signIntent))
router.get('/ledger', requireSession, asyncRoute(ledger))
router.post('/digest', asyncRoute(digestPreview))
router.get('/identity', asyncRoute(identity))
router.post('/identity/issue', requireSession, asyncRoute(issueId))
router.post('/identity/mandate', requireSession, asyncRoute(mandate))
router.post('/identity/verify', asyncRoute(verifyId))
router.post('/identity/seal', requireSession, asyncRoute(sealId))
router.post('/identity/check', asyncRoute(checkId))
router.get('/identity/check', asyncRoute(checkId))
router.post('/auth', attachSession, asyncRoute(auth))

export default router
