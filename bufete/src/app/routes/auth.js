const express = require('express');
const bcrypt = require('bcryptjs');
const sql = require('mssql');
const multer = require('multer');

const router = express.Router();

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

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Faltan datos de usuario o contraseña' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const existingUser = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM Users WHERE username = @username');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, hashedPassword)
            .query('INSERT INTO Users (username, password) VALUES (@username, @password)');

        res.status(201).json({ message: 'Usuario registrado' });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error en el registro' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Faltan datos de usuario o contraseña' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM Users WHERE username = @username');

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        res.status(200).json({ message: 'Inicio de sesión exitoso' });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload-file', upload.single('archivo'), async (req, res) => {
    const { nombreExpediente} = req.body;
    const archivoPDF = req.file.buffer;

    if (!nombreExpediente ||!archivoPDF) {
        return res.status(400).send('Faltan datos para subir el expediente');
    }

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('NombreExpediente', sql.VarChar, nombreExpediente)
            .input('ArchivoPDF', sql.VarBinary, archivoPDF)
            .query(`
                INSERT INTO Expedientes (NombreExpediente, ArchivoPDF)
                VALUES (@NombreExpediente, @ArchivoPDF)
            `);

        res.status(201).send('Expediente subido exitosamente');
    } catch (error) {
        console.error('Error al subir el expediente:', error);
        res.status(500).send('Error al subir el expediente');
    }
});


module.exports = router;
