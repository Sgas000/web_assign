require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected to Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.once('open', async () => {
    console.log('MongoDB connected to Atlas');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(col => col.name));
});

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true }
});

const Book = mongoose.model('Book', bookSchema);

app.get('/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.status(200).json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/books', async (req, res) => {
    const { title, author, year, genre } = req.body;
    if (!title || !author || !year || !genre) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const newBook = new Book({ title, author, year, genre });
        await newBook.save();
        res.status(201).json(newBook);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/books/:id', async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.status(200).json(book);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/books/:id', async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.status(200).json({ message: 'Book deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/weather/:city', async (req, res) => {
    const city = req.params.city;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!city) {
        return res.status(400).json({ message: 'City is required' });
    }

    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
                q: city,
                appid: apiKey,
                units: 'metric'
            }
        });

        const weatherData = response.data;

        res.status(200).json({
            city: weatherData.name,
            temperature: `${weatherData.main.temp}°C`,
            condition: weatherData.weather[0].description
        });
    } catch (err) {
        if (err.response && err.response.status === 404) {
            res.status(404).json({ message: 'City not found' });
        } else {
            res.status(500).json({ message: 'Failed to fetch weather data', error: err.message });
        }
    }
});

app.get('/weather', async (req, res) => {
    const { city, country } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!city) {
        return res.status(400).json({ message: 'City is required' });
    }

    try {
        const query = country ? `${city},${country}` : city;

        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
                q: query,
                appid: apiKey,
                units: 'metric'
            }
        });

        const weatherData = response.data;

        res.status(200).json({
            city: weatherData.name,
            temperature: `${weatherData.main.temp}°C`,
            condition: weatherData.weather[0].description
        });
    } catch (err) {
        if (err.response && err.response.status === 404) {
            res.status(404).json({ message: 'City not found' });
        } else {
            res.status(500).json({ message: 'Failed to fetch weather data', error: err.message });
        }
    }
});

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
