const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const sql = require('mssql');

const dbConfig = {
    user: 'sa',
    password: 'Admin1234!', 
    server: 'localhost', 
    database: 'Bufete',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('username', sql.VarChar, username)
        .query('SELECT * FROM users WHERE username = @username');
  
      if (result.recordset.length === 0) {
        return res.status(401).send('Usuario no encontrado');
      }
  
      const user = result.recordset[0];
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).send('Contraseña incorrecta');
      }
  
      res.send('Inicio de sesión exitoso');
    } catch (err) {
      console.error('Error al conectar a SQL Server:', err);
      res.status(500).send('Error en el servidor');
    }
  });
  

const connectDB = async () => {
    try {
        await sql.connect(dbConfig);
        console.log('Conectado a SQL Server');
    } catch (err) {
        console.error('Error al conectar a SQL Server:', err.message);
        process.exit(1);
    }
};

module.exports = { connectDB, sql };
