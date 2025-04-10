const dotenv = require('dotenv');
dotenv.config(); // ← This should be at the top before anything else

const bookingRoutes = require('./routes/booking');
const authRoutes = require('./routes/auth'); 

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const corsOptions = {
    origin: [
      'http://localhost:3000', // Local frontend
      'https://train-booking-frontend-mu.vercel.app' // Deployed frontend
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
  };
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/bookings', bookingRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
