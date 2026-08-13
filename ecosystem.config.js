module.exports = {
  apps: [
    {
      name: 'whatsapp-webhook',
      script: './server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        VERIFY_TOKEN: 'trustingbrains@202326',
        ACCESS_TOKEN: process.env.ACCESS_TOKEN || '',
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || 3306,
        DB_NAME: process.env.DB_NAME || 'whtsapp',
        DB_USER: process.env.DB_USER || 'root',
        DB_PASSWORD: process.env.DB_PASSWORD || ''
      }
    }
  ]
};
