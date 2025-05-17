import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

dotenv.config();

const app = express();
const router = express.Router();
const prisma = new PrismaClient();

app.use(cors({
  origin: ["https://meusite.com", "https://admin.meusite.com"]
}));

app.use(express.json());

// --- ROTAS USUÁRIO ---

app.post("/usuarios", async (req, res) => {
  const { nome, email } = req.body;
  try {
    const novoUsuario = await prisma.usuario.create({
      data: { nome, email },
    });
    res.status(201).json(novoUsuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/usuarios", async (req, res) => {
  const usuarios = await prisma.usuario.findMany();
  res.json(usuarios);
});

app.get("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(id) },
  });
  if (usuario) {
    res.json(usuario);
  } else {
    res.status(404).json({ error: "Usuário não encontrado" });
  }
});

app.put("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, email } = req.body;
  try {
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { nome, email },
    });
    res.json(usuarioAtualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.usuario.delete({
      where: { id: Number(id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- ROTAS PRODUTO ---

app.post("/produtos", async (req, res) => {
  const { nome, descricao, preco } = req.body;
  try {
    const produto = await prisma.produto.create({
      data: { nome, descricao, preco: Number(preco) },
    });
    res.status(201).json(produto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/produtos", async (req, res) => {
  const produtos = await prisma.produto.findMany();
  res.json(produtos);
});

// --- ROTAS PEDIDO ---

app.post("/pedidos", async (req, res) => {
  const { usuarioId, itens } = req.body;
  // itens = [{ produtoId, quantidade }, ...]

  try {
    const pedido = await prisma.pedido.create({
      data: {
        usuarioId,
        itens: {
          create: itens,
        },
      },
      include: {
        itens: true,
      },
    });
    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/pedidos", async (req, res) => {
  const pedidos = await prisma.pedido.findMany({
    include: {
      usuario: true,
      itens: {
        include: {
          produto: true,
        },
      },
    },
  });
  res.json(pedidos);
});

// Esquema de validação com Zod
const registroSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

app.post("/register", async (req, res) => {
  const parse = registroSchema.safeParse(req.body);

  if (!parse.success) {
    return res.status(400).json({
      error: "Dados inválidos",
      detalhes: parse.error.flatten().fieldErrors,
    });
  }

  const { nome, email, senha } = parse.data;

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const novoUsuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash },
    });
    res.status(201).json({ id: novoUsuario.id, nome, email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Login de usuário
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    // Criar token JWT
    const token = jwt.sign({ userId: usuario.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token ausente" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
};

app.get("/pedidos", autenticar, async (req, res) => {
  const pedidos = await prisma.pedido.findMany({
    where: { usuarioId: req.userId },
    include: { itens: true },
  });
  res.json(pedidos);
});

dotenv.config(); // Carrega variáveis do .env

router.post('/', async (req, res) => {
  const { nome, telefone, endereco } = req.body;

  try {
    const cliente = await prisma.cliente.create({
      data: { nome, telefone, endereco },
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao cadastrar cliente' });
  }
});

router.get('/', async (req, res) => {
  const clientes = await prisma.cliente.findMany();
  res.json(clientes);
});

export default router;


// --- INICIAR SERVIDOR ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
