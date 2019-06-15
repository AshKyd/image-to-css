/**
 * Create an image element from a url
 * @param  {String} src Src to load, be it data url or (probably) regular url
 * @return {Promise}    Resolves with an image domelement once it has completed loading
 */
function getImage(src) {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Get ImageData from an image element
 * @param  {DOMElement} image
 * @return {Promise}          Resolves with ImageData
 */
function getPixelsFromImage(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return Promise.resolve(
    context.getImageData(0, 0, canvas.width, canvas.height)
  );
}

/**
 * Use a FileReader to load a given file
 * @param  {File} file                 File instance
 * @param  {String} [as="ArrayBuffer"] Method we should use to load the file
 * @return {Promise}                   Resolves with the loaded file
 */
function loadFile(file, as = "ArrayBuffer") {
  const allowedMethods = ["DataURL", "ArrayBuffer", "BinaryString", "Text"];
  if (!allowedMethods.includes(as))
    return Promise.reject('"as" must be one of ' + allowedMethods.join());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    const readerMethod = `readAs${as}`;
    reader[readerMethod](file);
  });
}

/**
 * Convert ImageData to a series of box-shadows
 * @param  {ImageData} imageData
 * @return {String}              The value for a CSS box-shadow prop.
 */
function pixelsToCss(imageData) {
  let boxShadow = [];

  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const color = pixels.slice(i, i + 4);
    const rgba = `rgba(${color.join(",")})`;
    if (rgba === "rgba(0,0,0,0)") continue;
    const pixel = i / 4;
    const x = pixel % imageData.width;
    const y = Math.floor(pixel / imageData.width);
    boxShadow.push(`${x}px ${y}px 0 ${rgba}`);
  }

  return boxShadow.join(",\n");
}

/**
 * Round a number to x decimal places
 * @param  {Number} number   Number to round
 * @param  {Number} decimals Number of decimal places
 * @return {Number}          Rounded number to the given decimal places
 */
function roundDecimals(number, decimals) {
  return Math.round(10 * decimals * number) / (10 * decimals);
}

// load image
document.querySelector("input").addEventListener("change", e => {
  const file = e.target.files[0];
  loadFile(file, "DataURL")
    .then(getImage)
    .then(getPixelsFromImage)
    .then(pixels => {
      if (pixels.data.length > 1e6) {
        const shouldContinue = confirm(
          "This is a pretty big image, it might crash your tab. Continue?"
        );
        if (!shouldContinue) return;
      }
      const css = pixelsToCss(pixels);
      sproot.style.boxShadow = css;
    })
    .catch(error => "oh no" + JSON.stringify(alert));
});

// change size
document.querySelectorAll("button").forEach(el =>
  el.addEventListener("click", e => {
    const direction = e.target.textContent === "+" ? 0.2 : -0.2;
    const size = roundDecimals(
      (Number(sproot.dataset.size) || 1) + direction,
      2
    );
    if (size < 0.5) return;
    sproot.dataset.size = size;
    sproot.style.transform = `scale(${size})`;
    sizelabel.textContent = size + "px";
  })
);
