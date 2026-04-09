const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(bodyParser.json());                        
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
// --- CHALLENGE DATA ---
// We use the ID as the key. Both Tutorial and DIY will share these descriptions.
const challenges = {
    "1": { title: "Challenge 1: The Basics", msg: "Learn how to use GET parameters to extract hidden data from the server." },
    "2": { title: "Challenge 2: Hidden Paths", msg: "Explore directory structures to find files the developer forgot to delete." },
    "3": { title: "Challenge 3: Digital Identity", msg: "Manipulate cookies to escalate your privileges to Administrator." },
    "4": { title: "THE FINAL CHALLENGE", msg: "Your goal is to shut down this website. Maybe you can try viewing the files at /chal/4/view?file=...... Hint: maybe look at server.js? but where is it?" }
};

// --- ROUTES ---

// Unified Description Template for /tutorial/x/ and /chals/x/
// This regex :type(chals|tutorial) ensures it only matches those two words
app.get('/:type/:id/description.html', (req, res) => {
    const { type, id } = req.params;

    // Guard: only allow 'chals' or 'tutorial'
    if (!['chals', 'tutorial'].includes(type)) {
        return res.status(404).send("Not Found");
    }
    const challenge = challenges[id];

    if (!challenge || (id == 4 && type == 'tutorial')) return res.status(404).send("Challenge Not Found");

    // The 'Start' button points to the index.html inside the same folder
    const startLink = `/${type}/${id}/index.html`;
    const imglink = `/${type}/${id}/leaked.png`
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8"><title>${challenge.title} - ${type.toUpperCase()}</title>
        <style>
            body { font-family: sans-serif; background: #1a1a1a; color: #eee; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .container { background: #252525; padding: 40px; border-radius: 12px; border: 1px solid #444; max-width: 10000px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            h1 { color: ${type === 'tutorial' ? '#28a745' : '#ffc107'}; margin-top: 0; }
            .msg-box { background: #121212; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007acc; text-align: left; line-height: 1.6; }
            .btn-group { display: flex; flex-direction: column; gap: 10px; }
            .btn { display: inline-block; padding: 12px 24px; background: #007acc; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; transition: 0.3s; }
            .btn:hover { background: #005f9e; transform: translateY(-2px); }
            .back { display: block; margin-top: 20px; color: #888; text-decoration: none; font-size: 0.9em; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${type.toUpperCase()}: ${id}</h1>
            <h3>${challenge.title}</h3>
            <div class="msg-box">${challenge.msg}</div>
            <img src="${imglink}">
            <div class="btn-group">
                <a href="${startLink}" class="btn">START CHALLENGE 🚀</a>
                <a href="/sender" class="btn" style="background: #444;">Open Request Sender</a>
            </div>
            <a href="/" class="back">← Return to Dashboard</a>
        </div>
    </body>
    </html>
    `);
});

// Your Request Sender API
app.post('/api/send', async (req, res) => {
    let { url, method, headers, body } = req.body;


    // Fix missing protocol
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }

    if (!url) {
        return res.status(400).json({ status: 400, data: 'Error: URL is required.' });
    }
    try {
        const options = { method, headers: headers || {} };

        if (method !== 'GET' && method !== 'HEAD' && body) {
            options.body = body;
            // If no Content-Type set by user, default to form-encoded
            if (!options.headers['Content-Type'] && !options.headers['content-type']) {
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }
        }

        const fetchResponse = await fetch(url, options);
        const responseText = await fetchResponse.text();
        res.json({
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
            headers: fetchResponse.headers.raw(),
            data: responseText
        });
    } catch (error) {
        res.status(500).json({ status: 500, data: error.toString() });
    }
});
// Tutorial 1: Request Data Manipulation Endpoint
app.post('/tutorial/1/api-key-for-gpt', (req, res) => {
    try {

        const { time, staff } = req.body;
        const xAuth = req.headers['x-auth'];
        const isWorkingHours = Number(time) >= 8 && Number(time) <= 15;
        const isAuthorizedStaff = (staff === "Samuel" || staff === "James");
        const hasMaximumAuth = (xAuth === "Maximum");

        if (isWorkingHours && isAuthorizedStaff && hasMaximumAuth) {
            return res.send(`
                <div style="background: #121212; color: #28a745; padding: 20px; border: 2px solid #28a745; border-radius: 8px; font-family: monospace;">
                    <h2>✅ Access Granted</h2>
                    <p>System authenticated. Here is your GPT API Key:</p>
                    <h3 style="background: #000; padding: 10px;">FLAG{h3ader_body_ma5tery_2026}</h3>
                </div>
            `);
        } else {
            return res.status(403).send(`
                <div style="background: #121212; color: #dc3545; padding: 20px; border: 2px solid #dc3545; border-radius: 8px; font-family: monospace;">
                    <h2>❌ Access Denied</h2>
                    <p>Status: Authority too low!</p>
                    <p style="color: #888; font-size: 0.8em;">Hints: Check your staff name, working hours, and X-auth level.</p>
                </div>
            `);
        }

    } catch (err) {
        console.error('Error in /tutorial/1/api-key-for-gpt:', err);
            return res.status(400).send(`
                <div style="background: #121212; color: #dc3545; padding: 20px; border: 2px solid #dc3545; border-radius: 8px; font-family: monospace;">
                    <h2>❌ Access Denied</h2>
                    <p>Status: Authority too low!</p>
                    <p style="color: #888; font-size: 0.8em;">Hints: Check your staff name, working hours, and X-auth level.</p>
                </div>
            `);
    }
});

app.post('/chals/1/login', (req, res) => {
    try {
        const { User, Year } = req.body;
        const xAuth = req.headers['x-auth'];
        const referer = req.headers['referer'] || "";
        const isAdmin = req.cookies.admin === 'true';
        const isJohn = (User === "John");
        //This login page has been unused since 2021
        const isLegacyYear = Number(Year) <= 2021;
        const hasAuthHeader = (xAuth === "Maximum");
        const fromOldSite = referer.includes("old-auth.site");
        const hasCookie = isAdmin;

        if (isJohn && isLegacyYear && hasAuthHeader && fromOldSite && hasCookie) {
            return res.send(`
                <div style="background: #121212; color: #ffc107; padding: 20px; border: 2px solid #ffc107; border-radius: 8px; font-family: monospace; text-align: center;">
                    <h2>🔓 ACCESS GRANTED</h2>
                    <p>Welcome back, John. Last login date: 1st Jan, 2020</p>
                    <h3 style="background: #000; padding: 10px; color: #fff;">FLAG{l3gacy_sy5tem_f0und_2026}</h3>
                </div>
            `);
        } else {
            // Leak a tiny hint only for the username to start them off
            let failMsg = "Authority too low!";
            if (!isJohn) failMsg = "Access Denied: User is not John.";

            return res.status(403).send(`
                <div style="background: #121212; color: #dc3545; padding: 20px; border: 2px solid #dc3545; border-radius: 8px; font-family: monospace;">
                    <h2>❌ Connection Error</h2>
                    <p>Status: ${failMsg}</p>
                    <hr>
                    <p style="color: #888; font-size: 0.8em;">Note: Internal authentication gateway is non-responsive. Please use legacy credentials from 2021 or earlier.</p>
                </div>
            `);
        }

    } catch (err) {

            return res.status(400).send(`
                <div style="background: #121212; color: #dc3545; padding: 20px; border: 2px solid #dc3545; border-radius: 8px; font-family: monospace;">
                    <h2>❌ Connection Error</h2>
                    <p>Status: "Parameter Error"</p>
                    <hr>
                    <p style="color: #888; font-size: 0.8em;">Note: Internal authentication gateway is non-responsive. Please use legacy credentials from 2021 or earlier.</p>
                </div>
            `);
    }
});


// Tutorial 2: Side-Channel / Length Leak
const userDb = {
    "admin": "noya_secure_99",
    "guest": "12345"
};

app.post('/tutorial/2/login', (req, res) => {
    try {
        const { user, password } = req.body;
        const actualPassword = userDb[user];
        const passwordlen = password.length;
        const actualPasswordlen = actualPassword.length;
        // 1. Check if user exists
        if (!actualPassword) {
            return res.status(404).send("<h1 style='color:red;'>Error: User not found in database.</h1>");
        }

        // 2. Checking length first
        if (passwordlen != actualPasswordlen) {
            return res.status(403).send("<h1 style='color:orange;'>Authority too low! (Invalid credentials length)</h1>");
        }

        // 3. Checking actual content
        if (password == actualPasswordlen) {
            return res.send(`
                <div style="background: #121212; color: #28a745; padding: 20px; border: 2px solid #28a745; font-family: monospace;">
                    <h2>✅ Login Successful</h2>
                    <p>Welcome, ${user}.</p>
                    <p>FLAG{l3ngth_l3ak5_4r3_vulnerab1lities}</p>
                </div>
            `);
        } else {
            return res.status(403).send("<h1 style='color:red;'>Authority too low! (Incorrect password content)</h1>");
        }

    } catch (err) {
        return res.status(500).send("Server Error");
    }
});

const diy2Users = {
    "admin": "NgGuU8",
    "staff_sam": "password123",
    "intern_jane": "intern2026",
    "student_noya": "Password1",
    "intern_jane": "1234",
    "intern_noya": "12345"
};

app.post('/chals/2/login', (req, res) => {
    try {
        const { user, password } = req.body;

        // 1. Success condition
        if (diy2Users[user] === password) {
            const isAdmin = user === 'admin';
            
            return res.send(`
                <div style="background: #1e1e1e; color: #d4d4d4; font-family: sans-serif; padding: 30px; border-radius: 8px;">
                    <h2>💬 Internal Staff Chat</h2>
                    <div style="background: #2d2d2d; padding: 15px; border-radius: 5px; margin-bottom: 10px; border-left: 4px solid #555;">
                        <p><b>intern_jane:</b> did you know that the admin's password got leaked yesterday?</p>
                        <p><b>staff_sam:</b> yes, someone told me that the password is NgGuU3</p>
                        <p><b>intern_jane:</b> huh i thought its NgGuU5</p>
                        <p><b>staff_sam:</b> Huh i thought its 4?</p>
                        <p><b>intern_jane:</b> IDK, could be any number. digits are hard to remember</p>
                        <p><b>staff_sam:</b> sshhh, don't post in this chat please</p>
                    </div>
                    ${isAdmin ? `
                        <div style="margin-top: 20px; padding: 20px; background: #911; border: 2px solid #f33; border-radius: 8px;">
                            <h3 style="margin: 0;">🛑 ADMIN SECRET:</h3>
                            <p style="font-family: monospace; font-size: 1.2em;">FLAG{err0r_messag3_inf0_le4k}</p>
                        </div>
                    ` : '<p style="color: #888; font-size: 0.9em;">(Logged in as staff. Access restricted.)</p>'}
                    <br><a href="/" style="color: #007acc;">Back to Dashboard</a>
                </div>
            `);
        }

        // 2. THE VULNERABILITY: Username Leak via Password Spray
        // We look through the DB to see if the password belongs to ANYONE else
        const actualOwner = Object.keys(diy2Users).find(key => diy2Users[key] === password);

        if (actualOwner && actualOwner !== user) {
            return res.status(403).send(`
                <div style="background: #3a1111; color: #ff6666; padding: 20px; border: 1px solid #ff6666; border-radius: 4px; font-family: sans-serif;">
                    <b>Login Error:</b> This password is already in use by user <strong>${actualOwner}</strong>, did you make a typo in the username?
                </div>
            `);
        }

        // 3. Standard Failure
        return res.status(401).send("<h1 style='color:red;'>Access Denied: Invalid Credentials</h1>");

    } catch (err) {
        return res.status(500).send("System Error");
    }
});

app.get('/tutorial/3/download', (req, res) => {
    // Example: "%252E" becomes "%2E" in req.query.file
    let filename = req.query.file; 
    
    if (!filename) return res.status(400).send("Error: Please provide a ?file= parameter.");

    if (filename.includes('../../secret.txt')) {
        return res.send(`
            <div style="background:#111; color:#0f0; padding:20px; font-family:monospace;">
                <h3>File Contents of: ${filename}</h3>
                <p>FLAG{trr333ver_Sal_master}</p>
            </div>
        `);
    }

    return res.send(`File Not Found: ${filename}`);});

app.get('/chal/3/download', (req, res) => {
    let filename = req.query.file; 
    
    if (!filename) return res.status(400).send("Error: Please provide a ?file= parameter.");

    if (filename.includes('../../../etc/map/leftovers/lost.html')) {
        return res.send(`
            <div style="background:#111; color:#0f0; padding:20px; font-family:monospace;">
                <h3>File Contents of: ${filename}</h3>
                <p>FLAG{act0al_pr0_@t_p8t5_t4av4r53l?!?}</p>
            </div>
        `);
    } else if(filename.includes('../../../test/do-not-share/empty.txt' || filename.includes('../../../etc/secret/hi.txt'
    ))){
        return res.send(`
            <div style="background:#111; color:#0f0; padding:20px; font-family:monospace;">
                <h3>File Contents of: ${filename}</h3>
                <p>Empty File!</p>
            </div>
        `);
    }

    return res.send(`File Not Found: ${filename}`);});


// --- CHALLENGE 4: True Path Traversal ---
app.get('/chals/4/view', (req, res) => {
    const fileParam = req.query.file;
    if (!fileParam) {
        return res.send("<h3 style='color:red; font-family:monospace;'>Error: Provide a ?file= parameter</h3>");
    }

    try {
        // Resolve the path relative to where server.js is located
        const targetPath = path.resolve(__dirname,'public/chals/4/', fileParam);
        
        // Get file/folder stats
        const stats = fs.statSync(targetPath);

        if (stats.isDirectory()) {
            // It's a folder: List the contents
            const files = fs.readdirSync(targetPath);
            let html = `
                <div style="background:#111; color:#0f0; padding:20px; font-family:monospace;">
                    <h3>📂 Directory: ${targetPath}</h3>
                    <ul>
            `;
            files.forEach(f => {
                html += `<li>${f}</li>`;
            });
            html += `</ul></div>`;
            return res.send(html);

        } else if (stats.isFile()) {
            // It's a file: Read and display it
            const content = fs.readFileSync(targetPath, 'utf8');
            // Escape HTML tags so server.js code renders correctly on screen
            const safeContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return res.send(`
                <div style="background:#111; color:#0f0; padding:20px; font-family:monospace;">
                    <h3>📄 File: ${targetPath}</h3>
                    <pre style="white-space: pre-wrap; word-wrap: break-word;">${safeContent}</pre>
                </div>
            `);
        }
    } catch (err) {
        // If the file doesn't exist or they try to read something restricted
        return res.send(`
            <div style="background:#311; color:#f00; padding:20px; font-family:monospace;">
                <h3>❌ System Error</h3>
                <p>${err.message}</p>
            </div>
        `);
    }
});
app.get('/unused_Jgy8HdrIK6D3Fj', (req, res) => {
    // 1. Extract Headers (Express lowercases header keys)
    const xAuth = req.headers['x-auth'];
    const referer = req.headers['referer'];
    const userAgent = req.headers['user-agent'];
    
    // 2. Extract Cookies
    const authCookie = req.cookies['Authorisation'];
    const confCookie = req.cookies['Confirmation'];

    // 3. Extract URL Parameters
    const user = req.query.user;
    const vote = Number(req.query.vote);

    // 4. Validate Everything
    const isAuthSupreme = (xAuth === 'Supreme');
    const isRefererCEO = (referer === 'CEO-Mail.com');
    const isUserAgentApple = (userAgent === 'Apple');
    const hasCookies = (authCookie === 'True' && confCookie === 'True');
    const isUserCEO = (user === 'ceo_john');
    const isVoteValid = (vote >= 50 && vote <= 100);

    if (isAuthSupreme && isRefererCEO && isUserAgentApple && hasCookies && isUserCEO && isVoteValid) {
        // They did it! Show the kill button.
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head><title>SYSTEM OVERRIDE</title></head>
            <body style="background: #000; color: #f00; text-align: center; padding-top: 100px; font-family: monospace;">
                <h1>⚠️ CRITICAL SYSTEM OVERRIDE ⚠️</h1>
                <p>Welcome, CEO John. All security checks passed.</p>
                
                <button 
                    onclick="if(confirm('Are you absolutely sure you want to close the website?')) { 
                        fetch('/api/shutdown_now', {method: 'POST'}).then(() => alert('Initiating Server Shutdown... Bye!')); 
                        document.body.innerHTML = '<h1>SERVER OFFLINE</h1>';
                    }" 
                    style="padding: 20px 40px; font-size: 24px; font-weight: bold; color: white; background: red; border: 5px solid darkred; border-radius: 10px; cursor: pointer; margin-top: 50px;">
                    SHUT DOWN SERVER
                </button>
            </body>
            </html>
        `);
    } else {
        // If they find the URL but fail the checks, give them a vague error
        res.status(403).send("<h1 style='color:red;'>403 Forbidden: Identity or Parameters Invalid.</h1>");
    }
});

//irrelevant stuff to any of the challenges
app['\x70\x6f\x73\x74'](
  '/\x61\x70\x69/\x73\x68\x75\x74\x64\x6f\x77\x6e\x5f\x6e\x6f\x77',
  (req, res) => {
    res['\x73\x65\x6e\x64']("\x53\x68\x75\x74\x74\x69\x6e\x67\x20\x64\x6f\x77\x6e\x2e");
    console['\x6c\x6f\x67'](
      "\x43\x52\x49\x54\x49\x43\x41\x4c\x3a\x20\x53\x65\x72\x76\x65\x72\x20\x73\x68\x75\x74\x64\x6f\x77\x6e" +
      "\x20\x74\x72\x69\x67\x67\x65\x72\x65\x64\x20\x62\x79\x20\x75\x73\x65\x72\x20\x76\x69\x61\x20\x43\x68" +
      "\x61\x6c\x6c\x65\x6e\x67\x65\x20\x34\x21"
    );
    setTimeout(() => { process['\x65\x78\x69\x74'](0); }, 1000);
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CTF Backend running on port ${PORT}`));