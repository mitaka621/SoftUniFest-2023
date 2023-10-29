fetch("http://localhost:3000/businesses")
  .then((response) => response.json())
  .then((data) => {
    document.querySelector("#email").textContent = data.email;
    document.querySelectorAll(".bisanditems").forEach((item) => item.remove());

    data.obj.forEach(async (item) => {
      const status = await getStatus(item.Id);
      const profit = status[2][0].profit === null ? 0 : status[2][0].profit;

      document.querySelector(".main").innerHTML += `<div class="bisanditems">
        <div class="biscontainer" id="${item.Id}" onclick="Expand(this)">
          <h2>${item.Name}</h2>
          <hr />
          <div class="container">
            <img
              src="${item.ImgURL}"
              alt=""
            />
            <div>
              <h3>Description</h3>
              <p>
              ${item.Description}
              </p>
            </div>
            <div class="status">
              <h3>Status</h3>
              <p>Active Products: ${status[0][0].activeprod}</p>
              <p>Sold Products: ${status[1][0].soldprod}</p>
              <p>Earnings: ${profit}lv</p>
            </div>
          </div>
        </div>
        <a onclick="manageForm2(this)">Add Product</a>
        <form action="/addProduct" method="post">
        <div>
          <input type="hidden" id="businessId" name="businessId" value="" />
          <label for="name">Product Name:</label><br />
          <input type="text" id="name" name="name" required /><br /><br />

          <label for="quantity">Quantity:</label><br />
          <input
            type="number"
            id="quantity"
            name="quantity"
            required
          /><br /><br />

          <label for="price">Price:</label><br />
          <input
            type="number"
            id="price"
            name="price"
            step="0.01"
            required
          /><br /><br />

          <label for="imgUrl">Image URL:</label><br />
          <input
            type="text"
            id="imgUrl"
            name="imgUrl"
            value="https://media.istockphoto.com/id/1217632489/photo/computer-of-technology-sense-and-colorful-image.webp?s=170667a&w=0&k=20&c=3p2oJMWl3SHeNQxfw4iaqVtjgCao_nsBnPM-QEyis3g="
          /><br /><br />

          
        </div>
        <label for="prodDescription">Product Description:</label><br />
        <textarea
          id="prodDescription"
          name="prodDescription"
          rows="4"
          cols="50"
          resize="none"
        ></textarea>
        <input type="submit" value="Add Product" />
      </form>
        </div>`;
    });
  })
  .catch((error) => {
    console.error("Error:", error);
  });
async function getStatus(id) {
  const response = await fetch(`/status/${id}`);

  const data = await response.json();
  return data;
}
function Expand(e) {
  const form = e.parentElement.querySelector(`a[onclick="manageForm2(this)"]`);
  const parent = e.parentElement;
  if (e.parentElement.querySelectorAll(".items").length !== 0) {
    e.parentElement.querySelectorAll(".items").forEach((item) => item.remove());
    form.style.display = "none";
  } else {
    form.style.display = "block";
    fetch(`http://localhost:3000/getitems/${e.id}`)
      .then((response) => response.json())
      .then((data) => {
        data.forEach((item) => {
          parent.innerHTML += ` <div class="items">
        <img
          src="${item.ImgURL}"
          alt=""
        />
        <p>${item.Name}</p>
        <div>
          <p>Price lv<p>
          <input type="number" name="price" value="${item.Price}" />
        </div>
        <div>
          <p>Quantity<p>
          <input type="number" name="quantity" value="${item.Quantity}" />
        </div>
        
        <a href="">Apply</a>
      </div>`;
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
}

function logOut() {
  fetch("http://localhost:3000/logOut", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}), 
  })
    .then((response) => {
      
      window.location.href = "/"; 
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function manageForm1() {
  if (document.querySelector(".bizform").style.display == "block") {
    document.querySelector(".bizform").style.display = "none";
  } else document.querySelector(".bizform").style.display = "block";
}

function manageForm2(e) {
  const form = e.parentElement.querySelector(`form[action="/addProduct"]`);

  form.querySelector(`#businessId`).value =
    e.parentElement.querySelector(".biscontainer").id;
  if (form.style.display == "flex") {
    form.style.display = "none";
    e.parentElement
      .querySelectorAll(`form[action="/addProduct"] *`)
      .forEach((item) => (item.style.display = "none"));
  } else {
    e.parentElement
      .querySelectorAll(`form[action="/addProduct"] *`)
      .forEach((item) => (item.style.display = "flex"));
    form.style.display = "flex";
  }
}

function LoadTable() {
  document.querySelector(".main").innerHTML = `
  <h2>Sold Items</h2>
  <table border="1">
  <thead>
      <tr>
          <th>Number</th>
          <th>Customer Email</th>
          <th>Product Name</th>
          <th>Product Price</th>
          <th>Date</th>
      </tr>
  </thead>
  <tbody>
      
      <!-- Add more rows as needed -->
  </tbody>
</table>`;

  fetch("http://localhost:3000/sales")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((item) => {
        document.querySelector("tbody").innerHTML += `<tr>
          <td>${item.Number}</td>
          <td>${item.Email}</td>
          <td>${item.ProductName}</td>
          <td>${item.Price.toFixed(2)}lv</td>
          <td>${item.DateTimeComplated}</td>
        </tr>`;
      });
    });
}

function Stats() {
  fetch("http://localhost:3000/sales")
    .then((response) => response.json())
    .then(async (data) => {
      const sum = data.reduce((accumulator, object) => {
        return accumulator + object.Price;
      }, 0);

      document.querySelector(".main").innerHTML = `<h2>Statistics<h2>
      <h2>Total Revenu - ${sum.toFixed(2)}lv<h2>
    `;
    });
}
