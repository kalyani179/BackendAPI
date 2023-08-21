const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require("body-parser");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
mongoose.connect("mongodb://127.0.0.1:27017/sessionBookingDB", { useNewUrlParser: true }).then(
    ()=> console.log("DB connected")
);


const User = mongoose.model('User', {
  universityId: String,
  password: String,
});

const Session = mongoose.model('Session', {
  date: Date,
  bookedBy: String,
  booked: Boolean,
});

const SECRET_KEY = 'your-secret-key';
app.get("/",function(req,res){
  res.render("student_login");
})
app.post('/student/login', async (req, res) => {
  const { universityId, password } = req.body;
  const user = await User.findOne({ universityId, password });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ universityId }, SECRET_KEY);
  return res.json({ token });
});

app.get('/student/sessions', async (req, res) => {
  const sessions = await Session.find({ date: { $gte: new Date() }, booked: false });
  return res.json({ sessions });
});

app.post('/student/book', async (req, res) => {
  const { session_id } = req.body;
  const { universityId } = jwt.verify(req.headers.authorization.split(' ')[1], SECRET_KEY);

  const session = await Session.findOne({ _id: session_id, booked: false });
  if (!session) {
    return res.status(404).json({ message: 'Session not available' });
  }

  session.bookedBy = universityId;
  session.booked = true;
  await session.save();

  return res.json({ message: 'Session booked successfully' });
});

// Similar routes for Dean

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
