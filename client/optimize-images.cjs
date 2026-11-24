const sharp = require('sharp');
const path = require('path');

async function optimizeImages() {
  const images = [
    {
      input: 'src/assets/heroImage.jpg',
      output: 'src/assets/optimized/heroImage.webp'
    },
    {
      input: 'src/assets/Icon.jpg',
      output: 'src/assets/optimized/Icon.webp'
    }
  ];

  for (const image of images) {
    await sharp(image.input)
      .webp({ quality: 80, effort: 5 })
      .toFile(image.output);

    console.log(`Optimized: ${image.output}`);
  }
}

optimizeImages().catch((error) => {
  console.error('Image optimization failed:', error);
  process.exit(1);
});
