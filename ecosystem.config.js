module.exports = {
  apps: [
    {
      name: 'piattaforma-whls-test',
      script: 'npm',
      args: 'run start:test',
      env: {
        NODE_ENV: 'test',
        PORT: 3001
      },
      max_memory_restart: '1G'
    },
    {
      name: 'piattaforma-whls-prod',
      script: 'npm',
      args: 'run start:prod',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '1G'
    }
  ]
} 