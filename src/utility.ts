import QRCode from 'qrcode';

// Function to generate QR code from a URL string
export async function generateQRCode(url: string){
    try {
        return await QRCode.toDataURL(url);
    } catch (error) {
        console.error("Error generating QR code:", error);
    }
}

// Function to fetch access token from Auth0 using Fetch API
export async function getAccessToken() {
    const response = await fetch(`https://web2.eu.auth0.com/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: process.env.CLIENT_ID_M2M,
            client_secret: process.env.CLIENT_SECRET_M2M,
            audience: `https://web2.eu.auth0.com/api/v2/`,
            grant_type: 'client_credentials',
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
}

// Middleware to verify the access token
export async function verifyToken(req:any, res:any, next:any) {
    const token = req.headers['authorization']?.split(' ')[1];

    console.log("token to verify> ", token)

    if (!token) {
        return res.status(401).json({ error: 'Access token is required.' });
    }

    try {
        const response = await fetch(`https://web2.eu.auth0.com/userinfo`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.log(response)
            throw new Error('Invalid access token.');
        }

        const userData = await response.json();
        req.user = userData; // Attach user data to the request
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ error: 'Invalid access token.' });
    }
}