import AgentApi from "apminsight";

AgentApi.config()

import express from 'express';
import cors from 'cors'
import {toNodeHandler} from "better-auth/node";
import subjectsRouter from "./routes/subjects.js";
import usersRouter from "./routes/users.js";
import classesRouter from "./routes/classes.js";
import securityMiddleware from "./middleware/security.js";
import {auth} from "./lib/auth.js";

const app = express();
const port = 8000;

if (!process.env.FRONTEND_URL) {
    console.warn('FRONTEND_URL is not defined, CORS will block all cross-origin requests');
}

app.use(cors({
    origin: process.env.FRONTEND_URL || false,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.use(securityMiddleware)

app.use('/api/subjects', subjectsRouter)
app.use('/api/users', usersRouter)
app.use('/api/classes', classesRouter)

app.get('/', (req, res) => {
    res.json({message: 'Welcome to the Classroom API!'});
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
