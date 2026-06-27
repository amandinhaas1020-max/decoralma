const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.static(path.join(__dirname, "public")));

function lerDados() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          hero: {},
          colecoes: [],
          produtos: [],
          acessorios: [],
          criarArte: [],
          inspire: [],
          pedidos: []
        },
        null,
        2
      )
    );
  }

  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function salvarDados(dados) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2), "utf8");
}

function precoParaNumero(valor) {
  if (typeof valor === "number") return valor;

  return Number(
    String(valor || "0")
      .replace("R$", "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  ) || 0;
}

app.get("/api/site-data", (req, res) => {
  res.json(lerDados());
});

app.post("/api/site-data", (req, res) => {
  salvarDados(req.body);
  res.json({ ok: true });
});

app.post("/api/produtos", (req, res) => {
  const dados = lerDados();

  const produto = {
    id: Date.now().toString(),
    nome: req.body.nome || "Produto",
    preco: req.body.preco || "R$ 0,00",
    img: req.body.img || "",
    colecao: Number(req.body.colecao || 0),
    paraPintar: !!req.body.paraPintar,
    pintado: !!req.body.pintado
  };

  dados.produtos = Array.isArray(dados.produtos) ? dados.produtos : [];
  dados.produtos.push(produto);

  salvarDados(dados);
  res.json({ ok: true, produto });
});

app.delete("/api/produtos/:id", (req, res) => {
  const dados = lerDados();

  dados.produtos = (dados.produtos || []).filter(
    p => String(p.id) !== String(req.params.id)
  );

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

  dados.acessorios = (dados.acessorios || []).filter(
    p => String(p.id) !== String(req.params.id)
  );

  salvarDados(dados);
  res.json({ ok: true });
});

app.post("/criar-pagamento", async (req, res) => {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return res.status(500).json({
        erro: "MP_ACCESS_TOKEN não configurado no Render."
      });
    }

    const { metodo, cliente, frete, itens, total } = req.body;

    const valorTotal = precoParaNumero(total);

    if (!valorTotal || valorTotal <= 0) {
      return res.status(400).json({
        erro: "Total inválido."
      });
    }

    const preference = new Preference(client);

    let excluded_payment_types = [];

    if (metodo === "pix") {
      excluded_payment_types = [
        { id: "credit_card" },
        { id: "debit_card" },
        { id: "ticket" }
      ];
    }

    if (metodo === "cartao") {
      excluded_payment_types = [
        { id: "pix" },
        { id: "ticket" }
      ];
    }

    if (metodo === "boleto") {
      excluded_payment_types = [
        { id: "pix" },
        { id: "credit_card" },
        { id: "debit_card" }
      ];
    }

    const descricaoItens = (itens || [])
      .map(item => `${item.qtd || 1}x ${item.nome}`)
      .join(", ");

    const resultado = await preference.create({
      body: {
        items: [
          {
            title: "Pedido Decoralma",
            description: descricaoItens || "Compra no site Decoralma",
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(valorTotal.toFixed(2))
          }
        ],
        payer: {
          name: cliente?.nome || "",
          phone: {
            number: cliente?.telefone || ""
          },
          address: {
            zip_code: cliente?.cep || "",
            street_name: cliente?.endereco || "",
            street_number: cliente?.numero || ""
          }
        },
        payment_methods: {
          excluded_payment_types
        },
        back_urls: {
          success: "https://decoralmamdf.com.br",
          failure: "https://decoralmamdf.com.br",
          pending: "https://decoralmamdf.com.br"
        },
        auto_return: "approved"
      }
    });

    const dados = lerDados();
    dados.pedidos = Array.isArray(dados.pedidos) ? dados.pedidos : [];

    dados.pedidos.push({
      id: Date.now().toString(),
      nome: cliente?.nome || "Cliente",
      telefone: cliente?.telefone || "",
      endereco: cliente || {},
      frete: frete || {},
      itens: itens || [],
      total: `R$ ${valorTotal.toFixed(2).replace(".", ",")}`,
      metodo,
      status: "Pagamento criado",
      criadoEm: new Date().toISOString()
    });

    salvarDados(dados);

    res.json({
      ok: true,
      init_point: resultado.init_point
    });

  } catch (erro) {
    console.error("Erro Mercado Pago:", erro);

    res.status(500).json({
      erro: "Erro ao criar pagamento",
      detalhes: erro.message
    });
  }
});

app.get("/teste-pagamento", (req, res) => {
  res.json({
    ok: true,
    mercadoPagoToken: process.env.MP_ACCESS_TOKEN ? "configurado" : "não configurado"
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("Decoralma rodando na porta " + PORT);
});
