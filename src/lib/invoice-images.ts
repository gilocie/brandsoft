// This file acts as a manifest for invoice and quote background images.
// By importing them here, we make them available to the Next.js build process.

const invoiceAndQuoteImages: { name: string; src: any }[] = [];
const extensions = ['.png', '.jpeg', '.jpg', '.webp'];

for (let i = 0; i <= 50; i++) {
    for (const ext of extensions) {
        try {
            const src = require(`@/app/(app)/templates/inv-and-quots-backgrounds/inv-and-quots${i}${ext}`);
            invoiceAndQuoteImages.push({
                name: `inv-and-quots${i}`,
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

export default invoiceAndQuoteImages;
