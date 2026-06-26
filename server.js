const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = path.join(__dirname, "data.json");

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        hero: {},
        produtos: [],
        colecoes: [],
        acessorios: [],
        inspire: []
    }, null, 2));
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/site-data", (req, res) => {
    try {
        const dados = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
        res.json(dados);
    } catch (e) {
        res.status(500).json({ erro: "Erro ao ler dados." });
    }
});

app.post("/api/site-data", (req, res) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), "utf8");
        res.json({ sucesso: true });
    } catch (e) {
        res.status(500).json({ erro: "Erro ao salvar dados." });
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

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
