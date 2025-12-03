
// This file acts as a manifest for certificate background images.
// By importing them here, we make them available to the Next.js build process.
// It attempts to import images from 0 to 50 with various extensions.

const certificateImages: { name: string; src: any }[] = [];
const extensions = ['.png', '.jpeg', '.jpg', '.webp'];

for (let i = 0; i <= 50; i++) {
    for (const ext of extensions) {
        try {
            // The require context is a webpack feature that Next.js uses.
            // This tells it to look for files matching this pattern at build time.
            const src = require(`@/app/(app)/templates/certificate-backgrounds/brandsoft-cert${i}${ext}`);
            certificateImages.push({
                name: `brandsoft-cert${i}`,
                src: src,
            });
            // Break the inner loop once an image is found for this number
            break; 
        } catch (error) {
            // This is expected if the file with this extension doesn't exist.
            // Continue to the next extension.
        }
    }
}

export default certificateImages;
