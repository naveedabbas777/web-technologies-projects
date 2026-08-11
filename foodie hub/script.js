function orderNow(button) {
  const card = button.parentElement;
  const dishName = card.querySelector("h3").textContent;
  const confirmMsg = card.querySelector(".confirmation");
  confirmMsg.textContent = `${dishName} added to your order!`;
}

document.getElementById("searchForm").addEventListener("submit", function(e) {
  const input = document.getElementById("searchInput").value.trim();
  const error = document.getElementById("searchError");

  if (input === "") {
    e.preventDefault();
    error.textContent = "Please enter a food item to search!";
  } else {
    error.textContent = "";
  }
});