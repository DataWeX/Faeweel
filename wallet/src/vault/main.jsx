import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import VaultApp from './VaultApp.jsx'
import './vault.css'

createRoot(document.getElementById('root')).render(<StrictMode><VaultApp /></StrictMode>)
