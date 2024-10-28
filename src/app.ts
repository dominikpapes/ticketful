import express from 'express'
import fs from 'fs';
import https from 'https';
import path from "path";
import dotenv from "dotenv";
import { auth, requiresAuth } from 'express-openid-connect';
import {getAll, getCountTickets, getOne, newTicket} from "./db_access";
import {generateQRCode, getAccessToken, verifyToken} from "./utility";
dotenv.config();

const app = express()


const host = process.env.HOST
const port = process.env.PORT
const hostname = process.env.HOST_NAME

app.use(express.json())

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

const config = {
    authRequired : false,
    idpLogout : true,
    secret: process.env.SECRET,
    baseURL: `https://${host}:${port}`,
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: process.env.DOMAIN,
    clientSecret: process.env.CLIENT_SECRET,
    authorizationParams: {
        response_type: 'code' ,
        scope: "openid profile email"
    },
};


app.use(auth(config));

app.get('/', async (req, res) => {
    const count = await getAll();
    res.render('index', { count });
})

app.get('/ticket/:ticketId', requiresAuth(), async (req, res) => {
    const user = req.oidc.user;
    const user_name = user?.name
    console.log(user_name);
    const ticketId = req.params.ticketId;
    const data = await getOne(ticketId);
    const vatin = data.vatin
    const firstName = data.firstname
    const lastName = data.lastname
    const created_at = data.created_at
    res.render('ticket', { ticketId, vatin, firstName, lastName, created_at, user_name });
})

// @ts-ignore
app.post('/generate', async (req, res) => {
    try {
        const { vatin, firstName, lastName } = req.body;

        // Validate vatin: must be a string of exactly 10 digits
        const vatinPattern = /^\d{10}$/; // Regex for 10 digit number
        if (!vatinPattern.test(vatin)) {
            return res.status(400).json({ error: 'VATIN must be a 10-digit number.' });
        }

        // Validate firstName and lastName: must not be empty
        if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
            return res.status(400).json({ error: 'First name cannot be empty.' });
        }

        if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
            return res.status(400).json({ error: 'Last name cannot be empty.' });
        }

        // Check the number of generated tickets for current vatin
        const count = await getCountTickets(vatin);
        if (count < 3) { // Check if count is less than 3 to allow new ticket creation
            const uuid = await newTicket(vatin, firstName, lastName);// Create new ticket, returns uuid
            const ticket_url_qr = `https://${hostname}/tickets/${uuid}`;
            const ticket_url_local = '/ticket/' + uuid;
            const qr = await generateQRCode(ticket_url_qr);
            return res.json({ message: 'Ticket created successfully.', qr: qr, ticket_url: ticket_url_local}); // Send success response
        } else {
            return res.status(400).json({ error: 'You cannot create more than 3 tickets.' });
        }
    } catch (error) {
        console.error('Error fetching ticket count:', error);
        return res.status(500).json({ error: 'Internal Server Error' }); // Handle errors
    }
});

// app.post('/call_generate', async(req:any, res:any) => {
//     try {
//         const accessToken = await getAccessToken();
//
//         console.log(accessToken)
//
//         const { vatin, firstName, lastName } = req.body;
//
//         // Call the generate endpoint with the access token
//         const response = await fetch(`https://${host}:${port}/generate`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${accessToken}`,
//             },
//             body: JSON.stringify({ vatin, firstName, lastName }),
//         });
//
//         if (!response.ok) {
//             const errorData = await response.json(); // Parse the error response
//             return res.status(response.status).json({ error: errorData });
//         }
//
//         // Parse the response data
//         const responseData = await response.json();
//         return res.json(responseData);
//     } catch (error) {
//         console.error('Error in call_generate:', error);
//         return res.status(500).json({ error: 'Internal Server Error' });
//     }
// })

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app)
    .listen(port, function () {
        console.log(`Server running at https://${host}:${port}/`);
    });
