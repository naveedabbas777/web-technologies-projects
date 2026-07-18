const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
  console.warn('WARNING: Cloudinary signing server started without API credentials in env. Set CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME');
}

function signParams(params) {
  // Cloudinary signing: sort keys, join as key=value&..., append secret, sha1
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

app.post('/cloudinary/sign', (req, res) => {
  // Accept optional folder or public_id from client
  const { folder, public_id } = req.body || {};
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { timestamp };
  if (folder) params.folder = folder;
  if (public_id) params.public_id = public_id;

  try {
    const signature = signParams(params);
    res.json({ signature, timestamp, api_key: CLOUDINARY_API_KEY, cloud_name: CLOUDINARY_CLOUD_NAME });
  } catch (err) {
    res.status(500).json({ error: 'Signing failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Cloudinary signing server running on port ${PORT}`));
