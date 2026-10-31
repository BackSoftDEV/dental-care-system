module.exports = {
  apps: [
    {
      name: 'dental-backend',
      cwd: './backend',
      script: './node_modules/ts-node-dev/lib/bin.js',
      args: '--respawn --transpile-only src/server.ts',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
    },
    {
      name: 'dental-frontend',
      cwd: './frontend',
      script: './node_modules/vite/bin/vite.js',
      args: '',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
}
