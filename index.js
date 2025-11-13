// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const Joi = require('joi');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// ---- Firebase Admin Setup ----
const serviceAccount = require(path.join(__dirname, 'online-learning-platform-a10-firebase-adminsdk-fbsvc-7490a94502.json'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// ---- Middleware ----
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());

// Healthcheck
app.get('/', (req, res) => res.send({ ok: true, message: 'Server running' }));

// ---- MongoDB Setup ----
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ Missing MONGODB_URI');
  process.exit(1);
}
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

// ---- Auth Middlewares ----
async function verifyUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).send({ error: 'Invalid token' });
  }
}

function checkRole(requiredRole) {
  return async (req, res, next) => {
    const users = client.db(process.env.DB_NAME).collection('users');
    const found = await users.findOne({ email: req.user.email });
    if (!found) return res.status(403).send({ error: 'User not found' });
    if (found.role === requiredRole) return next();
    res.status(403).send({ error: 'Forbidden: wrong role' });
  };
}

// ---- Run Server ----
async function run() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const courses = db.collection('all-courses');
    const enrolled = db.collection('enrolled-courses');
    const users = db.collection('users');

    // ---- Validation ----
    const courseSchema = Joi.object({
      title: Joi.string().required(),
      image: Joi.string().uri().required(),
      price: Joi.number().min(0).required(),
      duration: Joi.string().required(),
      category: Joi.string().required(),
      description: Joi.string().required(),
      isFeatured: Joi.boolean().optional(),
      instructor: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        photo: Joi.string().uri().allow('')
      }).required()
    });

    // ---- User Endpoints ----
    app.get('/users', async (req, res) => {
      const { email } = req.query;
      if (!email) return res.status(400).send({ error: 'email query required' });
      const found = await users.findOne({ email });
      if (!found) return res.send({ role: 'student' });
      res.send({ role: found.role });
    });

    app.post('/users', async (req, res) => {
      const { email, name, photo, role = 'student' } = req.body;
      if (!email) return res.status(400).send({ error: 'Email required' });
      const existing = await users.findOne({ email });
      if (existing) return res.send(existing);
      const result = await users.insertOne({ email, name, photo, role });
      res.send({ insertedId: result.insertedId });
    });

    // ---- Public Endpoints ----
    app.get('/all-courses', async (req, res) => {
      const { category, search, page = 1, limit = 100 } = req.query;
      const q = {};
      if (category) q.category = category;
      if (search) q.title = { $regex: search, $options: 'i' };
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const list = await courses.find(q).skip(skip).limit(parseInt(limit)).toArray();
      res.send(list);
    });

    app.get('/courses/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.status(400).send({ error: 'Invalid id' });
      const doc = await courses.findOne({ _id: new ObjectId(id) });
      if (!doc) return res.status(404).send({ error: 'Course not found' });
      res.send(doc);
    });

    // ---- Featured courses endpoint ----
    app.get('/featured-courses', async (req, res) => {
      const limit = Math.min(parseInt(req.query.limit || '6', 10), 100);
      try {
        const list = await courses.find({ isFeatured: true }).sort({ createdAt: -1 }).limit(limit).toArray();
        const normalized = list.map(c => ({
          ...c,
          image: c.image || c.imageUrl || '',
        }));
        res.send(normalized);
      } catch (err) {
        console.error('Error fetching featured courses', err);
        res.status(500).send({ error: 'Server error' });
      }
    });

    // ---- Top Instructors endpoint ----
    app.get('/instructors', async (req, res) => {
      const limit = Math.min(parseInt(req.query.limit || '4', 10), 100);
      try {
        const instructorsFromUsers = await users.find({ role: 'instructor' }).limit(limit).toArray();
        if (instructorsFromUsers.length > 0) {
          const payload = instructorsFromUsers.slice(0, limit).map(u => ({ name: u.name, email: u.email, photo: u.photo || '' }));
          return res.send(payload);
        }
        const pipeline = [
          { $match: { 'instructor.email': { $exists: true } } },
          { $group: { _id: '$instructor.email', doc: { $first: '$instructor' } } },
          { $replaceRoot: { newRoot: '$doc' } },
          { $limit: limit }
        ];
        const list = await courses.aggregate(pipeline).toArray();
        res.send(list);
      } catch (err) {
        console.error('Error fetching instructors', err);
        res.status(500).send({ error: 'Server error' });
      }
    });

    // ---- Instructor Protected Endpoints ----
    app.post('/courses', verifyUser, checkRole('instructor'), async (req, res) => {
      const payload = req.body;
      const { error } = courseSchema.validate(payload);
      if (error) return res.status(400).send({ error: error.details[0].message });
      const result = await courses.insertOne({ ...payload, createdAt: new Date() });
      res.send({ insertedId: result.insertedId });
    });

    app.put('/courses/:id', verifyUser, checkRole('instructor'), async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.status(400).send({ error: 'Invalid id' });
      const payload = req.body;
      const updateDoc = { $set: { ...payload, updatedAt: new Date() } };
      const result = await courses.updateOne({ _id: new ObjectId(id) }, updateDoc);
      if (result.matchedCount === 0) return res.status(404).send({ error: 'Course not found' });
      res.send({ modifiedCount: result.modifiedCount });
    });

    app.delete('/courses/:id', verifyUser, checkRole('instructor'), async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.status(400).send({ error: 'Invalid id' });
      const result = await courses.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) return res.status(404).send({ error: 'Course not found' });
      res.send({ deletedCount: result.deletedCount });
    });

    app.get('/my-courses', verifyUser, checkRole('instructor'), async (req, res) => {
      const email = req.user.email;
      const list = await courses.find({ 'instructor.email': email }).toArray();
      res.send(list);
    });

    // ---- Student Protected Endpoints ----
    app.post('/enroll', verifyUser, checkRole('student'), async (req, res) => {
      const { courseId } = req.body;
      const userEmail = req.user.email;
      if (!courseId) return res.status(400).send({ error: 'courseId required' });
      if (!ObjectId.isValid(courseId)) return res.status(400).send({ error: 'Invalid courseId' });
      const already = await enrolled.findOne({ userEmail, courseId: new ObjectId(courseId) });
      if (already) return res.status(409).send({ error: 'Already enrolled' });
      const doc = { userEmail, courseId: new ObjectId(courseId), enrolledAt: new Date() };
      const result = await enrolled.insertOne(doc);
      res.send({ insertedId: result.insertedId });
    });

    app.get('/enrolled', verifyUser, checkRole('student'), async (req, res) => {
      const email = req.user.email;
      const list = await enrolled.aggregate([
        { $match: { userEmail: email } },
        {
          $lookup: {
            from: 'all-courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course'
          }
        },
        { $unwind: '$course' },
        { $project: { course: 1, enrolledAt: 1 } }
      ]).toArray();
      res.send(list);
    });

    // ---- Ping MongoDB ----
    // await client.db('admin').command({ ping: 1 });
    console.log('Connected to MongoDB');

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run().catch(console.dir);

app.listen(port, () => console.log(`Server running on port ${port}`));