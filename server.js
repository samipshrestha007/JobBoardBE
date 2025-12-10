// server/server.js
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const connectDB  = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const jobRoutes  = require('./routes/jobRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// mount the routers
app.use('/api/auth',authRoutes);
app.use('/api/jobs',jobRoutes);
app.use('/api/employees', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/users', userRoutes);



// catch-all 404
app.use((req, res) => {
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
