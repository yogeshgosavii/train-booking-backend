const dotenv = require('dotenv');
dotenv.config(); // ← This should be at the top before anything else

const bookingRoutes = require('./routes/booking');
const authRoutes = require('./routes/auth'); 

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/bookings', bookingRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
