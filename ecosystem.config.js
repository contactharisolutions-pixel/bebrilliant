module.exports = {
  apps: [
    {
      name: 'bebrilliant-next',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3010',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3010
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3010
      }
    },
    {
      name: 'bebrilliant-express',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5175
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5175
      }
    }
  ]
};


