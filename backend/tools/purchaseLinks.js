export default function purchaseLinks(partQuery) {
  const q = encodeURIComponent(partQuery || "car part");
  return {
    googleShopping: `https://www.google.com/search?tbm=shop&q=${q}`,
    amazon: `https://www.amazon.com/s?k=${q}`,
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${q}`,
  };
}