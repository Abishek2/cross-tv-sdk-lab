const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Resolve SDK from dist directory if not copied to lib
app.get('/lib/tv-sdk.umd.js', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../packages/tv-sdk/dist/tv-sdk.umd.js'));
});

app.get('/lib/tv-sdk.umd.js.map', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../packages/tv-sdk/dist/tv-sdk.umd.js.map'));
});

// Serve public static files
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`TV Demo App running on http://localhost:${PORT}`);
});
