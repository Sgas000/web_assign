require('dotenv').config();
console.log('MongoDB URI:', process.env.MONGO_URI); // Проверка
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Book Schema
const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true }
});

const Book = mongoose.model('Book', bookSchema);

// Routes

// Get all books
app.get('/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.status(200).json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new book
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

// Update a book
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

// Delete a book
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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const axios = require('axios');

// Weather API endpoint
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
                units: 'metric' // Use metric units for temperature in Celsius
            }
        });

        const weatherData = response.data;

        // Format response
        const formattedData = {
            city: weatherData.name,
            temperature: `${weatherData.main.temp}°C`,
            condition: weatherData.weather[0].description
        };

        res.status(200).json(formattedData);
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

        const formattedData = {
            city: weatherData.name,
            temperature: `${weatherData.main.temp}°C`,
            condition: weatherData.weather[0].description
        };

        res.status(200).json(formattedData);
    } catch (err) {
        if (err.response && err.response.status === 404) {
            res.status(404).json({ message: 'City not found' });
        } else {
            res.status(500).json({ message: 'Failed to fetch weather data', error: err.message });
        }
    }
});
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Load Swagger file
const swaggerDocument = YAML.load('./swagger.yaml');

// Setup Swagger middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
