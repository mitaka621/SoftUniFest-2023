const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const sql = require("mssql");
const bcrypt = require("bcryptjs");
const imageDataURI = require("image-data-uri");
const fileUpload = require("express-fileupload");
const { VarChar } = require("msnodesqlv8");
const stripe = require("stripe")(
  "sk_test_51O5kMYKg4hF84DwWPM185XGiEfWtf66AivCG6lhwloAKbXFuXtva19nbRriftQeJFZeDyBAKFIkFxeoxpWSaAV5900LXI1FScW"
);

let config = {
  server: "localhost",
  authentication: {
    type: "default",
    options: {
      userName: "user", 
      password: "1234", 
    },
  },
  options: {
    database: "PaymentServiceDB",
    validateBulkLoadParameters: false,
    encrypt: false,
  },
};

const app = express();
const port = 3000;
const secretKey = "hfjdks*#$#fhjkf*@$hdjvnqq!nbb689";

app.use(cors());
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/static", express.static(path.join(__dirname, "..", "UI")));
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:8888");

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  res.setHeader("Access-Control-Allow-Credentials", true);

  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "UI", "Login", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "UI", "Login", "register.html"));
});
app.post("/register", (req, res) => {
  const firstName = req.body.firstn;
  const LastName = req.body.lastn;
  const email = req.body.email;
  const password = req.body.psw;
  const usertype = req.body.usertype;

  bcrypt.genSalt(10, function (err, Salt) {
    bcrypt.hash(password, Salt, async function (err, hash) {
      if (err) {
        return console.log("Cannot encrypt");
      }
      try {
        let pool = await sql.connect(config);

        await pool
          .request()
          .input("FirstName", sql.NVarChar(255), firstName)
          .input("LastName", sql.NVarChar(255), LastName)
          .input("Email", sql.NVarChar(255), email)
          .input("Password", sql.Text, hash)
          .input("UserTypeId", sql.Int, usertype === "normal" ? 1 : 2)
          .query(
            "insert into Users(FirstName, LastName, Email, Password, UserTypeId)values(@FirstName,@LastName,@Email,@Password,@UserTypeId)"
          );

        await pool.close();
        sql.close();
      } catch (err) {
        console.error("Error: ", err);
      }
    });
  });

  res.sendFile(path.join(__dirname, "..", "UI", "Login", "succses.html"));
});
app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.psw;

  try {
    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input("Email", sql.NVarChar(255), email)
      .query("select Password,UserTypeId,Id from Users where Email=@Email;");
 
    sql.close();

    const hashedPassword = result.recordset[0].Password;
    bcrypt.compare(password, hashedPassword, function (err, isMatch) {
      if (err) {
        res.sendFile(path.join(__dirname, "..", "UI", "Login", "fail.html"));
      } else if (!isMatch) {
        res.sendFile(path.join(__dirname, "..", "UI", "Login", "fail.html"));
      } else {
        const token = jwt.sign({ email: email }, secretKey);
        res.cookie("token", token, {
          maxAge: 3600000,
          httpOnly: true,
        });
        res.cookie("Id", result.recordset[0].Id);
        if (Number(result.recordset[0].UserTypeId) === 1) {
          res.status(200).redirect("/main");
        } else res.status(200).redirect("/dashboard");
      }
    });
  } catch (err) {
    res.sendFile(path.join(__dirname, "..", "UI", "Login", "fail.html"));
  }
});

app.get("/dashboard", authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "UI", "dashboard.html"));
});

app.get("/main", authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "UI", "main.html"));
});

app.get("/businesses", authenticateToken, async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input("Id", sql.Int, req.cookies.Id)
      .query(
        "select Email,b.Id,b.Name,b.ImgURL,b.Description from UsersBusineses as ub join Business as b on ub.BusinessId=b.Id join Users as u on ub.UsersId=u.Id where UsersId=@Id"
      );

    const response2 = await pool
      .request()
      .input("id", sql.Int, req.cookies.Id)
      .query("select Email from Users where Id=@id");
    await pool.close();
    sql.close();

    obj = { email: response2.recordset[0].Email, obj: result.recordset };
    res.send(obj).status(200);

  } catch (err) {
    console.log(err);
  }
});

app.get("/getitems/:id", authenticateToken, async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input("Id", sql.Int, req.params.id)
      .query(
        "select p.ImgURL, p.Name,p.Price,p.Quantity,p.Description from Business as b join BusinessProducts as bp on b.Id=bp.BusinessId join Products as p on bp.ProductsId=p.Id where b.Id=@Id"
      );
    await pool.close();
    sql.close();
    res.send(result.recordset).status(200);
  } catch (err) {
    console.log(err);
  }
});

app.post("/logOut", authenticateToken, (req, res) => {
  res.clearCookie("token"); 
  res.clearCookie("Id");
  res.redirect("/"); 
});

app.post("/registerBusiness", authenticateToken, async (req, res) => {
  const { name, description, imgUrl } = req.body;
  const id = req.cookies.Id;
  try {
    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input("name", sql.NVarChar(255), name)
      .input("description", sql.Text, description)
      .input("imgUrl", sql.VarChar(500), imgUrl)
      .query(
        "insert into Business(Name, Description, ImgURL) values (@name,@description,@imgUrl);SELECT SCOPE_IDENTITY() AS Id"
      );

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("bizId", sql.Int, result.recordset[0].Id)
      .query(
        "insert into UsersBusineses(UsersId, BusinessId) values (@id, @bizId);"
      );
    await pool.close();
    sql.close();
    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
  }
});

app.post("/addProduct", authenticateToken, async (req, res) => {
  const { businessId, name, quantity, price, imgUrl, prodDescription } =
    req.body;

  try {
    let pool = await sql.connect(config);
    await pool
      .request()
      .input("name", sql.NVarChar(100), name)
      .input("quantity", sql.Int, quantity)
      .input("price", sql.Decimal(20, 2), price)
      .input("imgUrl", sql.VarChar(500), imgUrl)
      .input("businessId", sql.Int, businessId)
      .input("prodDescription", sql.Text, prodDescription)
      .query(
        "insert into Products(Name, Quantity, Price, ImgURL,Description)values(@name,@quantity,@price,@imgUrl,@prodDescription)insert into BusinessProducts(BusinessId, ProductsId)values(@businessId,SCOPE_IDENTITY());"
      );
    await pool.close();
    sql.close();
    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
  }
});

app.get("/products", authenticateToken, async (req, res) => {
  try {
    let pool = await sql.connect(config);
    const response = await pool
      .request()
      .query(
        "select p.Id,p.Name, p.Description, p.ImgURL, Price, Quantity, b.Name from Products as p join BusinessProducts as bp on p.Id=bp.ProductsId join Business as b on bp.BusinessId=b.Id where Quantity>0 order by Quantity desc"
      );
    const response2 = await pool
      .request()
      .input("id", sql.Int, req.cookies.Id)
      .query("select Email from Users where Id=@id");
    await pool.close();
    sql.close();

    res.send({ email: response2.recordset[0].Email, obj: response.recordset });
  } catch (err) {
    console.log(err);
  }
});

app.post("/buy/:productid", authenticateToken, async (req, res) => {
  const productid = req.params.productid;
  const clientid = req.cookies.Id;

  try {
    let pool = await sql.connect(config);
    const response = await pool
      .request()
      .input("productid", sql.Int, productid)
      .query("select Name, Price from Products where Id=@productid;");

    const product = await stripe.products.create({
      name: response.recordset[0].Name,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(response.recordset[0].Price * 100),
      currency: "bgn",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url:
        "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/fail",
    });

    const response2 = await pool
      .request()
      .input("SessionId", sql.VarChar(200), session.id)
      .input("UserId", sql.Int, clientid)
      .input("ProductId", sql.Int, productid)
      .query(
        "insert into Payments(SessionId, UserId, ProductId, Quantity)values(@SessionId,@UserId,@ProductId,1)"
      );
    await pool.close();
    sql.close();

    res.send({ url: session.url });
  } catch (err) {
    console.log(err);
  }
});

app.get("/success", authenticateToken, async (req, res) => {
  const { session_id } = req.query;

  try {
    let pool = await sql.connect(config);
    const response = await pool
      .request()
      .input("session_id", sql.VarChar(200), session_id)
      .query(
        "update Payments set Completed=1,DateTimeComplated=GETDATE() where SessionId=@session_id;update Products set Quantity-=1 where Id=(select ProductId from Payments as p join Products as pr on p.ProductId=pr.Id where SessionId=@session_id)"
      );
    await pool.close();
    sql.close();
    res.sendFile(
      path.join(__dirname, "..", "UI", "payment", "paymentsuccess.html")
    );
  } catch (err) {
    console.log(err);
  }
});

app.get("/fail", authenticateToken, async (req, res) => {
  res.sendFile(path.join(__dirname, "..", "UI", "payment", "paymentfail.html"));
});

app.get("/search/:searchPhrase", authenticateToken, async (req, res) => {
  const searchPhrase = req.params.searchPhrase;
  try {
    let pool = await sql.connect(config);
    let regex = /\w+/i;
    const response = await pool
      .request()
      .query(
        `select p.Id,p.Name, p.Description, p.ImgURL, Price, Quantity, b.Name from Products as p join BusinessProducts as bp on p.Id=bp.ProductsId join Business as b on bp.BusinessId=b.Id where Quantity>0 and (b.Name like '%${searchPhrase.match(
          regex
        )}%' or p.Name like '%${searchPhrase.match(regex)}%') order by b.Name`
      );
    await pool.close();
    sql.close();
    res.send(response.recordset);
  } catch (err) {
    console.log(err);
  }
});

app.get("/status/:id", authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    let pool = await sql.connect(config);
    const activeProducts = await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        `select Count(*) as [activeprod]
        from Products as p
        join BusinessProducts as bp on bp.ProductsId=p.Id
        join Business as b on bp.BusinessId=b.Id
        where b.Id=@id and p.Quantity>0
        
        select COUNT(*) as [soldprod]
        from Payments as p
        join Products as pr on p.ProductId=pr.Id
        join BusinessProducts as bp on bp.ProductsId=pr.Id
        join Business as b on bp.BusinessId=b.Id
        where Completed=1 and b.Id=@id
        
        select Sum(Price) as [profit]
        from Payments as p
        join Products as pr on p.ProductId=pr.Id
        join BusinessProducts as bp on bp.ProductsId=pr.Id
        join Business as b on bp.BusinessId=b.Id
        where Completed=1 and b.Id=@id`
      );
    
    await pool.close();
    sql.close();
    res.send(activeProducts.recordsets);
  } catch (err) {
    console.log(err);
  }
});

app.get("/sales", authenticateToken, async (req, res) => {
  const bisUserId = req.cookies.Id;
  try {
    let pool = await sql.connect(config);
    const response = await pool
      .request()
      .input("bisUserId", sql.Int, bisUserId)
      .query(
        `select ROW_NUMBER()OVER(ORDER BY p.DateTimeComplated desc) as Number,Email, pr.Name as ProductName, pr.Price, p.DateTimeComplated
        from Payments as p
        join Products as pr on p.ProductId=pr.Id
        join BusinessProducts as bp on bp.ProductsId=pr.Id
        join Business as b on bp.BusinessId=b.Id
        join Users as u on p.UserId=u.Id
        where b.Id in 
          (select b.Id
          from Users as u
          join UsersBusineses as ub on u.Id=ub.UsersId
          join Business as b on b.Id=ub.BusinessId
          where u.Id=@bisUserId) and p.Completed=1;
        `
      );
    await pool.close();
    sql.close();
    res.send(response.recordset);
  } catch (err) {
    console.log(err);
  }
});

function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (token === undefined) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
