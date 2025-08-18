import { rmSync } from 'fs'
import { preprocessFileSync } from 'preprocess'
import { execSync } from 'child_process'

rmSync('dist', { recursive: true, force: true })

preprocessFileSync(
  'src/bedit.mts',
  'src/bedit.production.mts',
  {
    PRODUCTION: true,
    DEV_MODE_ERROR:
      'console.error("[bedit] setDevMode is not available in production")',
  },
  { type: 'js' },
)

execSync('tsc --project tsconfig.build.json', { stdio: 'inherit', shell: true })
