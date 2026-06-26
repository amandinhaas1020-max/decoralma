const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.static(path.join(__dirname, "public")));

function lerDados() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ colecoes: [], produtos: [], acessorios: [], inspire: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function salvarDados(dados) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2), "utf8");
}

app.get("/api/site-data", (req, res) => {
  res.json(lerDados());
});

app.post("/api/produtos", (req, res) => {
  const dados = lerDados();
  const produto = {
    id: Date.now().toString(),
    nome: req.body.nome || "Produto",
    preco: req.body.preco || "R$ 0,00",
    img: req.body.img || "",
    colecao: Number(req.body.colecao || 0)
  };
  dados.produtos = Array.isArray(dados.produtos) ? dados.produtos : [];
  dados.produtos.push(produto);
  salvarDados(dados);
  res.json({ ok: true, produto });
});

app.delete("/api/produtos/:id", (req, res) => {
  const dados = lerDados();
  dados.produtos = (dados.produtos || []).filter(p => String(p.id) !== String(req.params.id));
  salvarDados(dados);
  res.json({ ok: true });
});

app.post("/api/acessorios", (req, res) => {
  const dados = lerDados();
  const produto = {
    id: Date.now().toString(),
    nome: req.body.nome || "Acessório",
    preco: req.body.preco || "R$ 0,00",
    img: req.body.img || ""
  };
  dados.acessorios = Array.isArray(dados.acessorios) ? dados.acessorios : [];
  dados.acessorios.push(produto);
  salvarDados(dados);
  res.json({ ok: true, produto });
});

app.delete("/api/acessorios/:id", (req, res) => {
  const dados = lerDados();
  dados.acessorios = (dados.acessorios || []).filter(p => String(p.id) !== String(req.params.id));
  salvarDados(dados);
  res.json({ ok: true });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("Decoralma rodando na porta " + PORT);
});
