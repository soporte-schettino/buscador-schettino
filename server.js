const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ================= CONEXIÓN A SUPABASE =================
const SUPABASE_URL = 'https://tepwekhskrxqxidovsia.supabase.co';
const SUPABASE_SECRET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcHdla2hza3J4cXhpZG92c2lhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTY3MDI4MywiZXhwIjoyMTA3MjQ2MjgzfQ.uzBC3dxXl7QQxrF5r8NWh3xgtIcqCUUqkg_RxCg3LZM'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

console.log('Conectado a Supabase en la nube.');

// ================= API ENDPOINTS =================

// 1. LOGIN CORPORATIVO SEGURO
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Intento de login recibido para usuario:", username);
        
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('*')
            .or(`username.eq.${username},email.eq.${username}`)
            .single();

        if (error || !user) {
            console.log("Error de Supabase o usuario no encontrado:", error);
            return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        
        if (isValid) {
            res.json({ 
                success: true, 
                user: { 
                    username: user.username, 
                    email: user.email, 
                    rol: user.rol, 
                    avatar_url: user.avatar_url 
                } 
            });
        } else {
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    } catch (err) {
        console.error("Error crítico en el login:", err);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// 2. OBTENER BUJES DE HULE
app.get('/api/bujes-hule', async (req, res) => {
    const { data, error } = await supabase.from('bujes_hule').select('*');

    if (error) {
        console.error("Error al obtener bujes de hule:", error.message);
        return res.status(500).json({ error: error.message });
    }

    const formateados = (data || []).map(item => ({
        ID: item.id,
        MATERIAL: 'HULE',
        CLAVE: item.clave || '',
        TIPO: item.tipo || 'Sin dato',
        "DIAMETRO EXTERIOR": item.diametro_exterior || '',
        "LARGO EXTERIOR": item.largo_exterior || '',
        "LARGO INTERIOR": item.largo_interior || '',
        "DIAMETRO INTERIOR": item.diametro_interior || '',
        "CEJA": item.ceja || '',
        P: item.plano_url || 'No se cuenta con Plano sobre esta Clave'
    }));
    res.json(formateados);
});

// 3. OBTENER BUJES DE BRONCE
app.get('/api/bujes-bronce', async (req, res) => {
    const { data, error } = await supabase.from('bujes_bronce').select('*');

    if (error) {
        console.error("Error al obtener bujes de bronce:", error.message);
        return res.status(500).json({ error: error.message });
    }

    const formateados = (data || []).map(item => ({
        ID: item.id,
        MATERIAL: 'BRONCE',
        CLAVE: item.clave || '',
        TIPO: 'Sin dato',
        "DIAM. (A) (+.010\")(-.000\")": item.diam_a || '',
        "DIAM. (B) (+.015\")(-.000\")": item.diam_b || '',
        "LONG. © (±.010\")": item.long_c || '',
        P: item.plano_url || 'No se cuenta con Plano sobre esta Clave'
    }));
    res.json(formateados);
});


// ================= GESTIÓN PARA ADMIN =================

// GESTIÓN DE BUJES DE HULE
app.post('/api/bujes-hule', async (req, res) => {
    const { clave, tipo, diametro_exterior, largo_exterior, largo_interior, diametro_interior, ceja, plano_url } = req.body;
    const { data, error } = await supabase.from('bujes_hule').insert([{ clave, tipo, diametro_exterior, largo_exterior, largo_interior, diametro_interior, ceja, plano_url }]).select();
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, data });
});

app.put('/api/bujes-hule/:id', async (req, res) => {
    const { id } = req.params;
    const { clave, tipo, diametro_exterior, largo_exterior, largo_interior, diametro_interior, ceja, plano_url } = req.body;
    const { error } = await supabase.from('bujes_hule').update({ clave, tipo, diametro_exterior, largo_exterior, largo_interior, diametro_interior, ceja, plano_url }).eq('id', id);
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true });
});

app.delete('/api/bujes-hule/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('bujes_hule').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true });
});

// GESTIÓN DE BUJES DE BRONCE
app.post('/api/bujes-bronce', async (req, res) => {
    const { clave, diam_a, diam_b, long_c, plano_url } = req.body;
    const { data, error } = await supabase.from('bujes_bronce').insert([{ clave, diam_a, diam_b, long_c, plano_url }]).select();
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, data });
});

app.put('/api/bujes-bronce/:id', async (req, res) => {
    const { id } = req.params;
    const { clave, diam_a, diam_b, long_c, plano_url } = req.body;
    const { error } = await supabase.from('bujes_bronce').update({ clave, diam_a, diam_b, long_c, plano_url }).eq('id', id);
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true });
});

app.delete('/api/bujes-bronce/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('bujes_bronce').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true });
});

// GESTIÓN DE USUARIOS
app.get('/api/usuarios', async (req, res) => {
    const { data, error } = await supabase.from('usuarios').select('id, username, email, rol');
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json(data);
});

app.post('/api/usuarios', async (req, res) => {
    try {
        const { username, email, password, rol } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const { error } = await supabase.from('usuarios').insert([{ username, email, password: hashedPassword, rol }]);
        
        if (error) {
            if (error.code === '23505' || error.message.includes('unique constraint')) {
                return res.status(400).json({ success: false, message: 'Ese nombre de usuario ya se encuentra en uso.' });
            }
            return res.status(400).json({ success: false, message: error.message });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

app.put('/api/usuarios/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevoPassword } = req.body;
        
        console.log("=== INTENTO DE CAMBIO DE CONTRASEÑA ===");
        console.log("ID recibido en la ruta:", id);

        if (!nuevoPassword) {
            return res.status(400).json({ success: false, message: 'La nueva contraseña es obligatoria' });
        }

        const hashedPassword = await bcrypt.hash(nuevoPassword, 10);

        const { data, error } = await supabase
            .from('usuarios')
            .update({ password: hashedPassword })
            .eq('id', id)
            .select();

        if (error) {
            return res.status(400).json({ success: false, message: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: 'No se encontró el usuario con ese ID en la base de datos' });
        }

        res.json({ success: true, message: "Contraseña actualizada correctamente" });
    } catch (err) {
        console.error("Error crítico al actualizar contraseña:", err);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});


app.delete('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Servidor en la nube corriendo en http://localhost:${PORT}`);
});