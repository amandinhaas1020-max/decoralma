const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend Decoralma funcionando!");
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
