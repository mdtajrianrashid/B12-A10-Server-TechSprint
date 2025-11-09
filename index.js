const express = require('express')
const app = express()
const port = 3000
const cors = require('cors')

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Server is running')
})



// MongoDB Connection
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://B12-A10:MDZDFk1V6Blx2KcF@cluster0.roajkzr.mongodb.net/?appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    await client.connect();
    
    // All APIs

    const db = client.db("B12-A10");
    const courseCollection = db.collection("all-courses");

    app.get("/all-courses", async (req, res) => {
      const result = await courseCollection.find().toArray();
      res.send(result);
    });




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})