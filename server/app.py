import json
import os
import pathlib
import time
import urllib.parse

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, request
from flask_cors import CORS

BASE_DIR = pathlib.Path(__file__).resolve().parent
TOKENS_FILE = BASE_DIR / '.tokens.json'
load_dotenv(BASE_DIR / '.env')

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
OAUTH_REDIRECT_URI = os.environ.get('OAUTH_REDIRECT_URI', 'http://localhost:5000/api/auth/callback')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173/google-photos')

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    raise RuntimeError('Google OAuth credentials are required in server/.env')

app = Flask(__name__)
CORS(app)

app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'replace-with-random-secret')


def load_token_data():
    if not TOKENS_FILE.exists():
        return {}
    try:
        return json.loads(TOKENS_FILE.read_text())
    except Exception:
        return {}


def save_token_data(data):
    TOKENS_FILE.write_text(json.dumps(data, indent=2))


def get_access_token():
    tokens = load_token_data()
    if not tokens:
        return None

    expires_at = tokens.get('expires_at', 0)
    if time.time() > expires_at - 60:
        if not tokens.get('refresh_token'):
            return None
        refreshed = refresh_access_token(tokens['refresh_token'])
        if not refreshed:
            return None
        tokens = load_token_data()

    return tokens.get('access_token')


def get_auth_url():
    params = {
        'client_id': GOOGLE_CLIENT_ID,
        'redirect_uri': OAUTH_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'https://www.googleapis.com/auth/photoslibrary.readonly',
        'access_type': 'offline',
        'prompt': 'consent',
        'include_granted_scopes': 'true',
    }
    return f'https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}'


def exchange_code(code):
    payload = {
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': OAUTH_REDIRECT_URI,
    }
    response = requests.post('https://oauth2.googleapis.com/token', data=payload, timeout=20)
    response.raise_for_status()
    tokens = response.json()
    tokens['expires_at'] = int(time.time()) + int(tokens.get('expires_in', 3600))
    save_token_data(tokens)
    return tokens


def refresh_access_token(refresh_token):
    payload = {
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token',
    }
    response = requests.post('https://oauth2.googleapis.com/token', data=payload, timeout=20)
    if response.status_code != 200:
        return None
    tokens = response.json()
    data = load_token_data()
    data.update(tokens)
    data['refresh_token'] = refresh_token
    data['expires_at'] = int(time.time()) + int(tokens.get('expires_in', 3600))
    save_token_data(data)
    return data


def api_get(path, params=None):
    access_token = get_access_token()
    if not access_token:
        return None, {'error': 'unauthorized'}, 401
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(f'https://photoslibrary.googleapis.com/v1{path}', headers=headers, params=params, timeout=20)
    if response.status_code == 401:
        return None, {'error': 'unauthorized'}, 401
    if not response.ok:
        print(f'API GET {path} failed {response.status_code}: {response.text}')
        response.raise_for_status()
    return response.json(), None, None


def api_post(path, data=None):
    access_token = get_access_token()
    if not access_token:
        return None, {'error': 'unauthorized'}, 401
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }
    response = requests.post(f'https://photoslibrary.googleapis.com/v1{path}', headers=headers, json=data or {}, timeout=20)
    if response.status_code == 401:
        return None, {'error': 'unauthorized'}, 401
    if not response.ok:
        print(f'API POST {path} failed {response.status_code}: {response.text}')
        response.raise_for_status()
    return response.json(), None, None


@app.route('/api/debug/token')
def debug_token():
    tokens = load_token_data()
    access_token = tokens.get('access_token')
    if not access_token:
        return jsonify({'error': 'no token'})
    r = requests.get(f'https://oauth2.googleapis.com/tokeninfo?access_token={access_token}', timeout=10)
    return jsonify(r.json())


@app.route('/api/status')
def status():
    token = get_access_token()
    return jsonify({'authorized': bool(token)})


@app.route('/api/auth/url')
def auth_url():
    return redirect(get_auth_url())


@app.route('/api/auth/callback')
def auth_callback():
    code = request.args.get('code')
    if not code:
        return 'Missing code', 400
    try:
        exchange_code(code)
    except Exception as exc:
        return f'Auth failed: {exc}', 500
    return redirect(FRONTEND_URL)


@app.route('/api/albums')
def albums():
    data, error, status_code = api_get('/albums', params={'pageSize': 50})
    if error:
        return jsonify(error), status_code
    albums = data.get('albums', [])
    return jsonify({'albums': [{'id': a['id'], 'title': a.get('title', 'Untitled Album')} for a in albums]})


@app.route('/api/photos')
def photos():
    album_id = request.args.get('albumId')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    page_size = int(request.args.get('pageSize', 36))
    page_token = request.args.get('pageToken')

    body = {'pageSize': page_size}
    if album_id and album_id != 'all':
        body['albumId'] = album_id

    filters = {}
    date_ranges = []
    if start_date:
        date_ranges.append({'startDate': {'year': int(start_date[:4]), 'month': int(start_date[5:7]), 'day': int(start_date[8:10])}})
    if end_date:
        date_ranges.append({'endDate': {'year': int(end_date[:4]), 'month': int(end_date[5:7]), 'day': int(end_date[8:10])}})
    if date_ranges:
        filters['dateFilter'] = {'ranges': [date_ranges[0]]}
        if len(date_ranges) == 2:
            filters['dateFilter']['ranges'][0].update(date_ranges[1])

    if filters:
        body['filters'] = filters
    if page_token:
        body['pageToken'] = page_token

    data, error, status_code = api_post('/mediaItems:search', data=body)
    if error:
        return jsonify(error), status_code
    items = data.get('mediaItems', [])
    return jsonify({'mediaItems': items, 'nextPageToken': data.get('nextPageToken')})


@app.route('/api/albums/create', methods=['POST'])
def create_album():
    body = request.get_json() or {}
    title = body.get('title')
    if not title:
        return jsonify({'error': 'Title is required'}), 400
    data, error, status_code = api_post('/albums', data={'album': {'title': title}})
    if error:
        return jsonify(error), status_code
    return jsonify(data)


@app.route('/api/albums/add', methods=['POST'])
def add_to_album():
    body = request.get_json() or {}
    album_id = body.get('albumId')
    media_item_ids = body.get('mediaItemIds', [])
    if not album_id or not media_item_ids:
        return jsonify({'error': 'albumId and mediaItemIds are required'}), 400
    data, error, status_code = api_post(f'/albums/{album_id}:batchAddMediaItems', data={'mediaItemIds': media_item_ids})
    if error:
        return jsonify(error), status_code
    return jsonify(data)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
