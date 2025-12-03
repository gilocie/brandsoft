// This file acts as a manifest for invoice and quote background images.
// To add a new image, place it in the /public folder and add its path to this list.

const invoiceImages: string[] = [];

for (let i = 0; i <= 50; i++) {
    invoiceImages.push(`/inv-and-quots${i}.jpg`);
}

export default invoiceImages;
