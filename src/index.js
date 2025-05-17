import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Rotas para CRUD de Usuário

// Criar usuário
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

// Listar todos os usuários
app.get("/usuarios", async (req, res) => {
  const usuarios = await prisma.usuario.findMany();
  res.json(usuarios);
});

// Buscar usuário por ID
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

// Atualizar usuário
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

// Deletar usuário
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
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import clientesRoutes from './routes/clientes.js';

dotenv.config();

app.use(cors());
app.use(express.json());

app.use('/clientes', clientesRoutes);

app.get('/', (req, res) => {
  res.send('API ERP Açaí rodando...');
});


// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
