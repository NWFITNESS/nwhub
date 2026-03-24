import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const svgBuffer = fs.readFileSync('./public/icons/NWHub-Icon.svg')
const outDir = './public/icons'

const sizes = [
  { name: 'icon-512.png',             size: 512 },
  { name: 'icon-192.png',             size: 192 },
  { name: 'apple-touch-icon.png',     size: 180 },
  { name: 'apple-touch-icon-167.png', size: 167 },
  { name: 'apple-touch-icon-152.png', size: 152 },
  { name: 'favicon-32.png',           size: 32  },
  { name: 'favicon-16.png',           size: 16  },
]

for (const { name, size } of sizes) {
  await sharp(svgBuffer).resize(size, size).png().toFile(path.join(outDir, name))
  console.log(`✓ ${name}`)
}

await sharp(svgBuffer).resize(32, 32).toFile('./public/favicon.ico')
console.log('✓ favicon.ico')
