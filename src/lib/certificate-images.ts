// This file acts as a manifest for certificate background images.
// By importing them here, we make them available to the Next.js build process.
// To add a new image, simply add a new import line and add it to the exported array.

const certificateImages: { name: string; src: any }[] = [];
const extensions = ['png', 'jpg', 'jpeg', 'webp'];

for (let i = 0; i <= 200; i++) {
    for (const ext of extensions) {
        try {
            const src = require(`@/app/(app)/templates/certificate-backgrounds/brandsoft-cert${i}.${ext}`);
            certificateImages.push({
                name: `brandsoft-cert${i}`,
                src: src,
            });
            break; // Stop after finding the first valid extension
        } catch (error) {
            // This is expected if the file doesn't exist.
        }
    }
}

export default certificateImages;
