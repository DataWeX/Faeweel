import { spawn } from 'node:child_process'

function run(cmd, args) {
  const child = spawn(cmd, args, { stdio: 'inherit', env: process.env })
  child.on('exit', (code) => process.exit(code ?? 1))
  return child
}

const operator = run(process.execPath, ['server/index.js'])
const vite = run(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0', '--port', '5173'])

function stop() {
  operator.kill('SIGTERM')
  vite.kill('SIGTERM')
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
