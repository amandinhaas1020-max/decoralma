const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");
const DATA_FILE = path.join(__dirname, "data.json");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    config: { whatsapp: "55SEUNUMERO", chavePix: "", nomeLoja: "Decoralma" },
    hero: {},
    colecoes: [],
    produtos: [],
    acessorios: [],
    inspire: [],
    pedidos: []
  }, null, 2));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg");
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({ storage });

app.use(express.static(PUBLIC_DIR));

function lerDados() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function salvarDados(dados) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2), "utf8");
}

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.get("/api/site-data", (req, res) => {
  try {
    res.json(lerDados());
  } catch (e) {
    res.status(500).json({ erro: "Erro ao ler dados." });
  }
});

app.post("/api/site-data", (req, res) => {
  try {
    salvarDados(req.body);
    res.json({ sucesso: true });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao salvar dados." });
  }
});

app.post("/api/upload", upload.single("imagem"), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: "Nenhuma imagem enviada." });
  res.json({ url: "/uploads/" + req.file.filename });
});

app.post("/api/pedidos", (req, res) => {
  try {
    const dados = lerDados();
    dados.pedidos = dados.pedidos || [];
    dados.pedidos.push({ ...req.body, criadoEm: new Date().toISOString() });
    salvarDados(dados);
    res.json({ sucesso: true });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao salvar pedido." });
  }
});

app.post("/calcular-frete", async (req, res) => {
  try {
    const resposta = await axios.post(
      "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Aplicação Decoralma"
        }
      }
    );
    res.json(resposta.data);
  } catch (erro) {
    res.status(500).json(erro.response?.data || erro.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
