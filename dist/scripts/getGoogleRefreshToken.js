import express from 'express';
import { OAuth2Client } from 'google-auth-library';
function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith('--')) {
            const [k, v] = a.replace(/^--/, '').split('=');
            if (v !== undefined)
                out[k] = v;
            else if (i + 1 < argv.length && !argv[i + 1].startsWith('--'))
                out[k] = argv[++i];
            else
                out[k] = 'true';
        }
    }
    return out;
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    const clientId = args['client-id'] || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = args['client-secret'] || process.env.GOOGLE_CLIENT_SECRET;
    const port = Number(args.port || 53682);
    const redirectUri = `http://localhost:${port}/callback`;
    if (!clientId || !clientSecret) {
        console.error('Missing --client-id and/or --client-secret');
        process.exit(1);
    }
    const oauth2Client = new OAuth2Client({ clientId, clientSecret, redirectUri });
    const scope = [
        'https://www.googleapis.com/auth/calendar',
    ];
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope,
    });
    const app = express();
    const server = app.listen(port, () => {
        console.log(`Listening for OAuth callback on ${redirectUri}`);
        console.log('Open the following URL in your browser to authorize:');
        console.log(authUrl);
    });
    app.get('/callback', async (req, res) => {
        try {
            const code = req.query.code || '';
            if (!code)
                throw new Error('Missing code param');
            const { tokens } = await oauth2Client.getToken(code);
            res.set('Content-Type', 'text/plain');
            res.send(`Refresh token: ${tokens.refresh_token}\nAccess token: ${tokens.access_token}\n`);
            console.log('Tokens obtained:');
            console.log(JSON.stringify(tokens, null, 2));
        }
        catch (e) {
            res.status(500).send(e.message);
        }
        finally {
            server.close(() => process.exit(0));
        }
    });
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
