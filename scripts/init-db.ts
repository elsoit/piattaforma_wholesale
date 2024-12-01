import { initializeDatabase, checkDatabaseExists } from '@/lib/db/init'

async function init() {
  const exists = await checkDatabaseExists()
  
  if (!exists) {
    console.log('Database not found, initializing...')
    await initializeDatabase()
  } else {
    console.log('Database already exists')
  }
}

init() 