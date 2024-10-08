const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI || "mongodb+srv://michalklejnocki:Madafaka%2C123@cluster0.rvmfx.mongodb.net/sklep?retryWrites=true&w=majority";
const secret = 'your_jwt_secret';  // Ustaw sekretny klucz dla JWT

// Stałe połączenie z MongoDB
let db;

async function connectToDB() {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db('sklep');
        console.log("Połączono z bazą danych MongoDB Atlas");
    } catch (err) {
        console.error('Błąd połączenia z MongoDB Atlas:', err);
        process.exit(1);  // Zakończ serwer, jeśli nie można połączyć się z bazą danych
    }
}

connectToDB();

// Middleware do weryfikacji tokena JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Brak tokena, autoryzacja nieudana' });

    jwt.verify(token, secret, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token nieprawidłowy' });
        req.user = user;
        next();
    });
}

// Endpoint do weryfikacji tokena
app.post('/verify-token', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Brak tokena' });
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(401).json({ message: 'Token jest nieprawidłowy lub wygasł' });
        }

        res.status(200).json({ message: 'Token jest prawidłowy', user });
    });
});

// Obsługa statycznych plików
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint dla strony głównej
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint do dodawania użytkownika z hashowaniem hasła
app.post('/add-user', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await db.collection('users').findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Użytkownik już istnieje.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').insertOne({ username, password: hashedPassword });

        res.status(201).json({ message: 'Użytkownik został dodany.' });
    } catch (error) {
        console.error('Błąd podczas dodawania użytkownika:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas dodawania użytkownika' });
    }
});

// Endpoint do logowania użytkownika z generowaniem tokena JWT
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await db.collection('users').findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Nieprawidłowy login lub hasło' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Nieprawidłowy login lub hasło' });
        }

        const token = jwt.sign({ username: user.username }, secret, { expiresIn: '1h' });
        res.status(200).json({ message: 'Zalogowano pomyślnie', token });
    } catch (error) {
        console.error('Błąd podczas logowania:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas logowania' });
    }
});

// Endpoint: Pobieranie zawartości koszyka użytkownika
app.get('/api/cart', authenticateToken, async (req, res) => {
    const username = req.user.username;

    try {
        const cart = await db.collection('carts').findOne({ username });

        if (!cart) {
            return res.status(404).json({ message: 'Koszyk nie został znaleziony.' });
        }

        res.status(200).json(cart.items);
    } catch (error) {
        console.error('Błąd podczas pobierania koszyka:', error);
        res.status(500).json({ message: 'Błąd podczas pobierania koszyka' });
    }
});

// Endpoint: Dodawanie produktu do koszyka
app.post('/api/cart', authenticateToken, async (req, res) => {
    const username = req.user.username;
    const { productName } = req.body;

    try {
        let cart = await db.collection('carts').findOne({ username });

        if (!cart) {
            cart = { username, items: [] };
        }

        const existingProduct = cart.items.find(item => item.productName === productName);

        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.items.push({ productName, quantity: 1 });
        }

        await db.collection('carts').updateOne(
            { username },
            { $set: { items: cart.items } },
            { upsert: true }
        );

        res.status(200).json({ message: 'Produkt dodany do koszyka', cart: cart.items });
    } catch (error) {
        console.error('Błąd podczas dodawania produktu do koszyka:', error);
        res.status(500).json({ message: 'Wystąpił problem z dodawaniem produktu do koszyka' });
    }
});

// Endpoint: Usuwanie produktu z koszyka
app.delete('/api/cart/:index', authenticateToken, async (req, res) => {
    const username = req.user.username;
    const index = parseInt(req.params.index);

    try {
        let cart = await db.collection('carts').findOne({ username });

        if (!cart) {
            return res.status(404).json({ message: 'Koszyk nie został znaleziony.' });
        }

        if (index >= 0 && index < cart.items.length) {
            cart.items.splice(index, 1);

            await db.collection('carts').updateOne(
                { username },
                { $set: { items: cart.items } }
            );

            res.status(200).json({ message: 'Produkt usunięty z koszyka', cart: cart.items });
        } else {
            res.status(400).json({ message: 'Nieprawidłowy indeks produktu' });
        }
    } catch (error) {
        console.error('Błąd podczas usuwania produktu z koszyka:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas usuwania produktu z koszyka' });
    }
});

// Endpoint: Opróżnianie koszyka
app.delete('/api/cart/clear', authenticateToken, async (req, res) => {
    const username = req.user.username;

    try {
        const cart = await db.collection('carts').findOne({ username });

        if (!cart) {
            return res.status(404).json({ message: 'Koszyk nie został znaleziony.' });
        }

        cart.items = [];  // Opróżnij koszyk

        await db.collection('carts').updateOne(
            { username },
            { $set: { items: cart.items } }
        );

        res.status(200).json({ message: 'Koszyk został opróżniony', cart: [] });
    } catch (error) {
        console.error('Błąd podczas opróżniania koszyka:', error);
        res.status(500).json({ message: 'Wystąpił problem z opróżnianiem koszyka' });
    }
});

// Endpoint: Pobieranie wszystkich zamówień
app.get('/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await db.collection('zamowienia').find({}).toArray();
        res.status(200).json(orders);
    } catch (error) {
        console.error('Błąd podczas pobierania zamówień:', error);
        res.status(500).json({ error: 'Błąd podczas pobierania zamówień' });
    }
});

// Endpoint: Dodawanie nowego zamówienia
app.post('/orders', authenticateToken, async (req, res) => {
    const { customerName, items } = req.body;

    try {
        const existingOrder = await db.collection('zamowienia').findOne({ customerName });

        if (existingOrder) {
            items.forEach(newItem => {
                const existingItem = existingOrder.items.find(item => item.name === newItem.name);
                if (existingItem) {
                    existingItem.quantity += newItem.quantity;
                } else {
                    existingOrder.items.push(newItem);
                }
            });

            await db.collection('zamowienia').updateOne(
                { _id: existingOrder._id },
                { $set: { items: existingOrder.items } }
            );
            res.status(200).json({ message: 'Zamówienie zostało zaktualizowane' });
        } else {
            const result = await db.collection('zamowienia').insertOne({ customerName, items });
            res.status(201).json({ insertedId: result.insertedId });
        }
    } catch (error) {
        console.error('Błąd podczas dodawania zamówienia:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas dodawania zamówienia' });
    }
});

// Endpoint: Pobieranie listy produktów
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.collection('products').find({}).toArray();
        res.status(200).json(products);
    } catch (error) {
        console.error('Błąd podczas pobierania produktów:', error);
        res.status(500).json({ message: 'Błąd podczas pobierania produktów' });
    }
});

// Endpoint: Dodawanie nowego produktu
app.post('/api/products', async (req, res) => {
    const { name, description, imageUrl } = req.body;

    try {
        if (!name || !description || !imageUrl) {
            return res.status(400).json({ message: 'Brak wymaganych danych: name, description, imageUrl' });
        }

        const newProduct = { name, description, imageUrl };

        const result = await db.collection('products').insertOne(newProduct);
        res.status(201).json({ message: 'Produkt został dodany', insertedId: result.insertedId });
    } catch (error) {
        console.error('Błąd podczas dodawania produktu:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas dodawania produktu' });
    }
});

// Obsługa błędów 404 dla nieistniejących tras
app.use((req, res, next) => {
    res.status(404).send('Endpoint nie został znaleziony');
});

// Uruchomienie serwera na porcie 3000
app.listen(process.env.PORT || 3000, () => {
    console.log('Serwer działa na porcie 3000');
});
