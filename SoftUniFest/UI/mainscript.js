const main = document.querySelector("main");
main.innerHTML = "";
fetch("/products")
  .then((response) => response.json())
  .then((data) => {
    document.querySelector("#email").textContent = data.email;
    data.obj.forEach((item) => {
      main.innerHTML += `<div class="items" id="${
        item.Id
      }" ondblclick="Buy(this)">
        <img
          src="${item.ImgURL}"
          alt=""
        />
        <h2>${item.Name[0]}</h2>
        <p>${item.Name[1]}</p>
        <div class="desc">
        ${
          item.Description === null
            ? "No provided description..."
            : item.Description
        }
        </div>
        <div class="pricecontainer">
          <h3>Price:</h3>
          <p>${Number(item.Price).toFixed(2)}lv</p>
        </div>
    
        <div class="countcontainer">
          <h3>Items left:</h3>
          <p>${item.Quantity}</p>
        </div>
      </div>
    </main>`;
    });
  })
  .catch((error) => {
    console.error("Error:", error);
  });

function logOut() {
  fetch("http://localhost:3000/logOut", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      // Handle the response here, such as a redirect to the login page
      window.location.href = "/"; // Redirect to the login page
    })
    .catch((error) => {
      // Handle any errors here
      console.error("Error:", error);
    });
}

function Buy(e) {
  const id = e.id;
  const name = e.querySelector("h2").textContent;
  const price = e.querySelector(".pricecontainer p").textContent.split("l")[0];
  fetch(`/buy/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Include any additional data to be sent in the request body
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      window.location.replace(data.url); // Redirect to the Stripe checkout URL
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function search(e) {
  fetch(`/search/${e.value}`)
    .then((response) => response.json())
    .then((data) => {
      main.innerHTML = "";
      if (data.length !== 0) {
        data.forEach((item) => {
          main.innerHTML += `<div class="items" id="${
            item.Id
          }" ondblclick="Buy(this)">
            <img
              src="${item.ImgURL}"
              alt=""
            />
            <h2>${item.Name[0]}</h2>
            <p>${item.Name[1]}</p>
            <div class="desc">
            ${
              item.Description === null
                ? "No provided description..."
                : item.Description
            }
            </div>
            <div class="pricecontainer">
              <h3>Price:</h3>
              <p>${Number(item.Price).toFixed(2)}lv</p>
            </div>
        
            <div class="countcontainer">
              <h3>Items left:</h3>
              <p>${item.Quantity}</p>
            </div>
          </div>
        </main>`;
        });
      }
    })
    .catch((error) => {
      location.reload();
      console.error("Error:", error);
    });
}
