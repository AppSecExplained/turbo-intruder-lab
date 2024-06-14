const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(
	session({
		secret: "your-secret-key",
		resave: false,
		saveUninitialized: true,
		cookie: { maxAge: 60000 },
	})
);

const users = [{ username: "jeremy", password: "password123" }];
let mfaCode = null;
let mfaExpiry = null;

app.get("/", (req, res) => {
	res.render("index", { message: null });
});

app.post("/login", (req, res) => {
	const { username, password } = req.body;
	const user = users.find((u) => u.username === username && u.password === password);
	if (user) {
		req.session.user = user;
		mfaCode = generateMfaCode();
		mfaExpiry = Date.now() + 60000; // 60 seconds from now
		res.redirect("/mfa");
	} else {
		res.render("index", { message: { type: "danger", text: "Login failed" } });
	}
});

app.get("/mfa", (req, res) => {
	if (!req.session.user) {
		res.render("index", { message: { type: "danger", text: "Please login first" } });
		return;
	}
	res.render("mfa", { message: null, mfaExpiry });
});

app.post("/mfa", (req, res) => {
	if (!req.session.user) {
		res.render("index", { message: { type: "danger", text: "Please login first" } });
		return;
	}
	const { code } = req.body;
	if (Date.now() > mfaExpiry) {
		res.render("mfa", { message: { type: "danger", text: "MFA code expired" }, mfaExpiry });
	} else if (code === mfaCode) {
		res.render("index", { message: { type: "success", text: "Login successful - challenge complete" } });
	} else {
		res.render("mfa", { message: { type: "danger", text: "Invalid MFA code" }, mfaExpiry });
	}
});

app.get("/mfa-code", (req, res) => {
	res.send(`MFA Code: ${mfaCode}`);
});

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});

function generateMfaCode() {
	return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a random 4-digit code
}
