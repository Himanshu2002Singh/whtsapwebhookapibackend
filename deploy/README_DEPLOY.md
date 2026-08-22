Deployment steps for `whatsappwebhook` (quick)

1. Copy `.env.production` to `.env` on the server and fill secrets.

   Also configure the Trusting Brains admin login:

   ```env
   ADMIN_NAME=Trusting Brains Admin
   ADMIN_EMAIL=admin@trustingbrains.com
   ADMIN_PASSWORD=use-a-long-random-password
   ```

   The Admin account has full access. Team members are added from the CRM Team page with Manager, Agent, or Viewer roles.

2. Install dependencies and start with pm2:

```bash
cd /path/to/whatsappwebhook
npm ci
pm2 start ecosystem.config.js --env production
pm2 save
```

3. Configure nginx: place `nginx_webhookapi.conf` in `/etc/nginx/sites-available/` and enable it.

4. Obtain TLS with certbot:

```bash
sudo certbot --nginx -d webhookapi.trustingbrains.com
```

5. In Facebook App (WhatsApp Cloud API) → Webhooks:
   - Callback URL: `https://webhookapi.trustingbrains.com/webhook`
   - Verify Token: use the `VERIFY_TOKEN` from your `.env`

6. Test locally with curl or use `ngrok` for local testing:

```bash
# if running locally on port 5000
curl "http://localhost:5000/webhook?hub.mode=subscribe&hub.verify_token=YourVerifyToken&hub.challenge=12345"
```
