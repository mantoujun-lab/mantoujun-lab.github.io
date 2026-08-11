// @ts-check
/// <reference types="node" />
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import minifyHtml from 'astro-minify-html-swc';
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * 压缩 public/ 下的大图
 * - 尺寸 > maxSize 的图片 resize 到 maxSize 以内
 * - 输出 WebP 格式（体积比 PNG/JPG 小 ~30%）
 * - 同时保留压缩后的原格式（兼容旧浏览器）
 */
async function compressPublicImages() {
  const publicDir = 'public';
  const distDir = 'dist';
  const maxSize = 512;
  const quality = 85;

  const entries = await readdir(publicDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/\.(png|jpe?g|webp)$/i.test(entry.name)) continue;

    const srcPath = join(publicDir, entry.name);
    const meta = await sharp(srcPath).metadata();
    if (!meta.width || !meta.height) continue;

    const needsResize = Math.max(meta.width, meta.height) > maxSize;
    console.log(
      `[compress-img] ${entry.name} ${meta.width}x${meta.height}${needsResize ? ` → max ${maxSize}px` : ''}`
    );

    let pipeline = sharp(srcPath);
    if (needsResize) {
      pipeline = pipeline.resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // 输出 1：原格式压缩版（保留兼容性）
    const originalOut = join(distDir, entry.name);
    if (/\.png$/i.test(entry.name)) {
      await pipeline.clone().png({ compressionLevel: 9, quality }).toFile(originalOut);
    } else if (/\.jpe?g$/i.test(entry.name)) {
      await pipeline.clone().jpeg({ quality, mozjpeg: true }).toFile(originalOut);
    } else {
      await pipeline.clone().webp({ quality }).toFile(originalOut);
    }

    // 输出 2：WebP 版（体积更小）
    const webpName = entry.name.replace(/\.(png|jpe?g)$/i, '.webp');
    if (webpName !== entry.name) {
      const webpOut = join(distDir, webpName);
      await pipeline.clone().webp({ quality }).toFile(webpOut);
    }

    const beforeStat = await stat(srcPath);
    const afterStat = await stat(originalOut);
    const saved = ((1 - afterStat.size / beforeStat.size) * 100).toFixed(1);
    console.log(
      `[compress-img]   ${entry.name}: ${(beforeStat.size / 1024).toFixed(1)}KB → ${(afterStat.size / 1024).toFixed(1)}KB (${saved}% ↓)`
    );
  }
}

// https://astro.build/config
export default defineConfig({
  // 注意：minifyHtml 必须放在 integrations 数组最后
  integrations: [minifyHtml()],
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'compress-public-images',
        // 只在 build 完成时执行（dev 不跑）
        closeBundle: async () => {
          await compressPublicImages();
        },
      },
    ],
  },
});