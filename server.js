const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
require("dotenv").config();
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 4000;

const initializePassport = require("./passportConfig");

initializePassport(passport);

// Middleware
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Middleware para establecer isAdmin
app.use((req, res, next) => {
  if (req.isAuthenticated() && req.user.email === 'pedro@gmail.com') { // Reemplaza con el correo específico
    req.session.isAdmin = true;
  } else {
    req.session.isAdmin = false;
  }
  next();
});

// Pasar isAdmin y user a las vistas
app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin;
  res.locals.user = req.user;
  next();
});


app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  const errorMessages = req.flash('error');
  res.render("login.ejs", { messages: { error: errorMessages } });
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  console.log(req.isAuthenticated());
  res.render("dashboard", { user: req.user.name });
});
app.get("/users/peliculas", checkNotAuthenticated, (req, res) => {
  res.render("peliculas.ejs", { user: req.user.name });
});

app.get("/users/verMovie", async (req, res) => {
  const movieId = req.query.movieId;

  // Ejemplo de enlaces de videos que podrías tener
  const movieVideos = {
    '786892': [{ key: 'https://player.cuevana.biz/player.php?h=xPGVAASKY7nq8KaEgwASgW.S.E5Wr8HwqVsXXKaLwa4jcxTar5R5z5rnqpRyHEXhQQRwOxVKDTX3drhpb7y0YUF3nmQDUpUmb1heRVkBPsowB_3TbN79YsAHVaB_7dcPCIjIPOXq4estnZkdGr1CXg--' }], //furiosa
    '1022789': [{ key: 'https://player.cuevana.biz/player.php?h=xPGVAASKY7nq8KaEgwASgW.S.E5Wr8HwqVsXXKaLwa4jcxTar5R5z5rnqpRyHEXhcDXH8y4O8hiyscOhBOANyapOIGG7fihiqW3yQ0bwRWeHpgNErJYSwILNSekuYbVDRu5VYnXCxa9ALYNZAiT6DA--' }], //intensamente 2
    '762441': [{ key: 'https://player.cuevana.biz/player.php?h=xPGVAASKY7nq8KaEgwASgW.S.E5Wr8HwqVsXXKaLwa4jcxTar5R5z5rnqpRyHEXhB099oZfU.gjMNq8cE40K8yxU2ejbXQxbydXzT16.RS50rmgS8PTO9IKoqrnSp62613vsGrg6MPIz.rxNIMDtrg--' }],//asi empezo el silencio
    '573435': [{ key: 'https://player.cuevana.biz/player.php?h=xPGVAASKY7nq8KaEgwASgW.S.E5Wr8HwqVsXXKaLwa4jcxTar5R5z5rnqpRyHEXh4OJRYmOg8cB1Mojn1UW2o89fx42_laj50PIiti3Y_EbncCK9ybRnfBN_U3s_T6KFMXF9pfeOS3zCQy.189Fgsg--' }], //badboys hasta la muerte
    '1016346': [{ key: 'https://player.cuevana.biz/player.php?h=xPGVAASKY7nq8KaEgwASgW.S.E5Wr8HwqVsXXKaLwa4jcxTar5R5z5rnqpRyHEXhaM8Iw2kk.i6izExpbo2rITwAg92xn5tSufZmXa6QZK734FLK6m38OQiuxUSFkw1LdLkqniAdcs1wcPi3tso4LA--' }], //ejecuta o muer
    '823464': [{ key: 'https://player.cuevana.biz/player.php?h=xPGVAASKY7nq8KaEgwASgW.S.E5Wr8HwqVsXXKaLwa4jcxTar5R5z5rnqpRyHEXhKM.HqZ0Ub8LWQNIUghtai83oBehqrOdNIzAvWZFfU1RlN9ZPd6M1QPa7KAMQyPh8Wwm6bw2mj8f25stL8Ty9Ug--' }],//gozilla y kong
    '955555': [{ key: 'https://doood.site/fakeplayer.php?h=038_DvDgIOFtn0TDuS9PLIvno9X8I7XpK5P4aQc7WGdE3_SwVkJRhtE60pClHQBAoWKtkDKZjb43XhcfEFwCXD.gblgDHQEqxG3zip1tW0TnuIg-' }], //fuerza bruta
    // Añade más películas y sus enlaces de video aquí
  };

  try {
    const options = { method: 'GET', headers: { accept: 'application/json' } };
    const respuesta = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=ce6c6eca048773cc1ff195955c0c3183&language=es-MX`, options);
    
    if (respuesta.status === 200) {
      const pelicula = await respuesta.json();
      
      // Agrega los videos manualmente si existen
      pelicula.videos = movieVideos[movieId] || [];
      
      res.render("verMovie", { pelicula });
    } else {
      res.send("Hubo un problema obteniendo los detalles de la película.");
    }
  } catch (error) {
    console.log(error);
    res.send("Hubo un error.");
  }
});


app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;
  let errors = [];

  console.log({
    name,
    email,
    password,
    password2
  });

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);
        if (results.rows.length > 0) {
          return res.render("register", {
            errors: [{ message: "Email already registered" }]
          });
        } else {
          pool.query(
            `INSERT INTO users (name, email, password)
             VALUES ($1, $2, $3)
             RETURNING id, password`,
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);

app.get("/users/admin", checkNotAuthenticated, (req, res) => {
  if (req.session.isAdmin) {
    res.render("admin.ejs");
  } else {
    res.redirect("/users/dashboard");
  }
});


function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/dashboard");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
