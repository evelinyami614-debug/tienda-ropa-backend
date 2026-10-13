require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // Habilita CORS para conectar con React

// Pool de conexión con soporte SSL para Aiven (Guía 14)
const conexion = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 25569,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10
});



conexion.getConnection((err, conn) => {
  if (err) {
    console.error('Error al conectar a la BD en Aiven:', err);
    return;
  }
  console.log('¡Conectado exitosamente a Aiven MySQL!');
  conn.release();
});


// ==================== CRUD CLIENTES ====================
app.get('/clientes', (req, res) => {
  conexion.query('SELECT * FROM clientes', (err, resultados) => {
    if (err) return res.status(500).send(err);
      res.json(resultados);
    
  });
});

app.post('/clientes', (req, res) => {
  const { nombre, telefono } = req.body;
  const tel = telefono || 'S/N';
  conexion.query('INSERT INTO clientes (nombre, telefono) VALUES (?, ?)', [nombre, tel], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: `Cliente agregado: ${nombre}`, id: result.insertId, nombre, telefono: tel });
  });
});

app.put('/clientes/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, telefono } = req.body;
  conexion.query('UPDATE clientes SET nombre=?, telefono=? WHERE id=?', [nombre, telefono, id], err => {
    if (err) return res.status(500).send(err);
    res.send(`Cliente con ID ${id} actualizado`);
  });
});

app.delete('/clientes/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM clientes WHERE id=?', [id], err => {
    if (err) return res.status(500).send(err);
    res.send(`Cliente con ID ${id} eliminado`);
  });
});

// ==================== CRUD PRENDAS ====================
app.get('/prendas', (req, res) => {
  conexion.query('SELECT * FROM prendas', (err, resultados) => {
    if (err) return res.status(500).send(err);
    res.json(resultados);
  });
});

app.post('/prendas', (req, res) => {
  const { nombre, precio } = req.body;
  conexion.query('INSERT INTO prendas (nombre, precio) VALUES (?, ?)', [nombre, precio], err => {
    if (err) return res.status(500).send(err);
    res.send(`Prenda agregada: ${nombre}`);
  });
});

app.put('/prendas/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, precio } = req.body;
  conexion.query('UPDATE prendas SET nombre=?, precio=? WHERE id=?', [nombre, precio, id], err => {
    if (err) return res.status(500).send(err);
    res.send(`Prenda con ID ${id} actualizada`);
  });
});

app.delete('/prendas/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM prendas WHERE id=?', [id], err => {
    if (err) return res.status(500).send(err);
    res.send(`Prenda con ID ${id} eliminada`);
  });
});

// ==================== CRUD VENTAS (CON JOIN) ====================
app.get('/ventas', (req, res) => {
  const sql = `
    SELECT v.id, c.nombre AS cliente, p.nombre AS prenda, 
           v.cantidad, v.fecha, p.precio, (v.cantidad * p.precio) AS total,
           v.cliente_id, v.prenda_id
    FROM ventas v
    INNER JOIN clientes c ON v.cliente_id = c.id
    INNER JOIN prendas p ON v.prenda_id = p.id
  `;
  conexion.query(sql, (err, resultados) => {
    if (err) return res.status(500).send(err);
    res.json(resultados);
  });
});

app.post('/ventas', (req, res) => {
  const { cliente_id, prenda_id, cantidad, fecha } = req.body;
  conexion.query(
    'INSERT INTO ventas (cliente_id, prenda_id, cantidad, fecha) VALUES (?, ?, ?, ?)',
    [cliente_id, prenda_id, cantidad, fecha],
    err => {
      if (err) return res.status(500).send(err);
      res.send({ message: 'Venta registrada correctamente' });
    }
  );
});

app.put('/ventas/:id', (req, res) => {
  const id = req.params.id;
  const { cliente_id, prenda_id, cantidad, fecha } = req.body;
  conexion.query(
    'UPDATE ventas SET cliente_id=?, prenda_id=?, cantidad=?, fecha=? WHERE id=?',
    [cliente_id, prenda_id, cantidad, fecha, id],
    err => {
      if (err) return res.status(500).send(err);
      res.send({ message: `Venta con ID ${id} actualizada` });
    }
  );
});

app.delete('/ventas/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM ventas WHERE id=?', [id], err => {
    if (err) return res.status(500).send(err);
    res.send({ message: `Venta con ID ${id} eliminada` });
  });
});

// Iniciar Servidor

app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en el puerto ${PORT}`);
});