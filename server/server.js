import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.js'
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./Ingest/index.js"

const app = express()
const port = 3000;

await connectDB()

//middleware
app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())

//api routs
app.get('/', (req , res)=> res.send('server is Live'))

app.use('/api/ingest',  serve({ client: inngest, functions }))

app.listen(port,()=>{
    console.log(`server Live On Port http://localhost:${port}`);   
} )