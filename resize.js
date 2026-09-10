const { Jimp } = require("jimp");
const path = require("path");

async function run() {
  const imgPath = "C:/Users/LOQ/.gemini/antigravity/scratch/test.png";
  const image = await Jimp.read(imgPath);
  
  // Create a 512x512 transparent background
  const bg512 = new Jimp({ width: 512, height: 512, color: 0x00000000 });
  const bg192 = new Jimp({ width: 192, height: 192, color: 0x00000000 });

  // Scale the original image down to 60% of the target bounds so it has plenty of padding
  const img512 = image.clone().resize({ w: 300 }); // 300px inside 512px
  const img192 = image.clone().resize({ w: 110 }); // 110px inside 192px

  bg512.composite(img512, 106, 106); // Center (512-300)/2 = 106
  bg192.composite(img192, 41, 41);   // Center (192-110)/2 = 41

  await bg512.write("public/icons/icon-512.png");
  await bg192.write("public/icons/icon-192.png");
  
  console.log("Successfully padded native PWA icons!");
}
run();