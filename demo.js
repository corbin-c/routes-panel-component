let img = document.querySelector("img");
let canvas = document.querySelector("canvas");
let context = canvas.getContext("2d");
let routes_panel = document.querySelector("routes-panel");
img.addEventListener("load",updateRoutes);
routes_panel.addEventListener("change",updateRoutes);
function updateRoutes() {
  let channels = (routes_panel.hasAttribute("routes")
    && (routes_panel.getAttribute("routes") != ""))
    ? routesToChannels(routes_panel.getAttribute("routes"))
    : [];
  drawCanvas(channels);
}
function routesToChannels(routes) {
  let rgb = ["red","green","blue"];
  return routes.split("|")
  .map(e => {
    let route = e.split("-");
    return [rgb.indexOf(route[0]),rgb.indexOf(route[1])];
  });
}
function drawCanvas(channels) {
  canvas.width = img.offsetWidth;
  canvas.height = img.offsetHeight;
  context.drawImage(img, 0, 0,img.width,img.height);
  let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  let buffer = [0,0,0];
  imageData.data.map((e,i,data) => {
    let channel = i%4;
    if (channel == 3) {
      buffer.map((h,j) => imageData.data[i-channel+j] = h);
      buffer = [0,0,0];
    } else {
      e = 0;
      let current_pixel = [
        data[i-channel],
        data[i-channel+1],
        data[i-channel+2]
      ];
      let sources = channels.filter(f => f[1] == channel);
      sources.map(g => {
        e += current_pixel[g[0]];
      });
      e = Math.min(e,255);
      buffer[channel] = e;
    }
  });
  context.putImageData(imageData, 0, 0);
}
