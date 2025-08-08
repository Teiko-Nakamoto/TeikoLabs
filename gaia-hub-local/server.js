const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create storage directory
const STORAGE_DIR = path.join(__dirname, 'storage');
fs.ensureDirSync(STORAGE_DIR);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(STORAGE_DIR, req.params.address);
    fs.ensureDirSync(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    cb(null, req.params.path || file.originalname);
  }
});

const upload = multer({ storage });

// Gaia Hub Info endpoint
app.get('/hub_info/', (req, res) => {
  res.json({
    challenge_text: "gaia-challenge",
    read_url_prefix: `http://localhost:${PORT}/read/`,
    latest_auth_version: "v1"
  });
});

// Store file endpoint (POST /store/{address}/{path})
app.post('/store/:address/*', upload.single('file'), (req, res) => {
  try {
    const address = req.params.address;
    const filePath = req.params[0]; // This captures the wildcard path
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`✅ File stored: ${address}/${filePath}`);
    
    res.status(202).json({
      publicURL: `http://localhost:${PORT}/read/${address}/${filePath}`,
      etag: `etag-${Date.now()}`
    });
  } catch (error) {
    console.error('❌ Store error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Read file endpoint (GET /read/{address}/{path})
app.get('/read/:address/*', (req, res) => {
  try {
    const address = req.params.address;
    const filePath = req.params[0];
    const fullPath = path.join(STORAGE_DIR, address, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD');
    
    // Send the file
    res.sendFile(fullPath);
  } catch (error) {
    console.error('❌ Read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List files endpoint
app.post('/list-files/:address', (req, res) => {
  try {
    const address = req.params.address;
    const userDir = path.join(STORAGE_DIR, address);
    
    if (!fs.existsSync(userDir)) {
      return res.json({ entries: [], page: null });
    }
    
    const files = fs.readdirSync(userDir);
    res.json({
      entries: files,
      page: null
    });
  } catch (error) {
    console.error('❌ List error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log('🌐 Local Gaia Hub running!');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📁 Storage: ${STORAGE_DIR}`);
  console.log(`🔗 Hub Info: http://localhost:${PORT}/hub_info/`);
  console.log('');
  console.log('📝 Usage:');
  console.log(`   Store: POST http://localhost:${PORT}/store/{address}/{path}`);
  console.log(`   Read:  GET  http://localhost:${PORT}/read/{address}/{path}`);
  console.log(`   List:  POST http://localhost:${PORT}/list-files/{address}`);
}); 