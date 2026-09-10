const { Jimp } = require("jimp");

async function run() {
  const imgPath = "C:/Users/LOQ/.gemini/antigravity/scratch/test.png";
  const image = await Jimp.read(imgPath);
  
  // Create solid WHITE backgrounds (0xFFFFFFFF) - this stops Android from turning transparency black!
  const bg512 = new Jimp({ width: 512, height: 512, color: 0xFFFFFFFF });
  const bg192 = new Jimp({ width: 192, height: 192, color: 0xFFFFFFFF });

  // Resize using highest quality to fix clarity
  const img512 = image.clone().resize({ w: 340 }); 
  const img192 = image.clone().resize({ w: 128 }); 

  bg512.composite(img512, 86, 86); 
  bg192.composite(img192, 32, 32);   

  await bg512.write("public/icons/icon-512.png");
  await bg192.write("public/icons/icon-192.png");
  
  console.log("Fixed icon black box and clarity!");
}
run();