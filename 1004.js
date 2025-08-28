// cityName -> city_name
// cityNAme -> city_nAme
// CityName -> City_name

function isCapital(ch) {
  return ch.toUpperCase() === ch;
}

function camelToKebab(text) {
  if (text.length === 0) {
    return text;
  }

  let leadingEdge = [];
  for (let i = 0; i < text.length - 1; i++) {
    const curr = text[i];
    const next = text[i + 1];
    if (!isCapital(curr) && isCapital(next)) {
      leadingEdge.push(i);
    }
  }

  if (leadingEdge.length === 0) {
    return text;
  }

  let ans = text.split("");
  for (const eIdx of leadingEdge) {
    const curr = ans[eIdx];
    const next = ans[eIdx + 1];
    ans.splice(eIdx, 2, ...`${curr}_${next.toLowerCase()}`.split(""));
  }
  return ans.join("");
}
