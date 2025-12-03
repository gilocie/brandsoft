// This file acts as a manifest for invoice and quote background images.
// By importing them here, we make them available to the Next.js build process.
// To add a new image, simply add a new import line and add it to the exported array.

const invoiceAndQuoteImages: { name: string; src: any }[] = [];
const extensions = ['png', 'jpg', 'jpeg', 'webp'];

for (let i = 0; i <= 200; i++) {
    for (const ext of extensions) {
        try {
            const src = require(`@/app/(app)/templates/inv-and-quots-backgrounds/inv-and-quots${i}.${ext}`);
            invoiceAndQuoteImages.push({
                name: `inv-and-quots${i}`,
                src: src,
            });
            break; // Stop after finding the first valid extension
        } catch (error) {
            // This is expected if the file doesn't exist.
        }
    }
}

export default invoiceAndQuoteImages;
