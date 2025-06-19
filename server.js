const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Função utilitária para ler e salvar o banco
function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Rotas da API
app.get('/usuarios', (req, res) => {
  const db = readDB();
  if (req.query.login) {
    const user = db.usuarios.filter(u => u.login === req.query.login);
    return res.json(user);
  }
  res.json(db.usuarios);
});

app.get('/usuarios/:id', (req, res) => {
  const db = readDB();
  const user = db.usuarios.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

app.post('/usuarios', (req, res) => {
  const db = readDB();
  const newUser = { ...req.body, id: uuidv4(), favorites: req.body.favorites || [], admin: req.body.admin || false };
  db.usuarios.push(newUser);
  writeDB(db);
  res.status(201).json(newUser);
});

app.patch('/usuarios/:id', (req, res) => {
  const db = readDB();
  const idx = db.usuarios.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado' });
  db.usuarios[idx] = { ...db.usuarios[idx], ...req.body };
  writeDB(db);
  res.json(db.usuarios[idx]);
});

// Itens
app.get('/itens', (req, res) => {
  const db = readDB();
  let itens = db.itens;
  if (req.query.destaque) {
    itens = itens.filter(i => i.destaque === true);
  }
  res.json(itens);
});

app.get('/itens/:id', (req, res) => {
  const db = readDB();
  const item = db.itens.find(i => i.id == req.params.id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });
  res.json(item);
});

// Favoritos (opcional, pois já está no usuário)
app.get('/favoritos/:userId', (req, res) => {
  const db = readDB();
  const user = db.usuarios.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user.favorites || []);
});

// Fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
