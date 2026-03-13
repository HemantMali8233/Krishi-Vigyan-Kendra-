const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
// Increase JSON body size limit so large bulk imports (e.g. 1000+ rows)
// can be processed without hitting the default 100kb limit.
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/disciplines', require('./routes/disciplineRoutes'));
app.use('/api/extension-activities', require('./routes/extensionActivityRoutes'));
app.use('/api/trainings', require('./routes/trainingRoutes'));
app.use('/api/data-entry', require('./routes/dataEntry'));
app.use('/api/common-data', require('./routes/commonData'));
app.use('/api/import', require('./routes/importRoutes'));
app.use('/api/year-lock', require('./routes/yearLockRoutes'));

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'KVK Backend API is running' });
});

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
