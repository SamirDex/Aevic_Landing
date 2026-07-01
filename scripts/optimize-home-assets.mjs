import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const projectRoot = process.cwd();

const args = new Set(process.argv.slice(2));
const runImages = args.size === 0 || args.has('--images');
const runModels = args.size === 0 || args.has('--models');
const runVideos = args.size === 0 || args.has('--videos');

const ensureDir = (targetPath) => mkdirSync(targetPath, { recursive: true });

const toKilobytes = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const toMegabytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const formatSize = (bytes) =>
  bytes >= 1024 * 1024 ? toMegabytes(bytes) : toKilobytes(bytes);

const summarize = (inputPath, outputPath) => {
  const inputBytes = statSync(inputPath).size;
  const outputBytes = statSync(outputPath).size;

  console.log(
    `${path.relative(projectRoot, inputPath)} (${formatSize(inputBytes)}) -> ${path.relative(projectRoot, outputPath)} (${formatSize(outputBytes)})`,
  );
};

const responsiveImageSpecs = [
  {
    input: 'public/assets/maps/erangel.png',
    outputBase: 'public/assets/optimized/maps/erangel',
    desktopWidth: 1536,
    mobileWidth: 960,
    avifQuality: 46,
    webpQuality: 72,
  },
  {
    input: 'public/assets/maps/miramar.png',
    outputBase: 'public/assets/optimized/maps/miramar',
    desktopWidth: 1536,
    mobileWidth: 960,
    avifQuality: 46,
    webpQuality: 72,
  },
  {
    input: 'public/assets/maps/rondo.png',
    outputBase: 'public/assets/optimized/maps/rondo',
    desktopWidth: 1536,
    mobileWidth: 960,
    avifQuality: 46,
    webpQuality: 72,
  },
  {
    input: 'public/assets/crystals/crystal-main.png',
    outputBase: 'public/assets/optimized/crystals/crystal-main',
    desktopWidth: 1024,
    mobileWidth: 640,
    avifQuality: 44,
    webpQuality: 70,
  },
  {
    input: 'public/assets/crystals/crystal-medium.png',
    outputBase: 'public/assets/optimized/crystals/crystal-medium',
    desktopWidth: 768,
    mobileWidth: 480,
    avifQuality: 42,
    webpQuality: 68,
  },
  {
    input: 'public/assets/crystals/crystal-small.png',
    outputBase: 'public/assets/optimized/crystals/crystal-small',
    desktopWidth: 512,
    mobileWidth: 320,
    avifQuality: 42,
    webpQuality: 68,
  },
  {
    input: 'public/assets/crystals/crystal-shards.png',
    outputBase: 'public/assets/optimized/crystals/crystal-shards',
    desktopWidth: 900,
    mobileWidth: 560,
    avifQuality: 42,
    webpQuality: 68,
  },
];

const modelSpecs = [
  {
    input: 'public/assets/models/erangel.glb',
    output: 'public/assets/models/erangel-optimized.glb',
    textureSize: '1024',
  },
  {
    input: 'public/assets/models/miramar.glb',
    output: 'public/assets/models/miramar-optimized.glb',
    textureSize: '512',
  },
];

const videoSpecs = [
  'pochinki',
  'military-base',
  'partona',
  'resort',
  'stadium',
  'test-track',
].map((name) => ({
  input: `public/assets/videos/${name}.mp4`,
  output: `public/assets/optimized/videos/${name}.mp4`,
}));

const optimizeResponsiveImage = async ({
  input,
  outputBase,
  desktopWidth,
  mobileWidth,
  avifQuality,
  webpQuality,
}) => {
  for (const [label, width] of [
    ['desktop', desktopWidth],
    ['mobile', mobileWidth],
  ]) {
    const avifOutput = `${outputBase}-${label}.avif`;
    const webpOutput = `${outputBase}-${label}.webp`;
    const resizeOptions = { width, withoutEnlargement: true };

    await sharp(input)
      .resize(resizeOptions)
      .avif({ quality: avifQuality, effort: 6 })
      .toFile(avifOutput);
    summarize(input, avifOutput);

    await sharp(input)
      .resize(resizeOptions)
      .webp({ quality: webpQuality, effort: 6, alphaQuality: webpQuality })
      .toFile(webpOutput);
    summarize(input, webpOutput);
  }
};

const optimizeModel = ({ input, output, textureSize }) => {
  execFileSync(
    'npx',
    [
      'gltf-transform',
      'optimize',
      input,
      output,
      '--compress',
      'draco',
      '--texture-compress',
      'webp',
      '--texture-size',
      textureSize,
    ],
    { stdio: 'inherit', cwd: projectRoot },
  );

  summarize(input, output);
};

const optimizeVideo = ({ input, output }) => {
  execFileSync(
    ffmpegInstaller.path,
    [
      '-i',
      input,
      '-vf',
      'scale=1280:-2:flags=lanczos',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '29',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      output,
      '-y',
    ],
    { stdio: 'inherit', cwd: projectRoot },
  );

  summarize(input, output);
};

async function main() {
  ensureDir(path.join(projectRoot, 'public/assets/optimized/maps'));
  ensureDir(path.join(projectRoot, 'public/assets/optimized/crystals'));
  ensureDir(path.join(projectRoot, 'public/assets/optimized/videos'));

  if (runImages) {
    for (const spec of responsiveImageSpecs) {
      await optimizeResponsiveImage(spec);
    }
  }

  if (runModels) {
    for (const spec of modelSpecs) {
      optimizeModel(spec);
    }
  }

  if (runVideos) {
    for (const spec of videoSpecs) {
      optimizeVideo(spec);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
