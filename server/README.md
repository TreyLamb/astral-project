# Google Photos Backend

This backend runs a small Flask server to handle Google OAuth and Google Photos API calls for the Astro project photo sorter.

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials.
2. Install dependencies:

   ```powershell
   cd server
   python -m pip install -r requirements.txt
   ```

3. Start the server:

   ```powershell
   python app.py
   ```

4. Open the React app in the main project and use the page at `/google-photos`.

## OAuth credentials

1. Open the Google Cloud Console: https://console.cloud.google.com/
2. Select your project or create a new one.
3. In the left menu, go to **APIs & Services > Credentials**.
4. Click **Create credentials > OAuth client ID**.
5. Choose **Web application**.
6. Under **Authorized JavaScript origins** add:
   - `http://localhost:5173`
7. Under **Authorized redirect URIs** add:
   - `http://localhost:5000/api/auth/callback`
8. Save and copy the **Client ID** and **Client secret**.

Then create `server/.env` from `.env.example` and paste the values:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FLASK_SECRET_KEY`
- `OAUTH_REDIRECT_URI`
- `FRONTEND_URL`

The application uses the Flask backend on port `5000` and the React app on port `5173` during development.

### Notes

- This app stores Google tokens locally in `server/.tokens.json` so you do not need to re-authenticate each browser session.
- If you want to change the frontend host, update `FRONTEND_URL` and the Vite proxy in `vite.config.js`.
